import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Banknote,
    CreditCard,
    Minus,
    Package,
    Plus,
    ScanBarcode,
    Search,
    ShoppingCart,
    Smartphone,
    Trash2,
    User,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { store as storeSale, searchProducts, lookupBarcode } from '@/actions/App/Http/Controllers/Pos/SaleController';
import { quickStore as quickStoreCustomer } from '@/actions/App/Http/Controllers/Pos/CustomerController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Product = {
    id: string;
    name: string;
    code: string;
    price: string;
    unity: string;
    image: string | null;
    category: { id: string; name: string } | null;
};

type ShopStockItem = {
    product: Product;
    available_quantity: number;
    stock_alert: number;
    is_low_stock: boolean;
};

type Promotion = {
    id: string;
    name: string;
    type: string;
    value: string;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
    products: { id: string; name: string }[];
};

type Customer = {
    id: string;
    name: string;
    phone: string | null;
    credit_balance: string;
};

type Session = {
    id: string;
    session_number: string;
    shop: { id: string; name: string; code: string };
};

type PaymentMethodType = { value: string; label: string };

type CartItem = {
    product: Product;
    quantity: number;
    unit_price: number;
    discount: number;
    promotion_id: string | null;
    available_quantity: number;
};

type PaymentEntry = {
    method: string;
    amount: number;
    reference: string;
};

const methodLabels: Record<string, string> = {
    cash: 'Espèces',
    mobile_money: 'Mobile Money',
    bank_card: 'Carte bancaire',
    bank_transfer: 'Virement',
    customer_credit: 'Crédit client',
};

const methodIcons: Record<string, typeof Banknote> = {
    cash: Banknote,
    mobile_money: Smartphone,
    bank_card: CreditCard,
    bank_transfer: CreditCard,
};

export default function PosTerminal({
    session,
    shopStocks,
    promotions,
    customers,
    paymentMethods,
}: {
    session: Session;
    shopStocks: ShopStockItem[];
    promotions: Promotion[];
    customers: Customer[];
    paymentMethods: PaymentMethodType[];
}) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [showCustomerDialog, setShowCustomerDialog] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [payments, setPayments] = useState<PaymentEntry[]>([{ method: 'cash', amount: 0, reference: '' }]);
    const [amountGiven, setAmountGiven] = useState(0);
    const [changeAction, setChangeAction] = useState<string>('return');
    const [isProcessing, setIsProcessing] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const barcodeBufferRef = useRef('');
    const barcodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Filter products by search
    const filteredProducts = useMemo(() => {
        if (!searchTerm) return shopStocks;
        const term = searchTerm.toLowerCase();
        return shopStocks.filter(
            (s) =>
                s.product.name.toLowerCase().includes(term) ||
                s.product.code.toLowerCase().includes(term) ||
                (s.product.category?.name ?? '').toLowerCase().includes(term),
        );
    }, [shopStocks, searchTerm]);

    // Cart calculations
    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0), [cart]);
    const discountTotal = useMemo(() => cart.reduce((sum, item) => sum + item.discount, 0), [cart]);
    const total = subtotal - discountTotal;
    const totalPayments = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);
    const amountDue = Math.max(0, total - totalPayments);
    const changeAmount = Math.max(0, totalPayments - total);

    // Find applicable promotions for a product
    const getPromotionsForProduct = useCallback(
        (productId: string) => {
            return promotions.filter(
                (p) => p.is_active && (p.products.length === 0 || p.products.some((pp) => pp.id === productId)),
            );
        },
        [promotions],
    );

    // Calculate discount for an item
    const calculateDiscount = useCallback(
        (unitPrice: number, quantity: number, promotionId: string | null): number => {
            if (!promotionId) return 0;
            const promo = promotions.find((p) => p.id === promotionId);
            if (!promo) return 0;
            if (promo.type === 'percentage') {
                return Math.round(unitPrice * (Number(promo.value) / 100) * quantity * 100) / 100;
            }
            return Math.min(Number(promo.value), unitPrice) * quantity;
        },
        [promotions],
    );

    // Barcode scan handler — looks up by code and adds to cart
    const handleBarcodeScan = useCallback(
        async (barcode: string) => {
            // First check local data by code
            const localMatch = shopStocks.find(
                (s) => s.product.code.toLowerCase() === barcode.toLowerCase(),
            );

            if (localMatch) {
                addToCartByStock(localMatch);
                return;
            }

            // Fallback to server lookup
            try {
                const res = await fetch(`${lookupBarcode().url}?barcode=${encodeURIComponent(barcode)}`, {
                    headers: { Accept: 'application/json' },
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.product) {
                        const stockItem: ShopStockItem = {
                            product: data.product,
                            available_quantity: data.available_quantity,
                            stock_alert: 0,
                            is_low_stock: data.is_low_stock,
                        };
                        addToCartByStock(stockItem);
                    }
                }
            } catch {
                // Silently fail — product not found
            }
        },
        [shopStocks],
    );

    // Global keyboard listener for barcode scanner (keyboard wedge)
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            const target = e.target as HTMLElement;
            // Only capture if not in a regular input/textarea (except barcode input)
            if (
                target.tagName === 'TEXTAREA' ||
                (target.tagName === 'INPUT' && !target.classList.contains('barcode-scanner-input'))
            ) {
                return;
            }

            if (e.key === 'Enter') {
                if (barcodeBufferRef.current.length > 3) {
                    e.preventDefault();
                    handleBarcodeScan(barcodeBufferRef.current);
                }
                barcodeBufferRef.current = '';
                if (barcodeTimerRef.current) clearTimeout(barcodeTimerRef.current);
                return;
            }

            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                barcodeBufferRef.current += e.key;
                if (barcodeTimerRef.current) clearTimeout(barcodeTimerRef.current);
                barcodeTimerRef.current = setTimeout(() => {
                    barcodeBufferRef.current = '';
                }, 80);
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (barcodeTimerRef.current) clearTimeout(barcodeTimerRef.current);
        };
    }, [handleBarcodeScan]);

    function addToCartByStock(stockItem: ShopStockItem) {
        setCart((prev) => {
            const existing = prev.find((c) => c.product.id === stockItem.product.id);
            if (existing) {
                if (existing.quantity >= stockItem.available_quantity) return prev;
                return prev.map((c) =>
                    c.product.id === stockItem.product.id
                        ? {
                              ...c,
                              quantity: c.quantity + 1,
                              discount: calculateDiscount(c.unit_price, c.quantity + 1, c.promotion_id),
                          }
                        : c,
                );
            }
            const unitPrice = Number(stockItem.product.price);
            return [
                ...prev,
                {
                    product: stockItem.product,
                    quantity: 1,
                    unit_price: unitPrice,
                    discount: 0,
                    promotion_id: null,
                    available_quantity: stockItem.available_quantity,
                },
            ];
        });
    }

    function addToCart(stockItem: ShopStockItem) {
        setCart((prev) => {
            const existing = prev.find((c) => c.product.id === stockItem.product.id);
            if (existing) {
                if (existing.quantity >= stockItem.available_quantity) return prev;
                return prev.map((c) =>
                    c.product.id === stockItem.product.id
                        ? {
                              ...c,
                              quantity: c.quantity + 1,
                              discount: calculateDiscount(c.unit_price, c.quantity + 1, c.promotion_id),
                          }
                        : c,
                );
            }
            const unitPrice = Number(stockItem.product.price);
            return [
                ...prev,
                {
                    product: stockItem.product,
                    quantity: 1,
                    unit_price: unitPrice,
                    discount: 0,
                    promotion_id: null,
                    available_quantity: stockItem.available_quantity,
                },
            ];
        });
    }

    function updateQuantity(productId: string, delta: number) {
        setCart((prev) =>
            prev
                .map((item) => {
                    if (item.product.id !== productId) return item;
                    const newQty = item.quantity + delta;
                    if (newQty <= 0) return null;
                    if (newQty > item.available_quantity) return item;
                    return {
                        ...item,
                        quantity: newQty,
                        discount: calculateDiscount(item.unit_price, newQty, item.promotion_id),
                    };
                })
                .filter(Boolean) as CartItem[],
        );
    }

    function removeFromCart(productId: string) {
        setCart((prev) => prev.filter((c) => c.product.id !== productId));
    }

    function applyPromotion(productId: string, promotionId: string | null) {
        setCart((prev) =>
            prev.map((item) => {
                if (item.product.id !== productId) return item;
                return {
                    ...item,
                    promotion_id: promotionId,
                    discount: calculateDiscount(item.unit_price, item.quantity, promotionId),
                };
            }),
        );
    }

    function addPaymentLine() {
        setPayments((prev) => [...prev, { method: 'cash', amount: 0, reference: '' }]);
    }

    function updatePayment(index: number, field: keyof PaymentEntry, value: string | number) {
        setPayments((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
    }

    function removePayment(index: number) {
        setPayments((prev) => prev.filter((_, i) => i !== index));
    }

    function setFullPayment() {
        setPayments([{ method: 'cash', amount: total, reference: '' }]);
        setAmountGiven(total);
    }

    function handleCheckout() {
        if (cart.length === 0) return;
        setShowPaymentDialog(true);
        setPayments([{ method: 'cash', amount: total, reference: '' }]);
        setAmountGiven(total);
    }

    function processSale() {
        setIsProcessing(true);

        const saleData = {
            items: cart.map((item) => ({
                product_id: item.product.id,
                quantity: item.quantity,
                promotion_id: item.promotion_id,
            })),
            payments: payments
                .filter((p) => p.amount > 0)
                .map((p) => ({
                    method: p.method,
                    amount: p.amount,
                    reference: p.reference || null,
                    notes: null,
                })),
            customer_id: selectedCustomer?.id ?? null,
            amount_given: amountGiven,
            change_action: changeAction === 'credit_customer' ? 'credit_customer' : changeAction === 'keep_residue' ? 'keep_residue' : null,
            notes: null,
        };

        router.post(storeSale().url, saleData, {
            onFinish: () => {
                setIsProcessing(false);
                setShowPaymentDialog(false);
            },
            onSuccess: () => {
                setCart([]);
                setPayments([{ method: 'cash', amount: 0, reference: '' }]);
                setSelectedCustomer(null);
            },
        });
    }

    function handleAddCustomer() {
        if (!newCustomerName) return;

        fetch(quickStoreCustomer().url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
                Accept: 'application/json',
            },
            body: JSON.stringify({ name: newCustomerName, phone: newCustomerPhone || null }),
        })
            .then((res) => res.json())
            .then((data) => {
                setSelectedCustomer(data.customer);
                setShowCustomerDialog(false);
                setNewCustomerName('');
                setNewCustomerPhone('');
            });
    }

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Point de vente', href: '/pos' },
        { title: 'Terminal', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Terminal de vente" />

            <div className="flex h-full flex-1 flex-col overflow-hidden">
                {/* Top bar */}
                <div className="flex items-center justify-between border-b bg-card px-4 py-2">
                    <div className="flex items-center gap-3">
                        <ShoppingCart className="size-5 text-primary" />
                        <span className="font-semibold">POS</span>
                        <Badge variant="outline">{session.shop.name}</Badge>
                        <Badge variant="secondary">#{session.session_number}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedCustomer ? (
                            <Badge variant="default" className="flex items-center gap-1">
                                <User className="size-3" />
                                {selectedCustomer.name}
                                <button onClick={() => setSelectedCustomer(null)} className="ml-1">
                                    <X className="size-3" />
                                </button>
                            </Badge>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => setShowCustomerDialog(true)}>
                                <User className="size-4" />
                                Client
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => router.visit('/pos')}>
                            Retour
                        </Button>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Products panel */}
                    <div className="flex flex-1 flex-col overflow-hidden border-r">
                        {/* Search */}
                        <div className="border-b p-3">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Rechercher un produit (nom, code, code-barres, catégorie)..."
                                        className="pl-10"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex items-center gap-1.5 rounded-md border border-dashed px-2.5 text-xs text-muted-foreground">
                                    <ScanBarcode className="size-3.5" />
                                    <span className="hidden sm:inline">Scanner actif</span>
                                </div>
                            </div>
                        </div>

                        {/* Product grid */}
                        <div className="flex-1 overflow-auto p-3">
                            {filteredProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
                                    <Package className="size-12 text-muted-foreground/40" />
                                    <p className="text-sm text-muted-foreground">Aucun produit trouvé</p>
                                </div>
                            ) : (
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {filteredProducts.map((stockItem) => {
                                        const inCart = cart.find((c) => c.product.id === stockItem.product.id);
                                        const promos = getPromotionsForProduct(stockItem.product.id);
                                        return (
                                            <button
                                                key={stockItem.product.id}
                                                onClick={() => addToCart(stockItem)}
                                                disabled={inCart && inCart.quantity >= stockItem.available_quantity}
                                                className={`group relative flex flex-col rounded-lg border p-3 text-left transition-all hover:border-primary hover:shadow-sm ${
                                                    inCart ? 'border-primary bg-primary/5' : ''
                                                } ${stockItem.is_low_stock ? 'border-orange-300' : ''}`}
                                            >
                                                {inCart && (
                                                    <Badge className="absolute -right-1 -top-1 size-6 items-center justify-center rounded-full p-0 text-xs">
                                                        {inCart.quantity}
                                                    </Badge>
                                                )}
                                                {promos.length > 0 && (
                                                    <Badge variant="destructive" className="absolute left-1 top-1 text-[9px]">
                                                        Promo
                                                    </Badge>
                                                )}
                                                <span className="truncate text-sm font-medium">{stockItem.product.name}</span>
                                                <span className="text-xs text-muted-foreground">{stockItem.product.code}</span>
                                                <div className="mt-auto flex items-end justify-between pt-2">
                                                    <span className="text-sm font-bold text-primary">
                                                        {Number(stockItem.product.price).toLocaleString('fr-FR')}
                                                    </span>
                                                    <span className={`text-xs ${stockItem.is_low_stock ? 'font-medium text-orange-600' : 'text-muted-foreground'}`}>
                                                        {stockItem.available_quantity} dispo
                                                        {stockItem.is_low_stock && <AlertTriangle className="ml-0.5 inline size-3" />}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cart panel */}
                    <div className="flex w-[400px] flex-col bg-card">
                        <div className="border-b p-3">
                            <h2 className="flex items-center gap-2 font-semibold">
                                <ShoppingCart className="size-4" />
                                Panier
                                {cart.length > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                        {cart.reduce((sum, c) => sum + c.quantity, 0)} article{cart.length > 1 ? 's' : ''}
                                    </Badge>
                                )}
                            </h2>
                        </div>

                        {/* Cart items */}
                        <div className="flex-1 overflow-auto p-2">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                                    <ShoppingCart className="size-8 opacity-30" />
                                    <p className="text-sm">Panier vide</p>
                                    <p className="text-xs">Cliquez sur un produit pour l&apos;ajouter</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {cart.map((item) => {
                                        const lineTotal = item.unit_price * item.quantity - item.discount;
                                        const promos = getPromotionsForProduct(item.product.id);
                                        return (
                                            <div key={item.product.id} className="rounded-lg border p-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium">{item.product.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.unit_price.toLocaleString('fr-FR')} × {item.quantity}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold">{lineTotal.toLocaleString('fr-FR')}</p>
                                                        {item.discount > 0 && (
                                                            <p className="text-xs text-green-600">-{item.discount.toLocaleString('fr-FR')}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-1 flex items-center justify-between">
                                                    <div className="flex items-center gap-1">
                                                        <Button variant="outline" size="icon" className="size-7" onClick={() => updateQuantity(item.product.id, -1)}>
                                                            <Minus className="size-3" />
                                                        </Button>
                                                        <span className="min-w-[2rem] text-center text-sm font-medium">{item.quantity}</span>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="size-7"
                                                            onClick={() => updateQuantity(item.product.id, 1)}
                                                            disabled={item.quantity >= item.available_quantity}
                                                        >
                                                            <Plus className="size-3" />
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {promos.length > 0 && (
                                                            <Select
                                                                value={item.promotion_id ?? 'none'}
                                                                onValueChange={(v) => applyPromotion(item.product.id, v === 'none' ? null : v)}
                                                            >
                                                                <SelectTrigger className="h-7 w-auto min-w-[80px] text-xs">
                                                                    <SelectValue placeholder="Promo" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="none">Sans promo</SelectItem>
                                                                    {promos.map((p) => (
                                                                        <SelectItem key={p.id} value={p.id}>
                                                                            {p.name} ({p.type === 'percentage' ? `${p.value}%` : `${Number(p.value).toLocaleString('fr-FR')} F`})
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-7 text-destructive"
                                                            onClick={() => removeFromCart(item.product.id)}
                                                        >
                                                            <Trash2 className="size-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Cart totals & checkout */}
                        <div className="border-t bg-muted/30 p-3">
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Sous-total</span>
                                    <span>{subtotal.toLocaleString('fr-FR')} F</span>
                                </div>
                                {discountTotal > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Remises</span>
                                        <span>-{discountTotal.toLocaleString('fr-FR')} F</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span className="text-primary">{total.toLocaleString('fr-FR')} FCFA</span>
                                </div>
                            </div>
                            <Button className="mt-3 w-full" size="lg" disabled={cart.length === 0} onClick={handleCheckout}>
                                <Banknote className="size-5" />
                                Encaisser {total > 0 && `${total.toLocaleString('fr-FR')} FCFA`}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Dialog */}
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Encaissement</DialogTitle>
                        <DialogDescription>
                            Total à payer : <strong>{total.toLocaleString('fr-FR')} FCFA</strong>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Payment lines */}
                        {payments.map((payment, index) => (
                            <div key={index} className="flex items-end gap-2">
                                <div className="flex-1">
                                    <Label className="text-xs">Mode</Label>
                                    <Select value={payment.method} onValueChange={(v) => updatePayment(index, 'method', v)}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {paymentMethods.map((pm) => (
                                                <SelectItem key={pm.value} value={pm.value}>
                                                    {pm.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-32">
                                    <Label className="text-xs">Montant</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        className="h-9"
                                        value={payment.amount}
                                        onChange={(e) => updatePayment(index, 'amount', Number(e.target.value))}
                                    />
                                </div>
                                {payment.method !== 'cash' && (
                                    <div className="w-28">
                                        <Label className="text-xs">Réf.</Label>
                                        <Input
                                            className="h-9"
                                            placeholder="Réf."
                                            value={payment.reference}
                                            onChange={(e) => updatePayment(index, 'reference', e.target.value)}
                                        />
                                    </div>
                                )}
                                {payments.length > 1 && (
                                    <Button variant="ghost" size="icon" className="size-9 text-destructive" onClick={() => removePayment(index)}>
                                        <X className="size-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={addPaymentLine}>
                                <Plus className="size-3" /> Ajouter un mode
                            </Button>
                            <Button variant="outline" size="sm" onClick={setFullPayment}>
                                Tout en espèces
                            </Button>
                        </div>

                        <Separator />

                        {/* Cash handling */}
                        {payments.some((p) => p.method === 'cash') && (
                            <div className="space-y-2">
                                <Label>Montant remis par le client (espèces)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={amountGiven}
                                    onChange={(e) => setAmountGiven(Number(e.target.value))}
                                />
                                {amountGiven > 0 && amountGiven > total && (
                                    <div className="rounded-lg bg-green-50 p-2 text-center dark:bg-green-950">
                                        <p className="text-sm text-muted-foreground">Monnaie à rendre</p>
                                        <p className="text-xl font-bold text-green-600">
                                            {(amountGiven - total).toLocaleString('fr-FR')} FCFA
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Change action */}
                        {changeAmount > 0 && selectedCustomer && (
                            <div className="space-y-2">
                                <Label>Action sur la monnaie restante</Label>
                                <Select value={changeAction} onValueChange={setChangeAction}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="return">Rendre la monnaie</SelectItem>
                                        <SelectItem value="keep_residue">Conserver le résidu</SelectItem>
                                        <SelectItem value="credit_customer">Créditer le compte client</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Summary */}
                        <div className="rounded-lg bg-muted p-3 text-sm">
                            <div className="flex justify-between">
                                <span>Total</span>
                                <span className="font-bold">{total.toLocaleString('fr-FR')} FCFA</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Payé</span>
                                <span className="font-medium">{totalPayments.toLocaleString('fr-FR')} FCFA</span>
                            </div>
                            {amountDue > 0 && (
                                <div className="flex justify-between text-orange-600">
                                    <span>Reste à payer (créance)</span>
                                    <span className="font-bold">{amountDue.toLocaleString('fr-FR')} FCFA</span>
                                </div>
                            )}
                            {changeAmount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Monnaie</span>
                                    <span className="font-bold">{changeAmount.toLocaleString('fr-FR')} FCFA</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                            Annuler
                        </Button>
                        <Button onClick={processSale} disabled={isProcessing || (totalPayments <= 0 && !amountDue)}>
                            {isProcessing ? 'Traitement…' : 'Valider la vente'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Customer Dialog */}
            <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Sélectionner ou créer un client</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Existing customers */}
                        <div className="max-h-48 overflow-auto space-y-1">
                            {customers.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => {
                                        setSelectedCustomer(c);
                                        setShowCustomerDialog(false);
                                    }}
                                    className="flex w-full items-center justify-between rounded-lg border p-2 text-left hover:bg-muted"
                                >
                                    <div>
                                        <p className="text-sm font-medium">{c.name}</p>
                                        {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                                    </div>
                                    {Number(c.credit_balance) !== 0 && (
                                        <Badge variant={Number(c.credit_balance) > 0 ? 'default' : 'destructive'}>
                                            {Number(c.credit_balance).toLocaleString('fr-FR')} F
                                        </Badge>
                                    )}
                                </button>
                            ))}
                        </div>

                        <Separator />

                        {/* New customer */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Nouveau client</p>
                            <Input placeholder="Nom" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} />
                            <Input placeholder="Téléphone" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} />
                            <Button variant="outline" className="w-full" onClick={handleAddCustomer} disabled={!newCustomerName}>
                                <Plus className="size-4" /> Créer le client
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
