import { Building2, Globe, Mail, MapPin, Phone, Tag, Upload, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type EnumOption = { value: string; name: string };

const STATUS_OPTIONS = [
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
    { value: 'suspended', label: 'Suspendu' },
] as const;

type Props = {
    defaults?: Partial<App.Data.CompanyData>;
    types: EnumOption[];
    errors: Partial<Record<keyof App.Data.CompanyData, string>>;
};

const typeLabels: EnumOption[] = [
    { value: 'alimentation', name: 'Alimentation' },
    { value: 'boutique', name: 'Boutique' },
    { value: 'restaurant', name: 'Restaurant' },
    { value: 'pharmacy', name: 'Pharmacie' },
    { value: 'service', name: 'Service' },
];

export default function CompanyForm({ defaults = {}, errors }: Props) {
    const [typeValue, setTypeValue] = useState<string>((defaults.type as string) ?? '');
    const [statusValue, setStatusValue] = useState<string>((defaults.status as string) ?? 'active');
    const [logoPreview, setLogoPreview] = useState<string | null>(defaults.logo ?? null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback((file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFileChange(file);
        },
        [handleFileChange],
    );

    const removeLogo = () => {
        setLogoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

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

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="type">
                                    Type <span className="text-destructive">*</span>
                                </Label>
                                <Select value={typeValue} onValueChange={setTypeValue}>
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Choisir un type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {typeLabels.map((t) => (
                                            <SelectItem key={t.value} value={t.value}>
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <input type="hidden" name="type" value={typeValue} />
                                <InputError message={errors.type} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="status">
                                    Statut <span className="text-destructive">*</span>
                                </Label>
                                <Select value={statusValue} onValueChange={setStatusValue}>
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Choisir un statut" />
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

                        <div className="grid gap-4 sm:grid-cols-2">
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

                        <div className="grid gap-4 sm:grid-cols-2">
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
                            <Label>Logo</Label>

                            {logoPreview ? (
                                <div className="relative overflow-hidden rounded-md border">
                                    <img
                                        src={logoPreview}
                                        alt="Aperçu du logo"
                                        className="h-36 w-full object-contain p-2"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute right-1 top-1 size-6"
                                        onClick={removeLogo}
                                    >
                                        <X className="size-3" />
                                    </Button>
                                </div>
                            ) : (
                                <div
                                    role="button"
                                    tabIndex={0}
                                    className={`cursor-pointer rounded-md border-2 border-dashed p-6 text-center transition-colors ${
                                        isDragging
                                            ? 'border-primary bg-primary/5'
                                            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                                    }`}
                                    onDrop={handleDrop}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onClick={() => fileInputRef.current?.click()}
                                    onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                                >
                                    <Upload className="mx-auto mb-2 size-6 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        Glisser une image ici ou{' '}
                                        <span className="text-primary underline">parcourir</span>
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, GIF — 2 Mo max</p>
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                name="logo_upload"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                            />
                            <InputError message={errors.logo} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
