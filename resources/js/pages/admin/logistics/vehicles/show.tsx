import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, Fuel, Hash, Trash2, Truck, User } from 'lucide-react';
import { useState } from 'react';
import { index as vehiclesIndex, edit, destroy } from '@/actions/App/Http/Controllers/Admin/Logistics/VehicleController';
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

type FuelLog = {
    id: string;
    quantity_liters: number;
    cost: string;
    odometer_reading: number | null;
    fueled_at: string;
    notes: string | null;
};

type Vehicle = {
    id: string;
    name: string;
    type: string;
    registration_number: string;
    load_capacity: string | null;
    average_consumption: string | null;
    status: string;
    notes: string | null;
    fuel_logs: FuelLog[];
    created_by: { id: string; name: string } | null;
    created_at: string;
    updated_at: string;
};

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

export default function VehicleShow({ vehicle }: { vehicle: Vehicle }) {
    const [showDelete, setShowDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Engins', href: vehiclesIndex().url },
        { title: vehicle.name, href: '#' },
    ];

    const status = statusConfig[vehicle.status] ?? { label: vehicle.status, variant: 'outline' as const };

    function handleDelete() {
        setIsDeleting(true);
        router.delete(destroy(vehicle.id).url, {
            onFinish: () => setIsDeleting(false),
        });
    }

    const totalFuel = vehicle.fuel_logs.reduce((sum, log) => sum + Number(log.cost), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={vehicle.name} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="ghost" size="icon" className="size-8">
                            <a href={vehiclesIndex().url}>
                                <ArrowLeft className="size-4" />
                                <span className="sr-only">Retour</span>
                            </a>
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="flex size-12 items-center justify-center rounded-lg border bg-muted">
                                <Truck className="size-5 text-muted-foreground" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold">{vehicle.name}</h1>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">{vehicle.registration_number}</span>
                                    <Badge variant={status.variant}>{status.label}</Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href={edit(vehicle.id).url}>
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
                    <div className="space-y-6 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Truck className="size-4" />
                                    Caractéristiques
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Type</p>
                                        <p className="font-semibold">{typeLabels[vehicle.type] ?? vehicle.type}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Immatriculation</p>
                                        <p className="font-semibold">{vehicle.registration_number}</p>
                                    </div>
                                    {vehicle.load_capacity && (
                                        <div className="flex items-start gap-1">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Capacité</p>
                                                <p className="font-semibold">{Number(vehicle.load_capacity).toLocaleString('fr-FR')} kg</p>
                                            </div>
                                        </div>
                                    )}
                                    {vehicle.average_consumption && (
                                        <div>
                                            <p className="text-xs text-muted-foreground">Consommation moy.</p>
                                            <p className="font-semibold">{Number(vehicle.average_consumption).toLocaleString('fr-FR')} L/100km</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {vehicle.notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Notes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{vehicle.notes}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Fuel logs */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Fuel className="size-4" />
                                    Ravitaillements récents ({vehicle.fuel_logs.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {vehicle.fuel_logs.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-muted-foreground">Aucun ravitaillement enregistré.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-left text-muted-foreground">
                                                    <th className="pb-2 font-medium">Date</th>
                                                    <th className="pb-2 text-right font-medium">Litres</th>
                                                    <th className="pb-2 text-right font-medium">Coût</th>
                                                    <th className="pb-2 text-right font-medium">Kilométrage</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {vehicle.fuel_logs.map((log) => (
                                                    <tr key={log.id} className="border-b last:border-0">
                                                        <td className="py-2.5">
                                                            {new Date(log.fueled_at).toLocaleDateString('fr-FR')}
                                                        </td>
                                                        <td className="py-2.5 text-right">{log.quantity_liters} L</td>
                                                        <td className="py-2.5 text-right font-semibold">
                                                            {Number(log.cost).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                                                        </td>
                                                        <td className="py-2.5 text-right text-muted-foreground">
                                                            {log.odometer_reading ? `${log.odometer_reading.toLocaleString('fr-FR')} km` : '—'}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {totalFuel > 0 && (
                                                    <tr className="font-bold">
                                                        <td className="pt-3" colSpan={2}>Total dépensé</td>
                                                        <td className="pt-3 text-right text-primary">
                                                            {totalFuel.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                                                        </td>
                                                        <td />
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
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
                                {vehicle.created_by && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <User className="size-3.5" />
                                        <span>Créé par {vehicle.created_by.name}</span>
                                    </div>
                                )}
                                <div className="text-muted-foreground">
                                    Créé le {new Date(vehicle.created_at).toLocaleDateString('fr-FR')}
                                </div>
                                <div className="text-muted-foreground">
                                    Modifié le {new Date(vehicle.updated_at).toLocaleDateString('fr-FR')}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Dialog open={showDelete} onOpenChange={(open) => !open && setShowDelete(false)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer l'engin</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer <strong>{vehicle.name}</strong> ? Cette action est irréversible.
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
