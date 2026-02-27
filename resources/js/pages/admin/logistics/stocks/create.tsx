import { Form, Head } from '@inertiajs/react';
import { ArrowLeft, Box, Warehouse as WarehouseIcon } from 'lucide-react';
import { useState } from 'react';
import WarehouseStockController, { index as stocksIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/WarehouseStockController';
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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Stocks', href: stocksIndex().url },
    { title: 'Ajouter', href: '#' },
];

export default function StocksCreate({ warehouses, products }: Props) {
    const [warehouseId, setWarehouseId] = useState('');
    const [productId, setProductId] = useState('');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ajouter un stock" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="size-8">
                        <a href={stocksIndex().url}>
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Retour</span>
                        </a>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Ajouter un stock</h1>
                        <p className="text-sm text-muted-foreground">Définissez le niveau de stock d'un produit dans un entrepôt</p>
                    </div>
                </div>

                <Separator />

                <Form {...WarehouseStockController.store.form()}>
                    {({ processing, errors }) => (
                        <>
                            <div className="mx-auto w-full max-w-2xl space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <WarehouseIcon className="size-4" />
                                            Entrepôt & Produit
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="warehouse_id">
                                                Entrepôt <span className="text-destructive">*</span>
                                            </Label>
                                            <Select value={warehouseId} onValueChange={setWarehouseId}>
                                                <SelectTrigger id="warehouse_id">
                                                    <SelectValue placeholder="Choisir un entrepôt" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {warehouses.map((wh) => (
                                                        <SelectItem key={wh.id} value={wh.id}>
                                                            {wh.name} ({wh.code})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <input type="hidden" name="warehouse_id" value={warehouseId} />
                                            <InputError message={errors.warehouse_id} />
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
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Box className="size-4" />
                                            Quantités
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="quantity">
                                                    Quantité <span className="text-destructive">*</span>
                                                </Label>
                                                <Input id="quantity" name="quantity" type="number" min="0" defaultValue="0" />
                                                <InputError message={errors.quantity} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="stock_alert">Seuil d'alerte</Label>
                                                <Input id="stock_alert" name="stock_alert" type="number" min="0" defaultValue="0" />
                                                <InputError message={errors.stock_alert} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" asChild>
                                    <a href={stocksIndex().url}>Annuler</a>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Enregistrement…' : 'Enregistrer le stock'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
