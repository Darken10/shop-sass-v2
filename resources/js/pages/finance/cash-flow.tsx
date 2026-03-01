import { Head } from '@inertiajs/react';
import { ArrowDownLeft, ArrowUpRight, Banknote, TrendingUp } from 'lucide-react';
import {
    Area,
    AreaChart,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type CashFlowData = {
    inflows: { sales: number; creditPayments: number; total: number };
    outflows: { expenses: number; logisticCosts: number; total: number };
    netCashFlow: number;
    byPeriod: { date: string; inflow: number; outflow: number; net: number }[];
};
type PaymentItem = { method: string; label: string; total: number; percentage: number };
type FilterOption = { id: string; name: string };
type Props = {
    cashFlow: CashFlowData;
    paymentBreakdown: PaymentItem[];
    filters: { start_date: string; end_date: string; shop_id: string | null; group_by: string };
    shops: FilterOption[];
    warehouses: FilterOption[];
};

function fmt(v: number): string {
    return v.toLocaleString('fr-FR');
}
function fmtCompact(v: number): string {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
    return v.toLocaleString('fr-FR');
}

const PIE_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f97316', '#ef4444', '#06b6d4'];

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Finance', href: '/finance' },
    { title: 'Flux de trésorerie', href: '/finance/cash-flow' },
];

export default function CashFlow({ cashFlow, paymentBreakdown, filters, shops, warehouses }: Props) {
    const cf = cashFlow;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Finance — Flux de trésorerie" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <FinancialFilters filters={{ ...filters, warehouse_id: undefined }} shops={shops} warehouses={warehouses} baseUrl="/finance/cash-flow" showWarehouse={false} />

                {/* ── Summary Cards ──────────── */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                        <CardContent className="flex items-center gap-4 p-4">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-950">
                                <ArrowUpRight className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Entrées de fonds</p>
                                <p className="text-xl font-bold text-green-600">{fmt(cf.inflows.total)} F</p>
                                <p className="text-xs text-muted-foreground">Ventes : {fmt(cf.inflows.sales)} F</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 p-4">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-red-50 text-red-500 dark:bg-red-950">
                                <ArrowDownLeft className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Sorties de fonds</p>
                                <p className="text-xl font-bold text-red-500">{fmt(cf.outflows.total)} F</p>
                                <p className="text-xs text-muted-foreground">
                                    Dépenses : {fmt(cf.outflows.expenses)} F · Logistique : {fmt(cf.outflows.logisticCosts)} F
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 p-4">
                            <div className={`flex size-10 items-center justify-center rounded-lg ${cf.netCashFlow >= 0 ? 'bg-blue-50 text-blue-600 dark:bg-blue-950' : 'bg-orange-50 text-orange-600 dark:bg-orange-950'}`}>
                                <TrendingUp className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Flux net de trésorerie</p>
                                <p className={`text-xl font-bold ${cf.netCashFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{fmt(cf.netCashFlow)} F</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Cash Flow Chart ──────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Évolution de la trésorerie</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {cf.byPeriod.length === 0 ? (
                            <p className="py-10 text-center text-sm text-muted-foreground">Aucune donnée pour cette période</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={320}>
                                <AreaChart data={cf.byPeriod} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradInflow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradOutflow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} className="fill-muted-foreground" />
                                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => fmtCompact(v)} className="fill-muted-foreground" />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (!active || !payload?.length) return null;
                                            const d = payload[0].payload as CashFlowData['byPeriod'][0];
                                            return (
                                                <div className="rounded-lg border bg-background p-3 shadow-md">
                                                    <p className="mb-1 text-sm font-semibold">{d.date}</p>
                                                    <p className="text-sm text-green-600">Entrées : {fmt(d.inflow)} F</p>
                                                    <p className="text-sm text-red-500">Sorties : {fmt(d.outflow)} F</p>
                                                    <p className={`text-sm font-semibold ${d.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Net : {fmt(d.net)} F</p>
                                                </div>
                                            );
                                        }}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="inflow" name="Entrées" stroke="#22c55e" fillOpacity={1} fill="url(#gradInflow)" />
                                    <Area type="monotone" dataKey="outflow" name="Sorties" stroke="#ef4444" fillOpacity={1} fill="url(#gradOutflow)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* ── Payment Method Breakdown ──────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Répartition par mode de paiement</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {paymentBreakdown.length === 0 ? (
                            <p className="py-10 text-center text-sm text-muted-foreground">Aucune donnée</p>
                        ) : (
                            <div className="flex flex-col items-center gap-4 md:flex-row md:justify-around">
                                <ResponsiveContainer width={250} height={250}>
                                    <PieChart>
                                        <Pie data={paymentBreakdown} dataKey="total" nameKey="label" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
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
                                                        <p className="text-xs text-muted-foreground">{fmt(d.total)} F ({d.percentage}%)</p>
                                                    </div>
                                                );
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-3">
                                    {paymentBreakdown.map((p, i) => (
                                        <div key={p.method} className="flex items-center gap-3">
                                            <span className="size-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                            <div>
                                                <p className="text-sm font-medium">{p.label}</p>
                                                <p className="text-xs text-muted-foreground">{fmt(p.total)} F — {p.percentage}%</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
