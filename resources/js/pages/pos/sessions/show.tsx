import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Banknote,
    CreditCard,
    FileText,
    Package,
    Percent,
    Receipt,
    ShoppingCart,
    Smartphone,
    TrendingUp,
    User,
    Wallet,
} from 'lucide-react';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { sessions as sessionsIndex } from '@/actions/App/Http/Controllers/Pos/CashRegisterController';
import { show as saleShow, receipt as saleReceipt } from '@/actions/App/Http/Controllers/Pos/SaleController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Product = { id: string; name: string };
type Promotion = { id: string; name: string } | null;
type SaleItem = { id: string; quantity: number; unit_price: string; discount: string; subtotal: string; product: Product; promotion: Promotion };
type Payment = { id: string; method: string; amount: string };
type Customer = { id: string; name: string } | null;

type SaleInfo = {
    id: string;
    reference: string;
    status: string;
    total: string;
    amount_paid: string;
    amount_due: string;
    discount_total: string;
    change_given: string;
    created_at: string;
    items: SaleItem[];
    payments: Payment[];
    customer: Customer;
};

type Session = {
    id: string;
    session_number: string;
    status: string;
    opening_amount: string;
    closing_amount: string | null;
    opened_at: string;
    closed_at: string | null;
    shop: { id: string; name: string; code: string };
    cashier: { id: string; name: string };
    sales: SaleInfo[];
};

type PaymentBreakdownItem = { method: string; label: string; total: number };
type HourlySale = { hour: string; count: number; total: number };

type Stats = {
    totalSales: number;
    salesCount: number;
    itemsCount: number;
    totalPaid: number;
    totalCredits: number;
    totalDiscounts: number;
    totalChangeGiven: number;
    theoreticalClosing: number;
    gap: number | null;
    paymentBreakdown: PaymentBreakdownItem[];
    hourlySales: HourlySale[];
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
    bank_transfer: Wallet,
    customer_credit: CreditCard,
};

const methodColors: Record<string, string> = {
    cash: 'bg-green-500',
    mobile_money: 'bg-blue-500',
    bank_card: 'bg-purple-500',
    bank_transfer: 'bg-orange-500',
    customer_credit: 'bg-red-500',
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

function formatMoney(value: string | number | null): string {
    return Number(value ?? 0).toLocaleString('fr-FR');
}

export default function SessionShow({ session, stats }: { session: Session; stats: Stats }) {
    const opened = new Date(session.opened_at);
    const closed = session.closed_at ? new Date(session.closed_at) : null;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Point de vente', href: '/pos' },
        { title: 'Historique caisses', href: sessionsIndex().url },
        { title: `#${session.session_number}`, href: '#' },
    ];

    // Max hourly total for bar chart scaling
    const maxHourlyTotal = useMemo(
        () => Math.max(...stats.hourlySales.map((h) => h.total), 1),
        [stats.hourlySales],
    );

    // Total for pie chart percentages
    const totalPayments = useMemo(
        () => stats.paymentBreakdown.reduce((sum, p) => sum + p.total, 0) || 1,
        [stats.paymentBreakdown],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Session #${session.session_number}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={sessionsIndex().url}>
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Session #{session.session_number}</h1>
                            <p className="text-sm text-muted-foreground">
                                {session.shop.name} • {session.cashier.name}
                            </p>
                        </div>
                    </div>
                    <Badge variant={session.status === 'open' ? 'default' : 'secondary'} className="text-sm">
                        {session.status === 'open' ? 'Ouverte' : 'Clôturée'}
                    </Badge>
                </div>

                {/* General Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Informations générales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <p className="text-xs text-muted-foreground">Caissier</p>
                                <p className="flex items-center gap-1 font-medium">
                                    <User className="size-3" /> {session.cashier.name}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Magasin</p>
                                <p className="font-medium">{session.shop.name} ({session.shop.code})</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Ouverture</p>
                                <p className="font-medium">
                                    {opened.toLocaleDateString('fr-FR')} à {opened.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Fermeture</p>
                                <p className="font-medium">
                                    {closed
                                        ? `${closed.toLocaleDateString('fr-FR')} à ${closed.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                                        : 'En cours'}
                                </p>
                            </div>
                        </div>
                        <Separator className="my-4" />
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                                <p className="text-xs text-muted-foreground">Montant initial</p>
                                <p className="text-lg font-bold">{formatMoney(session.opening_amount)} F</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Montant final théorique</p>
                                <p className="text-lg font-bold">{formatMoney(stats.theoreticalClosing)} F</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Écart</p>
                                {stats.gap !== null ? (
                                    <p className={`text-lg font-bold ${stats.gap === 0 ? 'text-green-600' : stats.gap > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                        {stats.gap > 0 ? '+' : ''}{formatMoney(stats.gap)} F
                                    </p>
                                ) : (
                                    <p className="text-lg font-bold text-muted-foreground">—</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* KPI Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total ventes</CardTitle>
                            <TrendingUp className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{formatMoney(stats.totalSales)} F</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                            <ShoppingCart className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{stats.salesCount}</p>
                            <p className="text-xs text-muted-foreground">{stats.itemsCount} article{stats.itemsCount > 1 ? 's' : ''}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Encaissé</CardTitle>
                            <Banknote className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{formatMoney(stats.totalPaid)} F</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Créances</CardTitle>
                            <CreditCard className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className={`text-2xl font-bold ${stats.totalCredits > 0 ? 'text-orange-600' : ''}`}>
                                {formatMoney(stats.totalCredits)} F
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Promotions</CardTitle>
                            <Percent className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className={`text-2xl font-bold ${stats.totalDiscounts > 0 ? 'text-green-600' : ''}`}>
                                {formatMoney(stats.totalDiscounts)} F
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts row */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Payment breakdown (pie-style) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Wallet className="size-4" />
                                Répartition par mode de paiement
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {stats.paymentBreakdown.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">Aucun paiement</p>
                            ) : (
                                <div className="space-y-3">
                                    {stats.paymentBreakdown.map((item) => {
                                        const pct = Math.round((item.total / totalPayments) * 100);
                                        const Icon = methodIcons[item.method] ?? Banknote;
                                        const color = methodColors[item.method] ?? 'bg-gray-500';
                                        return (
                                            <div key={item.method} className="space-y-1">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="flex items-center gap-2">
                                                        <Icon className="size-4 text-muted-foreground" />
                                                        {item.label}
                                                    </span>
                                                    <span className="font-bold">{formatMoney(item.total)} F ({pct}%)</span>
                                                </div>
                                                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className={`h-full rounded-full ${color} transition-all`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Hourly sales (bar chart) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <TrendingUp className="size-4" />
                                Ventes par heure
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {stats.hourlySales.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">Aucune donnée</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={stats.hourlySales} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                        <XAxis
                                            dataKey="hour"
                                            tick={{ fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                            className="fill-muted-foreground"
                                        />
                                        <YAxis
                                            tick={{ fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(v: number) => formatMoney(v)}
                                            className="fill-muted-foreground"
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
                                            content={({ active, payload }) => {
                                                if (!active || !payload?.length) return null;
                                                const data = payload[0].payload as HourlySale;
                                                return (
                                                    <div className="rounded-lg border bg-background p-3 shadow-md">
                                                        <p className="mb-1 text-sm font-semibold">{data.hour}h</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {data.count} vente{data.count > 1 ? 's' : ''} &bull; {formatMoney(data.total)} F
                                                        </p>
                                                    </div>
                                                );
                                            }}
                                        />
                                        <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={48}>
                                            {stats.hourlySales.map((entry) => (
                                                <Cell
                                                    key={entry.hour}
                                                    className="fill-primary"
                                                    opacity={entry.total === maxHourlyTotal ? 1 : 0.75}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sales table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="size-4" />
                            Récapitulatif des ventes ({stats.salesCount})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>N° Ticket</TableHead>
                                    <TableHead>Heure</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead className="text-right">Montant</TableHead>
                                    <TableHead className="text-right">Payé</TableHead>
                                    <TableHead className="text-right">Solde dû</TableHead>
                                    <TableHead>Paiement(s)</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {session.sales.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                                            Aucune vente enregistrée
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    session.sales.map((sale) => (
                                        <TableRow key={sale.id}>
                                            <TableCell className="font-mono text-sm">{sale.reference}</TableCell>
                                            <TableCell className="text-sm">
                                                {new Date(sale.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </TableCell>
                                            <TableCell>
                                                {sale.customer ? (
                                                    <span className="flex items-center gap-1 text-sm">
                                                        <User className="size-3" /> {sale.customer.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                {formatMoney(sale.total)} F
                                            </TableCell>
                                            <TableCell className="text-right">{formatMoney(sale.amount_paid)} F</TableCell>
                                            <TableCell className="text-right">
                                                {Number(sale.amount_due) > 0 ? (
                                                    <span className="font-medium text-orange-600">{formatMoney(sale.amount_due)} F</span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">0 F</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {sale.payments.map((p, i) => (
                                                        <Badge key={i} variant="outline" className="text-xs">
                                                            {methodLabels[p.method] ?? p.method}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusVariant[sale.status] ?? 'outline'}>
                                                    {statusLabels[sale.status] ?? sale.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" asChild title="Voir">
                                                        <Link href={saleShow(sale.id).url}>
                                                            <Package className="size-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" asChild title="Ticket">
                                                        <Link href={saleReceipt(sale.id).url}>
                                                            <Receipt className="size-4" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
