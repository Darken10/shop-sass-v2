import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Box, Edit, Hash, MapPin, Phone, Trash2, User, Warehouse as WarehouseIcon } from 'lucide-react';
import { useState } from 'react';
import { index as warehousesIndex, edit, destroy } from '@/actions/App/Http/Controllers/Admin/Logistics/WarehouseController';
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

type Creator = { id: string; name: string };
type Stock = {
    id: string;
    quantity: number;
    stock_alert: number;
    product: { id: string; name: string; code: string };
};

type Warehouse = {
    id: string;
    name: string;
    code: string;
    address: string | null;
    city: string | null;
    phone: string | null;
    status: string;
    description: string | null;
    stocks: Stock[];
    created_by: Creator | null;
    created_at: string;
    updated_at: string;
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Actif', variant: 'default' },
    inactive: { label: 'Inactif', variant: 'secondary' },
    under_maintenance: { label: 'En maintenance', variant: 'destructive' },
};

export default function WarehouseShow({ warehouse }: { warehouse: Warehouse }) {
    const [showDelete, setShowDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Entrepôts', href: warehousesIndex().url },
        { title: warehouse.name, href: '#' },
    ];

    const status = statusConfig[warehouse.status] ?? { label: warehouse.status, variant: 'outline' as const };

    function handleDelete() {
        setIsDeleting(true);
        router.delete(destroy(warehouse.id).url, {
            onFinish: () => setIsDeleting(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={warehouse.name} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="ghost" size="icon" className="size-8">
                            <a href={warehousesIndex().url}>
                                <ArrowLeft className="size-4" />
                                <span className="sr-only">Retour</span>
                            </a>
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="flex size-12 items-center justify-center rounded-lg border bg-muted">
                                <WarehouseIcon className="size-5 text-muted-foreground" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold">{warehouse.name}</h1>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">{warehouse.code}</span>
                                    <Badge variant={status.variant}>{status.label}</Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href={edit(warehouse.id).url}>
                                <Edit className="size-4" />
                                Modifier
                            </Link>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>
                            <Trash2 className="size-4" />
                            Supprimer
                        </Button>
                    </div>
                </div>

                <Separator />

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main info */}
                    <div className="space-y-6 lg:col-span-2">
                        {warehouse.description && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Description</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{warehouse.description}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Stocks table */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Box className="size-4" />
                                    Stocks ({warehouse.stocks.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {warehouse.stocks.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-muted-foreground">Aucun stock enregistré dans cet entrepôt.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-left text-muted-foreground">
                                                    <th className="pb-2 font-medium">Produit</th>
                                                    <th className="pb-2 font-medium">Code</th>
                                                    <th className="pb-2 text-right font-medium">Quantité</th>
                                                    <th className="pb-2 text-right font-medium">Alerte</th>
                                                    <th className="pb-2 text-right font-medium">État</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {warehouse.stocks.map((stock) => (
                                                    <tr key={stock.id} className="border-b last:border-0">
                                                        <td className="py-2.5 font-medium">{stock.product.name}</td>
                                                        <td className="py-2.5 text-muted-foreground">{stock.product.code}</td>
                                                        <td className="py-2.5 text-right">{stock.quantity}</td>
                                                        <td className="py-2.5 text-right text-muted-foreground">{stock.stock_alert}</td>
                                                        <td className="py-2.5 text-right">
                                                            {stock.quantity <= stock.stock_alert ? (
                                                                <Badge variant="destructive" className="text-[10px]">Alerte</Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-[10px]">Normal</Badge>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {(warehouse.address || warehouse.city || warehouse.phone) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <MapPin className="size-4" />
                                        Localisation
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    {warehouse.address && (
                                        <div className="text-muted-foreground">{warehouse.address}</div>
                                    )}
                                    {warehouse.city && (
                                        <div className="text-muted-foreground">{warehouse.city}</div>
                                    )}
                                    {warehouse.phone && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Phone className="size-3.5" />
                                            <span>{warehouse.phone}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Hash className="size-4" />
                                    Détails
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {warehouse.created_by && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <User className="size-3.5" />
                                        <span>Créé par {warehouse.created_by.name}</span>
                                    </div>
                                )}
                                <div className="text-muted-foreground">
                                    Créé le {new Date(warehouse.created_at).toLocaleDateString('fr-FR')}
                                </div>
                                <div className="text-muted-foreground">
                                    Modifié le {new Date(warehouse.updated_at).toLocaleDateString('fr-FR')}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Dialog open={showDelete} onOpenChange={(open) => !open && setShowDelete(false)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer l'entrepôt</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer <strong>{warehouse.name}</strong> ? Cette action est irréversible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDelete(false)} disabled={isDeleting}>
                            Annuler
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? 'Suppression…' : 'Supprimer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
