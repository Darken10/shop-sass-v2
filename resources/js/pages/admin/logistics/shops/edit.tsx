import { Form, Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import ShopController, { index as shopsIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/ShopController';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import ShopForm from './_form';

type Shop = {
    id: string;
    name: string;
    code: string;
    address: string | null;
    city: string | null;
    phone: string | null;
    status: string;
    description: string | null;
};

export default function ShopsEdit({ shop }: { shop: Shop }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Magasins', href: shopsIndex().url },
        { title: 'Modifier', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Modifier ${shop.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="size-8">
                        <a href={shopsIndex().url}>
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Retour</span>
                        </a>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Modifier le magasin</h1>
                        <p className="text-sm text-muted-foreground">{shop.name}</p>
                    </div>
                </div>

                <Separator />

                <Form {...ShopController.update.form(shop.id)}>
                    {({ processing, errors }) => (
                        <>
                            <ShopForm
                                defaults={{
                                    name: shop.name,
                                    code: shop.code,
                                    address: shop.address ?? undefined,
                                    city: shop.city ?? undefined,
                                    phone: shop.phone ?? undefined,
                                    status: shop.status,
                                    description: shop.description ?? undefined,
                                }}
                                errors={errors}
                            />

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" asChild>
                                    <a href={shopsIndex().url}>Annuler</a>
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
