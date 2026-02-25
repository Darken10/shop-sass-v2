import { Head, Link, router } from '@inertiajs/react';
import { Eye, FileText, Search } from 'lucide-react';
import { useState } from 'react';
import { index as salesIndex, show as showSale, receipt as saleReceipt } from '@/actions/App/Http/Controllers/Pos/SaleController';
import { index as posIndex } from '@/actions/App/Http/Controllers/Pos/CashRegisterController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type SaleRow = {
    id: string;
    reference: string;
    status: string;
    total: string;
    amount_paid: string;
    amount_due: string;
    created_at: string;
    customer: { id: string; name: string } | null;
    cashier: { id: string; name: string };
    shop: { id: string; name: string };
};

type PaginatedSales = {
    data: SaleRow[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Point de vente', href: '/pos' },
    { title: 'Ventes', href: '#' },
];

const statusLabels: Record<string, string> = {
    completed: 'Payée',
    partially_paid: 'Partielle',
    unpaid: 'Impayée',
    cancelled: 'Annulée',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    completed: 'default',
    partially_paid: 'secondary',
    unpaid: 'destructive',
    cancelled: 'outline',
};

export default function SalesIndex({ sales }: { sales: PaginatedSales }) {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Historique des ventes" />

            <div className="mx-auto max-w-5xl space-y-4 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Historique des ventes</h1>
                    <Badge variant="outline">{sales.total} vente{sales.total > 1 ? 's' : ''}</Badge>
                </div>

                {/* Search */}
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Rechercher par référence..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                {/* Sales table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50 text-left">
                                        <th className="px-4 py-3 font-medium">Référence</th>
                                        <th className="px-4 py-3 font-medium">Statut</th>
                                        <th className="px-4 py-3 font-medium">Client</th>
                                        <th className="px-4 py-3 font-medium">Magasin</th>
                                        <th className="px-4 py-3 font-medium">Caissier</th>
                                        <th className="px-4 py-3 text-right font-medium">Total</th>
                                        <th className="px-4 py-3 text-right font-medium">Reste dû</th>
                                        <th className="px-4 py-3 font-medium">Date</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sales.data
                                        .filter((s) => !searchTerm || s.reference.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map((sale) => (
                                            <tr key={sale.id} className="border-b last:border-0 hover:bg-muted/30">
                                                <td className="px-4 py-3 font-mono text-xs">{sale.reference}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={statusVariant[sale.status] ?? 'outline'}>
                                                        {statusLabels[sale.status] ?? sale.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">{sale.customer?.name ?? '—'}</td>
                                                <td className="px-4 py-3">{sale.shop.name}</td>
                                                <td className="px-4 py-3">{sale.cashier.name}</td>
                                                <td className="px-4 py-3 text-right font-medium">{Number(sale.total).toLocaleString('fr-FR')} F</td>
                                                <td className="px-4 py-3 text-right">
                                                    {Number(sale.amount_due) > 0 ? (
                                                        <span className="font-medium text-orange-600">{Number(sale.amount_due).toLocaleString('fr-FR')} F</span>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                                                    {new Date(sale.created_at).toLocaleDateString('fr-FR')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" className="size-7" asChild>
                                                            <Link href={showSale(sale.id).url}>
                                                                <Eye className="size-3.5" />
                                                            </Link>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="size-7" asChild>
                                                            <Link href={saleReceipt(sale.id).url}>
                                                                <FileText className="size-3.5" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {sales.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {sales.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
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
