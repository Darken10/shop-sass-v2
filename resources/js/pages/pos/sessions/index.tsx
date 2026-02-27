import { Head, Link } from '@inertiajs/react';
import { Clock, Eye, Store } from 'lucide-react';
import { sessions as sessionsIndex, show as sessionShow } from '@/actions/App/Http/Controllers/Pos/CashRegisterController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type SessionItem = {
    id: string;
    session_number: string;
    status: string;
    opening_amount: string;
    closing_amount: string | null;
    total_sales: string;
    opened_at: string;
    closed_at: string | null;
    shop: { id: string; name: string; code: string };
    cashier: { id: string; name: string };
    sales_count: number;
    sales_sum_total: string | null;
};

type PaginatedSessions = {
    data: SessionItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Point de vente', href: '/pos' },
    { title: 'Historique caisses', href: sessionsIndex().url },
];

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatMoney(value: string | number | null): string {
    return Number(value ?? 0).toLocaleString('fr-FR');
}

export default function SessionsIndex({ sessions }: { sessions: PaginatedSessions }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Historique des caisses" />

            <div className="flex h-full flex-1 flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Historique des caisses</h1>
                        <p className="text-sm text-muted-foreground">
                            {sessions.total} session{sessions.total > 1 ? 's' : ''} de caisse
                        </p>
                    </div>
                    <Badge variant="outline">
                        <Clock className="mr-1 size-3" />
                        Page {sessions.current_page}/{sessions.last_page}
                    </Badge>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>N° Session</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Magasin</TableHead>
                                    <TableHead>Caissier</TableHead>
                                    <TableHead>Ouverture</TableHead>
                                    <TableHead>Fermeture</TableHead>
                                    <TableHead className="text-right">Montant initial</TableHead>
                                    <TableHead className="text-right">Ventes</TableHead>
                                    <TableHead className="text-right">Total ventes</TableHead>
                                    <TableHead>État</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sessions.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={11} className="py-10 text-center text-muted-foreground">
                                            Aucune session de caisse
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sessions.data.map((session) => (
                                        <TableRow key={session.id}>
                                            <TableCell className="font-mono text-sm">#{session.session_number}</TableCell>
                                            <TableCell>{formatDate(session.opened_at)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    <Store className="size-3 text-muted-foreground" />
                                                    {session.shop.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>{session.cashier.name}</TableCell>
                                            <TableCell>{formatTime(session.opened_at)}</TableCell>
                                            <TableCell>
                                                {session.closed_at ? (
                                                    formatTime(session.closed_at)
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatMoney(session.opening_amount)} F
                                            </TableCell>
                                            <TableCell className="text-right">{session.sales_count}</TableCell>
                                            <TableCell className="text-right font-bold text-green-600">
                                                {formatMoney(session.sales_sum_total)} F
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={session.status === 'open' ? 'default' : 'secondary'}>
                                                    {session.status === 'open' ? 'Ouverte' : 'Fermée'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={sessionShow(session.id).url}>
                                                        <Eye className="size-4" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {sessions.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {sessions.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                asChild={!!link.url}
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
