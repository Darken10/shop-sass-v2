import { Head, Link, router } from '@inertiajs/react';
import { Building2, Edit, Mail, MailPlus, Plus, Shield, Trash2, UserCheck, Users } from 'lucide-react';
import { useState } from 'react';
import {
    index as usersIndex,
    create,
    destroy,
    edit,
    resendActivation,
} from '@/actions/App/Http/Controllers/Admin/UserController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type UserEntry = {
    id: string;
    name: string;
    email: string;
    email_verified_at: string | null;
    password?: string | null;
    created_at: string;
    company: { id: string; name: string } | null;
    roles: { id: string; name: string }[];
};

type PaginatedUsers = {
    data: UserEntry[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Utilisateurs', href: usersIndex().url },
];

const roleLabels: Record<string, string> = {
    'super admin': 'Super Admin',
    admin: 'Admin',
    gestionnaire: 'Gestionnaire',
    caissier: 'Caissier',
    logisticien: 'Logisticien',
    magasinier: 'Magasinier',
};

const roleVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    'super admin': 'default',
    admin: 'default',
    gestionnaire: 'secondary',
    caissier: 'outline',
    logisticien: 'outline',
    magasinier: 'outline',
};

export default function UsersIndex({ users }: { users: PaginatedUsers }) {
    const [deleteTarget, setDeleteTarget] = useState<UserEntry | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [resending, setResending] = useState<string | null>(null);

    function handleDelete() {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(destroy(deleteTarget.id).url, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    }

    function handleResendActivation(userId: string) {
        setResending(userId);
        router.post(resendActivation(userId).url, {}, {
            onFinish: () => setResending(null),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Utilisateurs" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                            <Users className="size-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Utilisateurs</h1>
                            <p className="text-sm text-muted-foreground">
                                {users.total} utilisateur{users.total !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <Button asChild size="sm">
                        <Link href={create().url} prefetch>
                            <Plus className="size-4" />
                            Nouvel utilisateur
                        </Link>
                    </Button>
                </div>

                <Separator />

                {/* Cards grid */}
                {users.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20 text-center">
                        <Users className="size-12 text-muted-foreground/40" />
                        <div>
                            <p className="font-medium">Aucun utilisateur trouvé</p>
                            <p className="text-sm text-muted-foreground">Commencez par créer votre premier utilisateur.</p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                            <Link href={create().url}>
                                <Plus className="size-4" />
                                Créer un utilisateur
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {users.data.map((user) => {
                            const roleName = user.roles[0]?.name ?? 'aucun';
                            const isActivated = user.email_verified_at !== null;

                            return (
                                <Card key={user.id} className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
                                    {/* Top banner + avatar */}
                                    <div className="relative h-16 bg-primary/8">
                                        <div className="absolute -bottom-6 left-4 flex size-12 items-center justify-center rounded-full border-2 border-background bg-background shadow-sm">
                                            <span className="text-sm font-bold text-primary">
                                                {user.name
                                                    .split(' ')
                                                    .map((w) => w[0])
                                                    .join('')
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="absolute right-3 top-3 flex gap-1.5">
                                            <Badge variant={roleVariant[roleName] ?? 'outline'}>
                                                {roleLabels[roleName] ?? roleName}
                                            </Badge>
                                        </div>
                                    </div>

                                    <CardContent className="flex flex-1 flex-col gap-3 pt-9">
                                        <div>
                                            <h3 className="truncate font-semibold leading-tight">{user.name}</h3>
                                            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Mail className="size-3 shrink-0" />
                                                <span className="truncate">{user.email}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 text-xs text-muted-foreground">
                                            {user.company && (
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 className="size-3 shrink-0" />
                                                    <span className="truncate">{user.company.name}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5">
                                                {isActivated ? (
                                                    <>
                                                        <UserCheck className="size-3 shrink-0 text-green-600" />
                                                        <span className="text-green-600">Activé</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Shield className="size-3 shrink-0 text-amber-500" />
                                                        <span className="text-amber-500">En attente d{"'"}activation</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="gap-1 border-t px-3 py-2">
                                        <Button asChild variant="ghost" size="icon" className="size-8">
                                            <Link href={edit(user.id).url} prefetch>
                                                <Edit className="size-3.5" />
                                                <span className="sr-only">Modifier</span>
                                            </Link>
                                        </Button>
                                        {!isActivated && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                disabled={resending === user.id}
                                                onClick={() => handleResendActivation(user.id)}
                                                title="Renvoyer l'email d'activation"
                                            >
                                                <MailPlus className="size-3.5" />
                                                <span className="sr-only">Renvoyer activation</span>
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="ml-auto size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => setDeleteTarget(user)}
                                        >
                                            <Trash2 className="size-3.5" />
                                            <span className="sr-only">Supprimer</span>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1 pt-2">
                        {users.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                asChild={!!link.url}
                                className="min-w-9"
                            >
                                {link.url ? (
                                    <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                                ) : (
                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                )}
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete confirmation dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer l{"'"}utilisateur</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer <strong>{deleteTarget?.name}</strong> ? Cette action est irréversible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                            Annuler
                        </Button>
                        <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
                            {isDeleting ? 'Suppression…' : 'Supprimer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
