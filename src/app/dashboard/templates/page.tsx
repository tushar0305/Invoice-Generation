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
      // Check if settings exist
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
    <MotionWrapper className="space-y-6 pb-24">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Invoice Templates</h1>
        <p className="text-muted-foreground text-sm">Choose the format for your invoice PDFs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card 
            key={template.id} 
            className={cn(
              "cursor-pointer transition-all duration-200 border-2",
              currentTemplate === template.id 
                ? "border-primary shadow-md" 
                : "border-transparent hover:border-primary/50"
            )}
            onClick={() => handleSelectTemplate(template.id)}
          >
            <div className={cn("aspect-[1/1.4] w-full rounded-t-lg flex items-center justify-center border-b", template.color)}>
              <div className="text-center p-6 opacity-50">
                <LayoutTemplate className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {template.name} Preview
                </span>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {template.name}
                {currentTemplate === template.id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button 
                variant={currentTemplate === template.id ? "default" : "outline"} 
                className="w-full"
                disabled={isSaving === template.id || currentTemplate === template.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectTemplate(template.id);
                }}
              >
                {isSaving === template.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentTemplate === template.id ? 'Active' : 'Select'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </MotionWrapper>
  );
}
