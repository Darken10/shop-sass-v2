import { Head, Link } from '@inertiajs/react';
import { Coins, Eye, Plus } from 'lucide-react';
import { create, show } from '@/actions/App/Http/Controllers/Admin/Logistics/LogisticChargeController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

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
};

type PaginatedCharges = {
    data: LogisticCharge[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Charges logistiques', href: '#' },
];

export default function ChargeIndex({ charges }: { charges: PaginatedCharges }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Charges logistiques" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg border bg-muted">
                            <Coins className="size-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Charges logistiques</h1>
                            <p className="text-sm text-muted-foreground">{charges.total} charge(s)</p>
                        </div>
                    </div>
                    <Button asChild size="sm" className="hidden sm:flex">
                        <Link href={create().url}>
                            <Plus className="size-4" />
                            Nouvelle charge
                        </Link>
                    </Button>
                </div>

                <Separator />

                <Button asChild size="sm" className="w-full sm:hidden">
                    <Link href={create().url}>
                        <Plus className="size-4" />
                        Nouvelle charge
                    </Link>
                </Button>

                {charges.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-16">
                        <Coins className="size-10 text-muted-foreground/50" />
                        <p className="text-muted-foreground">Aucune charge logistique enregistrée.</p>
                        <Button asChild variant="outline" size="sm">
                            <Link href={create().url}>
                                <Plus className="size-4" />
                                Ajouter une charge
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                                    <th className="px-4 py-3 font-medium">Libellé</th>
                                    <th className="px-4 py-3 font-medium">Type</th>
                                    <th className="px-4 py-3 text-right font-medium">Montant</th>
                                    <th className="px-4 py-3 font-medium">Référence liée</th>
                                    <th className="px-4 py-3 font-medium">Créé par</th>
                                    <th className="px-4 py-3 font-medium">Date</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {charges.data.map((charge) => {
                                    const typeConfig = chargeTypeLabels[charge.type] ?? { label: charge.type, variant: 'outline' as const };
                                    const linkedRef = charge.stock_movement?.reference ?? charge.supply_request?.reference ?? null;

                                    return (
                                        <tr key={charge.id} className="border-b last:border-0 hover:bg-muted/30">
                                            <td className="px-4 py-3 font-medium">{charge.label}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold">
                                                {Number(charge.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                                            </td>
                                            <td className="px-4 py-3">
                                                {linkedRef ? (
                                                    <span className="font-mono text-xs">{linkedRef}</span>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {charge.created_by?.name ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {new Date(charge.created_at).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button asChild variant="ghost" size="icon" className="size-8">
                                                    <Link href={show(charge.id).url}>
                                                        <Eye className="size-4" />
                                                        <span className="sr-only">Voir</span>
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

                {charges.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {charges.links.map((link) => (
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
