'use client';

import { TemplateBasic } from '@/components/catalogue/templates/template-basic';
import { TemplateModern } from '@/components/catalogue/templates/template-modern';
import { TemplatePremium } from '@/components/catalogue/templates/template-premium';

interface StoreClientProps {
    shop: any;
    initialProducts: any[];
    categories: any[];
}

export function StoreClient({ shop, initialProducts, categories }: StoreClientProps) {

    // Choose Template
    const Template = {
        basic: TemplateBasic,
        modern: TemplateModern,
        premium: TemplatePremium
    }[shop.template_id as 'basic' | 'modern' | 'premium'] || TemplateBasic;

    return <Template shop={shop} initialProducts={initialProducts} categories={categories} />;
}
