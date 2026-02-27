import { Head, Link, router } from '@inertiajs/react';
import { Banknote, Eye, Search } from 'lucide-react';
import { useState } from 'react';
import { credits as creditsRoute, show as showSale } from '@/actions/App/Http/Controllers/Pos/SaleController';
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
    customer: { id: string; name: string; phone: string | null } | null;
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
    { title: 'Créances', href: '#' },
];

const statusLabels: Record<string, string> = {
    partially_paid: 'Partielle',
    unpaid: 'Impayée',
};

export default function SalesCredits({ sales }: { sales: PaginatedSales }) {
    const [searchTerm, setSearchTerm] = useState('');

    const totalDue = sales.data.reduce((sum, s) => sum + Number(s.amount_due), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Créances" />

            <div className="flex h-full flex-1 flex-col gap-4 p-6">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Créances</h1>
                        <p className="text-sm text-muted-foreground">
                            Ventes avec un solde restant dû
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total des créances</p>
                        <p className="text-xl font-bold text-orange-600">{totalDue.toLocaleString('fr-FR')} FCFA</p>
                        <Badge variant="outline">{sales.total} vente{sales.total > 1 ? 's' : ''}</Badge>
                    </div>
                </div>

                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Rechercher..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50 text-left">
                                        <th className="px-4 py-3 font-medium">Référence</th>
                                        <th className="px-4 py-3 font-medium">Client</th>
                                        <th className="px-4 py-3 font-medium">Magasin</th>
                                        <th className="px-4 py-3 text-right font-medium">Total</th>
                                        <th className="px-4 py-3 text-right font-medium">Payé</th>
                                        <th className="px-4 py-3 text-right font-medium">Reste dû</th>
                                        <th className="px-4 py-3 font-medium">Date</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sales.data
                                        .filter(
                                            (s) =>
                                                !searchTerm ||
                                                s.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                (s.customer?.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()),
                                        )
                                        .map((sale) => (
                                            <tr key={sale.id} className="border-b last:border-0 hover:bg-muted/30">
                                                <td className="px-4 py-3 font-mono text-xs">{sale.reference}</td>
                                                <td className="px-4 py-3">
                                                    {sale.customer ? (
                                                        <div>
                                                            <p className="font-medium">{sale.customer.name}</p>
                                                            {sale.customer.phone && (
                                                                <p className="text-xs text-muted-foreground">{sale.customer.phone}</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">{sale.shop.name}</td>
                                                <td className="px-4 py-3 text-right">{Number(sale.total).toLocaleString('fr-FR')} F</td>
                                                <td className="px-4 py-3 text-right">{Number(sale.amount_paid).toLocaleString('fr-FR')} F</td>
                                                <td className="px-4 py-3 text-right font-bold text-orange-600">
                                                    {Number(sale.amount_due).toLocaleString('fr-FR')} F
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                                                    {new Date(sale.created_at).toLocaleDateString('fr-FR')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Button variant="ghost" size="icon" className="size-7" asChild>
                                                        <Link href={showSale(sale.id).url}>
                                                            <Eye className="size-3.5" />
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

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
