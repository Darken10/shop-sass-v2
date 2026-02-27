import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Banknote, FileText, Printer } from 'lucide-react';
import { useState } from 'react';
import { index as salesIndex, receipt as saleReceipt, creditPayment } from '@/actions/App/Http/Controllers/Pos/SaleController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type SaleItem = {
    id: string;
    quantity: number;
    unit_price: string;
    discount: string;
    subtotal: string;
    product: { id: string; name: string; code: string };
    promotion: { id: string; name: string } | null;
};

type Payment = {
    id: string;
    method: string;
    amount: string;
    reference: string | null;
    created_at: string;
};

type Sale = {
    id: string;
    reference: string;
    status: string;
    subtotal: string;
    discount_total: string;
    total: string;
    amount_paid: string;
    amount_due: string;
    change_given: string;
    change_residue: string;
    qr_code_token: string;
    notes: string | null;
    created_at: string;
    items: SaleItem[];
    payments: Payment[];
    customer: { id: string; name: string; phone: string | null } | null;
    cashier: { id: string; name: string };
    shop: { id: string; name: string };
    session: { id: string; session_number: string };
};

const methodLabels: Record<string, string> = {
    cash: 'Espèces',
    mobile_money: 'Mobile Money',
    bank_card: 'Carte bancaire',
    bank_transfer: 'Virement',
    customer_credit: 'Crédit client',
};

const statusLabels: Record<string, string> = {
    completed: 'Payée',
    partially_paid: 'Partiellement payée',
    unpaid: 'Impayée',
    cancelled: 'Annulée',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    completed: 'default',
    partially_paid: 'secondary',
    unpaid: 'destructive',
    cancelled: 'outline',
};

export default function SaleShow({ sale }: { sale: Sale }) {
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const paymentForm = useForm({
        method: 'cash',
        amount: Number(sale.amount_due),
        reference: '',
        notes: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Point de vente', href: '/pos' },
        { title: 'Ventes', href: salesIndex().url },
        { title: sale.reference, href: '#' },
    ];

    function handleCreditPayment(e: React.FormEvent) {
        e.preventDefault();
        paymentForm.post(creditPayment(sale.id).url, {
            onSuccess: () => setShowPaymentDialog(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Vente ${sale.reference}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={salesIndex().url}>
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{sale.reference}</h1>
                            <p className="text-sm text-muted-foreground">
                                {sale.shop.name} • {sale.cashier.name} • Session #{sale.session.session_number}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusVariant[sale.status] ?? 'outline'}>
                            {statusLabels[sale.status] ?? sale.status}
                        </Badge>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={saleReceipt(sale.id).url}>
                                <Printer className="size-4" /> Reçu
                            </Link>
                        </Button>
                        {Number(sale.amount_due) > 0 && (
                            <Button size="sm" onClick={() => setShowPaymentDialog(true)}>
                                <Banknote className="size-4" /> Encaisser
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Items */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Articles</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {sale.items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="font-medium">{item.product.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.quantity} × {Number(item.unit_price).toLocaleString('fr-FR')} F
                                                {item.promotion && (
                                                    <span className="ml-2 text-green-600">• {item.promotion.name}</span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{Number(item.subtotal).toLocaleString('fr-FR')} F</p>
                                            {Number(item.discount) > 0 && (
                                                <p className="text-xs text-green-600">-{Number(item.discount).toLocaleString('fr-FR')} F</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Résumé</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Sous-total</span>
                                    <span>{Number(sale.subtotal).toLocaleString('fr-FR')} F</span>
                                </div>
                                {Number(sale.discount_total) > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Remises</span>
                                        <span>-{Number(sale.discount_total).toLocaleString('fr-FR')} F</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between text-base font-bold">
                                    <span>Total</span>
                                    <span>{Number(sale.total).toLocaleString('fr-FR')} F</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Payé</span>
                                    <span>{Number(sale.amount_paid).toLocaleString('fr-FR')} F</span>
                                </div>
                                {Number(sale.amount_due) > 0 && (
                                    <div className="flex justify-between font-medium text-orange-600">
                                        <span>Reste dû</span>
                                        <span>{Number(sale.amount_due).toLocaleString('fr-FR')} F</span>
                                    </div>
                                )}
                                {Number(sale.change_given) > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Monnaie rendue</span>
                                        <span>{Number(sale.change_given).toLocaleString('fr-FR')} F</span>
                                    </div>
                                )}
                                <Separator />
                                <p className="text-xs text-muted-foreground">
                                    {new Date(sale.created_at).toLocaleString('fr-FR')}
                                </p>
                                {sale.customer && (
                                    <p className="text-xs">Client : <strong>{sale.customer.name}</strong></p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Paiements</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {sale.payments.map((p) => (
                                    <div key={p.id} className="flex justify-between text-sm">
                                        <div>
                                            <p className="font-medium">{methodLabels[p.method] ?? p.method}</p>
                                            {p.reference && <p className="text-xs text-muted-foreground">Réf : {p.reference}</p>}
                                        </div>
                                        <span className="font-bold">{Number(p.amount).toLocaleString('fr-FR')} F</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Credit payment dialog */}
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Encaisser un paiement</DialogTitle>
                        <DialogDescription>
                            Reste dû : <strong>{Number(sale.amount_due).toLocaleString('fr-FR')} FCFA</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreditPayment} className="space-y-4">
                        <div>
                            <Label>Mode de paiement</Label>
                            <Select value={paymentForm.data.method} onValueChange={(v) => paymentForm.setData('method', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Espèces</SelectItem>
                                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                                    <SelectItem value="bank_card">Carte bancaire</SelectItem>
                                    <SelectItem value="bank_transfer">Virement</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Montant</Label>
                            <Input
                                type="number"
                                min="1"
                                max={Number(sale.amount_due)}
                                value={paymentForm.data.amount}
                                onChange={(e) => paymentForm.setData('amount', Number(e.target.value))}
                            />
                        </div>
                        {paymentForm.data.method !== 'cash' && (
                            <div>
                                <Label>Référence</Label>
                                <Input
                                    value={paymentForm.data.reference}
                                    onChange={(e) => paymentForm.setData('reference', e.target.value)}
                                    placeholder="N° transaction"
                                />
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowPaymentDialog(false)}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={paymentForm.processing}>
                                {paymentForm.processing ? 'Traitement…' : 'Valider'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
