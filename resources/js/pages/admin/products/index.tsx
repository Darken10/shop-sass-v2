import { Head, Link, router } from '@inertiajs/react';
import { Edit, Eye, Package, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { index as productsIndex, create, destroy, edit, show } from '@/actions/App/Http/Controllers/Admin/ProductController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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

type ProductCategory = { id: string; name: string };
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
    category: ProductCategory | null;
    tags: ProductTag[];
    created_by_user: Creator | null;
    created_at: string;
};

type PaginatedProducts = {
    data: Product[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Produits', href: productsIndex().url },
];

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

export default function ProductsIndex({ products }: { products: PaginatedProducts }) {
    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    function handleDelete() {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(destroy(deleteTarget.id).url, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Produits" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                            <Package className="size-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Produits</h1>
                            <p className="text-sm text-muted-foreground">
                                {products.total} produit{products.total !== 1 ? 's' : ''} enregistré{products.total !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <Button asChild size="sm">
                        <Link href={create().url} prefetch>
                            <Plus className="size-4" />
                            Nouveau produit
                        </Link>
                    </Button>
                </div>

                <Separator />

                {/* Cards grid */}
                {products.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20 text-center">
                        <Package className="size-12 text-muted-foreground/40" />
                        <div>
                            <p className="font-medium">Aucun produit trouvé</p>
                            <p className="text-sm text-muted-foreground">Commencez par créer votre premier produit.</p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                            <Link href={create().url}>
                                <Plus className="size-4" />
                                Créer un produit
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {products.data.map((product) => {
                            const status = statusConfig[product.status] ?? { label: product.status, variant: 'outline' as const };
                            return (
                                <Card key={product.id} className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
                                    <div className="relative h-32 bg-muted">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="size-full object-cover" />
                                        ) : (
                                            <div className="flex size-full items-center justify-center">
                                                <Package className="size-10 text-muted-foreground/30" />
                                            </div>
                                        )}
                                        <div className="absolute right-2 top-2">
                                            <Badge variant={status.variant}>{status.label}</Badge>
                                        </div>
                                    </div>

                                    <CardContent className="flex flex-1 flex-col gap-2 pt-4">
                                        <div>
                                            <h3 className="truncate font-semibold leading-tight">{product.name}</h3>
                                            <p className="text-xs text-muted-foreground">{product.code}</p>
                                        </div>

                                        <div className="flex items-baseline justify-between">
                                            <span className="text-lg font-bold text-primary">
                                                {Number(product.price).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                                            </span>
                                            <span className="text-xs text-muted-foreground">/ {unityLabels[product.unity] ?? product.unity}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>Stock: {product.stock}</span>
                                            {product.stock <= product.stock_alert && (
                                                <Badge variant="destructive" className="text-[10px]">
                                                    Alerte
                                                </Badge>
                                            )}
                                        </div>

                                        {product.category && (
                                            <Badge variant="outline" className="w-fit text-[10px]">
                                                {product.category.name}
                                            </Badge>
                                        )}

                                        {product.tags && product.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {product.tags.map((tag) => (
                                                    <Badge key={tag.id} variant="secondary" className="text-[10px]">
                                                        {tag.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>

                                    <CardFooter className="gap-1 border-t p-2">
                                        <Button asChild variant="ghost" size="sm" className="flex-1">
                                            <Link href={show(product.id).url} prefetch>
                                                <Eye className="size-3.5" />
                                                Voir
                                            </Link>
                                        </Button>
                                        <Button asChild variant="ghost" size="sm" className="flex-1">
                                            <Link href={edit(product.id).url} prefetch>
                                                <Edit className="size-3.5" />
                                                Modifier
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1 text-destructive hover:text-destructive"
                                            onClick={() => setDeleteTarget(product)}
                                        >
                                            <Trash2 className="size-3.5" />
                                            Supprimer
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {products.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {products.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                className="min-w-9"
                                disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Delete confirmation dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer le produit</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer <strong>{deleteTarget?.name}</strong> ? Cette action est irréversible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
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
