import { Form, Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import ShopController, { index as shopsIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/ShopController';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import ShopForm from './_form';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Magasins', href: shopsIndex().url },
    { title: 'Nouveau magasin', href: '#' },
];

export default function ShopsCreate() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouveau magasin" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="size-8">
                        <a href={shopsIndex().url}>
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Retour</span>
                        </a>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Nouveau magasin</h1>
                        <p className="text-sm text-muted-foreground">Remplissez les informations ci-dessous</p>
                    </div>
                </div>

                <Separator />

                <Form {...ShopController.store.form()}>
                    {({ processing, errors }) => (
                        <>
                            <ShopForm errors={errors} />

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" asChild>
                                    <a href={shopsIndex().url}>Annuler</a>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Enregistrement…' : 'Créer le magasin'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
