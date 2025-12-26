'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { MessageCircle, Copy, Check } from 'lucide-react';
import { openWhatsApp } from '@/lib/scheme-share';
import { useToast } from '@/hooks/use-toast';

interface ReferralShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    customerName: string;
    customerPhone: string;
    referralCode: string;
    shopName: string;
}

const TEMPLATES = {
    welcome: (name: string, code: string, shop: string) => 
        `Welcome to ${shop}, ${name}! 🌟\n\nWe are excited to have you. Your unique referral code is *${code}*.\n\nShare this code with your friends and family. When they join, you earn rewards! 🎁`,
    
    invite: (name: string, code: string, shop: string) => 
        `Hi! I'm saving in Gold at ${shop}. It's a great way to plan for the future.\n\nUse my code *${code}* when you join, and we both get a special bonus! 💎`,
    
    reward: (name: string, code: string, shop: string) => 
        `Congratulations ${name}! 🎉\n\nSomeone just joined ${shop} using your code *${code}*.\n\nYou have earned a reward! Visit the shop to claim it.`
};

export function ReferralShareModal({ isOpen, onClose, customerName, customerPhone, referralCode, shopName }: ReferralShareModalProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof TEMPLATES>('welcome');
    const [message, setMessage] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            setMessage(TEMPLATES[selectedTemplate](customerName, referralCode, shopName));
        }
    }, [isOpen, selectedTemplate, customerName, referralCode, shopName]);

    const handleSend = () => {
        openWhatsApp(customerPhone, message);
        toast({
            title: "WhatsApp Opened",
            description: "Please hit send in the WhatsApp window.",
        });
        onClose();
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(message);
        toast({
            title: "Copied",
            description: "Message copied to clipboard",
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-green-600" />
                        Share Referral Code
                    </DialogTitle>
                    <DialogDescription>
                        Send a WhatsApp message to {customerName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Message Template</Label>
                        <Select 
                            value={selectedTemplate} 
                            onValueChange={(val) => setSelectedTemplate(val as keyof typeof TEMPLATES)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="welcome">Welcome & Code Share</SelectItem>
                                <SelectItem value="invite">Friend Invite (For them to forward)</SelectItem>
                                <SelectItem value="reward">Reward Notification</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Preview Message</Label>
                        <Textarea 
                            value={message} 
                            onChange={(e) => setMessage(e.target.value)}
                            className="h-40 resize-none bg-muted/30 font-mono text-sm"
                        />
                    </div>
                </div>

                <DialogFooter className="flex gap-2 sm:justify-between">
                    <Button variant="outline" onClick={handleCopy} className="gap-2">
                        <Copy className="w-4 h-4" /> Copy
                    </Button>
                    <Button onClick={handleSend} className="gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white">
                        <MessageCircle className="w-4 h-4" /> Send on WhatsApp
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
