'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, QrCode, AlertCircle, Loader2, Camera, Keyboard } from 'lucide-react';
import { supabase } from '@/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import jsQR from 'jsqr';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Zap } from 'lucide-react';

interface QRScannerProps {
    shopId: string;
    onItemsAdded: (items: Array<{
        id: string;
        tag_id: string;
        name: string;
        metal_type: string;
        purity: string;
        hsn_code?: string;
        category?: string;
        gross_weight: number;
        net_weight: number;
        stone_weight?: number;
        wastage_percent?: number;
        making_charge_value?: number;
    }>) => void;
    existingTagIds: string[];
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

interface ScannedItem {
    tag_id: string;
    status: 'pending' | 'success' | 'error' | 'duplicate';
    item?: any;
    error?: string;
    timestamp: number;
}

export function MultiQRScanner({
    shopId,
    onItemsAdded,
    existingTagIds,
    isOpen,
    onOpenChange
}: QRScannerProps) {
    const { toast } = useToast();
    const [qrInput, setQrInput] = useState('');
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [scanMode, setScanMode] = useState<'manual' | 'camera'>('manual');
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    // UX-NEW: Continuous Scan
    const [continuousMode, setContinuousMode] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const requestRef = useRef<number>();

    // Focus input when dialog opens
    useEffect(() => {
        if (isOpen && inputRef.current && scanMode === 'manual') {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, scanMode]);

    // Cleanup camera on unmount or mode change
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const playSuccessSound = () => {
        const audio = new Audio('/sounds/beep.mp3'); // Fallback or native beep?
        // Using AudioContext for a simple generated beep is more reliable than missing file
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 1000;
                osc.type = 'sine';
                gain.gain.value = 0.1;
                osc.start();
                setTimeout(() => osc.stop(), 150);
            }
        } catch (e) {
            console.error("Audio beep failed", e);
        }
    };

    const startCamera = async () => {
        try {
            setCameraError(null);

            // Check if API exists
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera not supported on this device/browser.');
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' }, // Prefer back camera
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Required for iOS to play video inline
                videoRef.current.setAttribute('playsinline', 'true');
                streamRef.current = stream;
                setCameraActive(true);

                // Start scanning after video is ready
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch(e => console.error("Play error:", e));
                    captureAndDecode();
                };
            }
        } catch (error: any) {
            console.error("Camera Error:", error);
            const errorMsg = error.name === 'NotAllowedError'
                ? 'Camera permission denied. Please allow camera access.'
                : error.name === 'NotFoundError'
                    ? 'No camera found on this device.'
                    : 'Failed to access camera. Please check permissions.';

            setCameraError(errorMsg);
            toast({
                variant: 'destructive',
                title: 'Camera Error',
                description: errorMsg
            });
            setScanMode('manual');
        }
    };

    const stopCamera = () => {
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    const captureAndDecode = () => {
        if (!cameraActive || !videoRef.current || !canvasRef.current) return;

        // Check if video is actually playing and has data
        if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const context = canvasRef.current.getContext('2d', { willReadFrequently: true });
            if (!context) return;

            const height = videoRef.current.videoHeight;
            const width = videoRef.current.videoWidth;

            canvasRef.current.height = height;
            canvasRef.current.width = width;

            // Draw video frame to canvas
            context.drawImage(videoRef.current, 0, 0, width, height);

            try {
                // Get image data and decode QR
                const imageData = context.getImageData(0, 0, width, height);
                const code = jsQR(imageData.data, width, height, {
                    inversionAttempts: "dontInvert",
                });

                if (code && code.data && code.data.length > 0) {
                    // Found a QR code!
                    handleQRScan(code.data);
                }
            } catch (e) {
                console.error("Decoding error:", e);
            }
        }

        // Continue capturing
        if (cameraActive) {
            requestRef.current = requestAnimationFrame(captureAndDecode);
        }
    };

    const handleQRScan = async (qrCode: string) => {
        const trimmedQR = qrCode.trim();
        if (!trimmedQR) return;

        // Debounce: Check if we just scanned this item (last 2 seconds) 
        // OR if it's already in the list to avoid rapid duplicate firing
        const lastItem = scannedItems[scannedItems.length - 1];
        if (lastItem && lastItem.tag_id === trimmedQR && (Date.now() - lastItem.timestamp < 2000)) {
            return;
        }

        // Check if already scanned in this session
        if (scannedItems.some(item => item.tag_id === trimmedQR)) {
            setScannedItems(prev => [...prev, {
                tag_id: trimmedQR,
                status: 'duplicate',
                error: 'Already scanned in this session',
                timestamp: Date.now()
            }]);
            return;
        }

        // Check if already in invoice
        if (existingTagIds.includes(trimmedQR)) {
            setScannedItems(prev => [...prev, {
                tag_id: trimmedQR,
                status: 'duplicate',
                error: 'Already added to invoice',
                timestamp: Date.now()
            }]);
            return;
        }

        setIsProcessing(true);
        try {
            // Fetch inventory item by tag_id
            const { data, error } = await supabase
                .from('inventory_items')
                .select('*')
                .eq('tag_id', trimmedQR)
                .eq('shop_id', shopId)
                .eq('status', 'IN_STOCK')
                .single();

            if (error || !data) {
                setScannedItems(prev => [...prev, {
                    tag_id: trimmedQR,
                    status: 'error',
                    error: 'Item not found or not in stock',
                    timestamp: Date.now()
                }]);
            } else {
                // Success!
                playSuccessSound();
                if ('vibrate' in navigator) navigator.vibrate([50]);

                if (continuousMode) {
                    // Auto-Add immediately
                    onItemsAdded([data]);
                    toast({
                        title: "Added Item",
                        description: `${data.name} (${data.tag_id})`,
                        duration: 1500,
                        className: "bg-emerald-50 border-emerald-200 text-emerald-800"
                    });
                    setScannedItems(prev => [...prev, {
                        tag_id: trimmedQR,
                        status: 'success',
                        item: data,
                        timestamp: Date.now()
                    }]);
                } else {
                    // Manual Add later
                    setScannedItems(prev => [...prev, {
                        tag_id: trimmedQR,
                        status: 'success',
                        item: data,
                        timestamp: Date.now()
                    }]);
                }
            }
        } catch (err: any) {
            setScannedItems(prev => [...prev, {
                tag_id: trimmedQR,
                status: 'error',
                error: err.message || 'Failed to fetch item',
                timestamp: Date.now()
            }]);
        } finally {
            setIsProcessing(false);
            if (scanMode === 'manual') {
                setQrInput('');
                inputRef.current?.focus();
            }
        }
    };

    const handleAddScannedItems = () => {
        const successItems = scannedItems
            .filter(item => item.status === 'success' && item.item)
            .map(item => item.item);

        if (successItems.length > 0) {
            onItemsAdded(successItems);
            setScannedItems([]);
            setQrInput('');
            onOpenChange(false);
        }
    };

    const handleClearScan = () => {
        setScannedItems([]);
        setQrInput('');
        inputRef.current?.focus();
    };

    const successCount = scannedItems.filter(item => item.status === 'success').length;
    const errorCount = scannedItems.filter(item => item.status === 'error').length;
    const duplicateCount = scannedItems.filter(item => item.status === 'duplicate').length;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                stopCamera();
            }
            onOpenChange(open);
        }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <QrCode className="h-5 w-5" />
                        Scan Multiple QR Codes
                    </DialogTitle>
                    <DialogDescription>
                        Choose scan mode: Use camera or enter IDs manually.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Mode Toggle & Continuous Switch */}
                    <div className="flex flex-col sm:flex-row justify-between gap-3 bg-muted/30 p-3 rounded-lg border">
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={scanMode === 'manual' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    setScanMode('manual');
                                    stopCamera();
                                }}
                                className="gap-2"
                            >
                                <Keyboard className="h-4 w-4" />
                                Manual
                            </Button>
                            <Button
                                type="button"
                                variant={scanMode === 'camera' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    setScanMode('camera');
                                    startCamera();
                                }}
                                className="gap-2"
                            >
                                <Camera className="h-4 w-4" />
                                Camera
                            </Button>
                        </div>

                        {/* Continuous Mode Toggle */}
                        <div className="flex items-center space-x-2 border-l pl-4 border-border/50">
                            <Switch
                                id="continuous-mode"
                                checked={continuousMode}
                                onCheckedChange={setContinuousMode}
                            />
                            <Label htmlFor="continuous-mode" className="text-sm cursor-pointer flex items-center gap-1.5 font-medium">
                                <Zap className={cn("h-3.5 w-3.5", continuousMode ? "text-amber-500 fill-amber-500" : "text-muted-foreground")} />
                                Auto-Add Items
                            </Label>
                        </div>
                    </div>

                    {/* Camera Mode */}
                    {scanMode === 'camera' && (
                        <div className="space-y-2">
                            {cameraError && (
                                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 rounded-lg text-sm">
                                    {cameraError}
                                </div>
                            )}
                            {cameraActive && (
                                <div className="space-y-2">
                                    <div className="relative bg-black rounded-lg overflow-hidden aspect-video shadow-inner">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover"
                                        />
                                        {/* Crosshair overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-56 h-56 border-2 border-primary/50 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] relative">
                                                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary -mt-1 -ml-1"></div>
                                                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary -mt-1 -mr-1"></div>
                                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary -mb-1 -ml-1"></div>
                                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary -mb-1 -mr-1"></div>
                                            </div>
                                            <div className="absolute w-64 h-0.5 bg-red-500/80 animate-pulse top-1/2 -translate-y-1/2 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                        </div>
                                        {/* Continuous Mode Indicator */}
                                        {continuousMode && (
                                            <div className="absolute top-4 right-4 bg-black/60 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1.5 backdrop-blur-md border border-white/10">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                                Auto-Add On
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center">
                                        {continuousMode ? "Scan items continuously. They will be added automatically." : "Point camera at QR code."}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={stopCamera}
                                        className="w-full"
                                    >
                                        Stop Camera
                                    </Button>
                                </div>
                            )}
                            {!cameraActive && !cameraError && (
                                <Button
                                    type="button"
                                    className="w-full gap-2 py-8 bg-muted/50 hover:bg-muted border-2 border-dashed text-muted-foreground"
                                    variant="ghost"
                                    onClick={startCamera}
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <Camera className="h-6 w-6" />
                                        <span>Tap to Start Camera</span>
                                    </div>
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Manual Entry Mode */}
                    {scanMode === 'manual' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Enter QR Code or Tag ID</label>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handleQRScan(qrInput);
                            }} className="flex gap-2">
                                <Input
                                    ref={inputRef}
                                    placeholder="e.g., SA-G22-000001 or scan with device..."
                                    value={qrInput}
                                    onChange={(e) => setQrInput(e.target.value)}
                                    disabled={isProcessing}
                                    className="flex-1"
                                    autoComplete="off"
                                />
                                <Button
                                    type="submit"
                                    disabled={isProcessing || !qrInput.trim()}
                                    className="gap-2"
                                >
                                    {isProcessing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <QrCode className="h-4 w-4" />
                                    )}
                                    Add
                                </Button>
                            </form>
                            {continuousMode && <p className="text-xs text-amber-600 flex items-center gap-1"><Zap className="h-3 w-3" /> Auto-add enabled for manual entry too.</p>}
                        </div>
                    )}

                    {/* Hidden canvas for camera capture */}
                    <canvas
                        ref={canvasRef}
                        style={{ display: 'none' }}
                    />

                    {/* Stats */}
                    {scannedItems.length > 0 && (
                        <div className="flex gap-2">
                            {successCount > 0 && (
                                <Badge className="bg-green-500/10 text-green-600 border-green-200">
                                    <Check className="h-3 w-3 mr-1" />
                                    {successCount} Added
                                </Badge>
                            )}
                            {duplicateCount > 0 && (
                                <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    {duplicateCount} Duplicate
                                </Badge>
                            )}
                            {errorCount > 0 && (
                                <Badge className="bg-red-500/10 text-red-600 border-red-200">
                                    <X className="h-3 w-3 mr-1" />
                                    {errorCount} Error
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* Scanned Items List */}
                    {scannedItems.length > 0 && (
                        <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1 custom-scrollbar">
                            {scannedItems.slice().reverse().map((scannedItem, idx) => (
                                <Card
                                    key={scannedItem.timestamp}
                                    className={cn(
                                        'transition-all duration-300 animate-in slide-in-from-top-2',
                                        scannedItem.status === 'success' && 'bg-green-50/50 dark:bg-green-950/20 border-green-200',
                                        scannedItem.status === 'error' && 'bg-red-50/50 dark:bg-red-950/20 border-red-200',
                                        scannedItem.status === 'duplicate' && 'bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200'
                                    )}
                                >
                                    <CardContent className="p-2.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    {scannedItem.status === 'success' && (
                                                        <Check className="h-3.5 w-3.5 text-green-600" />
                                                    )}
                                                    {scannedItem.status === 'error' && (
                                                        <X className="h-3.5 w-3.5 text-red-600" />
                                                    )}
                                                    {scannedItem.status === 'duplicate' && (
                                                        <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />
                                                    )}
                                                    <span className="font-mono font-bold text-sm">{scannedItem.tag_id}</span>
                                                </div>
                                                {scannedItem.item && (
                                                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                                                        <span>{scannedItem.item.name} • {scannedItem.item.net_weight}g</span>
                                                    </div>
                                                )}
                                                {scannedItem.error && (
                                                    <div className="text-xs text-destructive mt-0.5">
                                                        {scannedItem.error}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground opacity-50">
                                                {new Date(scannedItem.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 justify-end pt-4 border-t mt-2">
                        <Button
                            variant="outline"
                            onClick={handleClearScan}
                            disabled={scannedItems.length === 0}
                        >
                            Clear
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Close
                        </Button>
                        {!continuousMode && (
                            <Button
                                onClick={handleAddScannedItems}
                                disabled={successCount === 0}
                                className="gap-2"
                            >
                                <Check className="h-4 w-4" />
                                Add {successCount} Items
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
