import { Form, Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import UserController, { index as usersIndex } from '@/actions/App/Http/Controllers/Admin/UserController';
import UserForm from './_form';

type CompanyOption = { id: string; name: string };

type UserData = {
    id: string;
    name: string;
    email: string;
    company_id: string | null;
    role: string | null;
    is_activated: boolean;
    email_verified_at: string | null;
};

type Props = {
    user: UserData;
    roles: string[];
    companies: CompanyOption[];
    auth: { roles: string[] };
};

export default function UsersEdit({ user, roles, companies, auth }: Props) {
    const isSuperAdmin = auth.roles?.includes('super admin') ?? false;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Utilisateurs', href: usersIndex().url },
        { title: user.name, href: '#' },
        { title: 'Modifier', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Modifier — ${user.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="size-8">
                        <a href={usersIndex().url}>
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Retour</span>
                        </a>
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">Modifier l{"'"}utilisateur</h1>
                        <p className="text-sm text-muted-foreground">{user.name}</p>
                    </div>
                </div>

                <Separator />

                <Form {...UserController.update.form(user)}>
                    {({ processing, errors }) => (
                        <>
                            <UserForm
                                defaults={{
                                    name: user.name,
                                    email: user.email,
                                    role: user.role ?? undefined,
                                    company_id: user.company_id ?? undefined,
                                }}
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
