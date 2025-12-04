'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Store, 
  Palette, 
  FileText, 
  Shield, 
  ChevronRight, 
  Save, 
  Upload, 
  Image as ImageIcon,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';

interface MobileSettingsProps {
  shopId: string;
  initialSettings: any;
  user: any;
}

export function MobileSettings({ shopId, initialSettings, user }: MobileSettingsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(initialSettings || {});
  const [activeTab, setActiveTab] = useState('general');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        shop_name: settings.shopName,
        phone_number: settings.phoneNumber,
        address: settings.address,
        gst_number: settings.gstNumber,
        cgst_rate: settings.cgstRate,
        sgst_rate: settings.sgstRate,
        template_id: settings.templateId,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('shops')
        .update(payload)
        .eq('id', shopId);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your shop settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.uid}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('ShopLogo')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('ShopLogo')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('shops')
        .update({ logo_url: publicUrl })
        .eq('id', shopId);

      if (updateError) throw updateError;

      toast({ title: "Logo uploaded", description: "Refresh to see changes." });
      
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="md:hidden min-h-screen bg-gray-50/50 dark:bg-black/50 pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 px-4 py-3 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            Settings
          </h1>
          <Button 
            size="sm" 
            onClick={handleSave} 
            disabled={loading}
            className="rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl">
            <TabsTrigger value="general" className="rounded-lg text-[10px] py-2">General</TabsTrigger>
            <TabsTrigger value="branding" className="rounded-lg text-[10px] py-2">Branding</TabsTrigger>
            <TabsTrigger value="invoice" className="rounded-lg text-[10px] py-2">Invoice</TabsTrigger>
            <TabsTrigger value="account" className="rounded-lg text-[10px] py-2">Account</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="p-4 space-y-4">
        {activeTab === 'general' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card className="border-none shadow-sm bg-white dark:bg-gray-900/50">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Shop Name</Label>
                  <Input 
                    value={settings.shopName || ''} 
                    onChange={(e) => setSettings({...settings, shopName: e.target.value})}
                    className="bg-gray-50 dark:bg-gray-800/50 border-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input 
                    value={settings.phoneNumber || ''} 
                    onChange={(e) => setSettings({...settings, phoneNumber: e.target.value})}
                    className="bg-gray-50 dark:bg-gray-800/50 border-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input 
                    value={settings.address || ''} 
                    onChange={(e) => setSettings({...settings, address: e.target.value})}
                    className="bg-gray-50 dark:bg-gray-800/50 border-none"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white dark:bg-gray-900/50">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>GST Number</Label>
                  <Input 
                    value={settings.gstNumber || ''} 
                    onChange={(e) => setSettings({...settings, gstNumber: e.target.value})}
                    className="bg-gray-50 dark:bg-gray-800/50 border-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CGST (%)</Label>
                    <Input 
                      type="number"
                      value={settings.cgstRate || 0} 
                      onChange={(e) => setSettings({...settings, cgstRate: parseFloat(e.target.value)})}
                      className="bg-gray-50 dark:bg-gray-800/50 border-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SGST (%)</Label>
                    <Input 
                      type="number"
                      value={settings.sgstRate || 0} 
                      onChange={(e) => setSettings({...settings, sgstRate: parseFloat(e.target.value)})}
                      className="bg-gray-50 dark:bg-gray-800/50 border-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'branding' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card className="border-none shadow-sm bg-white dark:bg-gray-900/50">
              <CardContent className="p-4 flex flex-col items-center justify-center space-y-4">
                <div className="h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  <Upload className="w-4 h-4 mr-2" /> 
                  {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Recommended size: 500x500px. Max 2MB.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'invoice' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card className="border-none shadow-sm bg-white dark:bg-gray-900/50">
              <CardContent className="p-4 space-y-4">
                <Label>Invoice Template</Label>
                <div className="grid grid-cols-2 gap-3">
                  {['classic', 'modern', 'minimal', 'bold'].map((template) => (
                    <div 
                      key={template}
                      onClick={() => setSettings({...settings, templateId: template})}
                      className={`
                        cursor-pointer rounded-lg border-2 p-2 text-center transition-all
                        ${settings.templateId === template 
                          ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-800' 
                          : 'border-transparent bg-gray-100 dark:bg-gray-800/50'}
                      `}
                    >
                      <div className="aspect-[3/4] bg-white dark:bg-gray-900 rounded mb-2 shadow-sm" />
                      <span className="text-xs font-medium capitalize">{template}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'account' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card className="border-none shadow-sm bg-white dark:bg-gray-900/50">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-700 to-black flex items-center justify-center text-white font-bold">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{user?.email}</p>
                    <p className="text-xs text-muted-foreground">Owner</p>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  className="w-full mt-4"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
