import { Head } from '@inertiajs/react';
import { FileText, TrendingDown, TrendingUp } from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import FinancialFilters from '@/components/financial-filters';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type ExpenseCat = { category: string; amount: number; count: number; percentage: number };
type ProfitLossData = {
    revenue: { sales: number; otherIncome: number; total: number };
    costOfGoodsSold: number;
    grossProfit: number;
    grossMargin: number;
    expenses: { categories: ExpenseCat[]; logisticCosts: number; total: number };
    netProfit: number;
    netMargin: number;
};
type MonthlyTrend = { month: string; revenue: number; expenses: number; netProfit: number };
type FilterOption = { id: string; name: string };
type Props = {
    profitLoss: ProfitLossData;
    monthlyTrend: MonthlyTrend[];
    filters: { start_date: string; end_date: string; shop_id: string | null; warehouse_id: string | null };
    shops: FilterOption[];
    warehouses: FilterOption[];
};

function fmt(v: number): string {
    return v.toLocaleString('fr-FR');
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Finance', href: '/finance' },
    { title: 'Compte de résultat', href: '/finance/profit-loss' },
];

export default function ProfitLoss({ profitLoss, monthlyTrend, filters, shops, warehouses }: Props) {
    const pl = profitLoss;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Finance — Compte de résultat" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <FinancialFilters filters={{ ...filters, group_by: undefined }} shops={shops} warehouses={warehouses} baseUrl="/finance/profit-loss" showGroupBy={false} />

                {/* ── Summary KPIs ────────────── */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard label="Chiffre d'affaires" value={pl.revenue.total} accent="blue" />
                    <SummaryCard label="Bénéfice brut" value={pl.grossProfit} accent={pl.grossProfit >= 0 ? 'green' : 'red'} sub={`Marge brute : ${pl.grossMargin}%`} />
                    <SummaryCard label="Total dépenses" value={pl.expenses.total} accent="orange" />
                    <SummaryCard label="Bénéfice net" value={pl.netProfit} accent={pl.netProfit >= 0 ? 'green' : 'red'} sub={`Marge nette : ${pl.netMargin}%`} />
                </div>

                {/* ── P&L Statement ────────────── */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <FileText className="size-5 text-muted-foreground" />
                            <CardTitle className="text-base">Compte de résultat</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                        {/* Revenue */}
                        <Section title="Revenus">
                            <LineItem label="Ventes" value={pl.revenue.sales} />
                            {pl.revenue.otherIncome > 0 && <LineItem label="Autres revenus" value={pl.revenue.otherIncome} />}
                            <TotalLine label="Total revenus" value={pl.revenue.total} />
                        </Section>

                        <Separator />

                        {/* COGS */}
                        <LineItem label="Coût des marchandises vendues" value={-pl.costOfGoodsSold} negative />
                        <TotalLine label="Bénéfice brut" value={pl.grossProfit} highlighted badge={`${pl.grossMargin}%`} />

                        <Separator />

                        {/* Expenses */}
                        <Section title="Charges d'exploitation">
                            {pl.expenses.categories.map((c) => (
                                <LineItem key={c.category} label={c.category} value={-c.amount} negative />
                            ))}
                            {pl.expenses.logisticCosts > 0 && <LineItem label="Frais logistiques" value={-pl.expenses.logisticCosts} negative />}
                            <TotalLine label="Total charges" value={-pl.expenses.total} />
                        </Section>

                        <Separator className="border-t-2" />

                        {/* Net */}
                        <TotalLine label="Résultat net" value={pl.netProfit} highlighted badge={`${pl.netMargin}%`} large />
                    </CardContent>
                </Card>

                {/* ── Monthly Trend Chart ────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Tendance mensuelle (12 mois)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {monthlyTrend.length === 0 ? (
                            <p className="py-10 text-center text-sm text-muted-foreground">Aucune donnée</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={monthlyTrend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                    <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} className="fill-muted-foreground" />
                                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} className="fill-muted-foreground" />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (!active || !payload?.length) return null;
                                            const d = payload[0].payload as MonthlyTrend;
                                            return (
                                                <div className="rounded-lg border bg-background p-3 shadow-md">
                                                    <p className="mb-1 text-sm font-semibold">{d.month}</p>
                                                    <p className="text-sm text-blue-600">CA : {fmt(d.revenue)} F</p>
                                                    <p className="text-sm text-orange-500">Charges : {fmt(d.expenses)} F</p>
                                                    <p className={`text-sm font-semibold ${d.netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                        Résultat : {fmt(d.netProfit)} F
                                                    </p>
                                                </div>
                                            );
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="revenue" name="Chiffre d'affaires" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="expenses" name="Charges" fill="#f97316" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="netProfit" name="Résultat net" radius={[4, 4, 0, 0]}>
                                        {monthlyTrend.map((t, i) => (
                                            <Cell key={i} fill={t.netProfit >= 0 ? '#22c55e' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

// ── Sub-components ─────────────────────────────────────────────
function SummaryCard({ label, value, accent, sub }: { label: string; value: number; accent: string; sub?: string }) {
    const color = accent === 'green' ? 'text-green-600' : accent === 'red' ? 'text-red-500' : accent === 'blue' ? 'text-blue-600' : 'text-orange-600';
    return (
        <Card>
            <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{fmt(value)} F</p>
                {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
            </CardContent>
        </Card>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
            {children}
        </div>
    );
}

function LineItem({ label, value, negative }: { label: string; value: number; negative?: boolean }) {
    return (
        <div className="flex items-center justify-between py-1 pl-4">
            <span>{label}</span>
            <span className={negative ? 'text-red-500' : ''}>{fmt(value)} F</span>
        </div>
    );
}

function TotalLine({ label, value, highlighted, badge, large }: { label: string; value: number; highlighted?: boolean; badge?: string; large?: boolean }) {
    return (
        <div className={`flex items-center justify-between py-2 ${highlighted ? 'rounded bg-muted/50 px-4' : 'pl-4'} ${large ? 'text-lg' : ''}`}>
            <span className="font-semibold">{label}</span>
            <span className="flex items-center gap-2">
                <span className={`font-bold ${value >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(value)} F</span>
                {badge && <Badge variant={value >= 0 ? 'default' : 'destructive'} className="text-xs">{badge}</Badge>}
            </span>
        </div>
    );
}
