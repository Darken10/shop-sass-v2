import { Head } from '@inertiajs/react';
import { Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type AccountRow = { id: string; code: string; name: string; balance: number };
type BalanceSheetData = {
    assets: AccountRow[];
    liabilities: AccountRow[];
    equity: AccountRow[];
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
};

type Props = { balanceSheet: BalanceSheetData };

function fmt(v: number): string {
    return v.toLocaleString('fr-FR');
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Finance', href: '/finance' },
    { title: 'Bilan comptable', href: '/finance/accounting/balance-sheet' },
];

export default function BalanceSheet({ balanceSheet }: Props) {
    const bs = balanceSheet;
    const totalLP = bs.totalLiabilities + bs.totalEquity;
    const isBalanced = Math.abs(bs.totalAssets - totalLP) < 0.01;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Finance — Bilan comptable" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg border bg-muted">
                        <Scale className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold">Bilan comptable</h1>
                        <p className="text-sm text-muted-foreground">
                            {isBalanced ? (
                                <span className="text-green-600">✓ Le bilan est équilibré</span>
                            ) : (
                                <span className="text-red-500">⚠ Le bilan n'est pas équilibré — écart de {fmt(Math.abs(bs.totalAssets - totalLP))} F</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">Total Actifs</p>
                            <p className="text-2xl font-bold text-blue-600">{fmt(bs.totalAssets)} F</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">Total Passifs</p>
                            <p className="text-2xl font-bold text-red-500">{fmt(bs.totalLiabilities)} F</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">Capitaux propres</p>
                            <p className="text-2xl font-bold text-purple-600">{fmt(bs.totalEquity)} F</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Two column layout */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Assets */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base text-blue-600">Actifs</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <BalanceTable accounts={bs.assets} total={bs.totalAssets} label="Total actifs" color="text-blue-600" />
                        </CardContent>
                    </Card>

                    {/* Liabilities + Equity */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base text-red-500">Passifs</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <BalanceTable accounts={bs.liabilities} total={bs.totalLiabilities} label="Total passifs" color="text-red-500" />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base text-purple-600">Capitaux propres</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <BalanceTable accounts={bs.equity} total={bs.totalEquity} label="Total capitaux propres" color="text-purple-600" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function BalanceTable({ accounts, total, label, color }: { accounts: AccountRow[]; total: number; label: string; color: string }) {
    if (accounts.length === 0) {
        return <p className="p-6 text-center text-sm text-muted-foreground">Aucun compte</p>;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Compte</TableHead>
                    <TableHead className="text-right">Solde</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {accounts.map((acc) => (
                    <TableRow key={acc.id}>
                        <TableCell className="font-mono text-xs">{acc.code}</TableCell>
                        <TableCell>{acc.name}</TableCell>
                        <TableCell className="text-right font-semibold">{fmt(acc.balance)} F</TableCell>
                    </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                    <TableCell colSpan={2} className="text-right font-bold">{label}</TableCell>
                    <TableCell className={`text-right font-bold ${color}`}>{fmt(total)} F</TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
}
