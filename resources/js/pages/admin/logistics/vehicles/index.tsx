import { Head, Link, router } from '@inertiajs/react';
import { Edit, Eye, Plus, Trash2, Truck } from 'lucide-react';
import { useState } from 'react';
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
import { index as vehiclesIndex, create, destroy, edit, show } from '@/actions/App/Http/Controllers/Admin/Logistics/VehicleController';

type Vehicle = {
    id: string;
    name: string;
    type: string;
    registration_number: string;
    load_capacity: string | null;
    average_consumption: string | null;
    status: string;
    notes: string | null;
    created_by: { id: string; name: string } | null;
    created_at: string;
};

type PaginatedVehicles = {
    data: Vehicle[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Engins', href: vehiclesIndex().url },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Actif', variant: 'default' },
    in_maintenance: { label: 'En maintenance', variant: 'secondary' },
    out_of_service: { label: 'Hors service', variant: 'destructive' },
};

const typeLabels: Record<string, string> = {
    truck: 'Camion',
    tricycle: 'Tricycle',
    van: 'Fourgon',
    pickup: 'Pick-up',
    other: 'Autre',
};

export default function VehiclesIndex({ vehicles }: { vehicles: PaginatedVehicles }) {
    const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
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
            <Head title="Engins" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                            <Truck className="size-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Engins & Véhicules</h1>
                            <p className="text-sm text-muted-foreground">
                                {vehicles.total} engin{vehicles.total !== 1 ? 's' : ''} enregistré{vehicles.total !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <Button asChild size="sm">
                        <Link href={create().url} prefetch>
                            <Plus className="size-4" />
                            Nouvel engin
                        </Link>
                    </Button>
                </div>

                <Separator />

                {vehicles.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20 text-center">
                        <Truck className="size-12 text-muted-foreground/40" />
                        <div>
                            <p className="font-medium">Aucun engin trouvé</p>
                            <p className="text-sm text-muted-foreground">Commencez par enregistrer votre premier engin.</p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                            <Link href={create().url}>
                                <Plus className="size-4" />
                                Créer un engin
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {vehicles.data.map((vehicle) => {
                            const status = statusConfig[vehicle.status] ?? { label: vehicle.status, variant: 'outline' as const };
                            return (
                                <Card key={vehicle.id} className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
                                    <div className="relative flex h-24 items-center justify-center bg-muted">
                                        <Truck className="size-10 text-muted-foreground/30" />
                                        <div className="absolute right-2 top-2">
                                            <Badge variant={status.variant}>{status.label}</Badge>
                                        </div>
                                    </div>

                                    <CardContent className="flex flex-1 flex-col gap-2 pt-4">
                                        <div>
                                            <h3 className="truncate font-semibold leading-tight">{vehicle.name}</h3>
                                            <p className="text-xs text-muted-foreground">{vehicle.registration_number}</p>
                                        </div>

                                        <Badge variant="outline" className="w-fit text-[10px]">
                                            {typeLabels[vehicle.type] ?? vehicle.type}
                                        </Badge>

                                        {vehicle.load_capacity && (
                                            <p className="text-xs text-muted-foreground">
                                                Capacité: {Number(vehicle.load_capacity).toLocaleString('fr-FR')} kg
                                            </p>
                                        )}
                                    </CardContent>

                                    <CardFooter className="gap-1 border-t p-2">
                                        <Button asChild variant="ghost" size="sm" className="flex-1">
                                            <Link href={show(vehicle.id).url} prefetch>
                                                <Eye className="size-3.5" />
                                                Voir
                                            </Link>
                                        </Button>
                                        <Button asChild variant="ghost" size="sm" className="flex-1">
                                            <Link href={edit(vehicle.id).url} prefetch>
                                                <Edit className="size-3.5" />
                                                Modifier
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1 text-destructive hover:text-destructive"
                                            onClick={() => setDeleteTarget(vehicle)}
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

                {vehicles.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {vehicles.links.map((link, i) => (
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
                        <DialogTitle>Supprimer l'engin</DialogTitle>
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
