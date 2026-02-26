import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Check,
    CheckCircle2,
    Hash,
    Package,
    PackageCheck,
    Truck,
    Warehouse as WarehouseIcon,
} from 'lucide-react';
import { useState } from 'react';
import { show as requestShow, receive } from '@/actions/App/Http/Controllers/Admin/Logistics/SupplyRequestController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Item = {
    id: string;
    quantity_requested: number;
    quantity_delivered: number | null;
    product: { id: string; name: string; code: string };
};

type SupplyRequest = {
    id: string;
    reference: string;
    type: string;
    status: string;
    source_warehouse: { id: string; name: string; code: string } | null;
    destination_warehouse: { id: string; name: string; code: string } | null;
    supplier: { id: string; name: string; code: string } | null;
    items: Item[];
    created_by: { id: string; name: string } | null;
};

type ReceiveItem = {
    item_id: string;
    quantity_received: string;
    discrepancy_note: string;
    validated: boolean;
};

const typeLabels: Record<string, string> = {
    supplier_to_warehouse: 'Fournisseur → Entrepôt',
    warehouse_to_warehouse: 'Entrepôt → Entrepôt',
};

export default function SupplyRequestReceive({ supplyRequest }: { supplyRequest: SupplyRequest }) {
    const [receiveItems, setReceiveItems] = useState<ReceiveItem[]>(
        supplyRequest.items.map((item) => ({
            item_id: item.id,
            quantity_received: String(item.quantity_delivered ?? item.quantity_requested),
            discrepancy_note: '',
            validated: false,
        })),
    );
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentItemIndex, setCurrentItemIndex] = useState(0);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Approvisionnements', href: '/admin/logistics/supply-requests' },
        { title: supplyRequest.reference, href: requestShow(supplyRequest.id).url },
        { title: 'Réception', href: '#' },
    ];

    const source =
        supplyRequest.type === 'supplier_to_warehouse'
            ? supplyRequest.supplier
            : supplyRequest.source_warehouse;
    const sourceLabel = supplyRequest.type === 'supplier_to_warehouse' ? 'Fournisseur' : 'Entrepôt source';

    const validatedCount = receiveItems.filter((ri) => ri.validated).length;
    const totalItems = receiveItems.length;
    const allValidated = validatedCount === totalItems;

    function getItemDiscrepancy(ri: ReceiveItem, item: Item): boolean {
        const delivered = item.quantity_delivered ?? item.quantity_requested;
        return parseInt(ri.quantity_received) !== delivered;
    }

    function validateItem(index: number) {
        const ri = receiveItems[index];
        const item = supplyRequest.items.find((i) => i.id === ri.item_id);
        if (!item) return;

        const newErrors = { ...errors };
        delete newErrors[`items.${index}.quantity_received`];
        delete newErrors[`items.${index}.discrepancy_note`];

        const qty = parseInt(ri.quantity_received);
        if (isNaN(qty) || qty < 0) {
            newErrors[`items.${index}.quantity_received`] = 'La quantité doit être un nombre positif.';
            setErrors(newErrors);
            return;
        }

        const delivered = item.quantity_delivered ?? item.quantity_requested;
        if (qty !== delivered && !ri.discrepancy_note.trim()) {
            newErrors[`items.${index}.discrepancy_note`] = "Explication requise pour l'écart de quantité.";
            setErrors(newErrors);
            return;
        }

        setErrors(newErrors);
        setReceiveItems((prev) =>
            prev.map((r, i) => (i === index ? { ...r, validated: true } : r)),
        );

        // Move to next non-validated item
        if (index < totalItems - 1) {
            const nextUnvalidated = receiveItems.findIndex((r, i) => i > index && !r.validated);
            if (nextUnvalidated !== -1) {
                setCurrentItemIndex(nextUnvalidated);
            }
        }
    }

    function unvalidateItem(index: number) {
        setReceiveItems((prev) =>
            prev.map((r, i) => (i === index ? { ...r, validated: false } : r)),
        );
        setCurrentItemIndex(index);
    }

    function updateItem(index: number, field: 'quantity_received' | 'discrepancy_note', value: string) {
        setReceiveItems((prev) =>
            prev.map((r, i) => (i === index ? { ...r, [field]: value, validated: false } : r)),
        );
        const newErrors = { ...errors };
        delete newErrors[`items.${index}.quantity_received`];
        delete newErrors[`items.${index}.discrepancy_note`];
        setErrors(newErrors);
    }

    function handleSubmit() {
        if (!allValidated) return;

        setIsProcessing(true);
        router.post(
            receive(supplyRequest.id).url,
            {
                items: receiveItems.map((ri) => ({
                    item_id: ri.item_id,
                    quantity_received: parseInt(ri.quantity_received),
                    discrepancy_note: ri.discrepancy_note || null,
                })),
            },
            {
                onFinish: () => setIsProcessing(false),
                onError: (serverErrors) => {
                    setErrors(serverErrors as Record<string, string>);
                    const errorIndexes = Object.keys(serverErrors)
                        .filter((key) => key.startsWith('items.'))
                        .map((key) => parseInt(key.split('.')[1]));
                    if (errorIndexes.length > 0) {
                        setReceiveItems((prev) =>
                            prev.map((r, i) => (errorIndexes.includes(i) ? { ...r, validated: false } : r)),
                        );
                        setCurrentItemIndex(errorIndexes[0]);
                    }
                },
            },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Réception — ${supplyRequest.reference}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="ghost" size="icon" className="size-8">
                            <a href={requestShow(supplyRequest.id).url}>
                                <ArrowLeft className="size-4" />
                                <span className="sr-only">Retour</span>
                            </a>
                        </Button>
                        <div>
                            <h1 className="text-xl font-semibold">Accusé de réception</h1>
                            <p className="text-sm text-muted-foreground">
                                Approvisionnement {supplyRequest.reference} — Validez chaque produit un par un
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">{validatedCount}</span> / {totalItems} validés
                        </div>
                        <Button onClick={handleSubmit} disabled={!allValidated || isProcessing}>
                            <PackageCheck className="size-4" />
                            {isProcessing ? 'Traitement…' : 'Confirmer la réception'}
                        </Button>
                    </div>
                </div>

                <Separator />

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main content - item cards */}
                    <div className="space-y-4 lg:col-span-2">
                        {/* Progress bar */}
                        <div className="rounded-lg border bg-muted/30 p-4">
                            <div className="mb-2 flex items-center justify-between text-sm">
                                <span className="font-medium">Progression de la réception</span>
                                <span className="text-muted-foreground">{Math.round((validatedCount / totalItems) * 100)}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-primary transition-all duration-300"
                                    style={{ width: `${(validatedCount / totalItems) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Item cards */}
                        {supplyRequest.items.map((item, index) => {
                            const ri = receiveItems[index];
                            if (!ri) return null;
                            const delivered = item.quantity_delivered ?? item.quantity_requested;
                            const hasDiscrepancy = getItemDiscrepancy(ri, item);
                            const isActive = currentItemIndex === index;
                            const isValidated = ri.validated;

                            return (
                                <Card
                                    key={item.id}
                                    className={`transition-all ${
                                        isValidated
                                            ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/10'
                                            : isActive
                                              ? 'border-primary ring-1 ring-primary/20'
                                              : 'opacity-75'
                                    }`}
                                    onClick={() => {
                                        if (!isValidated) setCurrentItemIndex(index);
                                    }}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`flex size-8 items-center justify-center rounded-full text-sm font-bold ${
                                                        isValidated
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    {isValidated ? <Check className="size-4" /> : index + 1}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base">{item.product.name}</CardTitle>
                                                    <CardDescription>{item.product.code}</CardDescription>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">
                                                    Demandé : {item.quantity_requested}
                                                </Badge>
                                                <Badge variant="secondary">
                                                    Expédié : {delivered}
                                                </Badge>
                                                {isValidated && (
                                                    <Badge
                                                        variant={hasDiscrepancy ? 'destructive' : 'default'}
                                                        className={!hasDiscrepancy ? 'bg-green-500' : ''}
                                                    >
                                                        Reçu : {ri.quantity_received}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>

                                    {!isValidated && (isActive || (!isActive && !isValidated)) && (
                                        <CardContent className="space-y-4">
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor={`qty-${item.id}`}>Quantité reçue</Label>
                                                    <Input
                                                        id={`qty-${item.id}`}
                                                        type="number"
                                                        min={0}
                                                        value={ri.quantity_received}
                                                        onChange={(e) => updateItem(index, 'quantity_received', e.target.value)}
                                                        className={errors[`items.${index}.quantity_received`] ? 'border-destructive' : ''}
                                                        autoFocus={isActive}
                                                    />
                                                    {errors[`items.${index}.quantity_received`] && (
                                                        <p className="text-xs text-destructive">{errors[`items.${index}.quantity_received`]}</p>
                                                    )}
                                                </div>

                                                <div className="flex items-end">
                                                    <div className="w-full rounded-lg border bg-muted/50 p-3 text-sm">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-muted-foreground">Écart</span>
                                                            {hasDiscrepancy ? (
                                                                <span className="flex items-center gap-1 font-semibold text-destructive">
                                                                    <AlertTriangle className="size-3" />
                                                                    {parseInt(ri.quantity_received) - delivered}
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1 font-semibold text-green-600">
                                                                    <CheckCircle2 className="size-3" />
                                                                    Conforme
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {hasDiscrepancy && (
                                                <div className="space-y-2">
                                                    <Label htmlFor={`note-${item.id}`} className="flex items-center gap-1 text-destructive">
                                                        <AlertTriangle className="size-3" />
                                                        Explication de l'écart (obligatoire)
                                                    </Label>
                                                    <Textarea
                                                        id={`note-${item.id}`}
                                                        placeholder="Décrivez la raison de la différence entre la quantité expédiée et la quantité reçue…"
                                                        value={ri.discrepancy_note}
                                                        onChange={(e) => updateItem(index, 'discrepancy_note', e.target.value)}
                                                        rows={3}
                                                        className={errors[`items.${index}.discrepancy_note`] ? 'border-destructive' : ''}
                                                    />
                                                    {errors[`items.${index}.discrepancy_note`] && (
                                                        <p className="text-xs text-destructive">{errors[`items.${index}.discrepancy_note`]}</p>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex justify-end">
                                                <Button size="sm" onClick={() => validateItem(index)}>
                                                    <Check className="size-4" />
                                                    Valider ce produit
                                                </Button>
                                            </div>
                                        </CardContent>
                                    )}

                                    {isValidated && (
                                        <CardContent className="pt-0">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-sm text-green-600">
                                                    <CheckCircle2 className="size-4" />
                                                    Produit validé
                                                    {ri.discrepancy_note && (
                                                        <span className="text-muted-foreground">— {ri.discrepancy_note}</span>
                                                    )}
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => unvalidateItem(index)}>
                                                    Modifier
                                                </Button>
                                            </div>
                                        </CardContent>
                                    )}
                                </Card>
                            );
                        })}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Supply request context */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Hash className="size-4" />
                                    Détails de l'approvisionnement
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Référence</span>
                                    <span className="font-medium">{supplyRequest.reference}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Type</span>
                                    <Badge variant="outline">{typeLabels[supplyRequest.type] ?? supplyRequest.type}</Badge>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <WarehouseIcon className="size-3.5" />
                                        <span>{sourceLabel} : <strong>{source?.name ?? '—'}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Package className="size-3.5" />
                                        <span>Destination : <strong>{supplyRequest.destination_warehouse?.name ?? '—'}</strong></span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recap */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <PackageCheck className="size-4" />
                                    Récapitulatif
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                {receiveItems.map((ri, index) => {
                                    const item = supplyRequest.items[index];
                                    if (!item) return null;
                                    const delivered = item.quantity_delivered ?? item.quantity_requested;
                                    const hasDiscrepancy = getItemDiscrepancy(ri, item);

                                    return (
                                        <div
                                            key={ri.item_id}
                                            className={`flex items-center justify-between rounded-md px-2 py-1.5 ${
                                                ri.validated
                                                    ? hasDiscrepancy
                                                        ? 'bg-amber-50 dark:bg-amber-950/10'
                                                        : 'bg-green-50 dark:bg-green-950/10'
                                                    : 'bg-muted/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {ri.validated ? (
                                                    hasDiscrepancy ? (
                                                        <AlertTriangle className="size-3.5 text-amber-500" />
                                                    ) : (
                                                        <CheckCircle2 className="size-3.5 text-green-500" />
                                                    )
                                                ) : (
                                                    <div className="size-3.5 rounded-full border" />
                                                )}
                                                <span className="truncate">{item.product.name}</span>
                                            </div>
                                            {ri.validated && (
                                                <span className={`text-xs font-medium ${hasDiscrepancy ? 'text-amber-600' : 'text-green-600'}`}>
                                                    {ri.quantity_received} / {delivered}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        {/* Route info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Truck className="size-4" />
                                    Itinéraire
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 rounded-lg border bg-muted/30 p-3 text-center">
                                        <p className="text-[10px] text-muted-foreground">{sourceLabel}</p>
                                        <p className="text-xs font-semibold">{source?.name ?? '—'}</p>
                                    </div>
                                    <Truck className="size-4 shrink-0 text-muted-foreground" />
                                    <div className="flex-1 rounded-lg border bg-muted/30 p-3 text-center">
                                        <p className="text-[10px] text-muted-foreground">Destination</p>
                                        <p className="text-xs font-semibold">{supplyRequest.destination_warehouse?.name ?? '—'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
