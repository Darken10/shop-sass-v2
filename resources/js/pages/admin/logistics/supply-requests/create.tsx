import { Form, Head } from '@inertiajs/react';
import { ArrowLeft, ClipboardList, MinusCircle, Package, Plus, Warehouse as WarehouseIcon } from 'lucide-react';
import { useState } from 'react';
import SupplyRequestController, { index as requestsIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/SupplyRequestController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Warehouse = { id: string; name: string; code: string };
type Product = { id: string; name: string; code: string };

type Props = {
    warehouses: Warehouse[];
    products: Product[];
};

type ItemRow = {
    key: number;
    product_id: string;
    quantity_requested: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Approvisionnements', href: requestsIndex().url },
    { title: 'Nouvelle demande', href: '#' },
];

let nextKey = 1;

export default function SupplyRequestsCreate({ warehouses, products }: Props) {
    const [sourceId, setSourceId] = useState('');
    const [destId, setDestId] = useState('');
    const [items, setItems] = useState<ItemRow[]>([{ key: nextKey++, product_id: '', quantity_requested: '1' }]);

    function addItem() {
        setItems((prev) => [...prev, { key: nextKey++, product_id: '', quantity_requested: '1' }]);
    }

    function removeItem(key: number) {
        setItems((prev) => prev.filter((item) => item.key !== key));
    }

    function updateItem(key: number, field: keyof Omit<ItemRow, 'key'>, value: string) {
        setItems((prev) => prev.map((item) => (item.key === key ? { ...item, [field]: value } : item)));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouvelle demande d'approvisionnement" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="size-8">
                        <a href={requestsIndex().url}>
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Retour</span>
                        </a>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Nouvelle demande d'approvisionnement</h1>
                        <p className="text-sm text-muted-foreground">Demandez le transfert de produits entre entrepôts</p>
                    </div>
                </div>

                <Separator />

                <Form {...SupplyRequestController.store.form()}>
                    {({ processing, errors }) => (
                        <>
                            <div className="mx-auto w-full max-w-2xl space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <WarehouseIcon className="size-4" />
                                            Entrepôts
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="source_warehouse_id">
                                                    Entrepôt source <span className="text-destructive">*</span>
                                                </Label>
                                                <Select value={sourceId} onValueChange={setSourceId}>
                                                    <SelectTrigger id="source_warehouse_id">
                                                        <SelectValue placeholder="Source" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {warehouses.map((wh) => (
                                                            <SelectItem key={wh.id} value={wh.id}>
                                                                {wh.name} ({wh.code})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <input type="hidden" name="source_warehouse_id" value={sourceId} />
                                                <InputError message={errors.source_warehouse_id} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="destination_warehouse_id">Entrepôt destination</Label>
                                                <Select value={destId} onValueChange={setDestId}>
                                                    <SelectTrigger id="destination_warehouse_id">
                                                        <SelectValue placeholder="Destination (optionnel)" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {warehouses.map((wh) => (
                                                            <SelectItem key={wh.id} value={wh.id}>
                                                                {wh.name} ({wh.code})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <input type="hidden" name="destination_warehouse_id" value={destId} />
                                                <InputError message={errors.destination_warehouse_id} />
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="notes">Notes</Label>
                                            <textarea
                                                id="notes"
                                                name="notes"
                                                rows={2}
                                                placeholder="Notes supplémentaires…"
                                                className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[60px] w-full rounded-md border px-3 py-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <InputError message={errors.notes} />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between text-base">
                                            <span className="flex items-center gap-2">
                                                <Package className="size-4" />
                                                Articles ({items.length})
                                            </span>
                                            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                                <Plus className="size-4" />
                                                Ajouter
                                            </Button>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {items.map((item, idx) => (
                                            <div key={item.key} className="flex items-end gap-3 rounded-lg border bg-muted/20 p-3">
                                                <div className="flex-1 grid gap-2">
                                                    <Label htmlFor={`items-${idx}-product`}>
                                                        Produit <span className="text-destructive">*</span>
                                                    </Label>
                                                    <Select
                                                        value={item.product_id}
                                                        onValueChange={(v) => updateItem(item.key, 'product_id', v)}
                                                    >
                                                        <SelectTrigger id={`items-${idx}-product`}>
                                                            <SelectValue placeholder="Choisir" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {products.map((p) => (
                                                                <SelectItem key={p.id} value={p.id}>
                                                                    {p.name} ({p.code})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <input type="hidden" name={`items[${idx}][product_id]`} value={item.product_id} />
                                                    <InputError message={errors[`items.${idx}.product_id`]} />
                                                </div>
                                                <div className="w-28 grid gap-2">
                                                    <Label htmlFor={`items-${idx}-qty`}>Quantité</Label>
                                                    <Input
                                                        id={`items-${idx}-qty`}
                                                        name={`items[${idx}][quantity_requested]`}
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity_requested}
                                                        onChange={(e) => updateItem(item.key, 'quantity_requested', e.target.value)}
                                                    />
                                                    <InputError message={errors[`items.${idx}.quantity_requested`]} />
                                                </div>
                                                {items.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="mb-0.5 size-9 shrink-0 text-destructive hover:text-destructive"
                                                        onClick={() => removeItem(item.key)}
                                                    >
                                                        <MinusCircle className="size-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        <InputError message={errors.items} />
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" asChild>
                                    <a href={requestsIndex().url}>Annuler</a>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Enregistrement…' : 'Soumettre la demande'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
