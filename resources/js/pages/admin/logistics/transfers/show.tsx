import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Calendar, Check, Hash, Package, Replace, Ship, Truck, User, Warehouse as WarehouseIcon, X } from 'lucide-react';
import { useState } from 'react';
import { index as transfersIndex, approve, ship, deliver, reject } from '@/actions/App/Http/Controllers/Admin/Logistics/TransferController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Item = {
    id: string;
    quantity_requested: number;
    quantity_delivered: number | null;
    product: { id: string; name: string; code: string };
};

type Transfer = {
    id: string;
    reference: string;
    type: 'warehouse_to_shop' | 'warehouse_to_warehouse';
    status: string;
    notes: string | null;
    approved_at: string | null;
    shipped_at: string | null;
    delivered_at: string | null;
    source_warehouse: { id: string; name: string; code: string } | null;
    destination_warehouse: { id: string; name: string; code: string } | null;
    destination_shop: { id: string; name: string; code: string } | null;
    vehicle: { id: string; name: string; registration_number: string } | null;
    approved_by: { id: string; name: string } | null;
    created_by: { id: string; name: string } | null;
    items: Item[];
    created_at: string;
    updated_at: string;
};

const typeLabels: Record<string, string> = {
    warehouse_to_shop: 'Entrepôt → Magasin',
    warehouse_to_warehouse: 'Entrepôt → Entrepôt',
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'En attente', variant: 'outline' },
    approved: { label: 'Approuvé', variant: 'default' },
    in_transit: { label: 'En transit', variant: 'secondary' },
    delivered: { label: 'Livré', variant: 'default' },
    rejected: { label: 'Rejeté', variant: 'destructive' },
    cancelled: { label: 'Annulé', variant: 'secondary' },
};

export default function TransferShow({ transfer }: { transfer: Transfer }) {
    const [confirmAction, setConfirmAction] = useState<'approve' | 'ship' | 'deliver' | 'reject' | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Transferts', href: transfersIndex().url },
        { title: transfer.reference, href: '#' },
    ];

    const status = statusConfig[transfer.status] ?? { label: transfer.status, variant: 'outline' as const };

    const destination =
        transfer.type === 'warehouse_to_shop'
            ? transfer.destination_shop
            : transfer.destination_warehouse;

    const destinationLabel = transfer.type === 'warehouse_to_shop' ? 'Magasin' : 'Entrepôt';

    function handleAction() {
        if (!confirmAction) return;
        setIsProcessing(true);

        const actions = {
            approve: approve(transfer.id).url,
            ship: ship(transfer.id).url,
            deliver: deliver(transfer.id).url,
            reject: reject(transfer.id).url,
        };

        router.post(actions[confirmAction], {}, {
            onFinish: () => {
                setIsProcessing(false);
                setConfirmAction(null);
            },
        });
    }

    const actionLabels = {
        approve: { title: 'Approuver le transfert', description: 'Cette action approuvera le transfert.', button: 'Approuver', variant: 'default' as const },
        ship: { title: 'Expédier le transfert', description: 'Le transfert sera marqué comme en transit.', button: 'Expédier', variant: 'default' as const },
        deliver: { title: 'Marquer comme livré', description: 'Les stocks seront automatiquement mis à jour.', button: 'Livrer', variant: 'default' as const },
        reject: { title: 'Rejeter le transfert', description: 'Ce transfert sera rejeté et ne pourra plus être traité.', button: 'Rejeter', variant: 'destructive' as const },
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={transfer.reference} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="ghost" size="icon" className="size-8">
                            <a href={transfersIndex().url}>
                                <ArrowLeft className="size-4" />
                                <span className="sr-only">Retour</span>
                            </a>
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="flex size-12 items-center justify-center rounded-lg border bg-muted">
                                <Replace className="size-5 text-muted-foreground" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold">{transfer.reference}</h1>
                                <div className="flex items-center gap-2">
                                    <Badge variant={status.variant}>{status.label}</Badge>
                                    <Badge variant="outline">{typeLabels[transfer.type] ?? transfer.type}</Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {transfer.status === 'pending' && (
                            <>
                                <Button variant="outline" size="sm" onClick={() => setConfirmAction('approve')}>
                                    <Check className="size-4" />
                                    Approuver
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => setConfirmAction('reject')}>
                                    <X className="size-4" />
                                    Rejeter
                                </Button>
                            </>
                        )}
                        {transfer.status === 'approved' && (
                            <Button size="sm" onClick={() => setConfirmAction('ship')}>
                                <Ship className="size-4" />
                                Expédier
                            </Button>
                        )}
                        {transfer.status === 'in_transit' && (
                            <Button size="sm" onClick={() => setConfirmAction('deliver')}>
                                <Truck className="size-4" />
                                Livré
                            </Button>
                        )}
                    </div>
                </div>

                <Separator />

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        {/* Source / Destination */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <WarehouseIcon className="size-4" />
                                    Itinéraire
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 rounded-lg border bg-muted/30 p-4 text-center">
                                        <p className="text-xs text-muted-foreground">Source</p>
                                        <p className="mt-1 font-semibold">{transfer.source_warehouse?.name ?? '—'}</p>
                                        {transfer.source_warehouse && (
                                            <p className="text-xs text-muted-foreground">{transfer.source_warehouse.code}</p>
                                        )}
                                    </div>
                                    <Truck className="size-5 shrink-0 text-muted-foreground" />
                                    <div className="flex-1 rounded-lg border bg-muted/30 p-4 text-center">
                                        <p className="text-xs text-muted-foreground">{destinationLabel}</p>
                                        <p className="mt-1 font-semibold">{destination?.name ?? '—'}</p>
                                        {destination && (
                                            <p className="text-xs text-muted-foreground">{destination.code}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Hash className="size-4" />
                                    Informations
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Type</span>
                                    <Badge variant="outline">{typeLabels[transfer.type] ?? transfer.type}</Badge>
                                </div>
                                {transfer.vehicle && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Véhicule</span>
                                        <span className="font-medium">{transfer.vehicle.name} ({transfer.vehicle.registration_number})</span>
                                    </div>
                                )}
                                {transfer.notes && (
                                    <div className="pt-2">
                                        <p className="text-xs font-medium text-muted-foreground">Notes</p>
                                        <p className="mt-1 text-sm">{transfer.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Items */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Package className="size-4" />
                                    Articles ({transfer.items.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground">
                                                <th className="pb-2 font-medium">Produit</th>
                                                <th className="pb-2 font-medium">Code</th>
                                                <th className="pb-2 text-right font-medium">Demandé</th>
                                                <th className="pb-2 text-right font-medium">Livré</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transfer.items.map((item) => (
                                                <tr key={item.id} className="border-b last:border-0">
                                                    <td className="py-2.5 font-medium">{item.product.name}</td>
                                                    <td className="py-2.5 text-muted-foreground">{item.product.code}</td>
                                                    <td className="py-2.5 text-right font-semibold">{item.quantity_requested}</td>
                                                    <td className="py-2.5 text-right">
                                                        {item.quantity_delivered !== null ? (
                                                            <span className="font-semibold text-primary">{item.quantity_delivered}</span>
                                                        ) : (
                                                            <span className="text-muted-foreground">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Calendar className="size-4" />
                                    Suivi
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="ml-3 space-y-4 border-l-2 border-muted pl-4">
                                    <div>
                                        <p className="text-sm font-medium">Créé</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(transfer.created_at).toLocaleDateString('fr-FR', {
                                                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                                            })}
                                        </p>
                                        {transfer.created_by && (
                                            <p className="text-xs text-muted-foreground">par {transfer.created_by.name}</p>
                                        )}
                                    </div>
                                    {transfer.approved_at && (
                                        <div>
                                            <p className="text-sm font-medium">Approuvé</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(transfer.approved_at).toLocaleDateString('fr-FR', {
                                                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                                                })}
                                            </p>
                                            {transfer.approved_by && (
                                                <p className="text-xs text-muted-foreground">par {transfer.approved_by.name}</p>
                                            )}
                                        </div>
                                    )}
                                    {transfer.shipped_at && (
                                        <div>
                                            <p className="text-sm font-medium">Expédié</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(transfer.shipped_at).toLocaleDateString('fr-FR', {
                                                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    )}
                                    {transfer.delivered_at && (
                                        <div>
                                            <p className="text-sm font-medium">Livré</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(transfer.delivered_at).toLocaleDateString('fr-FR', {
                                                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    )}
                                    {transfer.status === 'rejected' && (
                                        <div>
                                            <p className="text-sm font-medium text-destructive">Rejeté</p>
                                        </div>
                                    )}
                                    {transfer.status === 'cancelled' && (
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Annulé</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <User className="size-4" />
                                    Détails
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {transfer.created_by && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <User className="size-3.5" />
                                        <span>Créé par {transfer.created_by.name}</span>
                                    </div>
                                )}
                                {transfer.approved_by && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Check className="size-3.5" />
                                        <span>Approuvé par {transfer.approved_by.name}</span>
                                    </div>
                                )}
                                {transfer.vehicle && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Truck className="size-3.5" />
                                        <span>{transfer.vehicle.name}</span>
                                    </div>
                                )}
                                <div className="text-muted-foreground">
                                    Créé le {new Date(transfer.created_at).toLocaleDateString('fr-FR')}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Confirm action dialog */}
            {confirmAction && (
                <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{actionLabels[confirmAction].title}</DialogTitle>
                            <DialogDescription>{actionLabels[confirmAction].description}</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={isProcessing}>
                                Annuler
                            </Button>
                            <Button
                                variant={actionLabels[confirmAction].variant}
                                onClick={handleAction}
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Traitement…' : actionLabels[confirmAction].button}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </AppLayout>
    );
}
