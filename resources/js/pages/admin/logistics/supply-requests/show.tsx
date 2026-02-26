import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Banknote,
    Calendar,
    Check,
    CircleDollarSign,
    ClipboardList,
    Hash,
    Package,
    PackageCheck,
    Send,
    Truck,
    User,
    Warehouse as WarehouseIcon,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { index as requestsIndex, approve, deliver, reject, submit, receiveForm } from '@/actions/App/Http/Controllers/Admin/Logistics/SupplyRequestController';
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
    quantity_received: number | null;
    discrepancy_note: string | null;
    product: { id: string; name: string; code: string };
};

type Charge = {
    id: string;
    label: string;
    type: string;
    amount: string;
    notes: string | null;
};

type Movement = {
    id: string;
    reference: string;
    type: string;
    quantity: number;
};

type SupplyRequest = {
    id: string;
    reference: string;
    status: string;
    type: string;
    notes: string | null;
    company_bears_costs: boolean;
    driver_name: string | null;
    driver_phone: string | null;
    source_warehouse: { id: string; name: string; code: string } | null;
    destination_warehouse: { id: string; name: string; code: string } | null;
    supplier: { id: string; name: string; code: string } | null;
    created_by: { id: string; name: string } | null;
    approved_by: { id: string; name: string } | null;
    received_by: { id: string; name: string } | null;
    approved_at: string | null;
    delivered_at: string | null;
    received_at: string | null;
    items: Item[];
    stock_movements: Movement[];
    logistic_charges: Charge[];
    created_at: string;
    updated_at: string;
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft: { label: 'Brouillon', variant: 'outline' },
    pending: { label: 'En attente', variant: 'outline' },
    approved: { label: 'Approuvée', variant: 'default' },
    in_transit: { label: 'En transit', variant: 'secondary' },
    delivered: { label: 'Livrée', variant: 'default' },
    received: { label: 'Réceptionnée', variant: 'default' },
    rejected: { label: 'Rejetée', variant: 'destructive' },
    cancelled: { label: 'Annulée', variant: 'secondary' },
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

export default function SupplyRequestShow({ supplyRequest }: { supplyRequest: SupplyRequest }) {
    const [confirmAction, setConfirmAction] = useState<'approve' | 'deliver' | 'reject' | 'submit' | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Approvisionnements', href: requestsIndex().url },
        { title: supplyRequest.reference, href: '#' },
    ];

    const status = statusConfig[supplyRequest.status] ?? { label: supplyRequest.status, variant: 'outline' as const };

    function handleAction() {
        if (!confirmAction) return;
        setIsProcessing(true);

        const actions: Record<string, string> = {
            approve: approve(supplyRequest.id).url,
            deliver: deliver(supplyRequest.id).url,
            reject: reject(supplyRequest.id).url,
            submit: submit(supplyRequest.id).url,
        };

        router.post(actions[confirmAction], {}, {
            onFinish: () => {
                setIsProcessing(false);
                setConfirmAction(null);
            },
        });
    }

    const actionLabels = {
        approve: { title: 'Approuver la demande', description: 'Cette action approuvera la demande d\'approvisionnement.', button: 'Approuver', variant: 'default' as const },
        deliver: { title: 'Marquer comme livrée', description: 'La demande sera marquée comme livrée à destination.', button: 'Livrer', variant: 'default' as const },
        reject: { title: 'Rejeter la demande', description: 'Cette demande sera rejetée et ne pourra plus être traitée.', button: 'Rejeter', variant: 'destructive' as const },
        submit: { title: 'Soumettre le brouillon', description: 'Le brouillon sera soumis pour approbation.', button: 'Soumettre', variant: 'default' as const },
    };

    const totalCharges = supplyRequest.logistic_charges.reduce((sum, c) => sum + Number(c.amount), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={supplyRequest.reference} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="ghost" size="icon" className="size-8">
                            <a href={requestsIndex().url}>
                                <ArrowLeft className="size-4" />
                                <span className="sr-only">Retour</span>
                            </a>
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="flex size-12 items-center justify-center rounded-lg border bg-muted">
                                <ClipboardList className="size-5 text-muted-foreground" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold">{supplyRequest.reference}</h1>
                                <div className="flex items-center gap-2">
                                    <Badge variant={status.variant}>{status.label}</Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {supplyRequest.status === 'draft' && (
                            <Button size="sm" onClick={() => setConfirmAction('submit')}>
                                <Send className="size-4" />
                                Soumettre
                            </Button>
                        )}
                        {supplyRequest.status === 'pending' && (
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
                        {supplyRequest.status === 'approved' && (
                            <Button size="sm" onClick={() => setConfirmAction('deliver')}>
                                <Truck className="size-4" />
                                Marquer livrée
                            </Button>
                        )}
                        {(supplyRequest.status === 'in_transit' || supplyRequest.status === 'delivered') && (
                            <Button size="sm" asChild>
                                <Link href={receiveForm(supplyRequest.id).url}>
                                    <PackageCheck className="size-4" />
                                    Réceptionner
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <Separator />

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        {/* Warehouses */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <WarehouseIcon className="size-4" />
                                    {supplyRequest.type === 'supplier_to_warehouse' ? 'Fournisseur → Entrepôt' : 'Entrepôts'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 rounded-lg border bg-muted/30 p-4 text-center">
                                        <p className="text-xs text-muted-foreground">
                                            {supplyRequest.type === 'supplier_to_warehouse' ? 'Fournisseur' : 'Source'}
                                        </p>
                                        <p className="mt-1 font-semibold">
                                            {supplyRequest.type === 'supplier_to_warehouse'
                                                ? (supplyRequest.supplier?.name ?? '—')
                                                : (supplyRequest.source_warehouse?.name ?? '—')}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {supplyRequest.type === 'supplier_to_warehouse'
                                                ? (supplyRequest.supplier?.code ?? '')
                                                : (supplyRequest.source_warehouse?.code ?? '')}
                                        </p>
                                    </div>
                                    <Truck className="size-5 shrink-0 text-muted-foreground" />
                                    <div className="flex-1 rounded-lg border bg-muted/30 p-4 text-center">
                                        <p className="text-xs text-muted-foreground">Destination</p>
                                        <p className="mt-1 font-semibold">
                                            {supplyRequest.destination_warehouse?.name ?? '—'}
                                        </p>
                                        {supplyRequest.destination_warehouse && (
                                            <p className="text-xs text-muted-foreground">{supplyRequest.destination_warehouse.code}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Items */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Package className="size-4" />
                                    Articles ({supplyRequest.items.length})
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
                                                <th className="pb-2 text-right font-medium">Reçu</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {supplyRequest.items.map((item) => {
                                                const delivered = item.quantity_delivered;
                                                const received = item.quantity_received;
                                                const hasDiscrepancy = received !== null && delivered !== null && received !== delivered;

                                                return (
                                                    <tr key={item.id} className="border-b last:border-0">
                                                        <td className="py-2.5 font-medium">{item.product.name}</td>
                                                        <td className="py-2.5 text-muted-foreground">{item.product.code}</td>
                                                        <td className="py-2.5 text-right font-semibold">{item.quantity_requested}</td>
                                                        <td className="py-2.5 text-right">
                                                            {delivered !== null ? (
                                                                <span className="font-semibold text-primary">{delivered}</span>
                                                            ) : (
                                                                <span className="text-muted-foreground">—</span>
                                                            )}
                                                        </td>
                                                        <td className="py-2.5 text-right">
                                                            {received !== null ? (
                                                                <span className={`font-semibold ${hasDiscrepancy ? 'text-destructive' : 'text-primary'}`}>
                                                                    {received}
                                                                    {hasDiscrepancy && <AlertTriangle className="ml-1 inline size-3" />}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Discrepancy notes */}
                                {supplyRequest.items.some((i) => i.discrepancy_note) && (
                                    <div className="mt-4 space-y-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                                        <p className="flex items-center gap-2 text-sm font-medium text-destructive">
                                            <AlertTriangle className="size-4" />
                                            Écarts signalés
                                        </p>
                                        {supplyRequest.items.filter((i) => i.discrepancy_note).map((item) => (
                                            <div key={item.id} className="text-sm">
                                                <span className="font-medium">{item.product.name} :</span>{' '}
                                                <span className="text-muted-foreground">{item.discrepancy_note}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {supplyRequest.notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Notes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{supplyRequest.notes}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Driver / Cost info */}
                        {(supplyRequest.driver_name || supplyRequest.company_bears_costs) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Hash className="size-4" />
                                        Informations transport
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    {supplyRequest.driver_name && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Chauffeur</span>
                                            <span className="font-medium">
                                                {supplyRequest.driver_name}
                                                {supplyRequest.driver_phone ? ` (${supplyRequest.driver_phone})` : ''}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Frais entreprise</span>
                                        <Badge variant={supplyRequest.company_bears_costs ? 'default' : 'outline'}>
                                            {supplyRequest.company_bears_costs ? 'Oui' : 'Non'}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Logistic charges */}
                        {supplyRequest.logistic_charges.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Banknote className="size-4" />
                                        Charges logistiques
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
                                                {supplyRequest.logistic_charges.map((charge) => (
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
                                                <tr className="font-bold">
                                                    <td className="pt-3" colSpan={2}>Total</td>
                                                    <td className="pt-3 text-right text-primary">
                                                        {totalCharges.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <ClipboardList className="size-4" />
                                    Suivi
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="ml-3 space-y-4 border-l-2 border-muted pl-4">
                                    <div>
                                        <p className="text-sm font-medium">Créée</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(supplyRequest.created_at).toLocaleDateString('fr-FR', {
                                                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                    {supplyRequest.approved_at && (
                                        <div>
                                            <p className="text-sm font-medium">Approuvée</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(supplyRequest.approved_at).toLocaleDateString('fr-FR', {
                                                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                                                })}
                                            </p>
                                            {supplyRequest.approved_by && (
                                                <p className="text-xs text-muted-foreground">par {supplyRequest.approved_by.name}</p>
                                            )}
                                        </div>
                                    )}
                                    {supplyRequest.delivered_at && (
                                        <div>
                                            <p className="text-sm font-medium">Livrée</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(supplyRequest.delivered_at).toLocaleDateString('fr-FR', {
                                                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    )}
                                    {supplyRequest.received_at && (
                                        <div>
                                            <p className="text-sm font-medium">Réceptionnée</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(supplyRequest.received_at).toLocaleDateString('fr-FR', {
                                                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                                                })}
                                            </p>
                                            {supplyRequest.received_by && (
                                                <p className="text-xs text-muted-foreground">par {supplyRequest.received_by.name}</p>
                                            )}
                                        </div>
                                    )}
                                    {supplyRequest.status === 'rejected' && (
                                        <div>
                                            <p className="text-sm font-medium text-destructive">Rejetée</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Hash className="size-4" />
                                    Détails
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {supplyRequest.created_by && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <User className="size-3.5" />
                                        <span>Demandé par {supplyRequest.created_by.name}</span>
                                    </div>
                                )}
                                {supplyRequest.received_by && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <PackageCheck className="size-3.5" />
                                        <span>Réceptionné par {supplyRequest.received_by.name}</span>
                                    </div>
                                )}
                                <div className="text-muted-foreground">
                                    Créé le {new Date(supplyRequest.created_at).toLocaleDateString('fr-FR')}
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
