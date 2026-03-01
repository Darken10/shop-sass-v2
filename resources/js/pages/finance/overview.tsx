import { Head } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowUpRight,
    Banknote,
    BarChart3,
    DollarSign,
    Percent,
    Receipt,
    ShoppingCart,
    Store,
    TrendingDown,
    TrendingUp,
    Truck,
    Wallet,
} from 'lucide-react';
import { useMemo } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import FinancialFilters from '@/components/financial-filters';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

// ── Types ──────────────────────────────────────────────────────
type Kpis = {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    totalSalesCount: number;
    averageOrderValue: number;
    totalReceivables: number;
    totalLogisticCosts: number;
    revenueGrowth: number | null;
    expenseGrowth: number | null;
};

type RevenuePoint = { date: string; revenue: number; cost: number; profit: number; count: number };
type ShopRevenue = { shop: string; shop_id: string; revenue: number; count: number; percentage: number };
type PaymentItem = { method: string; label: string; total: number; percentage: number };
type ExpenseCategory = { category: string; amount: number; count: number; percentage: number };
type TopProduct = { name: string; revenue: number; cost: number; profit: number; margin: number; qty: number };
type FilterOption = { id: string; name: string };

type Props = {
    kpis: Kpis;
    revenueTimeSeries: RevenuePoint[];
    revenueByShop: ShopRevenue[];
    paymentBreakdown: PaymentItem[];
    expensesByCategory: ExpenseCategory[];
    topProducts: TopProduct[];
    filters: {
        start_date: string;
        end_date: string;
        shop_id: string | null;
        warehouse_id: string | null;
        group_by: string;
    };
    shops: FilterOption[];
    warehouses: FilterOption[];
};

// ── Helpers ────────────────────────────────────────────────────
function formatMoney(value: number): string {
    return value.toLocaleString('fr-FR');
}

function formatCompact(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
    return value.toLocaleString('fr-FR');
}

const PIE_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ef4444', '#06b6d4', '#ec4899'];
const EXPENSE_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#06b6d4'];

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Finance', href: '/finance' },
    { title: 'Vue d\'ensemble', href: '/finance' },
];

// ── Component ──────────────────────────────────────────────────
export default function FinancialOverview({ kpis, revenueTimeSeries, revenueByShop, paymentBreakdown, expensesByCategory, topProducts, filters, shops, warehouses }: Props) {
    const maxShopRevenue = useMemo(() => Math.max(...revenueByShop.map((s) => s.revenue), 1), [revenueByShop]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Finance — Vue d'ensemble" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* ── Filters ──────────────────────────────────────── */}
                <FinancialFilters filters={filters} shops={shops} warehouses={warehouses} baseUrl="/finance" />

                {/* ── KPI Cards ─────────────────────────────────────── */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <KpiCard
                        title="Chiffre d'affaires"
                        value={`${formatCompact(kpis.totalRevenue)} F`}
                        icon={Banknote}
                        growth={kpis.revenueGrowth}
                        subtitle="vs période précédente"
                    />
                    <KpiCard
                        title="Bénéfice net"
                        value={`${formatCompact(kpis.netProfit)} F`}
                        icon={TrendingUp}
                        accent={kpis.netProfit >= 0 ? 'green' : 'red'}
                        subtitle={`Marge : ${kpis.profitMargin}%`}
                    />
                    <KpiCard
                        title="Dépenses totales"
                        value={`${formatCompact(kpis.totalExpenses)} F`}
                        icon={TrendingDown}
                        growth={kpis.expenseGrowth}
                        invertGrowth
                        subtitle="vs période précédente"
                    />
                    <KpiCard
                        title="Créances clients"
                        value={`${formatCompact(kpis.totalReceivables)} F`}
                        icon={Wallet}
                        accent="orange"
                        subtitle="Montants impayés"
                    />
                </div>

                {/* ── Mini Stats ───────────────────────────────────── */}
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    <MiniStat icon={ShoppingCart} label="Ventes" value={kpis.totalSalesCount} />
                    <MiniStat icon={Receipt} label="Panier moyen" value={`${formatMoney(kpis.averageOrderValue)} F`} />
                    <MiniStat icon={Truck} label="Coûts logistiques" value={`${formatMoney(kpis.totalLogisticCosts)} F`} />
                    <MiniStat icon={Percent} label="Marge bénéficiaire" value={`${kpis.profitMargin}%`} accent />
                </div>

                {/* ── Revenue & Profit Chart ────────────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Revenus, coûts et profit</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {revenueTimeSeries.length === 0 ? (
                            <p className="py-10 text-center text-sm text-muted-foreground">Aucune donnée pour cette période</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={320}>
                                <AreaChart data={revenueTimeSeries} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="fill-muted-foreground" />
                                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCompact(v)} className="fill-muted-foreground" />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (!active || !payload?.length) return null;
                                            const d = payload[0].payload as RevenuePoint;
                                            return (
                                                <div className="rounded-lg border bg-background p-3 shadow-md">
                                                    <p className="mb-1 text-sm font-semibold">{d.date}</p>
                                                    <p className="text-sm text-blue-600">CA : {formatMoney(d.revenue)} F</p>
                                                    <p className="text-sm text-orange-500">Coûts : {formatMoney(d.cost)} F</p>
                                                    <p className="text-sm text-green-600">Profit : {formatMoney(d.profit)} F</p>
                                                    <p className="text-xs text-muted-foreground">{d.count} vente{d.count > 1 ? 's' : ''}</p>
                                                </div>
                                            );
                                        }}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="revenue" name="Chiffre d'affaires" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
                                    <Area type="monotone" dataKey="profit" name="Profit" stroke="#22c55e" fillOpacity={1} fill="url(#colorProfit)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* ── Payment Breakdown + Expense Breakdown ─────────── */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Modes de paiement</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {paymentBreakdown.length === 0 ? (
                                <p className="py-10 text-center text-sm text-muted-foreground">Aucune donnée</p>
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie data={paymentBreakdown} dataKey="total" nameKey="label" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                                                {paymentBreakdown.map((_, i) => (
                                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (!active || !payload?.length) return null;
                                                    const d = payload[0].payload as PaymentItem;
                                                    return (
                                                        <div className="rounded-lg border bg-background p-2 shadow-md">
                                                            <p className="text-sm font-medium">{d.label}</p>
                                                            <p className="text-xs text-muted-foreground">{formatMoney(d.total)} F ({d.percentage}%)</p>
                                                        </div>
                                                    );
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {paymentBreakdown.map((p, i) => (
                                            <div key={p.method} className="flex items-center gap-1.5 text-xs">
                                                <span className="size-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                {p.label} ({p.percentage}%)
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Répartition des dépenses</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {expensesByCategory.length === 0 ? (
                                <p className="py-10 text-center text-sm text-muted-foreground">Aucune dépense</p>
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie data={expensesByCategory} dataKey="amount" nameKey="category" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                                                {expensesByCategory.map((_, i) => (
                                                    <Cell key={i} fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (!active || !payload?.length) return null;
                                                    const d = payload[0].payload as ExpenseCategory;
                                                    return (
                                                        <div className="rounded-lg border bg-background p-2 shadow-md">
                                                            <p className="text-sm font-medium">{d.category}</p>
                                                            <p className="text-xs text-muted-foreground">{formatMoney(d.amount)} F ({d.percentage}%)</p>
                                                        </div>
                                                    );
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {expensesByCategory.map((c, i) => (
                                            <div key={c.category} className="flex items-center gap-1.5 text-xs">
                                                <span className="size-2.5 rounded-full" style={{ backgroundColor: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }} />
                                                {c.category} ({c.percentage}%)
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Revenue by Shop + Top Products by Profit ──────── */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Performance par boutique</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {revenueByShop.length === 0 ? (
                                <p className="py-10 text-center text-sm text-muted-foreground">Aucune donnée</p>
                            ) : (
                                <div className="space-y-4">
                                    {revenueByShop.map((shop) => {
                                        const pct = Math.round((shop.revenue / maxShopRevenue) * 100);
                                        return (
                                            <div key={shop.shop_id} className="space-y-1.5">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="flex items-center gap-2">
                                                        <Store className="size-3.5 text-muted-foreground" />
                                                        {shop.shop}
                                                    </span>
                                                    <span className="font-semibold">{formatMoney(shop.revenue)} F</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <span className="w-20 text-right text-xs text-muted-foreground">{shop.count} ventes ({shop.percentage}%)</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Top produits — Rentabilité</CardTitle>
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
                                                <TableHead className="text-right">CA</TableHead>
                                                <TableHead className="text-right">Profit</TableHead>
                                                <TableHead className="text-right">Marge</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {topProducts.map((p, i) => (
                                                <TableRow key={p.name}>
                                                    <TableCell className="font-mono text-xs text-muted-foreground">{i + 1}</TableCell>
                                                    <TableCell className="text-sm font-medium">{p.name}</TableCell>
                                                    <TableCell className="text-right text-sm">{formatMoney(p.revenue)} F</TableCell>
                                                    <TableCell className="text-right text-sm font-semibold">{formatMoney(p.profit)} F</TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge variant={p.margin >= 30 ? 'default' : p.margin >= 15 ? 'secondary' : 'destructive'} className="text-xs">
                                                            {p.margin}%
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

// ── Sub-components ─────────────────────────────────────────────
function KpiCard({
    title,
    value,
    icon: Icon,
    growth,
    invertGrowth = false,
    accent,
    subtitle,
}: {
    title: string;
    value: string;
    icon: typeof DollarSign;
    growth?: number | null;
    invertGrowth?: boolean;
    accent?: 'green' | 'red' | 'orange';
    subtitle?: string;
}) {
    const accentColor = accent === 'green' ? 'text-green-600' : accent === 'red' ? 'text-red-500' : accent === 'orange' ? 'text-orange-600' : '';

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${accentColor}`}>{value}</div>
                <div className="flex items-center gap-1 text-xs">
                    {growth !== null && growth !== undefined ? (
                        <>
                            {(invertGrowth ? growth <= 0 : growth >= 0) ? (
                                <span className="flex items-center text-green-600">
                                    <ArrowUpRight className="size-3" /> {growth >= 0 ? '+' : ''}{growth}%
                                </span>
                            ) : (
                                <span className="flex items-center text-red-500">
                                    <ArrowDownRight className="size-3" /> {growth >= 0 ? '+' : ''}{growth}%
                                </span>
                            )}
                            {subtitle && <span className="text-muted-foreground">{subtitle}</span>}
                        </>
                    ) : (
                        subtitle && <span className="text-muted-foreground">{subtitle}</span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function MiniStat({
    icon: Icon,
    label,
    value,
    accent = false,
}: {
    icon: typeof Store;
    label: string;
    value: string | number;
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
                    <p className="text-xs text-muted-foreground">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}
