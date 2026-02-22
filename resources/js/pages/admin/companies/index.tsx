import { Head, Link, router } from '@inertiajs/react';
import { Building2, Edit, Eye, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { index as companiesIndex, create, destroy, edit, show } from '@/actions/App/Http/Controllers/Admin/CompanyController';

type Creator = { id: string; name: string };

type Company = {
    id: string;
    name: string;
    type: App.Enums.CompanyTypeEnum;
    status: App.Enums.CompanyStatusEnum;
    email: string | null;
    city: string | null;
    country: string | null;
    created_at: string;
    creator: Creator | null;
};

type PaginatedCompanies = {
    data: Company[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Entreprises', href: companiesIndex().url },
];

const statusConfig: Record<App.Enums.CompanyStatusEnum, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Actif', variant: 'default' },
    inactive: { label: 'Inactif', variant: 'secondary' },
    suspended: { label: 'Suspendu', variant: 'destructive' },
};

const typeLabels: Record<App.Enums.CompanyTypeEnum, string> = {
    alimentation: 'Alimentation',
    boutique: 'Boutique',
    restaurant: 'Restaurant',
    pharmacy: 'Pharmacie',
    service: 'Service',
};

export default function CompaniesIndex({ companies }: { companies: PaginatedCompanies }) {
    const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
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
            <Head title="Entreprises" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                            <Building2 className="size-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Entreprises</h1>
                            <p className="text-sm text-muted-foreground">
                                {companies.total} entreprise{companies.total !== 1 ? 's' : ''} enregistrée{companies.total !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <Button asChild size="sm">
                        <Link href={create().url} prefetch>
                            <Plus className="size-4" />
                            Nouvelle entreprise
                        </Link>
                    </Button>
                </div>

                <Separator />

                {/* Table */}
                <Card>
                    <CardHeader className="pb-0">
                        <p className="text-sm text-muted-foreground">
                            Page {companies.current_page} sur {companies.last_page}
                        </p>
                    </CardHeader>
                    <CardContent className="p-0">
                        {companies.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                                <Building2 className="size-12 text-muted-foreground/40" />
                                <div>
                                    <p className="font-medium">Aucune entreprise trouvée</p>
                                    <p className="text-sm text-muted-foreground">Commencez par créer votre première entreprise.</p>
                                </div>
                                <Button asChild size="sm" variant="outline">
                                    <Link href={create().url}>
                                        <Plus className="size-4" />
                                        Créer une entreprise
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/40">
                                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Entreprise</th>
                                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Localisation</th>
                                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Créateur</th>
                                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {companies.data.map((company) => {
                                            const status = statusConfig[company.status];
                                            return (
                                                <tr key={company.id} className="transition-colors hover:bg-muted/30">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 font-semibold text-primary text-xs">
                                                                {company.name.slice(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{company.name}</p>
                                                                {company.email && (
                                                                    <p className="text-xs text-muted-foreground">{company.email}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {typeLabels[company.type]}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant={status.variant}>{status.label}</Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {[company.city, company.country].filter(Boolean).join(', ') || '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {company.creator?.name ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button asChild variant="ghost" size="icon" className="size-8">
                                                                <Link href={show(company.id).url} prefetch>
                                                                    <Eye className="size-4" />
                                                                    <span className="sr-only">Voir</span>
                                                                </Link>
                                                            </Button>
                                                            <Button asChild variant="ghost" size="icon" className="size-8">
                                                                <Link href={edit(company.id).url} prefetch>
                                                                    <Edit className="size-4" />
                                                                    <span className="sr-only">Modifier</span>
                                                                </Link>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8 text-destructive hover:text-destructive"
                                                                onClick={() => setDeleteTarget(company)}
                                                            >
                                                                <Trash2 className="size-4" />
                                                                <span className="sr-only">Supprimer</span>
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {companies.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {companies.links.map((link, i) => (
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

            {/* Delete confirmation dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer l'entreprise</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer <strong>{deleteTarget?.name}</strong> ? Cette action est irréversible.
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
