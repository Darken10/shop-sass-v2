import { Head, Link } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { ArrowLeft, Fuel, Hash } from 'lucide-react';
import FuelLogController, { index as fuelLogsIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/FuelLogController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Vehicle = {
    id: string;
    name: string;
    registration_number: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Ravitaillements', href: fuelLogsIndex().url },
    { title: 'Nouveau', href: '#' },
];

export default function FuelLogCreate({ vehicles }: { vehicles: Vehicle[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouveau ravitaillement" />

            <Form {...FuelLogController.store.form()} className="flex h-full flex-1 flex-col gap-6 p-6">
                {({ processing, errors }) => (
                    <>
                        <div className="flex items-center gap-4">
                            <Button asChild variant="ghost" size="icon" className="size-8">
                                <a href={fuelLogsIndex().url}>
                                    <ArrowLeft className="size-4" />
                                    <span className="sr-only">Retour</span>
                                </a>
                            </Button>
                            <h1 className="text-xl font-semibold">Nouveau ravitaillement</h1>
                        </div>

                        <Separator />

                        <div className="mx-auto w-full max-w-2xl space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Fuel className="size-4" />
                                        Véhicule & Quantité
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="vehicle_id">Véhicule *</Label>
                                        <Select name="vehicle_id">
                                            <SelectTrigger id="vehicle_id">
                                                <SelectValue placeholder="Sélectionner un véhicule" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {vehicles.map((v) => (
                                                    <SelectItem key={v.id} value={v.id}>
                                                        {v.name} — {v.registration_number}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.vehicle_id} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="quantity_liters">Quantité (litres) *</Label>
                                            <Input
                                                id="quantity_liters"
                                                name="quantity_liters"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                            />
                                            <InputError message={errors.quantity_liters} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="cost">Coût (XOF) *</Label>
                                            <Input
                                                id="cost"
                                                name="cost"
                                                type="number"
                                                step="1"
                                                min="0"
                                                placeholder="0"
                                            />
                                            <InputError message={errors.cost} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Hash className="size-4" />
                                        Informations complémentaires
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="odometer_reading">Kilométrage</Label>
                                            <Input
                                                id="odometer_reading"
                                                name="odometer_reading"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="km"
                                            />
                                            <InputError message={errors.odometer_reading} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="fueled_at">Date de ravitaillement *</Label>
                                            <Input
                                                id="fueled_at"
                                                name="fueled_at"
                                                type="date"
                                                defaultValue={new Date().toISOString().split('T')[0]}
                                            />
                                            <InputError message={errors.fueled_at} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="notes">Notes</Label>
                                        <Textarea
                                            id="notes"
                                            name="notes"
                                            rows={3}
                                            placeholder="Notes optionnelles..."
                                        />
                                        <InputError message={errors.notes} />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex items-center justify-end gap-3">
                                <Button asChild variant="ghost">
                                    <Link href={fuelLogsIndex().url}>Annuler</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Enregistrement…' : 'Enregistrer le ravitaillement'}
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </Form>
        </AppLayout>
    );
}
