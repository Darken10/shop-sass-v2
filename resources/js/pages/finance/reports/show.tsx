import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, FileBarChart, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Report = {
    id: string;
    title: string;
    type: string;
    period_start: string;
    period_end: string;
    filters: Record<string, string | null> | null;
    data: Record<string, unknown>;
    summary: Record<string, unknown> | null;
    generator: { id: string; name: string } | null;
    created_at: string;
};

type Props = { report: Report };

function fmt(v: number): string {
    return v.toLocaleString('fr-FR');
}

const typeLabels: Record<string, string> = {
    profit_loss: 'Compte de résultat',
    balance_sheet: 'Bilan comptable',
    cash_flow: 'Flux de trésorerie',
    expense_report: 'Rapport de dépenses',
    revenue_report: 'Rapport de revenus',
    custom: 'Personnalisé',
};

export default function ReportShow({ report }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Finance', href: '/finance' },
        { title: 'Rapports', href: '/finance/reports' },
        { title: report.title, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={report.title} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon">
                        <Link href="/finance/reports">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">{report.title}</h1>
                        <p className="text-sm text-muted-foreground">
                            <Badge variant="secondary">{typeLabels[report.type] ?? report.type}</Badge>
                        </p>
                    </div>
                </div>

                <div className="mx-auto w-full max-w-4xl space-y-6">
                    {/* Meta */}
                    <Card>
                        <CardContent className="grid gap-3 p-6 sm:grid-cols-2">
                            <div className="flex items-center gap-3">
                                <CalendarDays className="size-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Période</span>
                                <span className="text-sm font-medium">{new Date(report.period_start).toLocaleDateString('fr-FR')} — {new Date(report.period_end).toLocaleDateString('fr-FR')}</span>
                            </div>
                            {report.generator && (
                                <div className="flex items-center gap-3">
                                    <User className="size-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Généré par</span>
                                    <span className="text-sm font-medium">{report.generator.name}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <CalendarDays className="size-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Créé le</span>
                                <span className="text-sm font-medium">{new Date(report.created_at).toLocaleString('fr-FR')}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary */}
                    {report.summary && Object.keys(report.summary).length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Résumé</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                                    {Object.entries(report.summary).map(([key, value]) => (
                                        <div key={key} className="rounded-lg border p-3">
                                            <p className="text-xs text-muted-foreground">{formatSummaryKey(key)}</p>
                                            <p className="text-lg font-bold">
                                                {typeof value === 'number' ? `${fmt(value)} F` : String(value)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Rendered report data */}
                    <ReportData type={report.type} data={report.data} />
                </div>
            </div>
        </AppLayout>
    );
}

function formatSummaryKey(key: string): string {
    const map: Record<string, string> = {
        totalRevenue: 'Chiffre d\'affaires',
        totalExpenses: 'Total dépenses',
        netProfit: 'Bénéfice net',
        netMargin: 'Marge nette',
        grossProfit: 'Bénéfice brut',
        totalInflows: 'Entrées de fonds',
        totalOutflows: 'Sorties de fonds',
        netCashFlow: 'Flux net',
        totalAssets: 'Total actifs',
        totalLiabilities: 'Total passifs',
        totalEquity: 'Capitaux propres',
    };
    return map[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

// ── Dynamic report rendering ───────────────────────────────
function ReportData({ type, data }: { type: string; data: Record<string, unknown> }) {
    switch (type) {
        case 'profit_loss':
            return <ProfitLossReport data={data} />;
        case 'cash_flow':
            return <CashFlowReport data={data} />;
        case 'balance_sheet':
            return <BalanceSheetReport data={data} />;
        default:
            return <GenericReport data={data} />;
    }
}

function ProfitLossReport({ data }: { data: Record<string, unknown> }) {
    const d = data as {
        revenue?: { sales?: number; total?: number };
        costOfGoodsSold?: number;
        grossProfit?: number;
        grossMargin?: number;
        expenses?: { categories?: { category: string; amount: number }[]; logisticCosts?: number; total?: number };
        netProfit?: number;
        netMargin?: number;
    };

    return (
        <Card>
            <CardHeader><CardTitle className="text-base">Compte de résultat</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
                <Row label="Ventes" value={d.revenue?.sales ?? 0} />
                <Row label="Coût des marchandises vendues" value={-(d.costOfGoodsSold ?? 0)} negative />
                <Separator />
                <Row label="Bénéfice brut" value={d.grossProfit ?? 0} bold badge={`${d.grossMargin ?? 0}%`} />
                <Separator />
                {d.expenses?.categories?.map((c) => (
                    <Row key={c.category} label={c.category} value={-c.amount} negative />
                ))}
                {(d.expenses?.logisticCosts ?? 0) > 0 && <Row label="Frais logistiques" value={-(d.expenses?.logisticCosts ?? 0)} negative />}
                <Row label="Total charges" value={-(d.expenses?.total ?? 0)} />
                <Separator />
                <Row label="Résultat net" value={d.netProfit ?? 0} bold badge={`${d.netMargin ?? 0}%`} large />
            </CardContent>
        </Card>
    );
}

function CashFlowReport({ data }: { data: Record<string, unknown> }) {
    const d = data as {
        inflows?: { sales?: number; total?: number };
        outflows?: { expenses?: number; logisticCosts?: number; total?: number };
        netCashFlow?: number;
    };

    return (
        <Card>
            <CardHeader><CardTitle className="text-base">Flux de trésorerie</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
                <Row label="Entrées — Ventes" value={d.inflows?.sales ?? 0} />
                <Row label="Total entrées" value={d.inflows?.total ?? 0} bold />
                <Separator />
                <Row label="Sorties — Dépenses" value={-(d.outflows?.expenses ?? 0)} negative />
                <Row label="Sorties — Logistique" value={-(d.outflows?.logisticCosts ?? 0)} negative />
                <Row label="Total sorties" value={-(d.outflows?.total ?? 0)} bold />
                <Separator />
                <Row label="Flux net de trésorerie" value={d.netCashFlow ?? 0} bold large />
            </CardContent>
        </Card>
    );
}

function BalanceSheetReport({ data }: { data: Record<string, unknown> }) {
    const d = data as {
        assets?: { code: string; name: string; balance: number }[];
        liabilities?: { code: string; name: string; balance: number }[];
        equity?: { code: string; name: string; balance: number }[];
        totalAssets?: number;
        totalLiabilities?: number;
        totalEquity?: number;
    };

    return (
        <div className="space-y-4">
            <AccountsTable title="Actifs" accounts={d.assets ?? []} total={d.totalAssets ?? 0} />
            <AccountsTable title="Passifs" accounts={d.liabilities ?? []} total={d.totalLiabilities ?? 0} />
            <AccountsTable title="Capitaux propres" accounts={d.equity ?? []} total={d.totalEquity ?? 0} />
        </div>
    );
}

function AccountsTable({ title, accounts, total }: { title: string; accounts: { code: string; name: string; balance: number }[]; total: number }) {
    return (
        <Card>
            <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Compte</TableHead>
                            <TableHead className="text-right">Solde</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {accounts.map((a) => (
                            <TableRow key={a.code}>
                                <TableCell className="font-mono text-xs">{a.code}</TableCell>
                                <TableCell>{a.name}</TableCell>
                                <TableCell className="text-right font-semibold">{fmt(a.balance)} F</TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="bg-muted/50">
                            <TableCell colSpan={2} className="text-right font-bold">Total</TableCell>
                            <TableCell className="text-right font-bold">{fmt(total)} F</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function GenericReport({ data }: { data: Record<string, unknown> }) {
    return (
        <Card>
            <CardHeader><CardTitle className="text-base">Données du rapport</CardTitle></CardHeader>
            <CardContent>
                <pre className="max-h-[500px] overflow-auto rounded bg-muted p-4 text-xs">{JSON.stringify(data, null, 2)}</pre>
            </CardContent>
        </Card>
    );
}

function Row({ label, value, negative, bold, badge, large }: { label: string; value: number; negative?: boolean; bold?: boolean; badge?: string; large?: boolean }) {
    return (
        <div className={`flex items-center justify-between py-1 ${bold ? 'rounded bg-muted/50 px-4' : 'px-4'} ${large ? 'text-lg' : ''}`}>
            <span className={bold ? 'font-semibold' : ''}>{label}</span>
            <span className="flex items-center gap-2">
                <span className={`${bold ? 'font-bold' : 'font-semibold'} ${negative ? 'text-red-500' : value >= 0 ? '' : 'text-red-500'}`}>
                    {fmt(value)} F
                </span>
                {badge && <Badge variant={value >= 0 ? 'default' : 'destructive'} className="text-xs">{badge}</Badge>}
            </span>
        </div>
    );
}
