import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    Box,
    Package,
    ShoppingCart,
    Store,
    TrendingUp,
    Truck,
    Users,
    Wallet,
    Warehouse,
} from 'lucide-react';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

// ── Types ──────────────────────────────────────────────────────────
type Kpis = {
    todaySalesCount: number;
    todaySalesTotal: number;
    monthSalesCount: number;
    monthSalesTotal: number;
    monthGrowth: number | null;
    openSessions: number;
    activeProducts: number;
    totalCustomers: number;
    unpaidAmount: number;
    pendingSupplyRequests: number;
    pendingTransfers: number;
    totalShops: number;
    totalWarehouses: number;
    totalCategories: number;
};

type RevenueDay = { date: string; total: number; count: number };
type PaymentBreakdownItem = { method: string; label: string; total: number };
type TopProduct = { name: string; qty: number; revenue: number };
type ShopSale = { name: string; count: number; total: number };
type LowStockItem = { product: string; shop: string; quantity: number; alert: number };
type PaymentInfo = { method: string; amount: number };
type RecentSale = {
    id: string;
    reference: string;
    status: string;
    total: number;
    amount_paid: number;
    customer: string | null;
    shop: string | null;
    created_at: string;
    payments: PaymentInfo[];
};

type Props = {
    kpis: Kpis;
    revenueByDay: RevenueDay[];
    paymentBreakdown: PaymentBreakdownItem[];
    topProducts: TopProduct[];
    salesByShop: ShopSale[];
    lowStockProducts: LowStockItem[];
    recentSales: RecentSale[];
};

// ── Helpers ─────────────────────────────────────────────────────────
function formatMoney(value: number): string {
    return value.toLocaleString('fr-FR');
}

function formatCompact(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
    return value.toLocaleString('fr-FR');
}

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

const PIE_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ef4444'];

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: dashboard().url }];

// ── Component ──────────────────────────────────────────────────────
export default function Dashboard({ kpis, revenueByDay, paymentBreakdown, topProducts, salesByShop, lowStockProducts, recentSales }: Props) {
    const maxRevenue = useMemo(() => Math.max(...revenueByDay.map((d) => d.total), 1), [revenueByDay]);
    const totalPayments = useMemo(() => paymentBreakdown.reduce((s, p) => s + p.total, 0) || 1, [paymentBreakdown]);
    const maxShopTotal = useMemo(() => Math.max(...salesByShop.map((s) => s.total), 1), [salesByShop]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* ── KPI Cards ─────────────────────────────────────── */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Today's revenue */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Ventes aujourd'hui</CardTitle>
                            <ShoppingCart className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatMoney(kpis.todaySalesTotal)} F</div>
                            <p className="text-xs text-muted-foreground">{kpis.todaySalesCount} vente{kpis.todaySalesCount > 1 ? 's' : ''}</p>
                        </CardContent>
                    </Card>

                    {/* Monthly revenue */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Chiffre du mois</CardTitle>
                            <TrendingUp className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCompact(kpis.monthSalesTotal)} F</div>
                            <div className="flex items-center gap-1 text-xs">
                                {kpis.monthGrowth !== null ? (
                                    kpis.monthGrowth >= 0 ? (
                                        <span className="flex items-center text-green-600">
                                            <ArrowUpRight className="size-3" /> +{kpis.monthGrowth}%
                                        </span>
                                    ) : (
                                        <span className="flex items-center text-red-500">
                                            <ArrowDownRight className="size-3" /> {kpis.monthGrowth}%
                                        </span>
                                    )
                                ) : (
                                    <span className="text-muted-foreground">—</span>
                                )}
                                <span className="text-muted-foreground">vs mois précédent</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Unpaid */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Créances clients</CardTitle>
                            <Wallet className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{formatMoney(kpis.unpaidAmount)} F</div>
                            <p className="text-xs text-muted-foreground">Montants impayés / partiels</p>
                        </CardContent>
                    </Card>

                    {/* Customers */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Clients</CardTitle>
                            <Users className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpis.totalCustomers}</div>
                            <p className="text-xs text-muted-foreground">clients enregistrés</p>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Second row of mini-stats ──────────────────────── */}
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                    <MiniStat icon={Store} label="Boutiques" value={kpis.totalShops} />
                    <MiniStat icon={Warehouse} label="Entrepôts" value={kpis.totalWarehouses} />
                    <MiniStat icon={Package} label="Produits actifs" value={kpis.activeProducts} />
                    <MiniStat icon={Box} label="Catégories" value={kpis.totalCategories} />
                    <MiniStat icon={BarChart3} label="Caisses ouvertes" value={kpis.openSessions} accent />
                    <MiniStat
                        icon={Truck}
                        label="En attente"
                        value={kpis.pendingSupplyRequests + kpis.pendingTransfers}
                        subtitle={`${kpis.pendingSupplyRequests} appro · ${kpis.pendingTransfers} transf.`}
                    />
                </div>

                {/* ── Revenue chart + Payment breakdown ─────────────── */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Revenue over 30 days */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base">Chiffre d'affaires — 30 derniers jours</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {revenueByDay.length === 0 ? (
                                <p className="py-10 text-center text-sm text-muted-foreground">Aucune donnée</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={revenueByDay} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="fill-muted-foreground" />
                                        <YAxis
                                            tick={{ fontSize: 11 }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(v: number) => formatCompact(v)}
                                            className="fill-muted-foreground"
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
                                            content={({ active, payload }) => {
                                                if (!active || !payload?.length) return null;
                                                const d = payload[0].payload as RevenueDay;
                                                return (
                                                    <div className="rounded-lg border bg-background p-3 shadow-md">
                                                        <p className="mb-1 text-sm font-semibold">{d.date}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatMoney(d.total)} F &bull; {d.count} vente{d.count > 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                );
                                            }}
                                        />
                                        <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={32}>
                                            {revenueByDay.map((entry, i) => (
                                                <Cell key={i} className="fill-primary" opacity={entry.total === maxRevenue ? 1 : 0.7} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment method pie chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Modes de paiement</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {paymentBreakdown.length === 0 ? (
                                <p className="py-10 text-center text-sm text-muted-foreground">Aucune donnée</p>
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <ResponsiveContainer width="100%" height={180}>
                                        <PieChart>
                                            <Pie
                                                data={paymentBreakdown}
                                                dataKey="total"
                                                nameKey="label"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={75}
                                                paddingAngle={3}
                                            >
                                                {paymentBreakdown.map((_, i) => (
                                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (!active || !payload?.length) return null;
                                                    const d = payload[0].payload as PaymentBreakdownItem;
                                                    return (
                                                        <div className="rounded-lg border bg-background p-2 shadow-md">
                                                            <p className="text-sm font-medium">{d.label}</p>
                                                            <p className="text-xs text-muted-foreground">{formatMoney(d.total)} F</p>
                                                        </div>
                                                    );
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {paymentBreakdown.map((p, i) => {
                                            const pct = Math.round((p.total / totalPayments) * 100);
                                            return (
                                                <div key={p.method} className="flex items-center gap-1.5 text-xs">
                                                    <span className="size-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                    {p.label} ({pct}%)
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Top products + Sales by shop ──────────────────── */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Top products */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Top 10 produits du mois</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {topProducts.length === 0 ? (
                                <p className="py-10 text-center text-sm text-muted-foreground">Aucune donnée</p>
                            ) : (
                                <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>#</TableHead>
                                            <TableHead>Produit</TableHead>
                                            <TableHead className="text-right">Qté</TableHead>
                                            <TableHead className="text-right">CA</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {topProducts.map((p, i) => (
                                            <TableRow key={p.name}>
                                                <TableCell className="font-mono text-xs text-muted-foreground">{i + 1}</TableCell>
                                                <TableCell className="text-sm font-medium">{p.name}</TableCell>
                                                <TableCell className="text-right text-sm">{p.qty}</TableCell>
                                                <TableCell className="text-right text-sm font-semibold">{formatMoney(p.revenue)} F</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Sales by shop */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Performance par boutique</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {salesByShop.length === 0 ? (
                                <p className="py-10 text-center text-sm text-muted-foreground">Aucune donnée</p>
                            ) : (
                                <div className="space-y-4">
                                    {salesByShop.map((shop) => {
                                        const pct = Math.round((shop.total / maxShopTotal) * 100);
                                        return (
                                            <div key={shop.name} className="space-y-1.5">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="flex items-center gap-2">
                                                        <Store className="size-3.5 text-muted-foreground" />
                                                        {shop.name}
                                                    </span>
                                                    <span className="font-semibold">{formatMoney(shop.total)} F</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <span className="w-14 text-right text-xs text-muted-foreground">{shop.count} ventes</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Low stock alerts + Recent sales ───────────────── */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Low stock */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <AlertTriangle className="size-4 text-orange-500" />
                                Alertes stock bas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {lowStockProducts.length === 0 ? (
                                <p className="py-10 text-center text-sm text-muted-foreground">Aucun stock bas détecté</p>
                            ) : (
                                <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Produit</TableHead>
                                            <TableHead>Boutique</TableHead>
                                            <TableHead className="text-right">Stock</TableHead>
                                            <TableHead className="text-right">Seuil</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {lowStockProducts.map((item, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="text-sm font-medium">{item.product}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{item.shop}</TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant={item.quantity === 0 ? 'destructive' : 'secondary'} className="font-mono text-xs">
                                                        {item.quantity}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-sm text-muted-foreground">{item.alert}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent sales */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Dernières ventes</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recentSales.length === 0 ? (
                                <p className="py-10 text-center text-sm text-muted-foreground">Aucune vente récente</p>
                            ) : (
                                <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Réf.</TableHead>
                                            <TableHead>Client</TableHead>
                                            <TableHead>Boutique</TableHead>
                                            <TableHead className="text-right">Montant</TableHead>
                                            <TableHead>Statut</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentSales.map((sale) => (
                                            <TableRow key={sale.id}>
                                                <TableCell className="font-mono text-xs">{sale.reference}</TableCell>
                                                <TableCell className="text-sm">{sale.customer ?? <span className="text-muted-foreground">—</span>}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{sale.shop ?? '—'}</TableCell>
                                                <TableCell className="text-right text-sm font-semibold">{formatMoney(sale.total)} F</TableCell>
                                                <TableCell>
                                                    <Badge variant={statusVariant[sale.status] ?? 'outline'} className="text-xs">
                                                        {statusLabels[sale.status] ?? sale.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

// ── MiniStat sub-component ─────────────────────────────────────────
function MiniStat({
    icon: Icon,
    label,
    value,
    subtitle,
    accent = false,
}: {
    icon: typeof Store;
    label: string;
    value: number;
    subtitle?: string;
    accent?: boolean;
}) {
    return (
        <Card>
            <CardContent className="flex items-center gap-3 p-4">
                <div className={`rounded-lg p-2 ${accent ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="size-4" />
                </div>
                <div>
                    <p className="text-lg font-bold leading-none">{value}</p>
                    <p className="text-xs text-muted-foreground">{subtitle ?? label}</p>
                </div>
            </CardContent>
        </Card>
    );
}
