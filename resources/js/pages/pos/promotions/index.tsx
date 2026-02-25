import { Head, Link, router } from '@inertiajs/react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { index as promotionsIndex, create as createPromotion, edit as editPromotion, destroy as destroyPromotion } from '@/actions/App/Http/Controllers/Pos/PromotionController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Promotion = {
    id: string;
    name: string;
    type: string;
    value: string;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
    description: string | null;
    shop: { id: string; name: string } | null;
    products: { id: string; name: string }[];
    created_by: { id: string; name: string } | null;
    created_at: string;
};

type PaginatedPromotions = {
    data: Promotion[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Point de vente', href: '/pos' },
    { title: 'Promotions', href: '#' },
];

export default function PromotionsIndex({ promotions }: { promotions: PaginatedPromotions }) {
    function handleDelete(promotion: Promotion) {
        if (confirm(`Supprimer la promotion "${promotion.name}" ?`)) {
            router.delete(destroyPromotion(promotion.id).url);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Promotions" />

            <div className="mx-auto max-w-5xl space-y-4 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Promotions</h1>
                        <p className="text-sm text-muted-foreground">{promotions.total} promotion{promotions.total > 1 ? 's' : ''}</p>
                    </div>
                    <Button asChild>
                        <Link href={createPromotion().url}>
                            <Plus className="size-4" /> Nouvelle promotion
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50 text-left">
                                        <th className="px-4 py-3 font-medium">Nom</th>
                                        <th className="px-4 py-3 font-medium">Type</th>
                                        <th className="px-4 py-3 font-medium">Valeur</th>
                                        <th className="px-4 py-3 font-medium">Magasin</th>
                                        <th className="px-4 py-3 font-medium">Produits</th>
                                        <th className="px-4 py-3 font-medium">Période</th>
                                        <th className="px-4 py-3 font-medium">Statut</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {promotions.data.map((promo) => {
                                        const now = new Date();
                                        const startsAt = new Date(promo.starts_at);
                                        const endsAt = new Date(promo.ends_at);
                                        const isCurrentlyActive = promo.is_active && startsAt <= now && endsAt >= now;

                                        return (
                                            <tr key={promo.id} className="border-b last:border-0 hover:bg-muted/30">
                                                <td className="px-4 py-3">
                                                    <p className="font-medium">{promo.name}</p>
                                                    {promo.description && <p className="text-xs text-muted-foreground">{promo.description}</p>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline">
                                                        {promo.type === 'percentage' ? 'Pourcentage' : 'Montant fixe'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 font-medium">
                                                    {promo.type === 'percentage'
                                                        ? `${promo.value}%`
                                                        : `${Number(promo.value).toLocaleString('fr-FR')} F`}
                                                </td>
                                                <td className="px-4 py-3">{promo.shop?.name ?? 'Tous'}</td>
                                                <td className="px-4 py-3">
                                                    {promo.products.length > 0 ? (
                                                        <span className="text-xs">{promo.products.map((p) => p.name).join(', ')}</span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">Tous les produits</span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-xs">
                                                    {startsAt.toLocaleDateString('fr-FR')} → {endsAt.toLocaleDateString('fr-FR')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={isCurrentlyActive ? 'default' : 'secondary'}>
                                                        {isCurrentlyActive ? 'Active' : promo.is_active ? 'Inactive' : 'Désactivée'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" className="size-7" asChild>
                                                            <Link href={editPromotion(promo.id).url}>
                                                                <Edit className="size-3.5" />
                                                            </Link>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => handleDelete(promo)}>
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {promotions.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {promotions.links.map((link, i) => (
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
