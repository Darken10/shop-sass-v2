import { Head, Link, router } from '@inertiajs/react';
import { Eye, Plus, Replace } from 'lucide-react';
import { index as transfersIndex, create, show } from '@/actions/App/Http/Controllers/Admin/Logistics/TransferController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Transfer = {
    id: string;
    reference: string;
    type: 'warehouse_to_shop' | 'warehouse_to_warehouse';
    status: string;
    notes: string | null;
    source_warehouse: { id: string; name: string; code: string } | null;
    destination_warehouse: { id: string; name: string; code: string } | null;
    destination_shop: { id: string; name: string; code: string } | null;
    created_by: { id: string; name: string } | null;
    created_at: string;
};

type PaginatedTransfers = {
    data: Transfer[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Transferts', href: transfersIndex().url },
];

const typeLabels: Record<string, string> = {
    warehouse_to_shop: 'Entrepôt → Magasin',
    warehouse_to_warehouse: 'Entrepôt → Entrepôt',
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'En attente', variant: 'outline' },
    approved: { label: 'Approuvé', variant: 'default' },
    in_transit: { label: 'En transit', variant: 'secondary' },
    delivered: { label: 'Livré', variant: 'default' },
    rejected: { label: 'Rejeté', variant: 'destructive' },
    cancelled: { label: 'Annulé', variant: 'secondary' },
};

export default function TransfersIndex({ transfers }: { transfers: PaginatedTransfers }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transferts" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                            <Replace className="size-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Transferts</h1>
                            <p className="text-sm text-muted-foreground">
                                {transfers.total} transfert{transfers.total !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <Button asChild size="sm">
                        <Link href={create().url} prefetch>
                            <Plus className="size-4" />
                            Nouveau transfert
                        </Link>
                    </Button>
                </div>

                <Separator />

                {transfers.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20 text-center">
                        <Replace className="size-12 text-muted-foreground/40" />
                        <div>
                            <p className="font-medium">Aucun transfert</p>
                            <p className="text-sm text-muted-foreground">Les transferts apparaîtront ici.</p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                            <Link href={create().url}>
                                <Plus className="size-4" />
                                Créer un transfert
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
                                            <th className="px-4 py-3 font-medium">Type</th>
                                            <th className="px-4 py-3 font-medium">Statut</th>
                                            <th className="px-4 py-3 font-medium">Source</th>
                                            <th className="px-4 py-3 font-medium">Destination</th>
                                            <th className="px-4 py-3 font-medium">Créé par</th>
                                            <th className="px-4 py-3 font-medium">Date</th>
                                            <th className="px-4 py-3 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transfers.data.map((transfer) => {
                                            const status = statusConfig[transfer.status] ?? { label: transfer.status, variant: 'outline' as const };
                                            const destination =
                                                transfer.type === 'warehouse_to_shop'
                                                    ? transfer.destination_shop?.name
                                                    : transfer.destination_warehouse?.name;
                                            return (
                                                <tr
                                                    key={transfer.id}
                                                    className="cursor-pointer border-b last:border-0 hover:bg-muted/20"
                                                    onClick={() => router.visit(show(transfer.id).url)}
                                                >
                                                    <td className="px-4 py-3 font-mono text-xs font-medium">{transfer.reference}</td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant="outline">{typeLabels[transfer.type] ?? transfer.type}</Badge>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant={status.variant}>{status.label}</Badge>
                                                    </td>
                                                    <td className="px-4 py-3">{transfer.source_warehouse?.name ?? '—'}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">{destination ?? '—'}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {transfer.created_by?.name ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {new Date(transfer.created_at).toLocaleDateString('fr-FR')}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Button asChild variant="ghost" size="icon" className="size-8">
                                                            <Link href={show(transfer.id).url} onClick={(e) => e.stopPropagation()}>
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

                {transfers.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {transfers.links.map((link, i) => (
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
