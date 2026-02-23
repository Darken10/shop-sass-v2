import { Form, Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import ProductController, { index as productsIndex } from '@/actions/App/Http/Controllers/Admin/ProductController';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import ProductForm from './_form';

type Category = { id: string; name: string };
type ProductTag = { id: string; name: string };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Produits', href: productsIndex().url },
    { title: 'Nouveau produit', href: '#' },
];

type Props = {
    categories: Category[];
    tags: ProductTag[];
    statuses: { value: string; name: string }[];
    unities: { value: string; name: string }[];
};

export default function ProductsCreate({ categories, tags }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouveau produit" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="size-8">
                        <a href={productsIndex().url}>
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Retour</span>
                        </a>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Nouveau produit</h1>
                        <p className="text-sm text-muted-foreground">Remplissez les informations ci-dessous</p>
                    </div>
                </div>

                <Separator />

                <Form {...ProductController.store.form()} encType="multipart/form-data">
                    {({ processing, errors }) => (
                        <>
                            <ProductForm categories={categories} tags={tags} errors={errors} />

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" asChild>
                                    <a href={productsIndex().url}>Annuler</a>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Enregistrement…' : 'Créer le produit'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
