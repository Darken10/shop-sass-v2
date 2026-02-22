import { Form, Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import UserController, { index as usersIndex } from '@/actions/App/Http/Controllers/Admin/UserController';
import UserForm from './_form';

type CompanyOption = { id: string; name: string };

type Props = {
    roles: string[];
    companies: CompanyOption[];
    auth: { roles: string[] };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Utilisateurs', href: usersIndex().url },
    { title: 'Nouvel utilisateur', href: '#' },
];

export default function UsersCreate({ roles, companies, auth }: Props) {
    const isSuperAdmin = auth.roles?.includes('super admin') ?? false;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouvel utilisateur" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="size-8">
                        <a href={usersIndex().url}>
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Retour</span>
                        </a>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Nouvel utilisateur</h1>
                        <p className="text-sm text-muted-foreground">
                            Un email d{"'"}activation sera envoyé automatiquement
                        </p>
                    </div>
                </div>

                <Separator />

                <Form {...UserController.store.form()}>
                    {({ processing, errors }) => (
                        <>
                            <UserForm
                                roles={roles}
                                companies={companies}
                                isSuperAdmin={isSuperAdmin}
                                errors={errors}
                            />

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" asChild>
                                    <a href={usersIndex().url}>Annuler</a>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Création…' : "Créer l'utilisateur"}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
