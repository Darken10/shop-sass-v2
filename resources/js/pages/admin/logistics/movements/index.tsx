import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeftRight, Eye, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { index as movementsIndex, create, show } from '@/actions/App/Http/Controllers/Admin/Logistics/StockMovementController';

type Movement = {
    id: string;
    reference: string;
    type: string;
    quantity: number;
    reason: string | null;
    product: { id: string; name: string; code: string };
    source_warehouse: { id: string; name: string; code: string } | null;
    destination_warehouse: { id: string; name: string; code: string } | null;
    created_by: { id: string; name: string } | null;
    created_at: string;
};

type PaginatedMovements = {
    data: Movement[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Mouvements de stock', href: movementsIndex().url },
];

const typeConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    purchase_entry: { label: 'Entrée achat', variant: 'default' },
    supplier_return: { label: 'Retour fournisseur', variant: 'destructive' },
    store_transfer: { label: 'Transfert magasin', variant: 'secondary' },
    loss: { label: 'Perte', variant: 'destructive' },
    internal_transfer: { label: 'Transfert interne', variant: 'outline' },
    adjustment: { label: 'Ajustement', variant: 'secondary' },
};

export default function MovementsIndex({ movements }: { movements: PaginatedMovements }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mouvements de stock" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                            <ArrowLeftRight className="size-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Mouvements de stock</h1>
                            <p className="text-sm text-muted-foreground">
                                {movements.total} mouvement{movements.total !== 1 ? 's' : ''} enregistré{movements.total !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <Button asChild size="sm">
                        <Link href={create().url} prefetch>
                            <Plus className="size-4" />
                            Nouveau mouvement
                        </Link>
                    </Button>
                </div>

                <Separator />

                {movements.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20 text-center">
                        <ArrowLeftRight className="size-12 text-muted-foreground/40" />
                        <div>
                            <p className="font-medium">Aucun mouvement de stock</p>
                            <p className="text-sm text-muted-foreground">Les mouvements de stock apparaîtront ici.</p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                            <Link href={create().url}>
                                <Plus className="size-4" />
                                Créer un mouvement
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
                                            <th className="px-4 py-3 font-medium">Produit</th>
                                            <th className="px-4 py-3 text-right font-medium">Quantité</th>
                                            <th className="px-4 py-3 font-medium">Source</th>
                                            <th className="px-4 py-3 font-medium">Destination</th>
                                            <th className="px-4 py-3 font-medium">Date</th>
                                            <th className="px-4 py-3 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movements.data.map((movement) => {
                                            const type = typeConfig[movement.type] ?? { label: movement.type, variant: 'outline' as const };
                                            return (
                                                <tr key={movement.id} className="border-b last:border-0 hover:bg-muted/20">
                                                    <td className="px-4 py-3 font-mono text-xs font-medium">{movement.reference}</td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant={type.variant}>{type.label}</Badge>
                                                    </td>
                                                    <td className="px-4 py-3">{movement.product.name}</td>
                                                    <td className="px-4 py-3 text-right font-semibold">{movement.quantity}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {movement.source_warehouse?.name ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {movement.destination_warehouse?.name ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {new Date(movement.created_at).toLocaleDateString('fr-FR')}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Button asChild variant="ghost" size="icon" className="size-8">
                                                            <Link href={show(movement.id).url}>
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

                {movements.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {movements.links.map((link, i) => (
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
