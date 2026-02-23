import { Head, Link, router } from '@inertiajs/react';
import { Edit, Eye, MapPin, Plus, Trash2, UserSquare } from 'lucide-react';
import { useState } from 'react';
import { index as suppliersIndex, create, destroy, edit, show } from '@/actions/App/Http/Controllers/Admin/Logistics/SupplierController';
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

type Supplier = {
    id: string;
    name: string;
    code: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    notes: string | null;
    is_active: boolean;
    created_by: Creator | null;
    created_at: string;
};

type PaginatedSuppliers = {
    data: Supplier[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Fournisseurs', href: suppliersIndex().url },
];

export default function SuppliersIndex({ suppliers }: { suppliers: PaginatedSuppliers }) {
    const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
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
            <Head title="Fournisseurs" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                            <UserSquare className="size-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Fournisseurs</h1>
                            <p className="text-sm text-muted-foreground">
                                {suppliers.total} fournisseur{suppliers.total !== 1 ? 's' : ''} enregistré{suppliers.total !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <Button asChild size="sm">
                        <Link href={create().url} prefetch>
                            <Plus className="size-4" />
                            Nouveau fournisseur
                        </Link>
                    </Button>
                </div>

                <Separator />

                {suppliers.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20 text-center">
                        <UserSquare className="size-12 text-muted-foreground/40" />
                        <div>
                            <p className="font-medium">Aucun fournisseur trouvé</p>
                            <p className="text-sm text-muted-foreground">Commencez par créer votre premier fournisseur.</p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                            <Link href={create().url}>
                                <Plus className="size-4" />
                                Créer un fournisseur
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {suppliers.data.map((supplier) => (
                            <Card key={supplier.id} className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
                                <div className="relative flex h-24 items-center justify-center bg-muted">
                                    <UserSquare className="size-10 text-muted-foreground/30" />
                                    <div className="absolute right-2 top-2">
                                        <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                                            {supplier.is_active ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </div>
                                </div>

                                <CardContent className="flex flex-1 flex-col gap-2 pt-4">
                                    <div>
                                        <h3 className="truncate font-semibold leading-tight">{supplier.name}</h3>
                                        <p className="text-xs text-muted-foreground">{supplier.code}</p>
                                    </div>

                                    {supplier.contact_name && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <UserSquare className="size-3 shrink-0" />
                                            <span className="truncate">{supplier.contact_name}</span>
                                        </div>
                                    )}

                                    {(supplier.city || supplier.address) && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <MapPin className="size-3 shrink-0" />
                                            <span className="truncate">{supplier.city ?? supplier.address}</span>
                                        </div>
                                    )}
                                </CardContent>

                                <CardFooter className="gap-1 border-t p-2">
                                    <Button asChild variant="ghost" size="sm" className="flex-1">
                                        <Link href={show(supplier.id).url} prefetch>
                                            <Eye className="size-3.5" />
                                            Voir
                                        </Link>
                                    </Button>
                                    <Button asChild variant="ghost" size="sm" className="flex-1">
                                        <Link href={edit(supplier.id).url} prefetch>
                                            <Edit className="size-3.5" />
                                            Modifier
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="flex-1 text-destructive hover:text-destructive"
                                        onClick={() => setDeleteTarget(supplier)}
                                    >
                                        <Trash2 className="size-3.5" />
                                        Supprimer
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}

                {suppliers.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {suppliers.links.map((link, i) => (
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
                        <DialogTitle>Supprimer le fournisseur</DialogTitle>
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
