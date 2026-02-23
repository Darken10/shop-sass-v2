import { Head, Link, router } from '@inertiajs/react';
import { Building2, Edit, Eye, Globe, Mail, MapPin, Plus, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { index as companiesIndex, create, destroy, edit, show } from '@/actions/App/Http/Controllers/Admin/CompanyController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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

type Creator = { id: string; name: string };

type Company = {
    id: string;
    name: string;
    type: App.Enums.CompanyTypeEnum;
    status: App.Enums.CompanyStatusEnum;
    email: string | null;
    phone: string | null;
    city: string | null;
    country: string | null;
    website: string | null;
    logo: string | null;
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

                {/* Cards grid */}
                {companies.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20 text-center">
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
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {companies.data.map((company) => {
                            const status = statusConfig[company.status];
                            const location = [company.city, company.country].filter(Boolean).join(', ');
                            return (
                                <Card key={company.id} className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
                                    {/* Top banner + avatar */}
                                    <div className="relative h-16 bg-primary/8">
                                        <div className="absolute -bottom-6 left-4 flex size-12 items-center justify-center rounded-xl border-2 border-background bg-background shadow-sm">
                                            {company.logo ? (
                                                <img
                                                    src={company.logo}
                                                    alt={company.name}
                                                    className="size-10 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <span className="text-sm font-bold text-primary">
                                                    {company.name.slice(0, 2).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="absolute right-3 top-3">
                                            <Badge variant={status.variant}>{status.label}</Badge>
                                        </div>
                                    </div>

                                    <CardContent className="flex flex-1 flex-col gap-3 pt-9">
                                        <div>
                                            <h3 className="truncate font-semibold leading-tight">{company.name}</h3>
                                            <p className="text-xs text-muted-foreground">{typeLabels[company.type]}</p>
                                        </div>

                                        <div className="space-y-1.5 text-xs text-muted-foreground">
                                            {company.email && (
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <Mail className="size-3 shrink-0" />
                                                    <span className="truncate">{company.email}</span>
                                                </div>
                                            )}
                                            {location && (
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <MapPin className="size-3 shrink-0" />
                                                    <span className="truncate">{location}</span>
                                                </div>
                                            )}
                                            {company.website && (
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <Globe className="size-3 shrink-0" />
                                                    <span className="truncate">{company.website.replace(/^https?:\/\//, '')}</span>
                                                </div>
                                            )}
                                            {company.creator && (
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <User className="size-3 shrink-0" />
                                                    <span className="truncate">{company.creator.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>

                                    <CardFooter className="gap-1 border-t p-2">
                                        <Button asChild variant="ghost" size="sm" className="flex-1">
                                            <Link href={show(company.id).url} prefetch>
                                                <Eye className="size-3.5" />
                                                Voir
                                            </Link>
                                        </Button>
                                        <Button asChild variant="ghost" size="sm" className="flex-1">
                                            <Link href={edit(company.id).url} prefetch>
                                                <Edit className="size-3.5" />
                                                Modifier
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1 text-destructive hover:text-destructive"
                                            onClick={() => setDeleteTarget(company)}
                                        >
                                            <Trash2 className="size-3.5" />
                                            Supprimer
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                )}

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
