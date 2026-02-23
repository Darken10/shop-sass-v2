import { Head } from '@inertiajs/react';
import { ArrowLeft, ArrowLeftRight, Banknote, Hash, User, Warehouse as WarehouseIcon } from 'lucide-react';
import { index as movementsIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/StockMovementController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Movement = {
    id: string;
    reference: string;
    type: string;
    quantity: number;
    reason: string | null;
    notes: string | null;
    product: { id: string; name: string; code: string };
    source_warehouse: { id: string; name: string; code: string } | null;
    destination_warehouse: { id: string; name: string; code: string } | null;
    created_by: { id: string; name: string } | null;
    fuel_logs: { id: string; quantity_liters: number; cost: string; fueled_at: string }[];
    logistic_charges: { id: string; label: string; type: string; amount: string }[];
    created_at: string;
    updated_at: string;
};

const typeConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    purchase_entry: { label: 'Entrée achat', variant: 'default' },
    supplier_return: { label: 'Retour fournisseur', variant: 'destructive' },
    store_transfer: { label: 'Transfert magasin', variant: 'secondary' },
    loss: { label: 'Perte', variant: 'destructive' },
    internal_transfer: { label: 'Transfert interne', variant: 'outline' },
    adjustment: { label: 'Ajustement', variant: 'secondary' },
};

const chargeTypeLabels: Record<string, string> = {
    fuel: 'Carburant',
    handling: 'Manutention',
    loading: 'Chargement',
    unloading: 'Déchargement',
    toll: 'Péage',
    packaging: 'Emballage',
    insurance: 'Assurance',
    other: 'Autre',
};

export default function MovementShow({ movement }: { movement: Movement }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Mouvements', href: movementsIndex().url },
        { title: movement.reference, href: '#' },
    ];

    const type = typeConfig[movement.type] ?? { label: movement.type, variant: 'outline' as const };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={movement.reference} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="ghost" size="icon" className="size-8">
                            <a href={movementsIndex().url}>
                                <ArrowLeft className="size-4" />
                                <span className="sr-only">Retour</span>
                            </a>
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="flex size-12 items-center justify-center rounded-lg border bg-muted">
                                <ArrowLeftRight className="size-5 text-muted-foreground" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold">{movement.reference}</h1>
                                <div className="flex items-center gap-2">
                                    <Badge variant={type.variant}>{type.label}</Badge>
                                    <span className="text-sm text-muted-foreground">{movement.product.name}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <ArrowLeftRight className="size-4" />
                                    Détails du mouvement
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Produit</p>
                                        <p className="font-semibold">{movement.product.name}</p>
                                        <p className="text-xs text-muted-foreground">{movement.product.code}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Quantité</p>
                                        <p className="text-lg font-bold text-primary">{movement.quantity}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Type</p>
                                        <Badge variant={type.variant}>{type.label}</Badge>
                                    </div>
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
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 rounded-lg border bg-muted/30 p-4 text-center">
                                        <p className="text-xs text-muted-foreground">Source</p>
                                        <p className="mt-1 font-semibold">
                                            {movement.source_warehouse?.name ?? '—'}
                                        </p>
                                        {movement.source_warehouse && (
                                            <p className="text-xs text-muted-foreground">{movement.source_warehouse.code}</p>
                                        )}
                                    </div>
                                    <ArrowLeftRight className="size-5 shrink-0 text-muted-foreground" />
                                    <div className="flex-1 rounded-lg border bg-muted/30 p-4 text-center">
                                        <p className="text-xs text-muted-foreground">Destination</p>
                                        <p className="mt-1 font-semibold">
                                            {movement.destination_warehouse?.name ?? '—'}
                                        </p>
                                        {movement.destination_warehouse && (
                                            <p className="text-xs text-muted-foreground">{movement.destination_warehouse.code}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {movement.reason && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Raison</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{movement.reason}</p>
                                </CardContent>
                            </Card>
                        )}

                        {movement.notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Notes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{movement.notes}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Logistic charges */}
                        {movement.logistic_charges.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Banknote className="size-4" />
                                        Charges logistiques ({movement.logistic_charges.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-left text-muted-foreground">
                                                    <th className="pb-2 font-medium">Libellé</th>
                                                    <th className="pb-2 font-medium">Type</th>
                                                    <th className="pb-2 text-right font-medium">Montant</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {movement.logistic_charges.map((charge) => (
                                                    <tr key={charge.id} className="border-b last:border-0">
                                                        <td className="py-2.5 font-medium">{charge.label}</td>
                                                        <td className="py-2.5">
                                                            <Badge variant="outline">
                                                                {chargeTypeLabels[charge.type] ?? charge.type}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-2.5 text-right font-semibold">
                                                            {Number(charge.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Hash className="size-4" />
                                    Détails
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {movement.created_by && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <User className="size-3.5" />
                                        <span>Créé par {movement.created_by.name}</span>
                                    </div>
                                )}
                                <div className="text-muted-foreground">
                                    Créé le {new Date(movement.created_at).toLocaleDateString('fr-FR')}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
