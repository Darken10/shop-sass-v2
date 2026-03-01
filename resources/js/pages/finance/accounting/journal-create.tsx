import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Minus, Plus, Save } from 'lucide-react';
import { type FormEventHandler } from 'react';
import { storeJournalEntry } from '@/actions/App/Http/Controllers/Finance/AccountingController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type AccountOption = { id: string; code: string; name: string; type: string };
type FilterOption = { id: string; name: string };
type Props = {
    accounts: AccountOption[];
    shops: FilterOption[];
    warehouses: FilterOption[];
};

type Line = { account_id: string; debit: string; credit: string; description: string };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Finance', href: '/finance' },
    { title: 'Journal', href: '/finance/accounting/journal' },
    { title: 'Nouvelle écriture', href: '#' },
];

export default function JournalCreate({ accounts, shops, warehouses }: Props) {
    const { data, setData, post, processing, errors } = useForm<{
        date: string;
        description: string;
        notes: string;
        shop_id: string;
        warehouse_id: string;
        lines: Line[];
    }>({
        date: new Date().toISOString().substring(0, 10),
        description: '',
        notes: '',
        shop_id: '',
        warehouse_id: '',
        lines: [
            { account_id: '', debit: '', credit: '', description: '' },
            { account_id: '', debit: '', credit: '', description: '' },
        ],
    });

    const totalDebit = data.lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
    const totalCredit = data.lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

    function updateLine(index: number, field: keyof Line, value: string) {
        const newLines = [...data.lines];
        newLines[index] = { ...newLines[index], [field]: value };
        setData('lines', newLines);
    }

    function addLine() {
        setData('lines', [...data.lines, { account_id: '', debit: '', credit: '', description: '' }]);
    }

    function removeLine(index: number) {
        if (data.lines.length <= 2) return;
        setData('lines', data.lines.filter((_, i) => i !== index));
    }

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(storeJournalEntry().url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Finance — Nouvelle écriture comptable" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon">
                        <Link href="/finance/accounting/journal">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-semibold">Nouvelle écriture comptable</h1>
                </div>

                <form onSubmit={submit} className="mx-auto w-full max-w-4xl space-y-6">
                    {/* Header fields */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Informations générales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label>Date *</Label>
                                    <Input type="date" value={data.date} onChange={(e) => setData('date', e.target.value)} />
                                    {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Description *</Label>
                                    <Input value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="Description de l'écriture" />
                                    {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label>Boutique</Label>
                                    <Select value={data.shop_id} onValueChange={(v) => setData('shop_id', v)}>
                                        <SelectTrigger><SelectValue placeholder="Optionnel" /></SelectTrigger>
                                        <SelectContent>
                                            {shops.map((s) => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Entrepôt</Label>
                                    <Select value={data.warehouse_id} onValueChange={(v) => setData('warehouse_id', v)}>
                                        <SelectTrigger><SelectValue placeholder="Optionnel" /></SelectTrigger>
                                        <SelectContent>
                                            {warehouses.map((w) => (
                                                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Notes</Label>
                                <Textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={2} placeholder="Notes internes..." />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Lines */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">Lignes d'écriture</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addLine}>
                                <Plus className="size-4" />
                                Ajouter une ligne
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {typeof errors.lines === 'string' && <p className="mb-3 text-xs text-destructive">{errors.lines}</p>}

                            <div className="space-y-3">
                                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
                                    <span className="col-span-4">Compte</span>
                                    <span className="col-span-2">Débit</span>
                                    <span className="col-span-2">Crédit</span>
                                    <span className="col-span-3">Libellé</span>
                                    <span className="col-span-1"></span>
                                </div>
                                {data.lines.map((line, i) => (
                                    <div key={i} className="grid grid-cols-12 gap-2">
                                        <div className="col-span-4">
                                            <Select value={line.account_id} onValueChange={(v) => updateLine(i, 'account_id', v)}>
                                                <SelectTrigger className="text-xs">
                                                    <SelectValue placeholder="Compte..." />
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
                                        <div className="col-span-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={line.debit}
                                                onChange={(e) => updateLine(i, 'debit', e.target.value)}
                                                placeholder="0.00"
                                                className="text-right text-xs"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={line.credit}
                                                onChange={(e) => updateLine(i, 'credit', e.target.value)}
                                                placeholder="0.00"
                                                className="text-right text-xs"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <Input
                                                value={line.description}
                                                onChange={(e) => updateLine(i, 'description', e.target.value)}
                                                placeholder="Libellé..."
                                                className="text-xs"
                                            />
                                        </div>
                                        <div className="col-span-1 flex justify-center">
                                            <Button type="button" variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => removeLine(i)} disabled={data.lines.length <= 2}>
                                                <Minus className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="mt-4 grid grid-cols-12 gap-2 border-t pt-3">
                                <div className="col-span-4 text-right text-sm font-semibold">Total</div>
                                <div className="col-span-2 text-right text-sm font-bold">{totalDebit.toLocaleString('fr-FR')} F</div>
                                <div className="col-span-2 text-right text-sm font-bold">{totalCredit.toLocaleString('fr-FR')} F</div>
                                <div className="col-span-3">
                                    {!isBalanced && totalDebit > 0 && (
                                        <p className="text-xs text-destructive">Écart : {Math.abs(totalDebit - totalCredit).toLocaleString('fr-FR')} F</p>
                                    )}
                                    {isBalanced && <p className="text-xs text-green-600">✓ Équilibrée</p>}
                                </div>
                                <div className="col-span-1"></div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing || !isBalanced}>
                            <Save className="size-4" />
                            Enregistrer
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
