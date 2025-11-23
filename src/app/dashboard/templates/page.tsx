'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/supabase/provider';
import { supabase } from '@/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2, LayoutTemplate } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MotionWrapper } from '@/components/ui/motion-wrapper';
import { cn } from '@/lib/utils';

const templates = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional and professional layout suitable for all businesses.',
    color: 'bg-slate-100',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and contemporary design with a focus on readability.',
    color: 'bg-blue-50',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Stripped back design that focuses purely on the data.',
    color: 'bg-zinc-50',
  },
];

import { TemplatePreviewCard } from '@/components/template-preview-card';

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <MotionWrapper className="space-y-8 pb-24">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
          Invoice Templates
        </h1>
        <p className="text-muted-foreground">
          Choose the perfect look for your brand. Changes apply to all future invoices.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {templates.map((template) => (
          <div
            key={template.id}
            className={cn(
              "group relative rounded-2xl overflow-hidden transition-all duration-300",
              currentTemplate === template.id
                ? "ring-2 ring-primary shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)] scale-[1.02]"
                : "hover:scale-[1.02] hover:shadow-xl border border-white/5 bg-background/40 backdrop-blur-sm"
            )}
            onClick={() => handleSelectTemplate(template.id)}
          >
            {/* Preview Area */}
            <div className="aspect-[1/1.4] w-full bg-muted/50 relative overflow-hidden">
              <div className="absolute inset-0 flex items-start justify-center pt-4 px-4 transition-transform duration-500 group-hover:scale-105">
                <TemplatePreviewCard templateId={template.id} />
              </div>

              {/* Overlay for non-active */}
              {currentTemplate !== template.id && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
              )}

              {/* Active Badge */}
              {currentTemplate === template.id && (
                <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <Check className="h-3 w-3" /> Active
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="p-5 space-y-4 bg-background/60 backdrop-blur-xl border-t border-white/5">
              <div>
                <h3 className="font-semibold text-lg tracking-tight flex items-center justify-between">
                  {template.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {template.description}
                </p>
              </div>

              <Button
                variant={currentTemplate === template.id ? "default" : "secondary"}
                className={cn(
                  "w-full shadow-lg transition-all duration-300",
                  currentTemplate === template.id
                    ? "shadow-primary/25"
                    : "hover:bg-primary hover:text-primary-foreground"
                )}
                disabled={isSaving === template.id || currentTemplate === template.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectTemplate(template.id);
                }}
              >
                {isSaving === template.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentTemplate === template.id ? 'Selected' : 'Use Template'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </MotionWrapper>
  );
}
