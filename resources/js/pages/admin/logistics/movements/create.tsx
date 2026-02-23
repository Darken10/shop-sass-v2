import { Form, Head } from '@inertiajs/react';
import { ArrowLeft, ArrowLeftRight, Box, Warehouse as WarehouseIcon } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import StockMovementController, { index as movementsIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/StockMovementController';

type Warehouse = { id: string; name: string; code: string };
type Product = { id: string; name: string; code: string };

const MOVEMENT_TYPES = [
    { value: 'purchase_entry', label: 'Entrée achat' },
    { value: 'supplier_return', label: 'Retour fournisseur' },
    { value: 'store_transfer', label: 'Transfert magasin' },
    { value: 'loss', label: 'Perte' },
    { value: 'internal_transfer', label: 'Transfert interne' },
    { value: 'adjustment', label: 'Ajustement' },
] as const;

type Props = {
    warehouses: Warehouse[];
    products: Product[];
    movementTypes: { value: string; name?: string }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Mouvements', href: movementsIndex().url },
    { title: 'Nouveau', href: '#' },
];

export default function MovementsCreate({ warehouses, products }: Props) {
    const [typeValue, setTypeValue] = useState('');
    const [productId, setProductId] = useState('');
    const [sourceId, setSourceId] = useState('');
    const [destId, setDestId] = useState('');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouveau mouvement de stock" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="size-8">
                        <a href={movementsIndex().url}>
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Retour</span>
                        </a>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Nouveau mouvement de stock</h1>
                        <p className="text-sm text-muted-foreground">Enregistrez une entrée, sortie ou transfert de stock</p>
                    </div>
                </div>

                <Separator />

                <Form {...StockMovementController.store.form()}>
                    {({ processing, errors }) => (
                        <>
                            <div className="mx-auto w-full max-w-2xl space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <ArrowLeftRight className="size-4" />
                                            Type & Produit
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="type">
                                                Type de mouvement <span className="text-destructive">*</span>
                                            </Label>
                                            <Select value={typeValue} onValueChange={setTypeValue}>
                                                <SelectTrigger id="type">
                                                    <SelectValue placeholder="Choisir le type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {MOVEMENT_TYPES.map((t) => (
                                                        <SelectItem key={t.value} value={t.value}>
                                                            {t.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <input type="hidden" name="type" value={typeValue} />
                                            <InputError message={errors.type} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="product_id">
                                                Produit <span className="text-destructive">*</span>
                                            </Label>
                                            <Select value={productId} onValueChange={setProductId}>
                                                <SelectTrigger id="product_id">
                                                    <SelectValue placeholder="Choisir un produit" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products.map((p) => (
                                                        <SelectItem key={p.id} value={p.id}>
                                                            {p.name} ({p.code})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <input type="hidden" name="product_id" value={productId} />
                                            <InputError message={errors.product_id} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="quantity">
                                                Quantité <span className="text-destructive">*</span>
                                            </Label>
                                            <Input id="quantity" name="quantity" type="number" min="1" placeholder="0" />
                                            <InputError message={errors.quantity} />
                                        </div>
                                    </CardContent>
                                </Card>

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
                                                <Label htmlFor="source_warehouse_id">Entrepôt source</Label>
                                                <Select value={sourceId} onValueChange={setSourceId}>
                                                    <SelectTrigger id="source_warehouse_id">
                                                        <SelectValue placeholder="Source (optionnel)" />
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
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Box className="size-4" />
                                            Informations complémentaires
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="reason">Raison</Label>
                                            <Input id="reason" name="reason" placeholder="Raison du mouvement" />
                                            <InputError message={errors.reason} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="notes">Notes</Label>
                                            <textarea
                                                id="notes"
                                                name="notes"
                                                rows={3}
                                                placeholder="Notes supplémentaires…"
                                                className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                            <InputError message={errors.notes} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" asChild>
                                    <a href={movementsIndex().url}>Annuler</a>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Enregistrement…' : 'Enregistrer le mouvement'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
