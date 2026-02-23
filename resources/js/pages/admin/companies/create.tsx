import { Form, Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import CompanyController, { index as companiesIndex } from '@/actions/App/Http/Controllers/Admin/CompanyController';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import CompanyForm from './_form';

type EnumOption = { value: string; name: string };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Entreprises', href: companiesIndex().url },
    { title: 'Nouvelle entreprise', href: '#' },
];

export default function CompaniesCreate({ types }: { types: EnumOption[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouvelle entreprise" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="size-8">
                        <a href={companiesIndex().url}>
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Retour</span>
                        </a>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Nouvelle entreprise</h1>
                        <p className="text-sm text-muted-foreground">Remplissez les informations ci-dessous</p>
                    </div>
                </div>

                <Separator />

                <Form {...CompanyController.store.form()}>
                    {({ processing, errors }) => (
                        <>
                            <CompanyForm types={types} errors={errors} />

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" asChild>
                                    <a href={companiesIndex().url}>Annuler</a>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Enregistrement…' : "Créer l'entreprise"}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
