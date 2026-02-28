import { Head, Link, router } from '@inertiajs/react';
import { Edit, Eye, MapPin, Plus, Store, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { index as shopsIndex, create, destroy, edit, show } from '@/actions/App/Http/Controllers/Admin/Logistics/ShopController';
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

type Creator = { id: string; name: string };

type Shop = {
    id: string;
    name: string;
    code: string;
    address: string | null;
    city: string | null;
    phone: string | null;
    status: string;
    description: string | null;
    stocks_count: number;
    created_by: Creator | null;
    created_at: string;
};

type PaginatedShops = {
    data: Shop[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Magasins', href: shopsIndex().url },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Actif', variant: 'default' },
    inactive: { label: 'Inactif', variant: 'secondary' },
    under_maintenance: { label: 'En maintenance', variant: 'destructive' },
};

export default function ShopsIndex({ shops }: { shops: PaginatedShops }) {
    const [deleteTarget, setDeleteTarget] = useState<Shop | null>(null);
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
            <Head title="Magasins" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                            <Store className="size-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Magasins / Points de vente</h1>
                            <p className="text-sm text-muted-foreground">
                                {shops.total} magasin{shops.total !== 1 ? 's' : ''} enregistré{shops.total !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <Button asChild size="sm" className="hidden sm:flex">
                        <Link href={create().url} prefetch>
                            <Plus className="size-4" />
                            Nouveau magasin
                        </Link>
                    </Button>
                </div>

                <Separator />

                <Button asChild size="sm" className="w-full sm:hidden">
                    <Link href={create().url} prefetch>
                        <Plus className="size-4" />
                        Nouveau magasin
                    </Link>
                </Button>

                {shops.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20 text-center">
                        <Store className="size-12 text-muted-foreground/40" />
                        <div>
                            <p className="font-medium">Aucun magasin trouvé</p>
                            <p className="text-sm text-muted-foreground">Commencez par créer votre premier magasin.</p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                            <Link href={create().url}>
                                <Plus className="size-4" />
                                Créer un magasin
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {shops.data.map((shop) => {
                            const status = statusConfig[shop.status] ?? { label: shop.status, variant: 'outline' as const };
                            return (
                                <Card key={shop.id} className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
                                    <div className="relative flex h-24 items-center justify-center bg-muted">
                                        <Store className="size-10 text-muted-foreground/30" />
                                        <div className="absolute right-2 top-2">
                                            <Badge variant={status.variant}>{status.label}</Badge>
                                        </div>
                                    </div>

                                    <CardContent className="flex flex-1 flex-col gap-2 pt-4">
                                        <div>
                                            <h3 className="truncate font-semibold leading-tight">{shop.name}</h3>
                                            <p className="text-xs text-muted-foreground">{shop.code}</p>
                                        </div>

                                        {(shop.city || shop.address) && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <MapPin className="size-3 shrink-0" />
                                                <span className="truncate">{shop.city ?? shop.address}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{shop.stocks_count} produit{shop.stocks_count !== 1 ? 's' : ''} en stock</span>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="gap-1 border-t p-2">
                                        <Button asChild variant="ghost" size="sm" className="flex-1">
                                            <Link href={show(shop.id).url} prefetch>
                                                <Eye className="size-3.5" />
                                                Voir
                                            </Link>
                                        </Button>
                                        <Button asChild variant="ghost" size="sm" className="flex-1">
                                            <Link href={edit(shop.id).url} prefetch>
                                                <Edit className="size-3.5" />
                                                Modifier
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1 text-destructive hover:text-destructive"
                                            onClick={() => setDeleteTarget(shop)}
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

                {shops.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {shops.links.map((link, i) => (
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

            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer le magasin</DialogTitle>
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
