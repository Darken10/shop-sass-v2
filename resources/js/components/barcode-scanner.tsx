import { Camera, ScanBarcode, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type BarcodeScannerProps = {
    /** Called when a barcode is successfully scanned or entered. */
    onScan: (barcode: string) => void;
    /** Placeholder text for the input field. */
    placeholder?: string;
    /** Whether to auto-focus the input. */
    autoFocus?: boolean;
    /** Whether the input should be cleared after scanning. */
    clearOnScan?: boolean;
    /** Optional className for the wrapper. */
    className?: string;
    /** Display mode: 'input' for form field, 'inline' for POS terminal. */
    mode?: 'input' | 'inline';
    /** Optional name attribute for form submission. */
    name?: string;
    /** Default value for the input. */
    defaultValue?: string;
    /** Error message to display. */
    error?: string;
};

/**
 * Barcode scanner component that supports:
 * 1. Physical barcode scanner (keyboard wedge) — detects rapid key input
 * 2. Camera-based scanning via BarcodeDetector API
 * 3. Manual text entry
 */
export default function BarcodeScanner({
    onScan,
    placeholder = 'Scanner ou saisir un code-barres…',
    autoFocus = false,
    clearOnScan = false,
    className = '',
    mode = 'input',
    name,
    defaultValue = '',
    error,
}: BarcodeScannerProps) {
    const [value, setValue] = useState(defaultValue);
    const [showCamera, setShowCamera] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animFrameRef = useRef<number>(0);

    // Track rapid keystrokes from barcode scanners
    const keystrokeBuffer = useRef('');
    const keystrokeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleBarcodeScan = useCallback(
        (barcode: string) => {
            const trimmed = barcode.trim();
            if (!trimmed) return;

            onScan(trimmed);

            if (clearOnScan) {
                setValue('');
            } else {
                setValue(trimmed);
            }
        },
        [onScan, clearOnScan],
    );

    // Detect rapid keystrokes (barcode scanner emulation)
    useEffect(() => {
        if (mode !== 'inline') return;

        function handleKeyDown(e: KeyboardEvent) {
            // Ignore if user is typing in another input/textarea
            const target = e.target as HTMLElement;
            if (target.tagName === 'TEXTAREA' || (target.tagName === 'INPUT' && target !== inputRef.current)) {
                return;
            }

            if (e.key === 'Enter') {
                if (keystrokeBuffer.current.length > 3) {
                    e.preventDefault();
                    handleBarcodeScan(keystrokeBuffer.current);
                }
                keystrokeBuffer.current = '';
                if (keystrokeTimer.current) clearTimeout(keystrokeTimer.current);
                return;
            }

            if (e.key.length === 1) {
                keystrokeBuffer.current += e.key;
                if (keystrokeTimer.current) clearTimeout(keystrokeTimer.current);
                keystrokeTimer.current = setTimeout(() => {
                    keystrokeBuffer.current = '';
                }, 100); // Barcode scanners type faster than 100ms between keys
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (keystrokeTimer.current) clearTimeout(keystrokeTimer.current);
        };
    }, [mode, handleBarcodeScan]);

    // Handle Enter key in input
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleBarcodeScan(value);
        }
    };

    // Camera-based barcode detection
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
        }
        setShowCamera(false);
    }, []);

    const startCamera = useCallback(async () => {
        // Check if BarcodeDetector is available
        if (!('BarcodeDetector' in window)) {
            alert('La détection de code-barres par caméra n\'est pas supportée par ce navigateur. Utilisez un scanner physique ou saisissez le code manuellement.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
            });
            streamRef.current = stream;
            setShowCamera(true);

            // Wait for video element to be rendered
            setTimeout(() => {
                if (videoRef.current && streamRef.current) {
                    videoRef.current.srcObject = streamRef.current;
                    videoRef.current.play();

                    // @ts-expect-error -- BarcodeDetector is available but not typed
                    const detector = new BarcodeDetector({
                        formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'],
                    });

                    const detect = async () => {
                        if (!videoRef.current || !streamRef.current) return;

                        try {
                            const barcodes = await detector.detect(videoRef.current);
                            if (barcodes.length > 0) {
                                handleBarcodeScan(barcodes[0].rawValue);
                                stopCamera();
                                return;
                            }
                        } catch {
                            // Detection failed, continue
                        }

                        animFrameRef.current = requestAnimationFrame(detect);
                    };

                    detect();
                }
            }, 200);
        } catch {
            alert('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
        }
    }, [handleBarcodeScan, stopCamera]);

    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    return (
        <div className={className}>
            <div className="relative flex gap-1.5">
                <div className="relative flex-1">
                    <ScanBarcode className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                        ref={inputRef}
                        type="text"
                        name={name}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="pl-9"
                        autoFocus={autoFocus}
                        autoComplete="off"
                    />
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={showCamera ? stopCamera : startCamera}
                    title={showCamera ? 'Arrêter la caméra' : 'Scanner avec la caméra'}
                >
                    {showCamera ? <X className="size-4" /> : <Camera className="size-4" />}
                </Button>
            </div>

            {error && <p className="mt-1 text-sm text-destructive">{error}</p>}

            {showCamera && (
                <div className="relative mt-2 overflow-hidden rounded-lg border bg-black">
                    <video
                        ref={videoRef}
                        className="h-48 w-full object-cover"
                        muted
                        playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-0.5 w-3/4 bg-red-500/60" />
                    </div>
                    <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/80">
                        Placez le code-barres devant la caméra
                    </p>
                </div>
            )}
        </div>
    );
}
