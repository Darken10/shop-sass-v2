import { Form, Head } from '@inertiajs/react';
import { ArrowLeft, CircleDollarSign, MinusCircle, Package, Plus, Save, Truck, Warehouse as WarehouseIcon } from 'lucide-react';
import { useState } from 'react';
import SupplyRequestController, { index as requestsIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/SupplyRequestController';
import CreateProductModal from '@/components/create-product-modal';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Warehouse = { id: string; name: string; code: string };
type Supplier = { id: string; name: string; code: string };
type Product = { id: string; name: string; code: string };
type Category = { id: string; name: string };
type ChargeType = { value: string; label: string };

type Props = {
    warehouses: Warehouse[];
    suppliers: Supplier[];
    products: Product[];
    categories: Category[];
    chargeTypes: ChargeType[];
};

type ItemRow = {
    key: number;
    product_id: string;
    quantity_requested: string;
};

type ChargeRow = {
    key: number;
    label: string;
    type: string;
    amount: string;
    notes: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Approvisionnements', href: requestsIndex().url },
    { title: 'Nouvelle demande', href: '#' },
];

let nextKey = 1;
let nextChargeKey = 1;

export default function SupplyRequestsCreate({ warehouses, suppliers, products: initialProducts, categories, chargeTypes }: Props) {
    const [type, setType] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [sourceId, setSourceId] = useState('');
    const [destId, setDestId] = useState('');
    const [driverName, setDriverName] = useState('');
    const [driverPhone, setDriverPhone] = useState('');
    const [companyBearsCosts, setCompanyBearsCosts] = useState(false);
    const [items, setItems] = useState<ItemRow[]>([{ key: nextKey++, product_id: '', quantity_requested: '1' }]);
    const [charges, setCharges] = useState<ChargeRow[]>([]);
    const [isDraft, setIsDraft] = useState(false);
    const [products, setProducts] = useState<Product[]>(initialProducts);

    function addItem() {
        setItems((prev) => [...prev, { key: nextKey++, product_id: '', quantity_requested: '1' }]);
    }

    function removeItem(key: number) {
        setItems((prev) => prev.filter((item) => item.key !== key));
    }

    function updateItem(key: number, field: keyof Omit<ItemRow, 'key'>, value: string) {
        setItems((prev) => prev.map((item) => (item.key === key ? { ...item, [field]: value } : item)));
    }

    function addCharge() {
        setCharges((prev) => [...prev, { key: nextChargeKey++, label: '', type: '', amount: '', notes: '' }]);
    }

    function removeCharge(key: number) {
        setCharges((prev) => prev.filter((c) => c.key !== key));
    }

    function updateCharge(key: number, field: keyof Omit<ChargeRow, 'key'>, value: string) {
        setCharges((prev) => prev.map((c) => (c.key === key ? { ...c, [field]: value } : c)));
    }

    function handleProductCreated(product: { id: string; name: string; code: string }) {
        setProducts((prev) => [...prev, product].sort((a, b) => a.name.localeCompare(b.name)));
    }

    const isSupplierToWarehouse = type === 'supplier_to_warehouse';
    const isWarehouseToWarehouse = type === 'warehouse_to_warehouse';

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
                        <p className="text-sm text-muted-foreground">Fournisseur → Entrepôt ou Entrepôt → Entrepôt</p>
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
                                            <Truck className="size-4" />
                                            Type d'approvisionnement
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="type">
                                                Type <span className="text-destructive">*</span>
                                            </Label>
                                            <Select value={type} onValueChange={(v) => { setType(v); setSupplierId(''); setSourceId(''); setDestId(''); }}>
                                                <SelectTrigger id="type">
                                                    <SelectValue placeholder="Sélectionner un type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="supplier_to_warehouse">Fournisseur → Entrepôt</SelectItem>
                                                    <SelectItem value="warehouse_to_warehouse">Entrepôt → Entrepôt</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <input type="hidden" name="type" value={type} />
                                            <InputError message={errors.type} />
                                        </div>
                                    </CardContent>
                                </Card>

                                {type && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <WarehouseIcon className="size-4" />
                                                {isSupplierToWarehouse ? 'Fournisseur & Entrepôt' : 'Entrepôts'}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                {isSupplierToWarehouse && (
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="supplier_id">
                                                            Fournisseur <span className="text-destructive">*</span>
                                                        </Label>
                                                        <Select value={supplierId} onValueChange={setSupplierId}>
                                                            <SelectTrigger id="supplier_id">
                                                                <SelectValue placeholder="Sélectionner un fournisseur" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {suppliers.map((s) => (
                                                                    <SelectItem key={s.id} value={s.id}>
                                                                        {s.name} ({s.code})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <input type="hidden" name="supplier_id" value={supplierId} />
                                                        <InputError message={errors.supplier_id} />
                                                    </div>
                                                )}

                                                {isWarehouseToWarehouse && (
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
                                                )}

                                                <div className="grid gap-2">
                                                    <Label htmlFor="destination_warehouse_id">
                                                        Entrepôt destination <span className="text-destructive">*</span>
                                                    </Label>
                                                    <Select value={destId} onValueChange={setDestId}>
                                                        <SelectTrigger id="destination_warehouse_id">
                                                            <SelectValue placeholder="Destination" />
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

                                            <Separator />

                                            {/* Transport details */}
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="driver_name">Nom du chauffeur</Label>
                                                    <Input
                                                        id="driver_name"
                                                        name="driver_name"
                                                        value={driverName}
                                                        onChange={(e) => setDriverName(e.target.value)}
                                                        placeholder="Nom du chauffeur"
                                                    />
                                                    <InputError message={errors.driver_name} />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="driver_phone">Téléphone du chauffeur</Label>
                                                    <Input
                                                        id="driver_phone"
                                                        name="driver_phone"
                                                        value={driverPhone}
                                                        onChange={(e) => setDriverPhone(e.target.value)}
                                                        placeholder="Numéro de téléphone"
                                                    />
                                                    <InputError message={errors.driver_phone} />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id="company_bears_costs"
                                                    checked={companyBearsCosts}
                                                    onCheckedChange={(v) => setCompanyBearsCosts(v === true)}
                                                />
                                                <Label htmlFor="company_bears_costs" className="font-normal">
                                                    L'entreprise prend en charge les frais de transport
                                                </Label>
                                                <input type="hidden" name="company_bears_costs" value={companyBearsCosts ? '1' : '0'} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Logistic charges */}
                                {companyBearsCosts && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center justify-between text-base">
                                                <span className="flex items-center gap-2">
                                                    <CircleDollarSign className="size-4" />
                                                    Frais logistiques ({charges.length})
                                                </span>
                                                <Button type="button" variant="outline" size="sm" onClick={addCharge}>
                                                    <Plus className="size-4" />
                                                    Ajouter
                                                </Button>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {charges.length === 0 && (
                                                <p className="text-sm text-muted-foreground text-center py-4">
                                                    Aucun frais ajouté. Cliquez sur « Ajouter » pour enregistrer des frais logistiques.
                                                </p>
                                            )}
                                            {charges.map((charge, idx) => (
                                                <div key={charge.key} className="flex items-end gap-3 rounded-lg border bg-muted/20 p-3">
                                                    <div className="grid flex-1 gap-2">
                                                        <Label htmlFor={`charge-${idx}-label`}>Libellé</Label>
                                                        <Input
                                                            id={`charge-${idx}-label`}
                                                            name={`charges[${idx}][label]`}
                                                            value={charge.label}
                                                            onChange={(e) => updateCharge(charge.key, 'label', e.target.value)}
                                                            placeholder="Ex: Carburant Cotonou-Parakou"
                                                        />
                                                    </div>
                                                    <div className="grid w-40 gap-2">
                                                        <Label htmlFor={`charge-${idx}-type`}>Type</Label>
                                                        <Select value={charge.type} onValueChange={(v) => updateCharge(charge.key, 'type', v)}>
                                                            <SelectTrigger id={`charge-${idx}-type`}>
                                                                <SelectValue placeholder="Type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {(chargeTypes ?? []).map((ct) => (
                                                                    <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <input type="hidden" name={`charges[${idx}][type]`} value={charge.type} />
                                                    </div>
                                                    <div className="grid w-28 gap-2">
                                                        <Label htmlFor={`charge-${idx}-amount`}>Montant</Label>
                                                        <Input
                                                            id={`charge-${idx}-amount`}
                                                            name={`charges[${idx}][amount]`}
                                                            type="number"
                                                            min="0"
                                                            value={charge.amount}
                                                            onChange={(e) => updateCharge(charge.key, 'amount', e.target.value)}
                                                        />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="mb-0.5 size-9 shrink-0 text-destructive hover:text-destructive"
                                                        onClick={() => removeCharge(charge.key)}
                                                    >
                                                        <MinusCircle className="size-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                )}

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between text-base">
                                            <span className="flex items-center gap-2">
                                                <Package className="size-4" />
                                                Articles ({items.length})
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <CreateProductModal categories={categories} onProductCreated={handleProductCreated} />
                                                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                                    <Plus className="size-4" />
                                                    Ajouter
                                                </Button>
                                            </div>
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
                                <input type="hidden" name="is_draft" value={isDraft ? '1' : '0'} />
                                <Button
                                    type="submit"
                                    variant="secondary"
                                    disabled={processing}
                                    onClick={() => setIsDraft(true)}
                                >
                                    <Save className="size-4" />
                                    {processing && isDraft ? 'Enregistrement…' : 'Sauvegarder brouillon'}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing || !type}
                                    onClick={() => setIsDraft(false)}
                                >
                                    {processing && !isDraft ? 'Enregistrement…' : 'Soumettre la demande'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
