import { Building2, Globe, Mail, MapPin, Phone, Tag } from 'lucide-react';
import InputError from '@/components/input-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type EnumOption = { value: string; name: string };

type Props = {
    defaults?: Partial<App.Data.CompanyData>;
    types: EnumOption[];
    statuses: EnumOption[];
    errors: Partial<Record<keyof App.Data.CompanyData, string>>;
};

const typeLabels: Record<string, string> = {
    alimentation: 'Alimentation',
    boutique: 'Boutique',
    restaurant: 'Restaurant',
    pharmacy: 'Pharmacie',
    service: 'Service',
};

const statusLabels: Record<string, string> = {
    active: 'Actif',
    inactive: 'Inactif',
    suspended: 'Suspendu',
};

export default function CompanyForm({ defaults = {}, types, statuses, errors }: Props) {
    return (
        <div className="grid gap-6 lg:grid-cols-3">
            {/* Main info */}
            <div className="space-y-6 lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Building2 className="size-4" />
                            Informations générales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">
                                Nom <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={defaults.name ?? ''}
                                placeholder="Nom de l'entreprise"
                                autoFocus
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="type">
                                    Type <span className="text-destructive">*</span>
                                </Label>
                                <Select name="type" defaultValue={defaults.type ?? ''}>
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Choisir un type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {types.map((t) => (
                                            <SelectItem key={t.value} value={t.value}>
                                                {typeLabels[t.value] ?? t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.type} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="status">
                                    Statut <span className="text-destructive">*</span>
                                </Label>
                                <Select name="status" defaultValue={defaults.status ?? 'active'}>
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Choisir un statut" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statuses.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>
                                                {statusLabels[s.value] ?? s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.status} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                name="description"
                                defaultValue={defaults.description ?? ''}
                                rows={3}
                                placeholder="Décrivez l'entreprise…"
                                className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <InputError message={errors.description} />
                        </div>
                    </CardContent>
                </Card>

                {/* Address */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <MapPin className="size-4" />
                            Adresse
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="address">Rue / Adresse</Label>
                            <Input
                                id="address"
                                name="address"
                                defaultValue={defaults.address ?? ''}
                                placeholder="123 Rue Principale"
                            />
                            <InputError message={errors.address} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="city">Ville</Label>
                                <Input id="city" name="city" defaultValue={defaults.city ?? ''} placeholder="Paris" />
                                <InputError message={errors.city} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="postal_code">Code postal</Label>
                                <Input
                                    id="postal_code"
                                    name="postal_code"
                                    defaultValue={defaults.postal_code ?? ''}
                                    placeholder="75001"
                                />
                                <InputError message={errors.postal_code} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="state">Région / État</Label>
                                <Input id="state" name="state" defaultValue={defaults.state ?? ''} placeholder="Île-de-France" />
                                <InputError message={errors.state} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="country">Pays</Label>
                                <Input id="country" name="country" defaultValue={defaults.country ?? ''} placeholder="France" />
                                <InputError message={errors.country} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Side info */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Phone className="size-4" />
                            Contact
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">
                                <Mail className="mr-1 inline size-3" />
                                Email
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                defaultValue={defaults.email ?? ''}
                                placeholder="contact@entreprise.com"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="phone">Téléphone</Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                defaultValue={defaults.phone ?? ''}
                                placeholder="+33 1 23 45 67 89"
                            />
                            <InputError message={errors.phone} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="website">
                                <Globe className="mr-1 inline size-3" />
                                Site web
                            </Label>
                            <Input
                                id="website"
                                name="website"
                                type="url"
                                defaultValue={defaults.website ?? ''}
                                placeholder="https://entreprise.com"
                            />
                            <InputError message={errors.website} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Tag className="size-4" />
                            Médias
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="logo">URL du logo</Label>
                            <Input
                                id="logo"
                                name="logo"
                                type="url"
                                defaultValue={defaults.logo ?? ''}
                                placeholder="https://…/logo.png"
                            />
                            <InputError message={errors.logo} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
