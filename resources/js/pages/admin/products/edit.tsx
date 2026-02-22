import { Form, Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import ProductController, { index as productsIndex } from '@/actions/App/Http/Controllers/Admin/ProductController';
import ProductForm from './_form';

type Category = { id: string; name: string };
type ProductTag = { id: string; name: string };

type Product = {
    id: string;
    name: string;
    code: string;
    description: string | null;
    price: string;
    cost_price: string | null;
    stock: number;
    stock_alert: number;
    unity: string;
    status: string;
    image: string | null;
    category_id: string;
    tags: ProductTag[];
};

type Props = {
    product: Product;
    categories: Category[];
    tags: ProductTag[];
    statuses: { value: string; name: string }[];
    unities: { value: string; name: string }[];
};

export default function ProductsEdit({ product, categories, tags }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Produits', href: productsIndex().url },
        { title: 'Modifier', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Modifier ${product.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="size-8">
                        <a href={productsIndex().url}>
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Retour</span>
                        </a>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Modifier le produit</h1>
                        <p className="text-sm text-muted-foreground">{product.name}</p>
                    </div>
                </div>

                <Separator />

                <Form {...ProductController.update.form(product.id)} encType="multipart/form-data">
                    {({ processing, errors }) => (
                        <>
                            <ProductForm
                                defaults={{
                                    name: product.name,
                                    code: product.code,
                                    description: product.description ?? undefined,
                                    price: product.price,
                                    cost_price: product.cost_price ?? undefined,
                                    stock: product.stock,
                                    stock_alert: product.stock_alert,
                                    unity: product.unity,
                                    status: product.status,
                                    image: product.image,
                                    category_id: product.category_id,
                                    tags: product.tags,
                                }}
                                categories={categories}
                                tags={tags}
                                errors={errors}
                            />

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" asChild>
                                    <a href={productsIndex().url}>Annuler</a>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Enregistrement…' : 'Mettre à jour'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
