import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, FileBarChart, Save } from 'lucide-react';
import { type FormEventHandler } from 'react';
import { store } from '@/actions/App/Http/Controllers/Finance/FinancialReportController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type ReportType = { value: string; label: string };
type FilterOption = { id: string; name: string };
type Props = {
    reportTypes: ReportType[];
    shops: FilterOption[];
    warehouses: FilterOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Finance', href: '/finance' },
    { title: 'Rapports', href: '/finance/reports' },
    { title: 'Nouveau rapport', href: '#' },
];

export default function ReportCreate({ reportTypes, shops, warehouses }: Props) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);

    const { data, setData, post, processing, errors } = useForm({
        type: '',
        period_start: startOfMonth.toISOString().substring(0, 10),
        period_end: new Date().toISOString().substring(0, 10),
        shop_id: '',
        warehouse_id: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(store().url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Finance — Nouveau rapport" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon">
                        <Link href="/finance/reports">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-semibold">Générer un rapport financier</h1>
                </div>

                <form onSubmit={submit} className="mx-auto w-full max-w-lg space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <FileBarChart className="size-5 text-muted-foreground" />
                                <CardTitle className="text-base">Paramètres du rapport</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label>Type de rapport *</Label>
                                <Select value={data.type} onValueChange={(v) => setData('type', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choisir un type..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {reportTypes.map((t) => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label>Date de début *</Label>
                                    <Input type="date" value={data.period_start} onChange={(e) => setData('period_start', e.target.value)} />
                                    {errors.period_start && <p className="text-xs text-destructive">{errors.period_start}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Date de fin *</Label>
                                    <Input type="date" value={data.period_end} onChange={(e) => setData('period_end', e.target.value)} />
                                    {errors.period_end && <p className="text-xs text-destructive">{errors.period_end}</p>}
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label>Boutique</Label>
                                    <Select value={data.shop_id} onValueChange={(v) => setData('shop_id', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Toutes" />
                                        </SelectTrigger>
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
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tous" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {warehouses.map((w) => (
                                                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>
                            <Save className="size-4" />
                            Générer le rapport
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
