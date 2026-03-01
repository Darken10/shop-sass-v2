import { Head, Link, router } from '@inertiajs/react';
import { BookOpen, Eye, Plus } from 'lucide-react';
import { createJournalEntry, showJournalEntry } from '@/actions/App/Http/Controllers/Finance/AccountingController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type JournalEntry = {
    id: string;
    reference: string;
    date: string;
    description: string;
    status: string;
    total_debit: string;
    total_credit: string;
    creator: { id: string; name: string } | null;
    shop: { id: string; name: string } | null;
    warehouse: { id: string; name: string } | null;
};

type Paginated = {
    data: JournalEntry[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
};

type FilterOption = { id: string; name: string };
type Props = {
    entries: Paginated;
    accounts: { id: string; code: string; name: string; type: string }[];
    shops: FilterOption[];
    warehouses: FilterOption[];
    filters: Record<string, string | null>;
};

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft: { label: 'Brouillon', variant: 'outline' },
    posted: { label: 'Validée', variant: 'default' },
    voided: { label: 'Annulée', variant: 'destructive' },
};

function fmt(v: string | number): string {
    return Number(v).toLocaleString('fr-FR');
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Finance', href: '/finance' },
    { title: 'Journal comptable', href: '/finance/accounting/journal' },
];

export default function JournalIndex({ entries, shops, filters }: Props) {
    function applyFilter(key: string, value: string | null) {
        router.get('/finance/accounting/journal', { ...filters, [key]: value || undefined }, { preserveState: true, preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Finance — Journal comptable" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg border bg-muted">
                            <BookOpen className="size-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Journal comptable</h1>
                            <p className="text-sm text-muted-foreground">{entries.total} écriture(s)</p>
                        </div>
                    </div>
                    <Button asChild size="sm">
                        <Link href={createJournalEntry().url}>
                            <Plus className="size-4" />
                            Nouvelle écriture
                        </Link>
                    </Button>
                </div>

                <Separator />

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <Select value={filters.status ?? 'all'} onValueChange={(v) => applyFilter('status', v === 'all' ? null : v)}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous</SelectItem>
                            <SelectItem value="draft">Brouillon</SelectItem>
                            <SelectItem value="posted">Validée</SelectItem>
                            <SelectItem value="voided">Annulée</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filters.shop_id ?? 'all'} onValueChange={(v) => applyFilter('shop_id', v === 'all' ? null : v)}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Boutique" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes</SelectItem>
                            {shops.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Input type="date" value={filters.start_date ?? ''} onChange={(e) => applyFilter('start_date', e.target.value || null)} className="w-40" />
                    <Input type="date" value={filters.end_date ?? ''} onChange={(e) => applyFilter('end_date', e.target.value || null)} className="w-40" />
                </div>

                {/* Table */}
                {entries.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <BookOpen className="size-10 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Aucune écriture comptable</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Référence</th>
                                    <th className="px-4 py-3 font-medium">Date</th>
                                    <th className="px-4 py-3 font-medium">Description</th>
                                    <th className="px-4 py-3 font-medium">Boutique</th>
                                    <th className="px-4 py-3 font-medium text-right">Débit</th>
                                    <th className="px-4 py-3 font-medium text-right">Crédit</th>
                                    <th className="px-4 py-3 font-medium">Statut</th>
                                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {entries.data.map((entry) => {
                                    const st = statusMap[entry.status] ?? { label: entry.status, variant: 'outline' as const };
                                    return (
                                        <tr key={entry.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 font-mono text-xs">{entry.reference}</td>
                                            <td className="px-4 py-3">{new Date(entry.date).toLocaleDateString('fr-FR')}</td>
                                            <td className="max-w-xs truncate px-4 py-3">{entry.description}</td>
                                            <td className="px-4 py-3">{entry.shop?.name ?? '—'}</td>
                                            <td className="px-4 py-3 text-right font-semibold">{fmt(entry.total_debit)} F</td>
                                            <td className="px-4 py-3 text-right font-semibold">{fmt(entry.total_credit)} F</td>
                                            <td className="px-4 py-3">
                                                <Badge variant={st.variant}>{st.label}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button asChild variant="ghost" size="icon" className="size-8">
                                                    <Link href={showJournalEntry(entry.id).url}>
                                                        <Eye className="size-4" />
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {entries.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {entries.links.map((link) => (
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
