import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, DollarSign, Edit, Hash, Layers, Package, ScanBarcode, Tag, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { index as productsIndex, edit, destroy } from '@/actions/App/Http/Controllers/Admin/ProductController';
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

type Category = { id: string; name: string };
type ProductTag = { id: string; name: string };
type Creator = { id: string; name: string };

type Product = {
    id: string;
    name: string;
    code: string;
    description: string | null;
    price: string;
    cost_price: string | null;
    stock: number;
    stock_alert: number;
    unity: string;
    status: string;
    image: string | null;
    category: Category | null;
    tags: ProductTag[];
    created_by_user: Creator | null;
    created_at: string;
    updated_at: string;
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Actif', variant: 'default' },
    inactive: { label: 'Inactif', variant: 'secondary' },
};

const unityLabels: Record<string, string> = {
    piece: 'Pièce',
    kilogram: 'Kilogramme',
    liter: 'Litre',
    meter: 'Mètre',
    square_meter: 'Mètre²',
    cubic_meter: 'Mètre³',
    pack: 'Pack',
    box: 'Boîte',
};

export default function ProductShow({ product }: { product: Product }) {
    const [showDelete, setShowDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Produits', href: productsIndex().url },
        { title: product.name, href: '#' },
    ];

    const status = statusConfig[product.status] ?? { label: product.status, variant: 'outline' as const };

    function handleDelete() {
        setIsDeleting(true);
        router.delete(destroy(product.id).url, {
            onFinish: () => setIsDeleting(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={product.name} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="ghost" size="icon" className="size-8">
                            <a href={productsIndex().url}>
                                <ArrowLeft className="size-4" />
                                <span className="sr-only">Retour</span>
                            </a>
                        </Button>
                        <div className="flex items-center gap-3">
                            {product.image ? (
                                <img src={product.image} alt={product.name} className="size-12 rounded-lg border object-cover" />
                            ) : (
                                <div className="flex size-12 items-center justify-center rounded-lg border bg-muted">
                                    <Package className="size-5 text-muted-foreground" />
                                </div>
                            )}
                            <div>
                                <h1 className="text-xl font-semibold">{product.name}</h1>
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <ScanBarcode className="size-3.5" />
                                        {product.code}
                                    </span>
                                    <Badge variant={status.variant}>{status.label}</Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href={edit(product.id).url}>
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
                        {product.description && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Description</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{product.description}</p>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <DollarSign className="size-4" />
                                    Prix & Stock
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Prix de vente</p>
                                        <p className="text-lg font-bold text-primary">
                                            {Number(product.price).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                                        </p>
                                    </div>
                                    {product.cost_price && (
                                        <div>
                                            <p className="text-xs text-muted-foreground">Prix d'achat</p>
                                            <p className="text-lg font-semibold">
                                                {Number(product.cost_price).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs text-muted-foreground">Stock actuel</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-lg font-semibold">{product.stock}</p>
                                            {product.stock <= product.stock_alert && (
                                                <Badge variant="destructive" className="text-[10px]">
                                                    Alerte
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Unité</p>
                                        <p className="text-lg font-semibold">{unityLabels[product.unity] ?? product.unity}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Layers className="size-4" />
                                    Catégorie
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {product.category ? (
                                    <Badge variant="outline">{product.category.name}</Badge>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Aucune catégorie</p>
                                )}
                            </CardContent>
                        </Card>

                        {product.tags && product.tags.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Tag className="size-4" />
                                        Tags
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {product.tags.map((tag) => (
                                            <Badge key={tag.id} variant="secondary">
                                                {tag.name}
                                            </Badge>
                                        ))}
                                    </div>
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
                                {product.created_by_user && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <User className="size-3.5" />
                                        <span>Créé par {product.created_by_user.name}</span>
                                    </div>
                                )}
                                <div className="text-muted-foreground">
                                    Créé le {new Date(product.created_at).toLocaleDateString('fr-FR')}
                                </div>
                                <div className="text-muted-foreground">
                                    Modifié le {new Date(product.updated_at).toLocaleDateString('fr-FR')}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Delete dialog */}
            <Dialog open={showDelete} onOpenChange={(open) => !open && setShowDelete(false)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer le produit</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer <strong>{product.name}</strong> ? Cette action est irréversible.
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
