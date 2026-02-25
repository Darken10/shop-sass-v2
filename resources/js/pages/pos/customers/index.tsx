import { Head, router, useForm } from '@inertiajs/react';
import { Edit, Plus, Search, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { index as customersIndex, store as storeCustomer, update as updateCustomer, destroy as destroyCustomer } from '@/actions/App/Http/Controllers/Pos/CustomerController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Customer = {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    credit_balance: string;
    created_at: string;
    created_by: { id: string; name: string } | null;
};

type PaginatedCustomers = {
    data: Customer[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Point de vente', href: '/pos' },
    { title: 'Clients', href: '#' },
];

export default function CustomersIndex({ customers }: { customers: PaginatedCustomers }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showDialog, setShowDialog] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    const form = useForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
    });

    function openCreate() {
        setEditingCustomer(null);
        form.reset();
        setShowDialog(true);
    }

    function openEdit(customer: Customer) {
        setEditingCustomer(customer);
        form.setData({
            name: customer.name,
            phone: customer.phone ?? '',
            email: customer.email ?? '',
            address: customer.address ?? '',
            city: customer.city ?? '',
        });
        setShowDialog(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingCustomer) {
            form.put(updateCustomer(editingCustomer.id).url, {
                onSuccess: () => setShowDialog(false),
            });
        } else {
            form.post(storeCustomer().url, {
                onSuccess: () => {
                    setShowDialog(false);
                    form.reset();
                },
            });
        }
    }

    function handleDelete(customer: Customer) {
        if (confirm(`Supprimer le client "${customer.name}" ?`)) {
            router.delete(destroyCustomer(customer.id).url);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clients" />

            <div className="flex h-full flex-1 flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Clients</h1>
                        <p className="text-sm text-muted-foreground">{customers.total} client{customers.total > 1 ? 's' : ''}</p>
                    </div>
                    <Button onClick={openCreate}>
                        <Plus className="size-4" /> Nouveau client
                    </Button>
                </div>

                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Rechercher par nom ou téléphone..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50 text-left">
                                        <th className="px-4 py-3 font-medium">Nom</th>
                                        <th className="px-4 py-3 font-medium">Téléphone</th>
                                        <th className="px-4 py-3 font-medium">Email</th>
                                        <th className="px-4 py-3 font-medium">Ville</th>
                                        <th className="px-4 py-3 text-right font-medium">Crédit</th>
                                        <th className="px-4 py-3 font-medium">Créé le</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.data
                                        .filter(
                                            (c) =>
                                                !searchTerm ||
                                                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                (c.phone ?? '').includes(searchTerm),
                                        )
                                        .map((customer) => (
                                            <tr key={customer.id} className="border-b last:border-0 hover:bg-muted/30">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <User className="size-4 text-muted-foreground" />
                                                        <span className="font-medium">{customer.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">{customer.phone ?? '—'}</td>
                                                <td className="px-4 py-3">{customer.email ?? '—'}</td>
                                                <td className="px-4 py-3">{customer.city ?? '—'}</td>
                                                <td className="px-4 py-3 text-right">
                                                    {Number(customer.credit_balance) !== 0 ? (
                                                        <Badge variant={Number(customer.credit_balance) > 0 ? 'default' : 'destructive'}>
                                                            {Number(customer.credit_balance).toLocaleString('fr-FR')} F
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground">0</span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                                                    {new Date(customer.created_at).toLocaleDateString('fr-FR')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(customer)}>
                                                            <Edit className="size-3.5" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => handleDelete(customer)}>
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {customers.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {customers.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCustomer ? 'Modifier le client' : 'Nouveau client'}</DialogTitle>
                        <DialogDescription>
                            {editingCustomer ? 'Modifiez les informations du client.' : 'Ajoutez un nouveau client à votre base.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Nom *</Label>
                            <Input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required />
                            {form.errors.name && <p className="mt-1 text-xs text-destructive">{form.errors.name}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Téléphone</Label>
                                <Input value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                            </div>
                            <div>
                                <Label>Email</Label>
                                <Input type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Adresse</Label>
                                <Input value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} />
                            </div>
                            <div>
                                <Label>Ville</Label>
                                <Input value={form.data.city} onChange={(e) => form.setData('city', e.target.value)} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Enregistrement…' : editingCustomer ? 'Mettre à jour' : 'Créer'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
