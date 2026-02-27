import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Box, Edit, Hash, MapPin, Phone, Store, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { index as shopsIndex, edit, destroy } from '@/actions/App/Http/Controllers/Admin/Logistics/ShopController';
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

type Shop = {
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

export default function ShopShow({ shop }: { shop: Shop }) {
    const [showDelete, setShowDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Magasins', href: shopsIndex().url },
        { title: shop.name, href: '#' },
    ];

    const status = statusConfig[shop.status] ?? { label: shop.status, variant: 'outline' as const };

    function handleDelete() {
        setIsDeleting(true);
        router.delete(destroy(shop.id).url, {
            onFinish: () => setIsDeleting(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={shop.name} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="ghost" size="icon" className="size-8">
                            <a href={shopsIndex().url}>
                                <ArrowLeft className="size-4" />
                                <span className="sr-only">Retour</span>
                            </a>
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="flex size-12 items-center justify-center rounded-lg border bg-muted">
                                <Store className="size-5 text-muted-foreground" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold">{shop.name}</h1>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">{shop.code}</span>
                                    <Badge variant={status.variant}>{status.label}</Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href={edit(shop.id).url}>
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
                        {shop.description && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Description</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{shop.description}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Stocks table */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Box className="size-4" />
                                    Stocks ({shop.stocks.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {shop.stocks.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-muted-foreground">Aucun stock enregistré dans ce magasin.</p>
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
                                                {shop.stocks.map((stock) => (
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
                        {(shop.address || shop.city || shop.phone) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <MapPin className="size-4" />
                                        Localisation
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    {shop.address && (
                                        <div className="text-muted-foreground">{shop.address}</div>
                                    )}
                                    {shop.city && (
                                        <div className="text-muted-foreground">{shop.city}</div>
                                    )}
                                    {shop.phone && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Phone className="size-3.5" />
                                            <span>{shop.phone}</span>
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
                                {shop.created_by && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <User className="size-3.5" />
                                        <span>Créé par {shop.created_by.name}</span>
                                    </div>
                                )}
                                <div className="text-muted-foreground">
                                    Créé le {new Date(shop.created_at).toLocaleDateString('fr-FR')}
                                </div>
                                <div className="text-muted-foreground">
                                    Modifié le {new Date(shop.updated_at).toLocaleDateString('fr-FR')}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Dialog open={showDelete} onOpenChange={(open) => !open && setShowDelete(false)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer le magasin</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer <strong>{shop.name}</strong> ? Cette action est irréversible.
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
