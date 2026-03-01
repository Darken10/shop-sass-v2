import { Head, Link, router } from '@inertiajs/react';
import { Book, Search } from 'lucide-react';
import { useCallback, useState } from 'react';
import { index as catalogIndex } from '@/actions/App/Http/Controllers/Admin/CatalogProductController';
import { index as productsIndex } from '@/actions/App/Http/Controllers/Admin/ProductController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

type Props = {
    products: PaginatedCatalog;
    filters: { search?: string };
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

export default function CatalogIndex({ products, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

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
        </AppLayout>
    );
}
