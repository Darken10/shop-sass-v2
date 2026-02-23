import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Building2, Edit, Globe, Mail, MapPin, Phone, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { destroy, edit, index as companiesIndex } from '@/actions/App/Http/Controllers/Admin/CompanyController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

type CompanyWithId = App.Data.CompanyData & { id: string };

export default function CompaniesShow({ company }: { company: CompanyWithId }) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const status = statusConfig[company.status];

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Entreprises', href: companiesIndex().url },
        { title: company.name, href: '#' },
    ];

    function handleDelete() {
        setIsDeleting(true);
        router.delete(destroy(company.id).url, {
            onFinish: () => {
                setIsDeleting(false);
                setShowDeleteDialog(false);
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={company.name} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="size-8">
                        <Link href={companiesIndex().url}>
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Retour</span>
                        </Link>
                    </Button>
                    <div className="flex flex-1 items-center gap-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            {company.logo ? (
                                <img src={company.logo} alt={company.name} className="size-10 rounded-lg object-cover" />
                            ) : (
                                <Building2 className="size-6 text-primary" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3">
                                <h1 className="truncate text-xl font-semibold">{company.name}</h1>
                                <Badge variant={status.variant}>{status.label}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{typeLabels[company.type]}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href={edit(company.id).url}>
                                <Edit className="size-4" />
                                Modifier
                            </Link>
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowDeleteDialog(true)}
                        >
                            <Trash2 className="size-4" />
                            Supprimer
                        </Button>
                    </div>
                </div>

                <Separator />

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main details */}
                    <div className="space-y-6 lg:col-span-2">
                        {company.description && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">À propos</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm leading-relaxed text-muted-foreground">{company.description}</p>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <MapPin className="size-4" />
                                    Adresse
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {[company.address, company.city, company.state, company.postal_code, company.country].some(Boolean) ? (
                                    <address className="not-italic text-sm text-muted-foreground leading-loose">
                                        {company.address && <div>{company.address}</div>}
                                        {(company.postal_code || company.city) && (
                                            <div>{[company.postal_code, company.city].filter(Boolean).join(' ')}</div>
                                        )}
                                        {company.state && <div>{company.state}</div>}
                                        {company.country && <div>{company.country}</div>}
                                    </address>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Aucune adresse renseignée</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Side info */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Phone className="size-4" />
                                    Contact
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {company.email ? (
                                    <a
                                        href={`mailto:${company.email}`}
                                        className="flex items-center gap-2 text-sm hover:underline"
                                    >
                                        <Mail className="size-4 shrink-0 text-muted-foreground" />
                                        {company.email}
                                    </a>
                                ) : null}

                                {company.phone ? (
                                    <a
                                        href={`tel:${company.phone}`}
                                        className="flex items-center gap-2 text-sm hover:underline"
                                    >
                                        <Phone className="size-4 shrink-0 text-muted-foreground" />
                                        {company.phone}
                                    </a>
                                ) : null}

                                {company.website ? (
                                    <a
                                        href={company.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm hover:underline"
                                    >
                                        <Globe className="size-4 shrink-0 text-muted-foreground" />
                                        {company.website.replace(/^https?:\/\//, '')}
                                    </a>
                                ) : null}

                                {!company.email && !company.phone && !company.website && (
                                    <p className="text-sm text-muted-foreground">Aucun contact renseigné</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Delete dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer l'entreprise</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer <strong>{company.name}</strong> ? Cette action est irréversible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
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
