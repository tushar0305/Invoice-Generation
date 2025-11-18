'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShoppingCart, FileText, Settings } from 'lucide-react';
import type { UserSettings } from '@/lib/definitions';

interface FirstTimeWelcomeProps {
  settings: UserSettings | null;
  isLoading?: boolean;
  hasInvoices?: boolean;
}

export function FirstTimeWelcome({ settings, isLoading, hasInvoices }: FirstTimeWelcomeProps) {
  // Show welcome only if there are no settings and no invoices (brand new user)
  if (isLoading || settings || hasInvoices) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Hero Card */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to Invoice Generator! 🎉</CardTitle>
          <CardDescription className="text-base mt-2">
            Let's set up your shop and get you creating invoices in minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Setup Steps */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Getting Started (3 simple steps):</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1 */}
              <div className="p-4 bg-white rounded-lg border border-blue-100">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-semibold flex-shrink-0">1</div>
                  <div>
                    <h4 className="font-semibold mb-2">Add Shop Details</h4>
                    <p className="text-sm text-muted-foreground mb-3">Tell us about your shop - this will appear on every invoice.</p>
                    <Link href="/dashboard/settings">
                      <Button size="sm" variant="outline" className="w-full">
                        Set Up Shop <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 bg-white rounded-lg border border-indigo-100">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-semibold flex-shrink-0">2</div>
                  <div>
                    <h4 className="font-semibold mb-2">Add Stock Items (Optional)</h4>
                    <p className="text-sm text-muted-foreground mb-3">Create a catalog of products you sell for quick invoice creation.</p>
                    <Link href="/dashboard/stock">
                      <Button size="sm" variant="outline" className="w-full">
                        Add Stock <ShoppingCart className="w-4 h-4 mr-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 bg-white rounded-lg border border-purple-100">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white font-semibold flex-shrink-0">3</div>
                  <div>
                    <h4 className="font-semibold mb-2">Create Your First Invoice</h4>
                    <p className="text-sm text-muted-foreground mb-3">Start creating professional invoices for your customers.</p>
                    <Link href="/dashboard/invoices/new">
                      <Button size="sm" variant="outline" className="w-full">
                        New Invoice <FileText className="w-4 h-4 mr-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="pt-6 border-t">
            <h3 className="font-semibold mb-3">Key Features:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Professional invoice templates</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Automatic tax calculations</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm">PDF and print support</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Customer management</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Share via WhatsApp</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm">Payment tracking</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-4 flex gap-3">
            <Link href="/dashboard/settings" className="flex-1">
              <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
