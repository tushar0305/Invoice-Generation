'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ArrowLeft, Image as ImageIcon, Zap, ZapOff, RotateCcw, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ScanInvoicePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [image, setImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [flashMode, setFlashMode] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const [zoom, setZoom] = useState(1);
    const [maxZoom, setMaxZoom] = useState(1);
    const [supportsZoom, setSupportsZoom] = useState(false);

    // Initialize camera on mount
    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            // Request camera permissions first (Capacitor handles this for WebView if configured, 
            // but we might need to be explicit or just rely on getUserMedia triggering the prompt)

            const constraints = {
                video: {
                    facingMode: 'environment', // Use back camera
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

            // Check for zoom capabilities
            const track = mediaStream.getVideoTracks()[0];
            const capabilities = track.getCapabilities() as any;

            if (capabilities.zoom) {
                setSupportsZoom(true);
                setMaxZoom(capabilities.zoom.max);
                setZoom(capabilities.zoom.min || 1);
            }

        } catch (error) {
            console.error('Error accessing camera:', error);
            toast({
                title: "Camera Error",
                description: "Could not access camera. Please check permissions.",
                variant: "destructive"
            });
        }
    };

    const handleZoom = async (newZoom: number) => {
        if (stream && supportsZoom) {
            try {
                const track = stream.getVideoTracks()[0];
                await track.applyConstraints({
                    advanced: [{ zoom: newZoom } as any]
                });
                setZoom(newZoom);
            } catch (err) {
                console.error('Zoom failed:', err);
            }
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const captureFrame = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw current frame
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);

                // Log the captured image data for debugging
                console.log('Captured Image Data:', imageDataUrl.substring(0, 100) + '...');
                console.log('Image Size:', imageDataUrl.length, 'bytes');

                setImage(imageDataUrl);
                stopCamera(); // Stop stream to save battery while previewing
            }
        }
    };

    const retakePhoto = () => {
        setImage(null);
        startCamera(); // Restart camera
    };

    const pickFromGallery = async () => {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.Base64,
                source: CameraSource.Photos
            });

            if (image.base64String) {
                const dataUrl = `data:image/jpeg;base64,${image.base64String}`;
                console.log('Gallery Image Data:', dataUrl.substring(0, 100) + '...');
                setImage(dataUrl);
                stopCamera();
            }
        } catch (error: any) {
            if (error.message !== 'User cancelled photos app') {
                toast({
                    title: "Gallery Error",
                    description: "Could not access gallery.",
                    variant: "destructive"
                });
            }
        }
    };

    const handleProcessInvoice = async () => {
        if (!image) return;

        setIsProcessing(true);
        try {
            // TODO: Implement OCR logic here
            // For now, simulate processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            toast({
                title: "Processing Complete",
                description: "Invoice data extracted successfully!",
            });

            // Navigate to edit page with data (mock for now)
            router.push('/dashboard/invoices/new');
        } catch (error) {
            toast({
                title: "Processing Failed",
                description: "Could not extract data. Please try again manually.",
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleFlash = async () => {
        // Flash control with getUserMedia is tricky and depends on track capabilities
        // This is a basic implementation attempt
        if (stream) {
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities() as any; // Cast to any because TS might not know torch

            if (capabilities.torch) {
                try {
                    await track.applyConstraints({
                        advanced: [{ torch: !flashMode } as any]
                    });
                    setFlashMode(!flashMode);
                } catch (err) {
                    console.error('Flash toggle failed', err);
                }
            } else {
                toast({
                    description: "Flash not supported on this device/camera.",
                });
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-50">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 pt-[calc(env(safe-area-inset-top)+1rem)] flex items-center justify-between text-white z-20 bg-gradient-to-b from-black/60 to-transparent">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="rounded-full hover:bg-white/20 text-white"
                >
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <span className="font-medium text-lg drop-shadow-md">Scan Invoice</span>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFlash}
                    className="rounded-full hover:bg-white/20 text-white"
                >
                    {flashMode ? <Zap className="h-6 w-6 fill-yellow-400 text-yellow-400" /> : <ZapOff className="h-6 w-6" />}
                </Button>
            </div>

            {/* Main Content (Full Screen) */}
            <div className="absolute inset-0 z-0 flex items-center justify-center bg-zinc-900">
                {image ? (
                    // Image Preview Mode
                    <div className="relative w-full h-full">
                        <Image
                            src={image}
                            alt="Captured invoice"
                            fill
                            className="object-contain"
                        />
                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-30">
                                <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
                                <p className="font-medium animate-pulse">Extracting Data...</p>
                            </div>
                        )}
                    </div>
                ) : (
                    // Live Camera View
                    <div className="relative w-full h-full">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Zoom Slider (if supported) */}
                        {supportsZoom && (
                            <div className="absolute bottom-32 left-8 right-8 z-30 flex items-center gap-4 bg-black/40 backdrop-blur-md p-2 rounded-full">
                                <span className="text-xs text-white font-medium pl-2">1x</span>
                                <input
                                    type="range"
                                    min="1"
                                    max={Math.min(maxZoom, 5)} // Cap at 5x for usability
                                    step="0.1"
                                    value={zoom}
                                    onChange={(e) => handleZoom(parseFloat(e.target.value))}
                                    className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <span className="text-xs text-white font-medium pr-2">{Math.min(maxZoom, 5).toFixed(1)}x</span>
                            </div>
                        )}

                        {/* Overlay Guides */}
                        <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
                            <div className="relative w-full max-w-md aspect-[3/4] border-2 border-white/30 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                                {/* Corner Guides */}
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary -mt-[2px] -ml-[2px]" />
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary -mt-[2px] -mr-[2px]" />
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary -mb-[2px] -ml-[2px]" />
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary -mb-[2px] -mr-[2px]" />
                            </div>
                        </div>

                        {/* Center Guide Text */}
                        <div className="absolute top-1/2 left-0 right-0 -mt-32 flex justify-center z-10 pointer-events-none">
                            <p className="text-white/90 text-sm font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
                                Align invoice within frame
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 pb-[calc(env(safe-area-inset-bottom)+2rem)] flex items-center justify-around bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20">
                {image ? (
                    // Preview Controls
                    <>
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={retakePhoto}
                            disabled={isProcessing}
                            className="h-14 w-14 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-md p-0"
                        >
                            <RotateCcw className="h-6 w-6" />
                        </Button>

                        <Button
                            size="lg"
                            onClick={handleProcessInvoice}
                            disabled={isProcessing}
                            className="h-16 px-8 rounded-full bg-primary text-primary-foreground font-semibold text-lg shadow-lg shadow-primary/25"
                        >
                            {isProcessing ? 'Processing...' : 'Use Photo'}
                        </Button>
                    </>
                ) : (
                    // Capture Controls
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={pickFromGallery}
                            className="text-white hover:bg-white/20 rounded-full h-12 w-12"
                        >
                            <ImageIcon className="h-6 w-6" />
                        </Button>

                        <button
                            onClick={captureFrame}
                            className="h-20 w-20 rounded-full border-4 border-white flex items-center justify-center group active:scale-95 transition-transform shadow-lg"
                        >
                            <div className="h-16 w-16 rounded-full bg-white group-active:scale-90 transition-transform" />
                        </button>

                        <div className="w-12" /> {/* Spacer for balance */}
                    </>
                )}
            </div>
        </div>
    );
}
