import { Form, Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import WarehouseController, { index as warehousesIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/WarehouseController';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import WarehouseForm from './_form';

type Warehouse = {
    id: string;
    name: string;
    code: string;
    address: string | null;
    city: string | null;
    phone: string | null;
    status: string;
    description: string | null;
};

export default function WarehousesEdit({ warehouse }: { warehouse: Warehouse }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Entrepôts', href: warehousesIndex().url },
        { title: 'Modifier', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Modifier ${warehouse.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="size-8">
                        <a href={warehousesIndex().url}>
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Retour</span>
                        </a>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Modifier l'entrepôt</h1>
                        <p className="text-sm text-muted-foreground">{warehouse.name}</p>
                    </div>
                </div>

                <Separator />

                <Form {...WarehouseController.update.form(warehouse.id)}>
                    {({ processing, errors }) => (
                        <>
                            <WarehouseForm
                                defaults={{
                                    name: warehouse.name,
                                    code: warehouse.code,
                                    address: warehouse.address ?? undefined,
                                    city: warehouse.city ?? undefined,
                                    phone: warehouse.phone ?? undefined,
                                    status: warehouse.status,
                                    description: warehouse.description ?? undefined,
                                }}
                                errors={errors}
                            />

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" asChild>
                                    <a href={warehousesIndex().url}>Annuler</a>
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
