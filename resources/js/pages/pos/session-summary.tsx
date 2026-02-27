import { Head, Link } from '@inertiajs/react';
import { Banknote, CreditCard, FileText, ShoppingCart, Smartphone } from 'lucide-react';
import { index as posIndex } from '@/actions/App/Http/Controllers/Pos/CashRegisterController';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type SaleItem = {
    id: string;
    quantity: number;
    unit_price: string;
    subtotal: string;
    product: { id: string; name: string };
};

type Payment = {
    id: string;
    method: string;
    amount: string;
};

type SaleInfo = {
    id: string;
    reference: string;
    status: string;
    total: string;
    amount_paid: string;
    amount_due: string;
    created_at: string;
    items: SaleItem[];
    payments: Payment[];
    customer: { id: string; name: string } | null;
};

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
    shop: { id: string; name: string; code: string };
    cashier: { id: string; name: string };
    sales: SaleInfo[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Point de vente', href: '/pos' },
    { title: 'Résumé de session', href: '#' },
];

const methodLabels: Record<string, string> = {
    cash: 'Espèces',
    mobile_money: 'Mobile Money',
    bank_card: 'Carte bancaire',
    bank_transfer: 'Virement',
    customer_credit: 'Crédit client',
};

const statusLabels: Record<string, string> = {
    completed: 'Payée',
    partially_paid: 'Partielle',
    unpaid: 'Impayée',
    cancelled: 'Annulée',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    completed: 'default',
    partially_paid: 'secondary',
    unpaid: 'destructive',
    cancelled: 'outline',
};

export default function SessionSummary({ session }: { session: Session }) {
    const opened = new Date(session.opened_at);
    const closed = session.closed_at ? new Date(session.closed_at) : null;

    const totalSalesCount = session.sales.length;
    const totalItemsCount = session.sales.reduce((sum, s) => sum + s.items.reduce((si, item) => si + item.quantity, 0), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Session #${session.session_number}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Session #{session.session_number}</h1>
                        <p className="text-sm text-muted-foreground">
                            {session.shop.name} • {session.cashier.name}
                        </p>
                    </div>
                    <Badge variant={session.status === 'open' ? 'default' : 'secondary'}>
                        {session.status === 'open' ? 'Ouverte' : 'Clôturée'}
                    </Badge>
                </div>

                {/* Summary cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total ventes</CardTitle>
                            <ShoppingCart className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{Number(session.total_sales).toLocaleString('fr-FR')} F</div>
                            <p className="text-xs text-muted-foreground">
                                {totalSalesCount} vente{totalSalesCount > 1 ? 's' : ''} • {totalItemsCount} article{totalItemsCount > 1 ? 's' : ''}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Espèces</CardTitle>
                            <Banknote className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{Number(session.total_cash).toLocaleString('fr-FR')} F</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Mobile Money</CardTitle>
                            <Smartphone className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{Number(session.total_mobile_money).toLocaleString('fr-FR')} F</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Carte / Virement</CardTitle>
                            <CreditCard className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {(Number(session.total_bank_card) + Number(session.total_bank_transfer)).toLocaleString('fr-FR')} F
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Timing */}
                <Card>
                    <CardContent className="flex flex-wrap gap-4 py-4 text-sm sm:gap-8">
                        <div>
                            <p className="text-muted-foreground">Ouverture</p>
                            <p className="font-medium">
                                {opened.toLocaleDateString('fr-FR')} à {opened.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-xs text-muted-foreground">Fond de caisse : {Number(session.opening_amount).toLocaleString('fr-FR')} F</p>
                        </div>
                        {closed && (
                            <div>
                                <p className="text-muted-foreground">Clôture</p>
                                <p className="font-medium">
                                    {closed.toLocaleDateString('fr-FR')} à {closed.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {session.closing_amount && (
                                    <p className="text-xs text-muted-foreground">
                                        Montant de clôture : {Number(session.closing_amount).toLocaleString('fr-FR')} F
                                    </p>
                                )}
                            </div>
                        )}
                        {Number(session.total_credit) > 0 && (
                            <div>
                                <p className="text-muted-foreground">Créances</p>
                                <p className="font-medium text-orange-600">{Number(session.total_credit).toLocaleString('fr-FR')} F</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Sales list */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="size-4" />
                            Ventes de la session
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {session.sales.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">Aucune vente enregistrée</p>
                        ) : (
                            <div className="space-y-2">
                                {session.sales.map((sale) => (
                                    <div key={sale.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div className="flex items-center gap-3">
                                            <Badge variant={statusVariant[sale.status] ?? 'outline'}>
                                                {statusLabels[sale.status] ?? sale.status}
                                            </Badge>
                                            <div>
                                                <p className="text-sm font-medium">{sale.reference}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {sale.items.length} article{sale.items.length > 1 ? 's' : ''}
                                                    {sale.customer && ` • ${sale.customer.name}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{Number(sale.total).toLocaleString('fr-FR')} F</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(sale.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
