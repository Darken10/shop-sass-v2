import { Head, Link, router } from '@inertiajs/react';
import { Eye, Plus, Receipt, Trash2 } from 'lucide-react';
import { create, destroy, show } from '@/actions/App/Http/Controllers/Finance/ExpenseController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Expense = {
    id: string;
    reference: string;
    label: string;
    amount: string;
    date: string;
    status: string;
    payment_method: string;
    category: { id: string; name: string; color: string | null } | null;
    shop: { id: string; name: string } | null;
    warehouse: { id: string; name: string } | null;
    supplier: { id: string; name: string } | null;
    creator: { id: string; name: string } | null;
};

type PaginatedExpenses = {
    data: Expense[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
};

type FilterOption = { id: string; name: string; color?: string | null };
type Props = {
    expenses: PaginatedExpenses;
    categories: FilterOption[];
    shops: FilterOption[];
    warehouses: FilterOption[];
    filters: Record<string, string | null>;
};

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'En attente', variant: 'outline' },
    approved: { label: 'Approuvée', variant: 'default' },
    rejected: { label: 'Rejetée', variant: 'destructive' },
};

function fmt(v: string | number): string {
    return Number(v).toLocaleString('fr-FR');
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Finance', href: '/finance' },
    { title: 'Dépenses', href: '/finance/expenses' },
];

export default function ExpensesIndex({ expenses, categories, shops, warehouses, filters }: Props) {
    function applyFilter(key: string, value: string | null) {
        router.get('/finance/expenses', { ...filters, [key]: value || undefined }, { preserveState: true, preserveScroll: true });
    }

    function handleDelete(expense: Expense) {
        if (!confirm(`Supprimer la dépense ${expense.reference} ?`)) return;
        router.delete(destroy(expense.id).url);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Finance — Dépenses" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg border bg-muted">
                            <Receipt className="size-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Dépenses</h1>
                            <p className="text-sm text-muted-foreground">{expenses.total} dépense(s)</p>
                        </div>
                    </div>
                    <Button asChild size="sm">
                        <Link href={create().url}>
                            <Plus className="size-4" />
                            Nouvelle dépense
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
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="approved">Approuvée</SelectItem>
                            <SelectItem value="rejected">Rejetée</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filters.category_id ?? 'all'} onValueChange={(v) => applyFilter('category_id', v === 'all' ? null : v)}>
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
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
                {expenses.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Receipt className="size-10 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Aucune dépense trouvée</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Référence</th>
                                    <th className="px-4 py-3 font-medium">Libellé</th>
                                    <th className="px-4 py-3 font-medium">Catégorie</th>
                                    <th className="px-4 py-3 font-medium">Boutique</th>
                                    <th className="px-4 py-3 font-medium text-right">Montant</th>
                                    <th className="px-4 py-3 font-medium">Date</th>
                                    <th className="px-4 py-3 font-medium">Statut</th>
                                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {expenses.data.map((exp) => {
                                    const st = statusMap[exp.status] ?? { label: exp.status, variant: 'outline' as const };
                                    return (
                                        <tr key={exp.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 font-mono text-xs">{exp.reference}</td>
                                            <td className="px-4 py-3 font-medium">{exp.label}</td>
                                            <td className="px-4 py-3">
                                                {exp.category ? (
                                                    <span className="flex items-center gap-1.5">
                                                        {exp.category.color && <span className="size-2 rounded-full" style={{ backgroundColor: exp.category.color }} />}
                                                        {exp.category.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">{exp.shop?.name ?? '—'}</td>
                                            <td className="px-4 py-3 text-right font-semibold">{fmt(exp.amount)} F</td>
                                            <td className="px-4 py-3">{new Date(exp.date).toLocaleDateString('fr-FR')}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant={st.variant}>{st.label}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button asChild variant="ghost" size="icon" className="size-8">
                                                        <Link href={show(exp.id).url}>
                                                            <Eye className="size-4" />
                                                        </Link>
                                                    </Button>
                                                    {exp.status === 'pending' && (
                                                        <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => handleDelete(exp)}>
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {expenses.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {expenses.links.map((link) => (
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
