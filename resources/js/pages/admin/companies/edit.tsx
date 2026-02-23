import { Form, Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import CompanyController, { index as companiesIndex, show } from '@/actions/App/Http/Controllers/Admin/CompanyController';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import CompanyForm from './_form';

type EnumOption = { value: string; name: string };

export default function CompaniesEdit({
    company,
    types,
}: {
    company: App.Data.CompanyData & { id: string };
    types: EnumOption[];
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Entreprises', href: companiesIndex().url },
        { title: company.name, href: show(company.id).url },
        { title: 'Modifier', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Modifier — ${company.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="size-8">
                        <a href={show(company.id).url}>
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Retour</span>
                        </a>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Modifier l'entreprise</h1>
                        <p className="text-sm text-muted-foreground">{company.name}</p>
                    </div>
                </div>

                <Separator />

                <Form {...CompanyController.update.form(company)}>
                    {({ processing, errors }) => (
                        <>
                            <CompanyForm
                                defaults={company}
                                types={types}
                                errors={errors}
                            />

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" asChild>
                                    <a href={show(company.id).url}>Annuler</a>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Enregistrement…' : 'Enregistrer les modifications'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
