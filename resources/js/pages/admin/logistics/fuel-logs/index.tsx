import { Head, Link, router } from '@inertiajs/react';
import { Eye, Fuel, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { index as fuelLogsIndex, create, show } from '@/actions/App/Http/Controllers/Admin/Logistics/FuelLogController';

type FuelLog = {
    id: string;
    quantity_liters: number;
    cost: string;
    odometer_reading: number | null;
    fueled_at: string;
    notes: string | null;
    vehicle: { id: string; name: string; registration_number: string } | null;
    created_by: { id: string; name: string } | null;
    created_at: string;
};

type PaginatedFuelLogs = {
    data: FuelLog[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Ravitaillements', href: '#' },
];

export default function FuelLogIndex({ fuelLogs }: { fuelLogs: PaginatedFuelLogs }) {
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const logToDelete = fuelLogs.data.find((l) => l.id === deleteId);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ravitaillements" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg border bg-muted">
                            <Fuel className="size-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Ravitaillements</h1>
                            <p className="text-sm text-muted-foreground">{fuelLogs.total} enregistrement(s)</p>
                        </div>
                    </div>
                    <Button asChild size="sm">
                        <Link href={create().url}>
                            <Plus className="size-4" />
                            Nouveau ravitaillement
                        </Link>
                    </Button>
                </div>

                <Separator />

                {fuelLogs.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-16">
                        <Fuel className="size-10 text-muted-foreground/50" />
                        <p className="text-muted-foreground">Aucun ravitaillement enregistré.</p>
                        <Button asChild variant="outline" size="sm">
                            <Link href={create().url}>
                                <Plus className="size-4" />
                                Ajouter un ravitaillement
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                                    <th className="px-4 py-3 font-medium">Véhicule</th>
                                    <th className="px-4 py-3 text-right font-medium">Litres</th>
                                    <th className="px-4 py-3 text-right font-medium">Coût</th>
                                    <th className="px-4 py-3 text-right font-medium">Kilométrage</th>
                                    <th className="px-4 py-3 font-medium">Date</th>
                                    <th className="px-4 py-3 font-medium">Créé par</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fuelLogs.data.map((log) => (
                                    <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            {log.vehicle ? (
                                                <div>
                                                    <p className="font-medium">{log.vehicle.name}</p>
                                                    <p className="text-xs text-muted-foreground">{log.vehicle.registration_number}</p>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Badge variant="secondary">{log.quantity_liters} L</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold">
                                            {Number(log.cost).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                                        </td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">
                                            {log.odometer_reading ? `${Number(log.odometer_reading).toLocaleString('fr-FR')} km` : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {new Date(log.fueled_at).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {log.created_by?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button asChild variant="ghost" size="icon" className="size-8">
                                                <Link href={show(log.id).url}>
                                                    <Eye className="size-4" />
                                                    <span className="sr-only">Voir</span>
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {fuelLogs.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {fuelLogs.links.map((link) => (
                            <Button
                                asChild={!!link.url}
                                key={link.label}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                            >
                                {link.url ? (
                                    <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                                ) : (
                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                )}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
