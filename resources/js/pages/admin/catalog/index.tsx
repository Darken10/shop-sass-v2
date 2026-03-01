import { Head, Link, router, useForm } from '@inertiajs/react';
import { Book, Check, Plus, Search, ShoppingBag } from 'lucide-react';
import { useCallback, useState } from 'react';
import { importToCompany } from '@/actions/App/Http/Controllers/Admin/CatalogProductController';
import { index as catalogIndex } from '@/actions/App/Http/Controllers/Admin/CatalogProductController';
import { index as productsIndex } from '@/actions/App/Http/Controllers/Admin/ProductController';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type CatalogProduct = {
    id: string;
    barcode: string;
    name: string;
    brand: string | null;
    description: string | null;
    image_url: string | null;
    category: string | null;
    unity: string;
    source: 'manual' | 'open_food_facts';
    created_at: string;
};

type PaginatedCatalog = {
    data: CatalogProduct[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type Category = { id: string; name: string };
type SelectOption = { value: string; label: string };

type Props = {
    products: PaginatedCatalog;
    filters: { search?: string };
    importedBarcodes: string[];
    categories: Category[];
    unities: SelectOption[];
    statuses: SelectOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Produits', href: productsIndex().url },
    { title: 'Catalogue global', href: catalogIndex().url },
];

const sourceConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    open_food_facts: { label: 'Open Food Facts', variant: 'secondary' },
    manual: { label: 'Manuel', variant: 'outline' },
};

type ImportFormData = {
    price: string;
    cost_price: string;
    stock: string;
    stock_alert: string;
    unity: string;
    status: string;
    category_id: string;
};

export default function CatalogIndex({ products, filters, importedBarcodes, categories, unities, statuses }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [importTarget, setImportTarget] = useState<CatalogProduct | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm<ImportFormData>({
        price: '',
        cost_price: '',
        stock: '0',
        stock_alert: '0',
        unity: 'piece',
        status: 'active',
        category_id: '',
    });

    const doSearch = useCallback(
        (value: string) => {
            router.get(
                catalogIndex().url,
                value ? { search: value } : {},
                { preserveState: true, replace: true },
            );
        },
        [],
    );

    function handleSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            doSearch(search);
        }
    }

    function openImport(product: CatalogProduct) {
        reset();
        setData('unity', product.unity ?? 'piece');
        setImportTarget(product);
    }

    function handleImport(e: React.FormEvent) {
        e.preventDefault();
        if (!importTarget) return;
        post(importToCompany(importTarget.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                setImportTarget(null);
                reset();
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Catalogue global" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                            <Book className="size-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Catalogue global</h1>
                            <p className="text-sm text-muted-foreground">
                                {products.total} produit{products.total !== 1 ? 's' : ''} dans le catalogue partagé
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Search */}
                <div className="flex w-full max-w-md items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par nom, marque ou code-barres…"
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleSearchKey}
                        />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => doSearch(search)}>
                        Rechercher
                    </Button>
                    {filters.search && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSearch('');
                                doSearch('');
                            }}
                        >
                            Effacer
                        </Button>
                    )}
                </div>

                {/* Cards grid */}
                {products.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20 text-center">
                        <Book className="size-12 text-muted-foreground/40" />
                        <div>
                            <p className="font-medium">Aucun produit trouvé</p>
                            <p className="text-sm text-muted-foreground">
                                {filters.search
                                    ? 'Essayez une autre recherche.'
                                    : 'Le catalogue est vide. Lancez la commande catalog:import.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {products.data.map((product) => {
                            const src = sourceConfig[product.source] ?? sourceConfig.manual;
                            const alreadyImported = importedBarcodes.includes(product.barcode);
                            return (
                                <Card key={product.id} className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
                                    <div className="relative h-32 bg-muted">
                                        {product.image_url ? (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="size-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex size-full items-center justify-center">
                                                <Book className="size-10 text-muted-foreground/30" />
                                            </div>
                                        )}
                                        <div className="absolute right-2 top-2">
                                            <Badge variant={src.variant} className="text-[10px]">
                                                {src.label}
                                            </Badge>
                                        </div>
                                    </div>

                                    <CardContent className="flex flex-1 flex-col gap-2 pt-4">
                                        <div>
                                            <h3 className="truncate font-semibold leading-tight">{product.name}</h3>
                                            {product.brand && (
                                                <p className="text-xs text-muted-foreground">{product.brand}</p>
                                            )}
                                        </div>

                                        <p className="font-mono text-xs text-muted-foreground">{product.barcode}</p>

                                        <div className="flex flex-wrap gap-1">
                                            {product.category && (
                                                <Badge variant="outline" className="text-[10px]">
                                                    {product.category}
                                                </Badge>
                                            )}
                                            <Badge variant="outline" className="text-[10px]">
                                                {product.unity}
                                            </Badge>
                                        </div>

                                        {product.description && (
                                            <p className="line-clamp-2 text-xs text-muted-foreground">
                                                {product.description}
                                            </p>
                                        )}

                                        <div className="mt-auto pt-2">
                                            {alreadyImported ? (
                                                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                                                    <Check className="size-3.5" />
                                                    Déjà dans votre boutique
                                                </div>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full"
                                                    onClick={() => openImport(product)}
                                                >
                                                    <Plus className="size-3.5" />
                                                    Ajouter à ma boutique
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {products.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {products.links.map((link, i) => (
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

            {/* Import dialog */}
            <Dialog open={!!importTarget} onOpenChange={(open) => { if (!open) { setImportTarget(null); reset(); } }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShoppingBag className="size-5" />
                            Ajouter à ma boutique
                        </DialogTitle>
                        {importTarget && (
                            <DialogDescription>
                                Configurez les informations commerciales pour <strong>{importTarget.name}</strong>.
                            </DialogDescription>
                        )}
                    </DialogHeader>

                    <form onSubmit={handleImport} className="space-y-4 pt-2">
                        {/* Price / cost */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="import-price">
                                    Prix de vente <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="import-price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={data.price}
                                    onChange={(e) => setData('price', e.target.value)}
                                />
                                <InputError message={errors.price} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="import-cost-price">Prix d'achat</Label>
                                <Input
                                    id="import-cost-price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={data.cost_price}
                                    onChange={(e) => setData('cost_price', e.target.value)}
                                />
                                <InputError message={errors.cost_price} />
                            </div>
                        </div>

                        {/* Stock / alert */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="import-stock">
                                    Stock initial <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="import-stock"
                                    type="number"
                                    min="0"
                                    value={data.stock}
                                    onChange={(e) => setData('stock', e.target.value)}
                                />
                                <InputError message={errors.stock} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="import-stock-alert">Seuil d'alerte</Label>
                                <Input
                                    id="import-stock-alert"
                                    type="number"
                                    min="0"
                                    value={data.stock_alert}
                                    onChange={(e) => setData('stock_alert', e.target.value)}
                                />
                                <InputError message={errors.stock_alert} />
                            </div>
                        </div>

                        {/* Unity */}
                        <div className="grid gap-1.5">
                            <Label>Unité</Label>
                            <Select value={data.unity} onValueChange={(v) => setData('unity', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Unité" />
                                </SelectTrigger>
                                <SelectContent>
                                    {unities.map((u) => (
                                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.unity} />
                        </div>

                        {/* Category */}
                        <div className="grid gap-1.5">
                            <Label>Catégorie</Label>
                            <Select value={data.category_id} onValueChange={(v) => setData('category_id', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir une catégorie" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.category_id} />
                        </div>

                        {/* Status */}
                        <div className="grid gap-1.5">
                            <Label>Statut</Label>
                            <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Statut" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.status} />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => { setImportTarget(null); reset(); }}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Ajout en cours…' : 'Ajouter à ma boutique'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
