import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/actions/App/Http/Controllers/ActivateAccountController';

type Props = {
    user: {
        id: string;
        name: string;
        email: string;
    };
    queryString: string;
};

export default function ActivateAccount({ user, queryString }: Props) {
    const actionUrl = `/activate/${user.id}${queryString ? '?' + queryString : ''}`;

    return (
        <AuthLayout
            title="Activez votre compte"
            description={`Bienvenue ${user.name} ! Définissez votre mot de passe pour activer votre compte.`}
        >
            <Head title="Activer mon compte" />

            <Form
                action={actionUrl}
                method={store.definition.methods[0]}
                resetOnSuccess={['password', 'password_confirmation']}
            >
                {({ processing, errors }) => (
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={user.email}
                                className="mt-1 block w-full"
                                readOnly
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                autoFocus
                                placeholder="Mot de passe"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">Confirmer le mot de passe</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                autoComplete="new-password"
                                className="mt-1 block w-full"
                                placeholder="Confirmer le mot de passe"
                            />
                            <InputError message={errors.password_confirmation} />
                        </div>

                        <Button type="submit" className="w-full" disabled={processing}>
                            {processing && <Spinner className="mr-2" />}
                            Activer mon compte
                        </Button>
                    </div>
                )}
            </Form>
        </AuthLayout>
    );
}
