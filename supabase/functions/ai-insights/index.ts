// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
    // Rate limiting: max requests per user per day
    RATE_LIMIT_MAX_REQUESTS: 10,
    RATE_LIMIT_WINDOW_MS: 24 * 60 * 60 * 1000, // 24 hours (1 day)

    // Token limits
    MAX_TOKENS_RESPONSE: 800,
    MAX_CONTEXT_LENGTH: 4000,

    // Model
    OPENAI_MODEL: 'gpt-4o-mini',
    TEMPERATURE: 0.3,
}

// ============================================================================
// LOGGING UTILITY
// ============================================================================
type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

interface LogContext {
    requestId: string
    userId?: string
    shopId?: string
    action?: string
    duration?: number
    tokensUsed?: number
    error?: string
    metadata?: Record<string, unknown>
}

function log(level: LogLevel, message: string, ctx: LogContext) {
    const timestamp = new Date().toISOString()
    const logEntry = {
        timestamp,
        level,
        message,
        ...ctx,
    }

    // Use appropriate console method based on level
    switch (level) {
        case 'ERROR':
            console.error(JSON.stringify(logEntry))
            break
        case 'WARN':
            console.warn(JSON.stringify(logEntry))
            break
        case 'DEBUG':
            console.debug(JSON.stringify(logEntry))
            break
        default:
            console.log(JSON.stringify(logEntry))
    }
}

// Generate unique request ID
function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// ============================================================================
// RATE LIMITING (In-memory for Edge Function - resets on cold start)
// For production, use Redis or Supabase table
// ============================================================================
async function checkRateLimit(userId: string, supabase: SupabaseClient): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Date.now()
    const key = `rate_${userId}`

    // 1. Get current limit from DB
    const { data: current, error } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('key', key)
        .single()

    // Handle first request or expired window
    if (!current || current.reset_at < now) {
        const resetAt = now + CONFIG.RATE_LIMIT_WINDOW_MS

        // Upsert new window
        const { error: upsertError } = await supabase
            .from('rate_limits')
            .upsert({
                key,
                count: 1,
                reset_at: resetAt
            })

        if (upsertError) {
            console.error('Rate limit upsert error:', upsertError)
            // Fail open if DB error
            return { allowed: true, remaining: CONFIG.RATE_LIMIT_MAX_REQUESTS - 1, resetAt }
        }

        return { allowed: true, remaining: CONFIG.RATE_LIMIT_MAX_REQUESTS - 1, resetAt }
    }

    // Check limit
    if (current.count >= CONFIG.RATE_LIMIT_MAX_REQUESTS) {
        return { allowed: false, remaining: 0, resetAt: Number(current.reset_at) }
    }

    // Increment counter
    const { error: updateError } = await supabase
        .from('rate_limits')
        .update({ count: current.count + 1 })
        .eq('key', key)

    if (updateError) {
        console.error('Rate limit update error:', updateError)
    }

    return {
        allowed: true,
        remaining: CONFIG.RATE_LIMIT_MAX_REQUESTS - (current.count + 1),
        resetAt: Number(current.reset_at)
    }
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================
const SYSTEM_PROMPT = `You are Swarna AI, a business intelligence analyst for SwarnaVyapar (jewellery shop management).

You have access to:
- Sales & Invoice data (revenue, order counts, payment status)
- Stock/Inventory levels (items, low stock alerts, stock value)
- Customer information (top customers, purchase patterns)
- Khatabook (credit/debit ledger, receivables, payables)
- Loan management data (active loans, interest earned)
- Loyalty program stats (points earned, redeemed)

Rules:
- Use ₹ for currency (Indian Rupees) with Indian number formatting (lakhs/crores)
- Be concise and actionable
- Provide confidence levels for predictions
- Never expose full customer details (mask names/phones)
- Keep responses friendly, professional and helpful
- Focus on insights that drive business decisions

CRITICAL: Always respond in this exact JSON format:
{
  "type": "insight|summary|alert|recommendation",
  "title": "Brief title (max 10 words)",
  "summary": "2-3 sentence insight with actionable information",
  "metrics": [{ "label": "Label", "value": "₹1,25,000", "trend": "up|down|neutral", "change": "+12%" }],
  "bullets": ["Key point 1", "Key point 2", "Key point 3"],
  "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2"],
  "confidence": "high|medium|low"
}

If you cannot answer, still respond in JSON with type "alert" and explain in summary.`

// ============================================================================
// CORS HEADERS
// ============================================================================
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================================================
// MAIN HANDLER
// ============================================================================
serve(async (req) => {
    const requestId = generateRequestId()
    const startTime = Date.now()

    log('INFO', 'Request received', { requestId, action: 'request_start' })

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        log('DEBUG', 'CORS preflight', { requestId })
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // ================================================================
        // STEP 1: Parse Request
        // ================================================================
        const { question, shopId } = await req.json()

        log('INFO', 'Request parsed', {
            requestId,
            shopId,
            action: 'parse_request',
            metadata: { questionLength: question?.length || 0 }
        })

        if (!question || !shopId) {
            log('WARN', 'Missing required fields', { requestId, action: 'validation_failed' })
            return new Response(
                JSON.stringify({ error: 'Missing question or shopId' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // ================================================================
        // STEP 2: Authenticate User via JWT
        // ================================================================
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            log('WARN', 'Missing authorization header', { requestId, action: 'auth_failed' })
            return new Response(
                JSON.stringify({ error: 'Missing authorization header' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create Supabase client with user's JWT
        // The JWT contains user info and is validated by Supabase
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            { global: { headers: { Authorization: authHeader } } }
        )

        // Verify user is authenticated - this also validates the JWT token
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            log('WARN', 'Authentication failed', {
                requestId,
                action: 'auth_failed',
                error: authError?.message || 'No user found'
            })
            return new Response(
                JSON.stringify({ error: 'Unauthorized - Invalid or expired token' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        log('INFO', 'User authenticated', {
            requestId,
            userId: user.id,
            shopId,
            action: 'auth_success'
        })

        // ================================================================
        // STEP 3: Rate Limiting Check
        // ================================================================
        const rateLimit = await checkRateLimit(user.id, supabase)

        if (!rateLimit.allowed) {
            const resetIn = Math.ceil((rateLimit.resetAt - Date.now()) / 1000 / 60) // minutes
            log('WARN', 'Rate limit exceeded', {
                requestId,
                userId: user.id,
                action: 'rate_limit_exceeded',
                metadata: { resetInMinutes: resetIn }
            })

            return new Response(
                JSON.stringify({
                    error: 'Rate limit exceeded',
                    message: `You have exceeded the limit of ${CONFIG.RATE_LIMIT_MAX_REQUESTS} requests per hour. Please try again in ${resetIn} minutes.`,
                    resetAt: rateLimit.resetAt,
                }),
                {
                    status: 429,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                        'X-RateLimit-Limit': CONFIG.RATE_LIMIT_MAX_REQUESTS.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': rateLimit.resetAt.toString(),
                    }
                }
            )
        }

        log('DEBUG', 'Rate limit check passed', {
            requestId,
            userId: user.id,
            metadata: { remaining: rateLimit.remaining }
        })

        // ================================================================
        // STEP 4: Verify User Has Access to Shop (Row Level Security)
        // ================================================================
        // RLS in Supabase automatically handles this when querying
        // The shop_members or shop ownership is checked by RLS policies
        const { data: shopData, error: shopError } = await supabase
            .from('shops')
            .select('id')
            .eq('id', shopId)
            .single()

        if (shopError || !shopData) {
            log('WARN', 'Shop access denied', {
                requestId,
                userId: user.id,
                shopId,
                action: 'access_denied',
                error: shopError?.message
            })
            return new Response(
                JSON.stringify({ error: 'Shop not found or access denied' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        log('INFO', 'Shop access verified', {
            requestId,
            userId: user.id,
            shopId,
            action: 'shop_access_verified'
        })

        // ================================================================
        // STEP 5: Fetch Business Data (Parallel Queries)
        // ================================================================
        const dataFetchStart = Date.now()
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const todayStart = new Date().toISOString().split('T')[0]

        log('DEBUG', 'Fetching business data', { requestId, action: 'data_fetch_start' })

        const [salesRes, stockRes, customersRes, khataRes, loansRes, loyaltyRes] = await Promise.all([
            // Sales data (last 30 days) - PERF-004: limit results
            supabase
                .from('invoices')
                .select('grand_total, invoice_date, status, customer_snapshot')
                .eq('shop_id', shopId)
                .gte('invoice_date', thirtyDaysAgo.split('T')[0])
                .limit(500),

            // Stock data - BUG-003: Use inventory_items instead of deprecated stock_items
            supabase
                .from('inventory_items')
                .select('name, status, gross_weight, metal_type, selling_price')
                .eq('shop_id', shopId)
                .limit(500),

            // Customer stats (from invoices) - PERF-004: limit results
            supabase
                .from('invoices')
                .select('customer_snapshot, grand_total')
                .eq('shop_id', shopId)
                .gte('invoice_date', thirtyDaysAgo.split('T')[0])
                .limit(500),

            // Khatabook data - PERF-004: limit results
            supabase
                .from('ledger_transactions')
                .select('amount, entry_type, transaction_type')
                .eq('shop_id', shopId)
                .limit(500),

            // Loans data
            supabase
                .from('loans')
                .select('principal_amount, status, total_interest_accrued')
                .eq('shop_id', shopId)
                .limit(100),

            // Loyalty data - BUG-002: Use 'reason' column instead of 'transaction_type' (which doesn't exist)
            supabase
                .from('customer_loyalty_logs')
                .select('points_change, reason')
                .eq('shop_id', shopId)
                .limit(500),
        ])

        const dataFetchDuration = Date.now() - dataFetchStart

        log('INFO', 'Business data fetched', {
            requestId,
            duration: dataFetchDuration,
            action: 'data_fetch_complete',
            metadata: {
                salesCount: salesRes.data?.length || 0,
                stockCount: stockRes.data?.length || 0,
                khataCount: khataRes.data?.length || 0,
                loansCount: loansRes.data?.length || 0,
            }
        })

        // ================================================================
        // STEP 6: Process and Aggregate Data
        // ================================================================
        // Today's sales
        const todaySales = salesRes.data?.filter(i => i.invoice_date === todayStart) || []
        const todayRevenue = todaySales.reduce((s, i) => s + Number(i.grand_total || 0), 0)

        // Sales data (30 days)
        const salesData = {
            totalRevenue: salesRes.data?.reduce((s, i) => s + Number(i.grand_total || 0), 0) || 0,
            todayRevenue,
            invoiceCount: salesRes.data?.length || 0,
            todayInvoiceCount: todaySales.length,
            paidCount: salesRes.data?.filter(i => i.status === 'paid').length || 0,
            dueCount: salesRes.data?.filter(i => i.status === 'due').length || 0,
            avgOrderValue: salesRes.data?.length
                ? (salesRes.data.reduce((s, i) => s + Number(i.grand_total || 0), 0) / salesRes.data.length)
                : 0,
        }

        // Stock data - BUG-003: Updated to use inventory_items schema
        const stockData = {
            totalItems: stockRes.data?.length || 0,
            inStockItems: stockRes.data?.filter((s: any) => s.status === 'IN_STOCK').length || 0,
            soldItems: stockRes.data?.filter((s: any) => s.status === 'SOLD').length || 0,
            reservedItems: stockRes.data?.filter((s: any) => s.status === 'RESERVED').length || 0,
            totalValue: stockRes.data?.reduce((s: number, i: any) => s + (Number(i.selling_price || 0)), 0) || 0,
            recentItemNames: stockRes.data?.filter((s: any) => s.status === 'IN_STOCK').slice(0, 5).map((s: any) => s.name) || [],
        }

        // Customer data (top 5, masked)
        const customerMap = new Map<string, number>()
        customersRes.data?.forEach(inv => {
            const name = inv.customer_snapshot?.name || 'Unknown'
            customerMap.set(name, (customerMap.get(name) || 0) + Number(inv.grand_total || 0))
        })
        const topCustomers = Array.from(customerMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, total]) => ({ name: name.split(' ')[0] + '***', total }))

        // Khata data
        const khataData = {
            receivable: khataRes.data?.filter(t => t.entry_type === 'CREDIT').reduce((s, t) => s + Number(t.amount || 0), 0) || 0,
            payable: khataRes.data?.filter(t => t.entry_type === 'DEBIT').reduce((s, t) => s + Number(t.amount || 0), 0) || 0,
            netBalance: 0,
            transactionCount: khataRes.data?.length || 0,
        }
        khataData.netBalance = khataData.receivable - khataData.payable

        // Loans data
        const loansData = {
            activeLoans: loansRes.data?.filter(l => l.status === 'active').length || 0,
            totalLoans: loansRes.data?.length || 0,
            totalDisbursed: loansRes.data?.reduce((s, l) => s + Number(l.principal_amount || 0), 0) || 0,
            interestEarned: loansRes.data?.reduce((s, l) => s + Number(l.total_interest_accrued || 0), 0) || 0,
        }

        // Loyalty data - BUG-002: Parse reason field for transaction type (column doesn't exist)
        const loyaltyData = {
            // Positive points_change = earned, negative = redeemed
            totalEarned: loyaltyRes.data?.filter((l: any) => l.points_change > 0).reduce((s: number, l: any) => s + (l.points_change || 0), 0) || 0,
            totalRedeemed: loyaltyRes.data?.filter((l: any) => l.points_change < 0).reduce((s: number, l: any) => s + Math.abs(l.points_change || 0), 0) || 0,
            activePoints: 0,
        }
        loyaltyData.activePoints = loyaltyData.totalEarned - loyaltyData.totalRedeemed

        // Build context for AI
        const context = JSON.stringify({
            period: 'Last 30 days',
            currentDate: new Date().toISOString().split('T')[0],
            sales: salesData,
            stock: stockData,
            topCustomers,
            khata: khataData,
            loans: loansData,
            loyalty: loyaltyData,
        })

        log('DEBUG', 'Context built for AI', {
            requestId,
            metadata: { contextLength: context.length }
        })

        // ================================================================
        // STEP 7: Call OpenAI API
        // ================================================================
        const openaiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openaiKey) {
            log('ERROR', 'OpenAI API key not configured', { requestId, action: 'config_error' })
            return new Response(
                JSON.stringify({ error: 'AI service not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const aiCallStart = Date.now()
        log('INFO', 'Calling OpenAI API', { requestId, action: 'openai_call_start' })

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: CONFIG.OPENAI_MODEL,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: `Business Data:\n${context}\n\nUser Question: ${question}` }
                ],
                max_tokens: CONFIG.MAX_TOKENS_RESPONSE,
                temperature: CONFIG.TEMPERATURE,
            }),
        })

        const aiCallDuration = Date.now() - aiCallStart

        if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text()
            log('ERROR', 'OpenAI API error', {
                requestId,
                action: 'openai_error',
                duration: aiCallDuration,
                error: errorText.substring(0, 200)
            })
            return new Response(
                JSON.stringify({ error: 'AI service unavailable. Please try again.' }),
                { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const openaiResult = await openaiResponse.json()
        const tokensUsed = openaiResult.usage?.total_tokens || 0
        const aiMessage = openaiResult.choices[0]?.message?.content

        log('INFO', 'OpenAI API response received', {
            requestId,
            action: 'openai_success',
            duration: aiCallDuration,
            tokensUsed,
        })

        // ================================================================
        // STEP 8: Parse AI Response
        // ================================================================
        let insight
        try {
            // Extract JSON from response (handle markdown code blocks)
            const jsonMatch = aiMessage.match(/```json\n?([\s\S]*?)\n?```/) || aiMessage.match(/\{[\s\S]*\}/)
            const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiMessage
            insight = JSON.parse(jsonStr)

            log('DEBUG', 'AI response parsed successfully', { requestId, action: 'parse_success' })
        } catch (parseError) {
            log('WARN', 'Failed to parse AI response as JSON', {
                requestId,
                action: 'parse_fallback',
                error: String(parseError)
            })

            // Fallback: create structured response from raw text
            insight = {
                type: 'insight',
                title: 'AI Response',
                summary: aiMessage,
                metrics: [],
                bullets: [],
                recommendations: [],
                confidence: 'medium'
            }
        }

        // ================================================================
        // STEP 9: Return Response
        // ================================================================
        const totalDuration = Date.now() - startTime

        log('INFO', 'Request completed successfully', {
            requestId,
            userId: user.id,
            shopId,
            duration: totalDuration,
            tokensUsed,
            action: 'request_complete'
        })

        return new Response(
            JSON.stringify({
                insight,
                tokensUsed,
                rateLimit: {
                    remaining: rateLimit.remaining,
                    limit: CONFIG.RATE_LIMIT_MAX_REQUESTS,
                    resetAt: rateLimit.resetAt,
                }
            }),
            {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                    'X-Request-Id': requestId,
                    'X-RateLimit-Limit': CONFIG.RATE_LIMIT_MAX_REQUESTS.toString(),
                    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                    'X-RateLimit-Reset': rateLimit.resetAt.toString(),
                }
            }
        )

    } catch (error) {
        const duration = Date.now() - startTime
        log('ERROR', 'Unhandled error', {
            requestId,
            duration,
            action: 'request_error',
            error: error instanceof Error ? error.message : String(error)
        })

        return new Response(
            JSON.stringify({
                error: 'Internal server error',
                requestId // Include for support/debugging
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
