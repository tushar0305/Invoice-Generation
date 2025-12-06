-- WhatsApp Marketing Module Schema
-- Simplified for one-way messaging (no webhooks/scheduling)

-- 1. WhatsApp Configurations (one per shop)
CREATE TABLE IF NOT EXISTS whatsapp_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  waba_id TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  display_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'error')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(shop_id)
);

-- 2. WhatsApp Templates (synced from Meta)
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'MARKETING' CHECK (category IN ('MARKETING', 'UTILITY', 'AUTHENTICATION')),
  language TEXT DEFAULT 'en',
  body TEXT NOT NULL,
  header_text TEXT,
  footer TEXT,
  buttons JSONB,
  meta_template_id TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(shop_id, name)
);

-- 3. WhatsApp Messages Log
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  template_id UUID REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  variables JSONB,
  meta_message_id TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_configs_shop ON whatsapp_configs(shop_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_shop ON whatsapp_templates(shop_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_status ON whatsapp_templates(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_shop ON whatsapp_messages(shop_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sent_at ON whatsapp_messages(sent_at DESC);

-- RLS Policies
ALTER TABLE whatsapp_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Config: Only shop members can view, only owners can modify
CREATE POLICY "Shop members can view whatsapp config"
  ON whatsapp_configs FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Shop owners can manage whatsapp config"
  ON whatsapp_configs FOR ALL
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Templates: Shop members can view and create
CREATE POLICY "Shop members can view templates"
  ON whatsapp_templates FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Shop members can manage templates"
  ON whatsapp_templates FOR ALL
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles 
      WHERE user_id = auth.uid()
    )
  );

-- Messages: Shop members can view and insert
CREATE POLICY "Shop members can view messages"
  ON whatsapp_messages FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Shop members can send messages"
  ON whatsapp_messages FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM user_shop_roles 
      WHERE user_id = auth.uid()
    )
  );

-- Updated at trigger for configs
CREATE OR REPLACE FUNCTION update_whatsapp_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER whatsapp_config_updated_at
  BEFORE UPDATE ON whatsapp_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_config_updated_at();
