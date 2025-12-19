import { Check, LayoutTemplate } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

const templates = [
    {
        id: 'classic',
        name: 'Classic',
        description: 'Traditional and professional layout.',
        color: 'bg-slate-100',
    },
    {
        id: 'modern',
        name: 'Modern',
        description: 'Sleek design with bold headers.',
        color: 'bg-blue-50',
    },
    {
        id: 'minimal',
        name: 'Minimal',
        description: 'Clean and simple, ink-saving.',
        color: 'bg-white border-2 border-dashed',
    },
    {
        id: 'premium',
        name: 'Premium',
        description: 'Elegant design with watermark background.',
        color: 'bg-amber-50 border-amber-200',
    },
];

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
    return (
        <div className="flex flex-row overflow-x-auto pb-4 gap-4 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 snap-x">
            {templates.map((template) => (
                <div
                    key={template.id}
                    className={cn(
                        "relative cursor-pointer rounded-xl border-2 p-4 transition-all hover:border-primary/50 min-w-[280px] sm:min-w-0 snap-center",
                        value === template.id ? "border-primary bg-primary/5" : "border-transparent bg-muted/50",
                    )}
                    onClick={() => onChange(template.id)}
                >
                    {value === template.id && (
                        <div className="absolute -right-2 -top-2 rounded-full bg-primary p-1 text-primary-foreground shadow-sm">
                            <Check className="h-3 w-3" />
                        </div>
                    )}
                    <div className={cn("mb-3 h-24 rounded-lg flex items-center justify-center", template.color)}>
                        <LayoutTemplate className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-semibold leading-none tracking-tight">{template.name}</h3>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
