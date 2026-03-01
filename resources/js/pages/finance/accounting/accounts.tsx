import { Head, Link, router, useForm } from '@inertiajs/react';
import { BookOpen, Plus } from 'lucide-react';
import { type FormEventHandler, useState } from 'react';
import { accounts as accountsAction, storeAccount } from '@/actions/App/Http/Controllers/Finance/AccountingController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Account = {
    id: string;
    name: string;
    code: string;
    type: string;
    description: string | null;
    balance: string;
    is_active: boolean;
    is_system: boolean;
    category: { id: string; name: string } | null;
};

type PaginatedAccounts = {
    data: Account[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
};

type AccountTypeOption = { value: string; label: string };
type Category = { id: string; name: string; type: string };
type Props = {
    accounts: PaginatedAccounts;
    accountTypes: AccountTypeOption[];
    categories: Category[];
    filters: Record<string, string | null>;
};

function fmt(v: string | number): string {
    return Number(v).toLocaleString('fr-FR');
}

const typeColors: Record<string, string> = {
    asset: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    liability: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    equity: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    revenue: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    expense: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Finance', href: '/finance' },
    { title: 'Plan comptable', href: '/finance/accounting/accounts' },
];

export default function AccountsPage({ accounts, accountTypes, categories, filters }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);

    function applyFilter(key: string, value: string | null) {
        router.get('/finance/accounting/accounts', { ...filters, [key]: value || undefined }, { preserveState: true, preserveScroll: true });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Finance — Plan comptable" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg border bg-muted">
                            <BookOpen className="size-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Plan comptable</h1>
                            <p className="text-sm text-muted-foreground">{accounts.total} compte(s)</p>
                        </div>
                    </div>

                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">
                                <Plus className="size-4" />
                                Nouveau compte
                            </Button>
                        </DialogTrigger>
                        <CreateAccountDialog accountTypes={accountTypes} categories={categories} onSuccess={() => setDialogOpen(false)} />
                    </Dialog>
                </div>

                <Separator />

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <Select value={filters.type ?? 'all'} onValueChange={(v) => applyFilter('type', v === 'all' ? null : v)}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous</SelectItem>
                            {accountTypes.map((t) => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filters.is_active ?? 'all'} onValueChange={(v) => applyFilter('is_active', v === 'all' ? null : v)}>
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous</SelectItem>
                            <SelectItem value="1">Actifs</SelectItem>
                            <SelectItem value="0">Inactifs</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                {accounts.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <BookOpen className="size-10 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Aucun compte trouvé</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Code</th>
                                    <th className="px-4 py-3 font-medium">Nom</th>
                                    <th className="px-4 py-3 font-medium">Type</th>
                                    <th className="px-4 py-3 font-medium">Catégorie</th>
                                    <th className="px-4 py-3 font-medium text-right">Solde</th>
                                    <th className="px-4 py-3 font-medium">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {accounts.data.map((acc) => {
                                    const typeLabel = accountTypes.find((t) => t.value === acc.type)?.label ?? acc.type;
                                    return (
                                        <tr key={acc.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3 font-mono text-xs font-semibold">{acc.code}</td>
                                            <td className="px-4 py-3 font-medium">{acc.name}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[acc.type] ?? ''}`}>
                                                    {typeLabel}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">{acc.category?.name ?? '—'}</td>
                                            <td className="px-4 py-3 text-right font-semibold">{fmt(acc.balance)} F</td>
                                            <td className="px-4 py-3">
                                                <Badge variant={acc.is_active ? 'default' : 'secondary'}>{acc.is_active ? 'Actif' : 'Inactif'}</Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {accounts.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {accounts.links.map((link) => (
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

// ── Create Account Dialog ─────────────────────────────────────
function CreateAccountDialog({ accountTypes, categories, onSuccess }: { accountTypes: AccountTypeOption[]; categories: Category[]; onSuccess: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        code: '',
        type: '',
        description: '',
        category_id: '',
        is_active: true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(storeAccount().url, {
            onSuccess: () => {
                reset();
                onSuccess();
            },
        });
    };

    return (
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Nouveau compte</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                    <Label>Nom *</Label>
                    <Input value={data.name} onChange={(e) => setData('name', e.target.value)} />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label>Code *</Label>
                        <Input value={data.code} onChange={(e) => setData('code', e.target.value)} placeholder="411000" />
                        {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label>Type *</Label>
                        <Select value={data.type} onValueChange={(v) => setData('type', v)}>
                            <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                            <SelectContent>
                                {accountTypes.map((t) => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label>Catégorie</Label>
                    <Select value={data.category_id} onValueChange={(v) => setData('category_id', v)}>
                        <SelectTrigger><SelectValue placeholder="Optionnel" /></SelectTrigger>
                        <SelectContent>
                            {categories.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea value={data.description} onChange={(e) => setData('description', e.target.value)} rows={2} />
                </div>
                <div className="flex items-center gap-2">
                    <Checkbox checked={data.is_active} onCheckedChange={(v) => setData('is_active', v)} />
                    <Label>Compte actif</Label>
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={processing}>Créer</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
