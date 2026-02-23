import { Head } from '@inertiajs/react';
import { ArrowLeft, Calendar, Fuel, Gauge, Hash, Truck, User } from 'lucide-react';
import { index as fuelLogsIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/FuelLogController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type StockMovement = {
    id: string;
    reference: string;
};

type FuelLog = {
    id: string;
    quantity_liters: number;
    cost: string;
    odometer_reading: number | null;
    fueled_at: string;
    notes: string | null;
    vehicle: { id: string; name: string; registration_number: string; type: string } | null;
    stock_movement: StockMovement | null;
    created_by: { id: string; name: string } | null;
    created_at: string;
    updated_at: string;
};

const typeLabels: Record<string, string> = {
    truck: 'Camion',
    tricycle: 'Tricycle',
    van: 'Fourgon',
    pickup: 'Pick-up',
    other: 'Autre',
};

export default function FuelLogShow({ fuelLog }: { fuelLog: FuelLog }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Ravitaillements', href: fuelLogsIndex().url },
        { title: `Ravitaillement du ${new Date(fuelLog.fueled_at).toLocaleDateString('fr-FR')}`, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Détail ravitaillement" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="size-8">
                        <a href={fuelLogsIndex().url}>
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Retour</span>
                        </a>
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-lg border bg-muted">
                            <Fuel className="size-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Ravitaillement</h1>
                            <p className="text-sm text-muted-foreground">
                                {new Date(fuelLog.fueled_at).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        {/* Key metrics */}
                        <div className="grid grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                            <Fuel className="size-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Quantité</p>
                                            <p className="text-lg font-bold">{fuelLog.quantity_liters} L</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                                            <Hash className="size-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Coût</p>
                                            <p className="text-lg font-bold">
                                                {Number(fuelLog.cost).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                                            <Gauge className="size-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Kilométrage</p>
                                            <p className="text-lg font-bold">
                                                {fuelLog.odometer_reading
                                                    ? `${Number(fuelLog.odometer_reading).toLocaleString('fr-FR')} km`
                                                    : '—'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Vehicle info */}
                        {fuelLog.vehicle && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Truck className="size-4" />
                                        Véhicule
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Nom</p>
                                            <p className="font-semibold">{fuelLog.vehicle.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Immatriculation</p>
                                            <p className="font-semibold">{fuelLog.vehicle.registration_number}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Type</p>
                                            <Badge variant="outline">{typeLabels[fuelLog.vehicle.type] ?? fuelLog.vehicle.type}</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Linked stock movement */}
                        {fuelLog.stock_movement && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Mouvement de stock lié</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="font-mono text-sm">{fuelLog.stock_movement.reference}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Notes */}
                        {fuelLog.notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Notes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{fuelLog.notes}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Calendar className="size-4" />
                                    Détails
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="text-muted-foreground">
                                    <strong>Prix/litre:</strong>{' '}
                                    {fuelLog.quantity_liters > 0
                                        ? (Number(fuelLog.cost) / fuelLog.quantity_liters).toLocaleString('fr-FR', {
                                              style: 'currency',
                                              currency: 'XOF',
                                          })
                                        : '—'}
                                </div>
                                {fuelLog.created_by && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <User className="size-3.5" />
                                        <span>Créé par {fuelLog.created_by.name}</span>
                                    </div>
                                )}
                                <div className="text-muted-foreground">
                                    Créé le {new Date(fuelLog.created_at).toLocaleDateString('fr-FR')}
                                </div>
                                <div className="text-muted-foreground">
                                    Modifié le {new Date(fuelLog.updated_at).toLocaleDateString('fr-FR')}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
