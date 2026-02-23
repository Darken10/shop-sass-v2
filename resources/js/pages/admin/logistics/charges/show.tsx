import { Head } from '@inertiajs/react';
import { ArrowLeft, Calendar, Coins, Link as LinkIcon, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { index as chargesIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/LogisticChargeController';

type LogisticCharge = {
    id: string;
    label: string;
    type: string;
    amount: string;
    notes: string | null;
    stock_movement: { id: string; reference: string } | null;
    supply_request: { id: string; reference: string } | null;
    created_by: { id: string; name: string } | null;
    created_at: string;
    updated_at: string;
};

const chargeTypeLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    fuel: { label: 'Carburant', variant: 'default' },
    handling: { label: 'Manutention', variant: 'secondary' },
    loading: { label: 'Chargement', variant: 'outline' },
    unloading: { label: 'Déchargement', variant: 'outline' },
    toll: { label: 'Péage', variant: 'secondary' },
    packaging: { label: 'Emballage', variant: 'secondary' },
    insurance: { label: 'Assurance', variant: 'default' },
    other: { label: 'Autre', variant: 'outline' },
};

export default function ChargeShow({ charge }: { charge: LogisticCharge }) {
    const typeConfig = chargeTypeLabels[charge.type] ?? { label: charge.type, variant: 'outline' as const };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Charges logistiques', href: chargesIndex().url },
        { title: charge.label, href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={charge.label} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="size-8">
                        <a href={chargesIndex().url}>
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Retour</span>
                        </a>
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-lg border bg-muted">
                            <Coins className="size-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">{charge.label}</h1>
                            <div className="flex items-center gap-2">
                                <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        {/* Amount card */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex size-14 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                                        <Coins className="size-7 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Montant de la charge</p>
                                        <p className="text-2xl font-bold">
                                            {Number(charge.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Linked references */}
                        {(charge.stock_movement || charge.supply_request) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <LinkIcon className="size-4" />
                                        Références liées
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {charge.stock_movement && (
                                        <div className="flex items-center justify-between rounded-lg border p-3">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Mouvement de stock</p>
                                                <p className="font-mono text-sm font-semibold">{charge.stock_movement.reference}</p>
                                            </div>
                                            <Badge variant="outline">Mouvement</Badge>
                                        </div>
                                    )}
                                    {charge.supply_request && (
                                        <div className="flex items-center justify-between rounded-lg border p-3">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Demande d'approvisionnement</p>
                                                <p className="font-mono text-sm font-semibold">{charge.supply_request.reference}</p>
                                            </div>
                                            <Badge variant="outline">Approvisionnement</Badge>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Notes */}
                        {charge.notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Notes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{charge.notes}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Calendar className="size-4" />
                                    Détails
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div>
                                    <p className="text-xs text-muted-foreground">Type</p>
                                    <Badge variant={typeConfig.variant} className="mt-1">{typeConfig.label}</Badge>
                                </div>
                                {charge.created_by && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <User className="size-3.5" />
                                        <span>Créé par {charge.created_by.name}</span>
                                    </div>
                                )}
                                <div className="text-muted-foreground">
                                    Créé le {new Date(charge.created_at).toLocaleDateString('fr-FR')}
                                </div>
                                <div className="text-muted-foreground">
                                    Modifié le {new Date(charge.updated_at).toLocaleDateString('fr-FR')}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
