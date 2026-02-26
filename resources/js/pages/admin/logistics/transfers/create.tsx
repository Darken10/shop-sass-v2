import { Form, Head } from '@inertiajs/react';
import { ArrowLeft, CircleDollarSign, MinusCircle, Package, Plus, Replace, Save, Truck } from 'lucide-react';
import { useState } from 'react';
import TransferController, { index as transfersIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/TransferController';
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
type Shop = { id: string; name: string; code: string };
type Product = { id: string; name: string; code: string };
type Vehicle = { id: string; name: string; registration_number: string };
type ChargeType = { value: string; label: string };

type Props = {
    warehouses: Warehouse[];
    shops: Shop[];
    products: Product[];
    vehicles: Vehicle[];
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
    { title: 'Transferts', href: transfersIndex().url },
    { title: 'Nouveau transfert', href: '#' },
];

let nextKey = 1;
let nextChargeKey = 1;

export default function TransfersCreate({ warehouses, shops, products, vehicles, chargeTypes }: Props) {
    const [type, setType] = useState('');
    const [sourceWarehouseId, setSourceWarehouseId] = useState('');
    const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
    const [destinationShopId, setDestinationShopId] = useState('');
    const [vehicleId, setVehicleId] = useState('');
    const [driverName, setDriverName] = useState('');
    const [driverPhone, setDriverPhone] = useState('');
    const [companyBearsCosts, setCompanyBearsCosts] = useState(false);
    const [items, setItems] = useState<ItemRow[]>([{ key: nextKey++, product_id: '', quantity_requested: '1' }]);
    const [charges, setCharges] = useState<ChargeRow[]>([]);
    const [isDraft, setIsDraft] = useState(false);

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouveau transfert" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="size-8">
                        <a href={transfersIndex().url}>
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Retour</span>
                        </a>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Nouveau transfert</h1>
                        <p className="text-sm text-muted-foreground">Transférez des produits entre entrepôts ou vers un magasin</p>
                    </div>
                </div>

                <Separator />

                <Form {...TransferController.store.form()}>
                    {({ processing, errors }) => (
                        <>
                            <div className="mx-auto w-full max-w-2xl space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Replace className="size-4" />
                                            Détails du transfert
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="type">
                                                Type de transfert <span className="text-destructive">*</span>
                                            </Label>
                                            <Select value={type} onValueChange={(v) => { setType(v); setDestinationWarehouseId(''); setDestinationShopId(''); }}>
                                                <SelectTrigger id="type">
                                                    <SelectValue placeholder="Sélectionner un type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="warehouse_to_shop">Entrepôt → Magasin</SelectItem>
                                                    <SelectItem value="warehouse_to_warehouse">Entrepôt → Entrepôt</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <input type="hidden" name="type" value={type} />
                                            <InputError message={errors.type} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="source_warehouse_id">
                                                    Entrepôt source <span className="text-destructive">*</span>
                                                </Label>
                                                <Select value={sourceWarehouseId} onValueChange={setSourceWarehouseId}>
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
                                                <input type="hidden" name="source_warehouse_id" value={sourceWarehouseId} />
                                                <InputError message={errors.source_warehouse_id} />
                                            </div>

                                            {type === 'warehouse_to_warehouse' && (
                                                <div className="grid gap-2">
                                                    <Label htmlFor="destination_warehouse_id">
                                                        Entrepôt destination <span className="text-destructive">*</span>
                                                    </Label>
                                                    <Select value={destinationWarehouseId} onValueChange={setDestinationWarehouseId}>
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
                                                    <input type="hidden" name="destination_warehouse_id" value={destinationWarehouseId} />
                                                    <InputError message={errors.destination_warehouse_id} />
                                                </div>
                                            )}

                                            {type === 'warehouse_to_shop' && (
                                                <div className="grid gap-2">
                                                    <Label htmlFor="destination_shop_id">
                                                        Magasin destination <span className="text-destructive">*</span>
                                                    </Label>
                                                    <Select value={destinationShopId} onValueChange={setDestinationShopId}>
                                                        <SelectTrigger id="destination_shop_id">
                                                            <SelectValue placeholder="Magasin" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {shops.map((shop) => (
                                                                <SelectItem key={shop.id} value={shop.id}>
                                                                    {shop.name} ({shop.code})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <input type="hidden" name="destination_shop_id" value={destinationShopId} />
                                                    <InputError message={errors.destination_shop_id} />
                                                </div>
                                            )}
                                        </div>

                                        {(vehicles?.length ?? 0) > 0 && (
                                            <div className="grid gap-2">
                                                <Label htmlFor="vehicle_id">Véhicule</Label>
                                                <Select value={vehicleId || undefined} onValueChange={setVehicleId}>
                                                    <SelectTrigger id="vehicle_id">
                                                        <SelectValue placeholder="Sélectionner un véhicule (optionnel)" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {vehicles.map((v) => (
                                                            <SelectItem key={v.id} value={v.id}>
                                                                {v.name} ({v.registration_number})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {vehicleId && <input type="hidden" name="vehicle_id" value={vehicleId} />}
                                                <InputError message={errors.vehicle_id} />
                                            </div>
                                        )}

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
                                        <div className="grid grid-cols-2 gap-4">
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
                                                Produits à transférer ({items.length})
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
                                                <div className="grid flex-1 gap-2">
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
                                                <div className="grid w-28 gap-2">
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
                                    <a href={transfersIndex().url}>Annuler</a>
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
                                    disabled={processing}
                                    onClick={() => setIsDraft(false)}
                                >
                                    {processing && !isDraft ? 'Enregistrement…' : 'Créer le transfert'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
