-- ==========================================
-- Online Catalogue / Digital Showcase Module
-- ==========================================

-- 1. Catalogue Settings (Branding & URL)
CREATE TABLE public.catalogue_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    public_slug TEXT NOT NULL, -- e.g., 'kohinoor-jewels'
    shop_display_name TEXT NOT NULL,
    about_text TEXT,
    logo_url TEXT,
    banner_url TEXT,
    primary_color TEXT DEFAULT '#D4AF37', -- Gold default
    is_active BOOLEAN DEFAULT false,
    contact_phone TEXT, -- WhatsApp number for inquiries
    contact_address TEXT,
    show_prices BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(shop_id),
    UNIQUE(public_slug)
);

-- 2. Device/View Analytics
CREATE TABLE public.catalogue_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    view_type TEXT CHECK (view_type IN ('page_view', 'product_view', 'whatsapp_click')),
    product_id UUID, -- Nullable for general page views
    visitor_id TEXT, -- Anonymous cookie ID
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Categories
CREATE TABLE public.catalogue_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(shop_id, slug)
);

-- 4. Products
CREATE TABLE public.catalogue_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id),
    category_id UUID REFERENCES public.catalogue_categories(id),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC DEFAULT 0,
    weight_g NUMERIC,
    purity TEXT, -- 22K, 18K, etc.
    images TEXT[], -- Array of image URLs
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- Row Level Security (RLS)
-- ==========================================

-- Enable RLS
ALTER TABLE catalogue_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogue_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogue_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogue_products ENABLE ROW LEVEL SECURITY;

-- Policies for Shop Owners (Manage their own data)
CREATE POLICY "Owners can manage catalogue settings" ON catalogue_settings
    FOR ALL USING (public.is_shop_owner(shop_id));

CREATE POLICY "Owners can manage categories" ON catalogue_categories
    FOR ALL USING (public.is_shop_owner(shop_id));

CREATE POLICY "Owners can manage products" ON catalogue_products
    FOR ALL USING (public.is_shop_owner(shop_id));

CREATE POLICY "Owners can view analytics" ON catalogue_analytics
    FOR SELECT USING (public.is_shop_owner(shop_id));

-- Policies for Public (View data)
-- Anyone can view active settings, categories, and products
CREATE POLICY "Public can view active settings" ON catalogue_settings
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active categories" ON catalogue_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active products" ON catalogue_products
    FOR SELECT USING (is_active = true);

-- Analytics: Public can insert (log views), but not read
CREATE POLICY "Public can log analytics" ON catalogue_analytics
    FOR INSERT WITH CHECK (true);

-- Indexes for Performance
CREATE INDEX idx_catalogue_slug ON catalogue_settings(public_slug);
CREATE INDEX idx_products_category ON catalogue_products(category_id);
CREATE INDEX idx_products_shop ON catalogue_products(shop_id);
