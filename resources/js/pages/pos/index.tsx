import { Head, Link, router, useForm } from '@inertiajs/react';
import { DollarSign, LogOut, ShoppingCart, Store } from 'lucide-react';
import { useMemo } from 'react';
import { index as posIndex, open, close } from '@/actions/App/Http/Controllers/Pos/CashRegisterController';
import { create as terminalRoute } from '@/actions/App/Http/Controllers/Pos/SaleController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Shop = { id: string; name: string; code: string; city: string | null };
type CashierInfo = { id: string; name: string };
type SalePayment = { method: string; amount: string };
type Sale = { id: string; total: string; change_given: string; payments: SalePayment[] };
type Session = {
    id: string;
    session_number: string;
    status: string;
    opening_amount: string;
    closing_amount: string | null;
    total_sales: string;
    total_cash: string;
    total_mobile_money: string;
    total_bank_card: string;
    total_bank_transfer: string;
    total_credit: string;
    opened_at: string;
    closed_at: string | null;
    shop: Shop;
    cashier: CashierInfo;
    sales: Sale[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Point de vente', href: posIndex().url },
];

export default function PosIndex({ currentSession, shops }: { currentSession: Session | null; shops: Shop[] }) {
    const openForm = useForm({
        opening_amount: 0,
        shop_id: '',
    });

    const closeForm = useForm({
        closing_notes: '',
    });

    // Compute live stats from sales data
    const liveStats = useMemo(() => {
        if (!currentSession?.sales) return { total: 0, cash: 0, mobileMoney: 0, bankCard: 0, bankTransfer: 0, credit: 0, changeGiven: 0 };
        const payments = currentSession.sales.flatMap((s) => s.payments);
        return {
            total: currentSession.sales.reduce((sum, s) => sum + Number(s.total), 0),
            cash: payments.filter((p) => p.method === 'cash').reduce((sum, p) => sum + Number(p.amount), 0),
            mobileMoney: payments.filter((p) => p.method === 'mobile_money').reduce((sum, p) => sum + Number(p.amount), 0),
            bankCard: payments.filter((p) => p.method === 'bank_card').reduce((sum, p) => sum + Number(p.amount), 0),
            bankTransfer: payments.filter((p) => p.method === 'bank_transfer').reduce((sum, p) => sum + Number(p.amount), 0),
            credit: payments.filter((p) => p.method === 'customer_credit').reduce((sum, p) => sum + Number(p.amount), 0),
            changeGiven: currentSession.sales.reduce((sum, s) => sum + Number(s.change_given), 0),
        };
    }, [currentSession]);

    function handleOpenSession(e: React.FormEvent) {
        e.preventDefault();
        openForm.post(open().url);
    }

    function handleCloseSession(e: React.FormEvent) {
        e.preventDefault();
        if (!currentSession) return;
        closeForm.post(close(currentSession.id).url);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Point de vente" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                        <ShoppingCart className="size-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold">Point de vente</h1>
                        <p className="text-sm text-muted-foreground">Gestion de la caisse</p>
                    </div>
                </div>

                <Separator />

                {!currentSession ? (
                    <Card className="mx-auto w-full max-w-lg">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-primary/10">
                                <Store className="size-8 text-primary" />
                            </div>
                            <CardTitle>Ouvrir la caisse</CardTitle>
                            <CardDescription>Sélectionnez un magasin et indiquez le montant initial pour commencer.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleOpenSession}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="shop_id">Magasin</Label>
                                    <Select value={openForm.data.shop_id} onValueChange={(v) => openForm.setData('shop_id', v)}>
                                        <SelectTrigger id="shop_id">
                                            <SelectValue placeholder="Choisir un magasin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {shops.map((shop) => (
                                                <SelectItem key={shop.id} value={shop.id}>
                                                    {shop.name} {shop.city ? `(${shop.city})` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {openForm.errors.shop_id && <p className="text-sm text-destructive">{openForm.errors.shop_id}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="opening_amount">Montant initial (FCFA)</Label>
                                    <Input
                                        id="opening_amount"
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={openForm.data.opening_amount}
                                        onChange={(e) => openForm.setData('opening_amount', Number(e.target.value))}
                                    />
                                    {openForm.errors.opening_amount && (
                                        <p className="text-sm text-destructive">{openForm.errors.opening_amount}</p>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" className="w-full" disabled={openForm.processing}>
                                    {openForm.processing ? 'Ouverture…' : 'Ouvrir la caisse'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Session info card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Store className="size-5" />
                                        Session active
                                    </CardTitle>
                                    <Badge variant="default">Ouverte</Badge>
                                </div>
                                <CardDescription>Session #{currentSession.session_number}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Magasin</span>
                                    <span className="font-medium">{currentSession.shop.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Caissier</span>
                                    <span className="font-medium">{currentSession.cashier.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Ouverture</span>
                                    <span className="font-medium">
                                        {new Date(currentSession.opened_at).toLocaleString('fr-FR')}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Montant initial</span>
                                    <span className="font-bold text-primary">
                                        {Number(currentSession.opening_amount).toLocaleString('fr-FR')} FCFA
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Ventes réalisées</span>
                                    <span className="font-medium">{currentSession.sales?.length ?? 0}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Total ventes</span>
                                    <span className="font-bold text-green-600">
                                        {liveStats.total.toLocaleString('fr-FR')} FCFA
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-sm font-semibold">
                                    <span>Total en caisse</span>
                                    <span className="text-primary">
                                        {(Number(currentSession.opening_amount) + liveStats.total).toLocaleString('fr-FR')} FCFA
                                    </span>
                                </div>
                            </CardContent>
                            <CardFooter className="flex gap-2">
                                <Button asChild className="flex-1">
                                    <Link href={terminalRoute().url}>
                                        <ShoppingCart className="size-4" />
                                        Vendre
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>

                        {/* Close session card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <LogOut className="size-5" />
                                    Fermer la caisse
                                </CardTitle>
                                <CardDescription>Fermez votre session en fin de journée.</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleCloseSession}>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-lg bg-muted p-3 text-center">
                                            <p className="text-xs text-muted-foreground">Espèces</p>
                                            <p className="font-bold">{liveStats.cash.toLocaleString('fr-FR')}</p>
                                        </div>
                                        <div className="rounded-lg bg-muted p-3 text-center">
                                            <p className="text-xs text-muted-foreground">Mobile Money</p>
                                            <p className="font-bold">{liveStats.mobileMoney.toLocaleString('fr-FR')}</p>
                                        </div>
                                        <div className="rounded-lg bg-muted p-3 text-center">
                                            <p className="text-xs text-muted-foreground">Carte bancaire</p>
                                            <p className="font-bold">{liveStats.bankCard.toLocaleString('fr-FR')}</p>
                                        </div>
                                        <div className="rounded-lg bg-muted p-3 text-center">
                                            <p className="text-xs text-muted-foreground">Créances</p>
                                            <p className="font-bold">{liveStats.credit.toLocaleString('fr-FR')}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="closing_notes">Notes de fermeture</Label>
                                        <Input
                                            id="closing_notes"
                                            type="text"
                                            placeholder="Notes optionnelles..."
                                            value={closeForm.data.closing_notes}
                                            onChange={(e) => closeForm.setData('closing_notes', e.target.value)}
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" variant="destructive" className="w-full" disabled={closeForm.processing}>
                                        {closeForm.processing ? 'Fermeture…' : 'Fermer la caisse'}
                                    </Button>
                                </CardFooter>
                            </form>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
