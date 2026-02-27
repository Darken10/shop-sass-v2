import { Hash, Truck } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const VEHICLE_TYPES = [
    { value: 'truck', label: 'Camion' },
    { value: 'tricycle', label: 'Tricycle' },
    { value: 'van', label: 'Fourgon' },
    { value: 'pickup', label: 'Pick-up' },
    { value: 'other', label: 'Autre' },
] as const;

const VEHICLE_STATUSES = [
    { value: 'active', label: 'Actif' },
    { value: 'in_maintenance', label: 'En maintenance' },
    { value: 'out_of_service', label: 'Hors service' },
] as const;

type VehicleDefaults = {
    name?: string;
    type?: string;
    registration_number?: string;
    load_capacity?: string;
    average_consumption?: string;
    status?: string;
    notes?: string;
};

type Props = {
    defaults?: VehicleDefaults;
    errors: Record<string, string>;
};

export default function VehicleForm({ defaults = {}, errors }: Props) {
    const [typeValue, setTypeValue] = useState<string>(defaults.type ?? 'truck');
    const [statusValue, setStatusValue] = useState<string>(defaults.status ?? 'active');

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Truck className="size-4" />
                            Informations générales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="name">
                                    Nom <span className="text-destructive">*</span>
                                </Label>
                                <Input id="name" name="name" defaultValue={defaults.name ?? ''} placeholder="Nom de l'engin" autoFocus />
                                <InputError message={errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="registration_number">
                                    Immatriculation <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative">
                                    <Hash className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                    <Input
                                        id="registration_number"
                                        name="registration_number"
                                        defaultValue={defaults.registration_number ?? ''}
                                        placeholder="AB-1234-CD"
                                        className="pl-8"
                                    />
                                </div>
                                <InputError message={errors.registration_number} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="type">
                                Type d'engin <span className="text-destructive">*</span>
                            </Label>
                            <Select value={typeValue} onValueChange={setTypeValue}>
                                <SelectTrigger id="type">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {VEHICLE_TYPES.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <input type="hidden" name="type" value={typeValue} />
                            <InputError message={errors.type} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="load_capacity">Capacité de charge (kg)</Label>
                                <Input
                                    id="load_capacity"
                                    name="load_capacity"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    defaultValue={defaults.load_capacity ?? ''}
                                    placeholder="0.00"
                                />
                                <InputError message={errors.load_capacity} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="average_consumption">Consommation moy. (L/100km)</Label>
                                <Input
                                    id="average_consumption"
                                    name="average_consumption"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    defaultValue={defaults.average_consumption ?? ''}
                                    placeholder="0.00"
                                />
                                <InputError message={errors.average_consumption} />
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
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Truck className="size-4" />
                            Statut
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select value={statusValue} onValueChange={setStatusValue}>
                            <SelectTrigger>
                                <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                            <SelectContent>
                                {VEHICLE_STATUSES.map((s) => (
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
