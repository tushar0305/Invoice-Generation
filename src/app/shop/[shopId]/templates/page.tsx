'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/supabase/provider';
import { supabase } from '@/supabase/client';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Sparkles, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { cn } from '@/lib/utils';
import { TemplatePreviewCard } from '@/components/template-preview-card';
import { useActiveShop } from '@/hooks/use-active-shop';
import { motion } from 'framer-motion';

const templates = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional and professional layout suitable for all businesses.',
    color: 'from-slate-500/20 to-slate-500/5',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and contemporary design with a focus on readability.',
    color: 'from-blue-500/20 to-blue-500/5',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Stripped back design that focuses purely on the data.',
    color: 'from-zinc-500/20 to-zinc-500/5',
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Sophisticated design with serif fonts and gold accents.',
    color: 'from-amber-500/20 to-amber-500/5',
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Exclusive watermark design with sophisticated gold styling.',
    color: 'from-yellow-600/20 to-yellow-600/5',
  },
];

export default function TemplatesPage() {
  const { user } = useUser();
  const { activeShop, refreshShops } = useActiveShop();
  const { toast } = useToast();
  const [currentTemplate, setCurrentTemplate] = useState<string>('classic');
  const [isSaving, setIsSaving] = useState<string | null>(null);

  useEffect(() => {
    if (activeShop?.templateId) {
      setCurrentTemplate(activeShop.templateId);
    }
  }, [activeShop]);

  const handleSelectTemplate = async (templateId: string) => {
    if (!activeShop) return;
    setIsSaving(templateId);

    try {
      const { error } = await supabase
        .from('shops')
        .update({ template_id: templateId })
        .eq('id', activeShop.id);

      if (error) throw error;

      setCurrentTemplate(templateId);
      await refreshShops(); // Refresh to update local state

      toast({
        title: 'Template Updated',
        description: `Invoice format set to ${templates.find(t => t.id === templateId)?.name}.`,
      });
    } catch (e) {
      console.error('Error saving template:', e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update template preference.',
      });
    } finally {
      setIsSaving(null);
    }
  };

  if (!activeShop) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <MotionWrapper className="space-y-8 pb-24">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-background border border-white/10 p-8 md:p-12">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Palette className="w-64 h-64 text-primary" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-primary tracking-wider uppercase">Customization</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 mb-4">
            Invoice Templates
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Choose the perfect look for your brand. Your selected template will be applied to all future invoices generated for <span className="text-foreground font-medium">{activeShop.shopName}</span>.
          </p>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
        {templates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "group relative rounded-xl overflow-hidden transition-all duration-500 w-full max-w-[240px] aspect-[210/297] shadow-lg hover:shadow-2xl border border-white/10",
              currentTemplate === template.id
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                : "hover:scale-[1.02]"
            )}
            onClick={() => handleSelectTemplate(template.id)}
          >
            {/* Background Gradient */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
              template.color
            )} />

            {/* Preview Area - Full Card */}
            <div className="absolute inset-0 bg-white">
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                <div className="transform scale-[0.3] origin-center pointer-events-none select-none">
                  <TemplatePreviewCard templateId={template.id} />
                </div>
              </div>

              {/* Overlay for non-active */}
              {currentTemplate !== template.id && (
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300" />
              )}
            </div>

            {/* Content Overlay - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end items-center text-center">
              <h3 className="font-bold text-lg mb-1">{template.name}</h3>
              <p className="text-xs text-white/80 mb-3 line-clamp-2">{template.description}</p>
              <Button
                size="sm"
                variant={currentTemplate === template.id ? "default" : "outline"}
                className="w-full h-8 text-xs"
                disabled={isSaving === template.id || currentTemplate === template.id}
              >
                {isSaving === template.id ? <Loader2 className="h-3 w-3 animate-spin" /> : (currentTemplate === template.id ? 'Selected' : 'Use Template')}
              </Button>
            </div>

            {/* Active Badge - Top Right */}
            {currentTemplate === template.id && (
              <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 z-10">
                <Check className="h-3 w-3" /> Active
              </div>
            )}

            {/* Always visible title for mobile/touch when not hovering */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/90 backdrop-blur-sm border-t border-gray-100 md:hidden">
              <h3 className="font-semibold text-sm text-center text-gray-900">{template.name}</h3>
            </div>
          </motion.div>
        ))}
      </div>
    </MotionWrapper>
  );
}
