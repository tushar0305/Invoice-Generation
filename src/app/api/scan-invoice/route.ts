import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy',
});

// Demo fallback data for when API quota is exceeded
function getDemoExtractedData() {
    return {
        customerName: 'Priya Sharma',
        customerPhone: '+91 9876543210',
        customerAddress: '45 MG Road, New Delhi - 110001',
        invoiceNumber: `DEMO-${Math.floor(Math.random() * 10000)}`,
        invoiceDate: new Date().toISOString().split('T')[0],
        total: 85000,
        items: [
            {
                description: '22K Gold Chain',
                purity: '22K',
                grossWeight: 20.5,
                netWeight: 20.0,
                rate: 6500,
                making: 15000,
                stoneWeight: null,
                quantity: 1,
            },
            {
                description: 'Gold Pendant',
                purity: '22K',
                grossWeight: 5.2,
                netWeight: 5.0,
                rate: 6500,
                making: 3000,
                stoneWeight: 0.2,
                quantity: 1,
            },
        ],
    };
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { image } = body;

        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            console.warn('OpenAI API key not configured, using demo data');
            return NextResponse.json({
                success: true,
                extractedData: getDemoExtractedData(),
                demo: true,
                message: 'Demo mode: OpenAI API key not configured',
            });
        }

        try {
            // Call OpenAI Vision API
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `You are an expert invoice data extractor for a jewelry business. Analyze this invoice image and extract ALL relevant information in JSON format.

Extract the following fields (provide null if not found):
- customerName: Full customer name
- customerPhone: Phone number
- customerAddress: Complete address
- invoiceNumber: Invoice number
- invoiceDate: Date in YYYY-MM-DD format
- total: Total amount (numeric)
- items: Array of items with:
  - description: Item description/name
  - purity: Gold/Silver purity (e.g., 22K, 18K, 925)
  - grossWeight: Gross weight in grams (numeric)
  - netWeight: Net weight in grams (numeric)
  - rate: Rate per gram (numeric)
  - making: Making charges (numeric)
  - stoneWeight: Stone weight if any (numeric)
  - quantity: Quantity (numeric, default 1)

Return ONLY valid JSON, no markdown formatting. Example:
{
  "customerName": "Rajesh Kumar",
  "customerPhone": "+91 9876543210",
  "customerAddress": "123 MG Road, Delhi",
  "invoiceNumber": "INV-2024-001",
  "invoiceDate": "2024-11-25",
  "total": 125000,
  "items": [
    {
      "description": "Gold Necklace",
      "purity": "22K",
      "grossWeight": 25.5,
      "netWeight": 24.0,
      "rate": 6500,
      "making": 12000,
      "quantity": 1
    }
  ]
}`,
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: image,
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 2000,
            });

            const content = response.choices[0]?.message?.content;

            if (!content) {
                throw new Error('No response from OpenAI');
            }

            // Parse the JSON response
            let extractedData;
            try {
                // Remove markdown code blocks if present
                const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
                extractedData = JSON.parse(cleanedContent);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Raw content:', content);
                throw new Error('Failed to parse AI response');
            }

            // Validate and clean the data
            const validatedData = {
                customerName: extractedData.customerName || 'Unknown Customer',
                customerPhone: extractedData.customerPhone || null,
                customerAddress: extractedData.customerAddress || null,
                invoiceNumber: extractedData.invoiceNumber || null,
                invoiceDate: extractedData.invoiceDate || new Date().toISOString().split('T')[0],
                total: typeof extractedData.total === 'number' ? extractedData.total : null,
                items: Array.isArray(extractedData.items) ? extractedData.items.map((item: any) => ({
                    description: item.description || 'Item',
                    purity: item.purity || null,
                    grossWeight: typeof item.grossWeight === 'number' ? item.grossWeight : null,
                    netWeight: typeof item.netWeight === 'number' ? item.netWeight : null,
                    rate: typeof item.rate === 'number' ? item.rate : null,
                    making: typeof item.making === 'number' ? item.making : null,
                    stoneWeight: typeof item.stoneWeight === 'number' ? item.stoneWeight : null,
                    quantity: typeof item.quantity === 'number' ? item.quantity : 1,
                })) : [],
            };

            return NextResponse.json({
                success: true,
                extractedData: validatedData,
            });

        } catch (apiError: any) {
            // Check if it's a quota error
            if (apiError.status === 429 || apiError.code === 'insufficient_quota') {
                console.warn('OpenAI quota exceeded, using demo data');
                return NextResponse.json({
                    success: true,
                    extractedData: getDemoExtractedData(),
                    demo: true,
                    message: 'Demo mode: OpenAI quota exceeded. Please add credits to your OpenAI account for production use.',
                });
            }

            // Re-throw other errors
            throw apiError;
        }

    } catch (error: any) {
        console.error('Invoice scan error:', error);

        // If all else fails, still return demo data
        return NextResponse.json({
            success: true,
            extractedData: getDemoExtractedData(),
            demo: true,
            message: 'Demo mode: Error occurred. Using sample data for demonstration.',
        });
    }
}
