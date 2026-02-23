import { Form, Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import SupplierController, { index as suppliersIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/SupplierController';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import SupplierForm from './_form';

type Supplier = {
    id: string;
    name: string;
    code: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    notes: string | null;
    is_active: boolean;
};

export default function SuppliersEdit({ supplier }: { supplier: Supplier }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Fournisseurs', href: suppliersIndex().url },
        { title: 'Modifier', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Modifier ${supplier.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="size-8">
                        <a href={suppliersIndex().url}>
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Retour</span>
                        </a>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Modifier le fournisseur</h1>
                        <p className="text-sm text-muted-foreground">{supplier.name}</p>
                    </div>
                </div>

                <Separator />

                <Form {...SupplierController.update.form(supplier.id)}>
                    {({ processing, errors }) => (
                        <>
                            <SupplierForm
                                defaults={{
                                    name: supplier.name,
                                    code: supplier.code,
                                    contact_name: supplier.contact_name ?? undefined,
                                    email: supplier.email ?? undefined,
                                    phone: supplier.phone ?? undefined,
                                    address: supplier.address ?? undefined,
                                    city: supplier.city ?? undefined,
                                    notes: supplier.notes ?? undefined,
                                    is_active: supplier.is_active,
                                }}
                                errors={errors}
                            />

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" asChild>
                                    <a href={suppliersIndex().url}>Annuler</a>
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
