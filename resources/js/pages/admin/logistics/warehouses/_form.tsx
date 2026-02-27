import { Hash, MapPin, Phone, Warehouse as WarehouseIcon } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUS_OPTIONS = [
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
    { value: 'under_maintenance', label: 'En maintenance' },
] as const;

type WarehouseDefaults = {
    name?: string;
    code?: string;
    address?: string;
    city?: string;
    phone?: string;
    status?: string;
    description?: string;
};

type Props = {
    defaults?: WarehouseDefaults;
    errors: Record<string, string>;
};

export default function WarehouseForm({ defaults = {}, errors }: Props) {
    const [statusValue, setStatusValue] = useState<string>(defaults.status ?? 'active');

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            {/* Main info */}
            <div className="space-y-6 lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <WarehouseIcon className="size-4" />
                            Informations générales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="name">
                                    Nom <span className="text-destructive">*</span>
                                </Label>
                                <Input id="name" name="name" defaultValue={defaults.name ?? ''} placeholder="Nom de l'entrepôt" autoFocus />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="code">
                                    Code <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative">
                                    <Hash className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                    <Input id="code" name="code" defaultValue={defaults.code ?? ''} placeholder="WH-001" className="pl-8" />
                                </div>
                                <InputError message={errors.code} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                name="description"
                                defaultValue={defaults.description ?? ''}
                                rows={3}
                                placeholder="Décrivez l'entrepôt…"
                                className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <InputError message={errors.description} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <MapPin className="size-4" />
                            Localisation & Contact
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="address">Adresse</Label>
                            <Input id="address" name="address" defaultValue={defaults.address ?? ''} placeholder="Adresse complète" />
                            <InputError message={errors.address} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="city">Ville</Label>
                                <Input id="city" name="city" defaultValue={defaults.city ?? ''} placeholder="Ville" />
                                <InputError message={errors.city} />
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
                    </CardContent>
                </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <WarehouseIcon className="size-4" />
                            Statut
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select value={statusValue} onValueChange={setStatusValue}>
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
                        <input type="hidden" name="status" value={statusValue} />
                        <InputError message={errors.status} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
