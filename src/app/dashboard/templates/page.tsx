

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/supabase/provider';
import { supabase } from '@/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Sparkles, LayoutTemplate } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { cn } from '@/lib/utils';
import InvoicePdfTemplate from '@/components/invoice-pdf-template';
import type { Invoice, InvoiceItem, UserSettings } from '@/lib/definitions';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

const templates = [
  {
    id: 'classic',
    name: 'Classic Heritage',
    description: 'Timeless elegance for traditional jewelers.',
    color: 'from-slate-50 to-slate-100',
    accent: 'border-slate-200',
  },
  {
    id: 'modern',
    name: 'Modern Gold',
    description: 'Contemporary design with luxurious gold accents.',
    color: 'from-amber-50 to-yellow-50',
    accent: 'border-amber-200',
  },
  {
    id: 'minimal',
    name: 'Minimalist Chic',
    description: 'Clean, distraction-free layout for modern brands.',
    color: 'from-zinc-50 to-white',
    accent: 'border-zinc-200',
  },
];

export default function TemplatesPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [currentTemplate, setCurrentTemplate] = useState<string>('classic');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('template_id')
          .eq('user_id', user.uid)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading settings:', error);
        }

        if (data?.template_id) {
          setCurrentTemplate(data.template_id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [user]);

  const handleSelectTemplate = async (templateId: string) => {
    if (!user) return;
    setIsSaving(templateId);

    try {
      const { data: existing } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.uid)
        .single();

      let error;
      if (existing) {
        const { error: updateError } = await supabase
          .from('user_settings')
          .update({ template_id: templateId })
          .eq('user_id', user.uid);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert([{ user_id: user.uid, template_id: templateId }]);
        error = insertError;
      }

      if (error) throw error;

      setCurrentTemplate(templateId);
      toast({
        title: 'Style Updated',
        description: `Your invoices will now use the ${templates.find(t => t.id === templateId)?.name} style.`,
      });
    } catch (e) {
      console.error('Error saving template:', e);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not save your template preference.',
      });
    } finally {
      setIsSaving(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37]" />
          <p className="text-muted-foreground animate-pulse">Loading styles...</p>
        </div>
      </div>
    );
  }

  // Sample Data
  const previewInvoice: Invoice = {
    id: 'preview',
    userId: 'preview',
    invoiceNumber: 'INV-001',
    customerName: 'Priya Sharma',
    customerAddress: '12, Palace Road',
    customerState: 'Mumbai',
    customerPincode: '400001',
    customerPhone: '9876543210',
    invoiceDate: '2024-03-15',
    discount: 500,
    sgst: 0,
    cgst: 0,
    status: 'paid',
    grandTotal: 125000,
  } as any;

  const previewItems: InvoiceItem[] = [
    { id: 'i1', description: '22K Gold Necklace', purity: '22K', grossWeight: 15.5, netWeight: 15.0, rate: 6800, making: 450 },
  ];

  const baseSettings: Partial<UserSettings> = {
    shopName: 'Royal Jewellers',
    address: 'Gold Souk, Dubai',
    phoneNumber: '+971 50 123 4567',
    email: 'contact@royaljewels.com',
  };

  return (
    <MotionWrapper className="space-y-8 pb-24 px-1">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] p-8 text-white shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-[#D4AF37]/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[#D4AF37]">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Premium Styles</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight">
            Invoice Templates
          </h1>
          <p className="text-white/60 max-w-xl text-lg">
            Select a design that reflects your brand's prestige. All templates are optimized for mobile sharing and print.
          </p>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {templates.map((template, index) => {
          const isActive = currentTemplate === template.id;

          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group relative"
            >
              <div
                className={cn(
                  "absolute -inset-0.5 rounded-[2rem] bg-gradient-to-b from-[#D4AF37] to-transparent opacity-0 transition-opacity duration-300 blur-sm",
                  isActive ? "opacity-40" : "group-hover:opacity-20"
                )}
              />

              <Card
                className={cn(
                  "relative h-full overflow-hidden rounded-[1.8rem] border-0 bg-card/50 backdrop-blur-xl transition-all duration-300",
                  isActive ? "ring-2 ring-[#D4AF37] shadow-[0_0_30px_-10px_rgba(212,175,55,0.3)]" : "hover:bg-card/80"
                )}
                onClick={() => handleSelectTemplate(template.id)}
              >
                {/* Preview Area */}
                <div className="relative aspect-[1/1.2] w-full overflow-hidden bg-muted/20 p-6">
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-tr opacity-50",
                    template.color
                  )} />

                  <div className="relative h-full w-full overflow-hidden rounded-xl shadow-2xl transition-transform duration-500 group-hover:scale-[1.02] group-hover:-rotate-1 bg-white">
                    <div className="origin-top-left scale-[0.35] md:scale-[0.4] w-[210mm] h-[297mm] pointer-events-none select-none">
                      <InvoicePdfTemplate
                        invoice={previewInvoice}
                        items={previewItems}
                        settings={{ ...baseSettings, templateId: template.id } as any}
                      />
                    </div>

                    {/* Overlay for non-active */}
                    {!isActive && (
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[1px]">
                        <Button variant="secondary" className="shadow-xl translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          Preview Style
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-heading font-bold text-xl flex items-center gap-2">
                        {template.name}
                        {isActive && (
                          <Badge variant="secondary" className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 text-[10px] px-2 py-0.5 h-5">
                            Active
                          </Badge>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button
                      className={cn(
                        "w-full h-12 rounded-xl font-medium transition-all duration-300",
                        isActive
                          ? "bg-[#D4AF37] hover:bg-[#C5A028] text-black shadow-lg shadow-[#D4AF37]/20"
                          : "bg-secondary hover:bg-secondary/80"
                      )}
                      disabled={isSaving === template.id}
                    >
                      {isSaving === template.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : isActive ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Selected
                        </>
                      ) : (
                        'Use This Style'
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </MotionWrapper>
  );
}
