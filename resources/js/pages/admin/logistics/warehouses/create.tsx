import { Form, Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import WarehouseController, { index as warehousesIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/WarehouseController';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import WarehouseForm from './_form';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Entrepôts', href: warehousesIndex().url },
    { title: 'Nouvel entrepôt', href: '#' },
];

export default function WarehousesCreate() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouvel entrepôt" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="size-8">
                        <a href={warehousesIndex().url}>
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Retour</span>
                        </a>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Nouvel entrepôt</h1>
                        <p className="text-sm text-muted-foreground">Remplissez les informations ci-dessous</p>
                    </div>
                </div>

                <Separator />

                <Form {...WarehouseController.store.form()}>
                    {({ processing, errors }) => (
                        <>
                            <WarehouseForm errors={errors} />

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" asChild>
                                    <a href={warehousesIndex().url}>Annuler</a>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Enregistrement…' : 'Créer l\'entrepôt'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
