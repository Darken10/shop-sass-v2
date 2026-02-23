import { Head, Link } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { ArrowLeft, Coins, StickyNote } from 'lucide-react';
import LogisticChargeController, { index as chargesIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/LogisticChargeController';
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

type ChargeType = {
    value: string;
    label?: string;
};

const chargeTypeLabels: Record<string, string> = {
    fuel: 'Carburant',
    handling: 'Manutention',
    loading: 'Chargement',
    unloading: 'Déchargement',
    toll: 'Péage',
    packaging: 'Emballage',
    insurance: 'Assurance',
    other: 'Autre',
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Charges logistiques', href: chargesIndex().url },
    { title: 'Nouvelle', href: '#' },
];

export default function ChargeCreate({ chargeTypes }: { chargeTypes: ChargeType[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nouvelle charge logistique" />

            <Form {...LogisticChargeController.store.form()} className="flex h-full flex-1 flex-col gap-6 p-6">
                {({ processing, errors }) => (
                    <>
                        <div className="flex items-center gap-4">
                            <Button asChild variant="ghost" size="icon" className="size-8">
                                <a href={chargesIndex().url}>
                                    <ArrowLeft className="size-4" />
                                    <span className="sr-only">Retour</span>
                                </a>
                            </Button>
                            <h1 className="text-xl font-semibold">Nouvelle charge logistique</h1>
                        </div>

                        <Separator />

                        <div className="mx-auto w-full max-w-2xl space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Coins className="size-4" />
                                        Informations de la charge
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="label">Libellé *</Label>
                                        <Input
                                            id="label"
                                            name="label"
                                            placeholder="Ex: Frais de transport Bamako-Sikasso"
                                        />
                                        <InputError message={errors.label} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="type">Type de charge *</Label>
                                            <Select name="type">
                                                <SelectTrigger id="type">
                                                    <SelectValue placeholder="Sélectionner un type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {chargeTypes.map((ct) => (
                                                        <SelectItem key={ct.value} value={ct.value}>
                                                            {chargeTypeLabels[ct.value] ?? ct.value}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <input type="hidden" name="type" id="type_hidden" />
                                            <InputError message={errors.type} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="amount">Montant (XOF) *</Label>
                                            <Input
                                                id="amount"
                                                name="amount"
                                                type="number"
                                                step="1"
                                                min="0"
                                                placeholder="0"
                                            />
                                            <InputError message={errors.amount} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <StickyNote className="size-4" />
                                        Références & Notes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="stock_movement_id">Mouvement de stock (opt.)</Label>
                                            <Input
                                                id="stock_movement_id"
                                                name="stock_movement_id"
                                                placeholder="UUID du mouvement"
                                            />
                                            <InputError message={errors.stock_movement_id} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="supply_request_id">Demande d'approvisionnement (opt.)</Label>
                                            <Input
                                                id="supply_request_id"
                                                name="supply_request_id"
                                                placeholder="UUID de la demande"
                                            />
                                            <InputError message={errors.supply_request_id} />
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
                                    <Link href={chargesIndex().url}>Annuler</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Enregistrement…' : 'Enregistrer la charge'}
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </Form>
        </AppLayout>
    );
}
