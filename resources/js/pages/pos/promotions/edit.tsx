import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { index as promotionsIndex, update as updatePromotion } from '@/actions/App/Http/Controllers/Pos/PromotionController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Shop = { id: string; name: string };
type Product = { id: string; name: string; code: string };
type PromotionType = { value: string; name: string };
type Promotion = {
    id: string;
    name: string;
    type: string;
    value: string;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
    description: string | null;
    shop_id: string | null;
    products: { id: string; name: string }[];
};

function toLocalDatetime(isoDate: string): string {
    const d = new Date(isoDate);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
}

export default function PromotionEdit({
    promotion,
    shops,
    products,
    promotionTypes,
}: {
    promotion: Promotion;
    shops: Shop[];
    products: Product[];
    promotionTypes: PromotionType[];
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Point de vente', href: '/pos' },
        { title: 'Promotions', href: promotionsIndex().url },
        { title: promotion.name, href: '#' },
    ];

    const form = useForm({
        name: promotion.name,
        type: promotion.type,
        value: Number(promotion.value),
        starts_at: toLocalDatetime(promotion.starts_at),
        ends_at: toLocalDatetime(promotion.ends_at),
        is_active: promotion.is_active,
        description: promotion.description ?? '',
        shop_id: promotion.shop_id ?? '',
        product_ids: promotion.products.map((p) => p.id),
    });

    function formatDatetime(value: string): string {
        if (!value) return '';
        return value.replace('T', ' ') + (value.length === 16 ? ':00' : '');
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            starts_at: formatDatetime(data.starts_at),
            ends_at: formatDatetime(data.ends_at),
            shop_id: data.shop_id || undefined,
            product_ids: data.product_ids.length > 0 ? data.product_ids : undefined,
        }));
        form.put(updatePromotion(promotion.id).url);
    }

    function toggleProduct(productId: string) {
        const ids = form.data.product_ids.includes(productId)
            ? form.data.product_ids.filter((id) => id !== productId)
            : [...form.data.product_ids, productId];
        form.setData('product_ids', ids);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Modifier ${promotion.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={promotionsIndex().url}>
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Modifier la promotion</h1>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Nom *</Label>
                                <Input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required />
                                {form.errors.name && <p className="mt-1 text-xs text-destructive">{form.errors.name}</p>}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label>Type *</Label>
                                    <Select value={form.data.type} onValueChange={(v) => form.setData('type', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                                            <SelectItem value="fixed_amount">Montant fixe (F)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Valeur *</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step={form.data.type === 'percentage' ? '0.01' : '1'}
                                        value={form.data.value}
                                        onChange={(e) => form.setData('value', Number(e.target.value))}
                                        required
                                    />
                                    {form.errors.value && <p className="mt-1 text-xs text-destructive">{form.errors.value}</p>}
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label>Début *</Label>
                                    <Input type="datetime-local" value={form.data.starts_at} onChange={(e) => form.setData('starts_at', e.target.value)} required />
                                    {form.errors.starts_at && <p className="mt-1 text-xs text-destructive">{form.errors.starts_at}</p>}
                                </div>
                                <div>
                                    <Label>Fin *</Label>
                                    <Input type="datetime-local" value={form.data.ends_at} onChange={(e) => form.setData('ends_at', e.target.value)} required />
                                    {form.errors.ends_at && <p className="mt-1 text-xs text-destructive">{form.errors.ends_at}</p>}
                                </div>
                            </div>

                            <div>
                                <Label>Magasin (optionnel)</Label>
                                <Select value={form.data.shop_id || 'all'} onValueChange={(v) => form.setData('shop_id', v === 'all' ? '' : v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tous les magasins" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous les magasins</SelectItem>
                                        {shops.map((shop) => (
                                            <SelectItem key={shop.id} value={shop.id}>
                                                {shop.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Description</Label>
                                <Input value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={form.data.is_active}
                                    onChange={(e) => form.setData('is_active', e.target.checked)}
                                    className="rounded"
                                />
                                <Label htmlFor="is_active">Promotion active</Label>
                            </div>

                            <Separator />

                            <div>
                                <Label>Produits concernés</Label>
                                <p className="mb-2 text-xs text-muted-foreground">
                                    Laissez vide pour appliquer à tous les produits.
                                </p>
                                <div className="max-h-48 overflow-auto rounded-lg border p-2">
                                    {products.map((product) => (
                                        <label key={product.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted">
                                            <input
                                                type="checkbox"
                                                checked={form.data.product_ids.includes(product.id)}
                                                onChange={() => toggleProduct(product.id)}
                                                className="rounded"
                                            />
                                            <span className="text-sm">{product.name}</span>
                                            <span className="text-xs text-muted-foreground">({product.code})</span>
                                        </label>
                                    ))}
                                </div>
                                {form.data.product_ids.length > 0 && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {form.data.product_ids.length} produit{form.data.product_ids.length > 1 ? 's' : ''} sélectionné{form.data.product_ids.length > 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={promotionsIndex().url}>Annuler</Link>
                                </Button>
                                <Button type="submit" disabled={form.processing}>
                                    {form.processing ? 'Enregistrement…' : 'Mettre à jour'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
