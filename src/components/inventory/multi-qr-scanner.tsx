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
            // Just show a small toast or ignore to not spam user
            // But we do add to list if user wants to see it? 
            // Logic in original code added a duplicate entry. Let's keep that but maybe not spam fetch.
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
                // Play a beep sound on success (optional but nice)
                // const audio = new Audio('/beep.mp3'); audio.play().catch(() => {});

                setScannedItems(prev => [...prev, {
                    tag_id: trimmedQR,
                    status: 'success',
                    item: data,
                    timestamp: Date.now()
                }]);
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
                        Choose scan mode: Use camera to scan or manually enter tag IDs.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Mode Toggle */}
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
                            Manual Entry
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
                            Camera Scan
                        </Button>
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
                                    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover"
                                        />
                                        {/* Crosshair overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-48 h-48 border-2 border-green-500/50 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
                                            <div className="absolute w-48 h-0.5 bg-red-500/50 animate-pulse top-1/2 -translate-y-1/2" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center">
                                        Point camera at QR code. Detected QR will be added automatically.
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
                                    className="w-full gap-2"
                                    onClick={startCamera}
                                >
                                    <Camera className="h-4 w-4" />
                                    Start Camera
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
                                    {successCount} Found
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
                                    {errorCount} Not Found
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* Scanned Items List */}
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                        {scannedItems.map((scannedItem, idx) => (
                            <Card
                                key={idx}
                                className={cn(
                                    'transition-colors',
                                    scannedItem.status === 'success' && 'bg-green-50/50 dark:bg-green-950/20 border-green-200',
                                    scannedItem.status === 'error' && 'bg-red-50/50 dark:bg-red-950/20 border-red-200',
                                    scannedItem.status === 'duplicate' && 'bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200'
                                )}
                            >
                                <CardContent className="p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                {scannedItem.status === 'success' && (
                                                    <Check className="h-4 w-4 text-green-600" />
                                                )}
                                                {scannedItem.status === 'error' && (
                                                    <X className="h-4 w-4 text-red-600" />
                                                )}
                                                {scannedItem.status === 'duplicate' && (
                                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                                )}
                                                <span className="font-mono font-bold">{scannedItem.tag_id}</span>
                                            </div>
                                            {scannedItem.item && (
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    {scannedItem.item.name} • {scannedItem.item.net_weight}g
                                                </div>
                                            )}
                                            {scannedItem.error && (
                                                <div className="text-sm text-destructive mt-1">
                                                    {scannedItem.error}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end pt-4 border-t">
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
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddScannedItems}
                            disabled={successCount === 0}
                            className="gap-2"
                        >
                            <Check className="h-4 w-4" />
                            Add {successCount} Items
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
