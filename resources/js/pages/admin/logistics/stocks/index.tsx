import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, Box, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { index as stocksIndex, create, destroy } from '@/actions/App/Http/Controllers/Admin/Logistics/WarehouseStockController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

type Stock = {
    id: string;
    quantity: number;
    stock_alert: number;
    product: { id: string; name: string; code: string };
    warehouse: { id: string; name: string; code: string };
    created_at: string;
};

type PaginatedStocks = {
    data: Stock[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Stocks', href: stocksIndex().url },
];

export default function StocksIndex({ stocks }: { stocks: PaginatedStocks }) {
    const [deleteTarget, setDeleteTarget] = useState<Stock | null>(null);
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
            <Head title="Stocks" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                            <Box className="size-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Stocks en entrepôt</h1>
                            <p className="text-sm text-muted-foreground">
                                {stocks.total} ligne{stocks.total !== 1 ? 's' : ''} de stock
                            </p>
                        </div>
                    </div>
                    <Button asChild size="sm">
                        <Link href={create().url} prefetch>
                            <Plus className="size-4" />
                            Ajouter un stock
                        </Link>
                    </Button>
                </div>

                <Separator />

                {stocks.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20 text-center">
                        <Box className="size-12 text-muted-foreground/40" />
                        <div>
                            <p className="font-medium">Aucun stock trouvé</p>
                            <p className="text-sm text-muted-foreground">Commencez par enregistrer un stock dans un entrepôt.</p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                            <Link href={create().url}>
                                <Plus className="size-4" />
                                Ajouter un stock
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
                                            <th className="px-4 py-3 font-medium">Produit</th>
                                            <th className="px-4 py-3 font-medium">Code</th>
                                            <th className="px-4 py-3 font-medium">Entrepôt</th>
                                            <th className="px-4 py-3 text-right font-medium">Quantité</th>
                                            <th className="px-4 py-3 text-right font-medium">Seuil alerte</th>
                                            <th className="px-4 py-3 text-center font-medium">État</th>
                                            <th className="px-4 py-3 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stocks.data.map((stock) => (
                                            <tr key={stock.id} className="border-b last:border-0 hover:bg-muted/20">
                                                <td className="px-4 py-3 font-medium">{stock.product.name}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{stock.product.code}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline">{stock.warehouse.name}</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold">{stock.quantity}</td>
                                                <td className="px-4 py-3 text-right text-muted-foreground">{stock.stock_alert}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {stock.quantity <= stock.stock_alert ? (
                                                        <Badge variant="destructive" className="gap-1">
                                                            <AlertTriangle className="size-3" />
                                                            Alerte
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">Normal</Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-destructive hover:text-destructive"
                                                        onClick={() => setDeleteTarget(stock)}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {stocks.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {stocks.links.map((link, i) => (
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
                        <DialogTitle>Supprimer le stock</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer le stock de <strong>{deleteTarget?.product.name}</strong> dans{' '}
                            <strong>{deleteTarget?.warehouse.name}</strong> ? Cette action est irréversible.
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
