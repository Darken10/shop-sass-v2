import { Hash, MapPin, Phone, UserSquare } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUS_OPTIONS = [
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
] as const;

type SupplierDefaults = {
    name?: string;
    code?: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    notes?: string;
    is_active?: boolean;
};

type Props = {
    defaults?: SupplierDefaults;
    errors: Record<string, string>;
};

export default function SupplierForm({ defaults = {}, errors }: Props) {
    const [isActiveValue, setIsActiveValue] = useState<string>(defaults.is_active === false ? 'inactive' : 'active');

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            {/* Main info */}
            <div className="space-y-6 lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <UserSquare className="size-4" />
                            Informations générales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="name">
                                    Nom <span className="text-destructive">*</span>
                                </Label>
                                <Input id="name" name="name" defaultValue={defaults.name ?? ''} placeholder="Nom du fournisseur" autoFocus />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="code">
                                    Code <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative">
                                    <Hash className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                    <Input id="code" name="code" defaultValue={defaults.code ?? ''} placeholder="SUP-001" className="pl-8" />
                                </div>
                                <InputError message={errors.code} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="contact_name">Personne de contact</Label>
                            <Input id="contact_name" name="contact_name" defaultValue={defaults.contact_name ?? ''} placeholder="Nom du contact" />
                            <InputError message={errors.contact_name} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" defaultValue={defaults.email ?? ''} placeholder="email@exemple.com" />
                                <InputError message={errors.email} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Téléphone</Label>
                                <div className="relative">
                                    <Phone className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                    <Input id="phone" name="phone" defaultValue={defaults.phone ?? ''} placeholder="+229 00 00 00 00" className="pl-8" />
                                </div>
                                <InputError message={errors.phone} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notes</Label>
                            <textarea
                                id="notes"
                                name="notes"
                                defaultValue={defaults.notes ?? ''}
                                rows={3}
                                placeholder="Notes supplémentaires…"
                                className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <InputError message={errors.notes} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <MapPin className="size-4" />
                            Localisation
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="address">Adresse</Label>
                            <Input id="address" name="address" defaultValue={defaults.address ?? ''} placeholder="Adresse complète" />
                            <InputError message={errors.address} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="city">Ville</Label>
                            <Input id="city" name="city" defaultValue={defaults.city ?? ''} placeholder="Ville" />
                            <InputError message={errors.city} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <UserSquare className="size-4" />
                            Statut
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select value={isActiveValue} onValueChange={setIsActiveValue}>
                            <SelectTrigger>
                                <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                        {s.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <input type="hidden" name="is_active" value={isActiveValue === 'active' ? '1' : '0'} />
                        <InputError message={errors.is_active} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
