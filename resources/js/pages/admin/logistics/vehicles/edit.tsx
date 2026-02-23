import { Form, Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import VehicleController, { index as vehiclesIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/VehicleController';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import VehicleForm from './_form';

type Vehicle = {
    id: string;
    name: string;
    type: string;
    registration_number: string;
    load_capacity: string | null;
    average_consumption: string | null;
    status: string;
    notes: string | null;
};

export default function VehiclesEdit({ vehicle }: { vehicle: Vehicle }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Engins', href: vehiclesIndex().url },
        { title: 'Modifier', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Modifier ${vehicle.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="size-8">
                        <a href={vehiclesIndex().url}>
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Retour</span>
                        </a>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Modifier l'engin</h1>
                        <p className="text-sm text-muted-foreground">{vehicle.name}</p>
                    </div>
                </div>

                <Separator />

                <Form {...VehicleController.update.form(vehicle.id)}>
                    {({ processing, errors }) => (
                        <>
                            <VehicleForm
                                defaults={{
                                    name: vehicle.name,
                                    type: vehicle.type,
                                    registration_number: vehicle.registration_number,
                                    load_capacity: vehicle.load_capacity ?? undefined,
                                    average_consumption: vehicle.average_consumption ?? undefined,
                                    status: vehicle.status,
                                    notes: vehicle.notes ?? undefined,
                                }}
                                errors={errors}
                            />

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" asChild>
                                    <a href={vehiclesIndex().url}>Annuler</a>
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
