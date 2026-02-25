import { Head, Link, router } from '@inertiajs/react';
import { ClipboardList, Eye, Plus } from 'lucide-react';
import { index as requestsIndex, create, show } from '@/actions/App/Http/Controllers/Admin/Logistics/SupplyRequestController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type SupplyRequest = {
    id: string;
    reference: string;
    status: string;
    type: string;
    notes: string | null;
    items_count: number;
    source_warehouse: { id: string; name: string; code: string } | null;
    destination_warehouse: { id: string; name: string; code: string } | null;
    supplier: { id: string; name: string; code: string } | null;
    created_by: { id: string; name: string } | null;
    approved_by: { id: string; name: string } | null;
    approved_at: string | null;
    delivered_at: string | null;
    created_at: string;
};

type PaginatedRequests = {
    data: SupplyRequest[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Approvisionnements', href: requestsIndex().url },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'En attente', variant: 'outline' },
    approved: { label: 'Approuvée', variant: 'default' },
    in_transit: { label: 'En transit', variant: 'secondary' },
    delivered: { label: 'Livrée', variant: 'default' },
    rejected: { label: 'Rejetée', variant: 'destructive' },
    cancelled: { label: 'Annulée', variant: 'secondary' },
};

export default function SupplyRequestsIndex({ supplyRequests }: { supplyRequests: PaginatedRequests }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Demandes d'approvisionnement" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                            <ClipboardList className="size-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Demandes d'approvisionnement</h1>
                            <p className="text-sm text-muted-foreground">
                                {supplyRequests.total} demande{supplyRequests.total !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <Button asChild size="sm">
                        <Link href={create().url} prefetch>
                            <Plus className="size-4" />
                            Nouvelle demande
                        </Link>
                    </Button>
                </div>

                <Separator />

                {supplyRequests.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20 text-center">
                        <ClipboardList className="size-12 text-muted-foreground/40" />
                        <div>
                            <p className="font-medium">Aucune demande d'approvisionnement</p>
                            <p className="text-sm text-muted-foreground">Les demandes apparaîtront ici.</p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                            <Link href={create().url}>
                                <Plus className="size-4" />
                                Créer une demande
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                                            <th className="px-4 py-3 font-medium">Référence</th>
                                            <th className="px-4 py-3 font-medium">Statut</th>
                                            <th className="px-4 py-3 font-medium">Source</th>
                                            <th className="px-4 py-3 font-medium">Destination</th>
                                            <th className="px-4 py-3 text-right font-medium">Articles</th>
                                            <th className="px-4 py-3 font-medium">Demandeur</th>
                                            <th className="px-4 py-3 font-medium">Date</th>
                                            <th className="px-4 py-3 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {supplyRequests.data.map((req) => {
                                            const status = statusConfig[req.status] ?? { label: req.status, variant: 'outline' as const };
                                            return (
                                                <tr key={req.id} className="border-b last:border-0 hover:bg-muted/20">
                                                    <td className="px-4 py-3 font-mono text-xs font-medium">{req.reference}</td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant={status.variant}>{status.label}</Badge>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {req.type === 'supplier_to_warehouse'
                                                            ? (req.supplier?.name ?? '—')
                                                            : (req.source_warehouse?.name ?? '—')}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {req.destination_warehouse?.name ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">{req.items_count}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {req.created_by?.name ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {new Date(req.created_at).toLocaleDateString('fr-FR')}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Button asChild variant="ghost" size="icon" className="size-8">
                                                            <Link href={show(req.id).url}>
                                                                <Eye className="size-3.5" />
                                                            </Link>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {supplyRequests.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {supplyRequests.links.map((link, i) => (
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
        </AppLayout>
    );
}
