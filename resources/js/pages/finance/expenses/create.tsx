import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { type FormEventHandler } from 'react';
import { store } from '@/actions/App/Http/Controllers/Finance/ExpenseController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type FilterOption = { id: string; name: string; color?: string | null };
type Props = {
    categories: FilterOption[];
    shops: FilterOption[];
    warehouses: FilterOption[];
    suppliers: FilterOption[];
};

const paymentMethods = [
    { value: 'cash', label: 'Espèces' },
    { value: 'card', label: 'Carte bancaire' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'bank_transfer', label: 'Virement bancaire' },
    { value: 'credit', label: 'Crédit' },
];

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Finance', href: '/finance' },
    { title: 'Dépenses', href: '/finance/expenses' },
    { title: 'Nouvelle dépense', href: '#' },
];

export default function ExpenseCreate({ categories, shops, warehouses, suppliers }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        label: '',
        description: '',
        amount: '',
        date: new Date().toISOString().substring(0, 10),
        payment_method: 'cash',
        receipt_number: '',
        category_id: '',
        shop_id: '',
        warehouse_id: '',
        supplier_id: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(store().url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Finance — Nouvelle dépense" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon">
                        <Link href="/finance/expenses">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <h1 className="text-xl font-semibold">Nouvelle dépense</h1>
                </div>

                <form onSubmit={submit} className="mx-auto w-full max-w-2xl space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Informations de la dépense</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Field label="Libellé *" error={errors.label}>
                                <Input value={data.label} onChange={(e) => setData('label', e.target.value)} placeholder="Ex: Achat fournitures bureau" />
                            </Field>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Montant *" error={errors.amount}>
                                    <Input type="number" step="0.01" min="0.01" value={data.amount} onChange={(e) => setData('amount', e.target.value)} placeholder="0.00" />
                                </Field>
                                <Field label="Date *" error={errors.date}>
                                    <Input type="date" value={data.date} onChange={(e) => setData('date', e.target.value)} />
                                </Field>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Mode de paiement" error={errors.payment_method}>
                                    <Select value={data.payment_method} onValueChange={(v) => setData('payment_method', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {paymentMethods.map((m) => (
                                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="N° de reçu" error={errors.receipt_number}>
                                    <Input value={data.receipt_number} onChange={(e) => setData('receipt_number', e.target.value)} placeholder="Optionnel" />
                                </Field>
                            </div>

                            <Field label="Description" error={errors.description}>
                                <Textarea value={data.description} onChange={(e) => setData('description', e.target.value)} rows={3} placeholder="Détails additionnels..." />
                            </Field>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Classification</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Field label="Catégorie" error={errors.category_id}>
                                <Select value={data.category_id} onValueChange={(v) => setData('category_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Choisir une catégorie" /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Boutique" error={errors.shop_id}>
                                    <Select value={data.shop_id} onValueChange={(v) => setData('shop_id', v)}>
                                        <SelectTrigger><SelectValue placeholder="Optionnel" /></SelectTrigger>
                                        <SelectContent>
                                            {shops.map((s) => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Entrepôt" error={errors.warehouse_id}>
                                    <Select value={data.warehouse_id} onValueChange={(v) => setData('warehouse_id', v)}>
                                        <SelectTrigger><SelectValue placeholder="Optionnel" /></SelectTrigger>
                                        <SelectContent>
                                            {warehouses.map((w) => (
                                                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </div>

                            <Field label="Fournisseur" error={errors.supplier_id}>
                                <Select value={data.supplier_id} onValueChange={(v) => setData('supplier_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Optionnel" /></SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>
                            <Save className="size-4" />
                            Enregistrer
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
