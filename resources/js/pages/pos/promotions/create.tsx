import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { index as promotionsIndex, store as storePromotion } from '@/actions/App/Http/Controllers/Pos/PromotionController';
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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Point de vente', href: '/pos' },
    { title: 'Promotions', href: '/pos/promotions' },
    { title: 'Nouvelle', href: '#' },
];

export default function PromotionCreate({
    shops,
    products,
    promotionTypes,
}: {
    shops: Shop[];
    products: Product[];
    promotionTypes: PromotionType[];
}) {
    const form = useForm({
        name: '',
        type: 'percentage',
        value: 0,
        starts_at: '',
        ends_at: '',
        is_active: true,
        description: '',
        shop_id: '',
        product_ids: [] as string[],
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post(storePromotion().url);
    }

    function toggleProduct(productId: string) {
        const ids = form.data.product_ids.includes(productId)
            ? form.data.product_ids.filter((id) => id !== productId)
            : [...form.data.product_ids, productId];
        form.setData('product_ids', ids);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouvelle promotion" />

            <div className="mx-auto max-w-2xl space-y-6 p-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={promotionsIndex().url}>
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Nouvelle promotion</h1>
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

                            <div className="grid grid-cols-2 gap-4">
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

                            <div className="grid grid-cols-2 gap-4">
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
                                    {form.processing ? 'Création…' : 'Créer la promotion'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
