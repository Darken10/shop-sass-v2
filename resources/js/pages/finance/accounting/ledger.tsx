import { Head, router } from '@inertiajs/react';
import { BookOpen } from 'lucide-react';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type AccountOption = { id: string; code: string; name: string; type: string; balance: number };
type LedgerEntry = { id: string; reference: string; date: string; description: string; debit: number; credit: number };
type SelectedAccount = { id: string; code: string; name: string; type: string; balance: number } | null;
type Props = {
    accounts: AccountOption[];
    ledgerEntries: LedgerEntry[];
    selectedAccount: SelectedAccount;
    filters: { account_id: string | null; start_date: string; end_date: string };
};

function fmt(v: number): string {
    return v.toLocaleString('fr-FR');
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Finance', href: '/finance' },
    { title: 'Grand livre', href: '/finance/accounting/ledger' },
];

export default function Ledger({ accounts, ledgerEntries, selectedAccount, filters }: Props) {
    function applyFilter(key: string, value: string | null) {
        router.get('/finance/accounting/ledger', { ...filters, [key]: value || undefined }, { preserveState: true, preserveScroll: true });
    }

    // Compute running balance
    const entriesWithBalance = useMemo(() => {
        let balance = 0;
        return ledgerEntries.map((entry) => {
            balance += entry.debit - entry.credit;
            return { ...entry, runningBalance: balance };
        });
    }, [ledgerEntries]);

    const totalDebit = ledgerEntries.reduce((s, e) => s + e.debit, 0);
    const totalCredit = ledgerEntries.reduce((s, e) => s + e.credit, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Finance — Grand livre" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg border bg-muted">
                        <BookOpen className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold">Grand livre</h1>
                        <p className="text-sm text-muted-foreground">
                            {selectedAccount
                                ? `${selectedAccount.code} — ${selectedAccount.name}`
                                : 'Sélectionnez un compte'}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="flex flex-wrap items-end gap-4 p-4">
                        <div className="min-w-[250px] flex-1 space-y-1.5">
                            <Label>Compte</Label>
                            <Select value={filters.account_id ?? ''} onValueChange={(v) => applyFilter('account_id', v || null)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir un compte..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>
                                            <span className="font-mono text-xs">{a.code}</span> — {a.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Date début</Label>
                            <Input type="date" value={filters.start_date ?? ''} onChange={(e) => applyFilter('start_date', e.target.value || null)} className="w-40" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Date fin</Label>
                            <Input type="date" value={filters.end_date ?? ''} onChange={(e) => applyFilter('end_date', e.target.value || null)} className="w-40" />
                        </div>
                    </CardContent>
                </Card>

                {/* Account Summary */}
                {selectedAccount && (
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground">Solde actuel</p>
                                <p className="text-xl font-bold">{fmt(selectedAccount.balance)} F</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground">Total débit (période)</p>
                                <p className="text-xl font-bold text-blue-600">{fmt(totalDebit)} F</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground">Total crédit (période)</p>
                                <p className="text-xl font-bold text-orange-600">{fmt(totalCredit)} F</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Entries Table */}
                {!selectedAccount ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <BookOpen className="size-10 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Sélectionnez un compte pour voir ses mouvements</p>
                    </div>
                ) : entriesWithBalance.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <BookOpen className="size-10 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Aucun mouvement pour cette période</p>
                    </div>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Mouvements</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Référence</TableHead>
                                        <TableHead>Libellé</TableHead>
                                        <TableHead className="text-right">Débit</TableHead>
                                        <TableHead className="text-right">Crédit</TableHead>
                                        <TableHead className="text-right">Solde</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entriesWithBalance.map((entry, i) => (
                                        <TableRow key={`${entry.id}-${i}`}>
                                            <TableCell>{entry.date}</TableCell>
                                            <TableCell className="font-mono text-xs">{entry.reference}</TableCell>
                                            <TableCell>{entry.description}</TableCell>
                                            <TableCell className="text-right font-semibold">{entry.debit > 0 ? `${fmt(entry.debit)} F` : ''}</TableCell>
                                            <TableCell className="text-right font-semibold">{entry.credit > 0 ? `${fmt(entry.credit)} F` : ''}</TableCell>
                                            <TableCell className={`text-right font-bold ${entry.runningBalance >= 0 ? '' : 'text-red-500'}`}>{fmt(entry.runningBalance)} F</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-muted/50 font-bold">
                                        <TableCell colSpan={3} className="text-right">Total</TableCell>
                                        <TableCell className="text-right">{fmt(totalDebit)} F</TableCell>
                                        <TableCell className="text-right">{fmt(totalCredit)} F</TableCell>
                                        <TableCell className="text-right">{fmt(totalDebit - totalCredit)} F</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
