import { Head } from '@inertiajs/react';
import { Bell, Building2, DollarSign, Package, ShoppingCart } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/company-settings';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Paramètres entreprise',
        href: edit().url,
    },
];

const CURRENCIES = [
    { value: 'XOF', label: 'Franc CFA BCEAO (XOF)' },
    { value: 'XAF', label: 'Franc CFA BEAC (XAF)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'USD', label: 'Dollar US (USD)' },
    { value: 'MAD', label: 'Dirham Marocain (MAD)' },
    { value: 'GNF', label: 'Franc Guinéen (GNF)' },
    { value: 'DZD', label: 'Dinar Algérien (DZD)' },
];

const LANGUAGES = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
    { value: 'ar', label: 'العربية' },
];

const MONTHS = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' },
];

type CompanySettings = {
    currency?: string;
    timezone?: string;
    language?: string;
    tax_number?: string;
    default_tax_rate?: number | string;
    fiscal_year_start_month?: number | string;
    max_discount_percent?: number | string;
    receipt_header?: string;
    receipt_footer?: string;
    low_stock_threshold?: number | string;
    auto_track_stock?: boolean;
};

type NotificationSettings = {
    email_enabled?: boolean;
    email_recipients?: string;
    sms_enabled?: boolean;
    sms_provider?: string;
    sms_api_key?: string;
    sms_phone?: string;
    whatsapp_enabled?: boolean;
    whatsapp_provider?: string;
    whatsapp_api_key?: string;
    whatsapp_phone?: string;
};

type Company = {
    id: string;
    name: string;
    settings: CompanySettings | null;
    notification_settings: NotificationSettings | null;
};

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
    return (
        <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="size-4 text-muted-foreground" />
                {title}
            </CardTitle>
        </CardHeader>
    );
}

export default function CompanySettings({ company }: { company: Company }) {
    const s = company.settings ?? {};
    const n = company.notification_settings ?? {};

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Paramètres entreprise" />

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title={`Paramètres — ${company.name}`}
                        description="Configurez tous les paramètres spécifiques à votre entreprise"
                    />

                    <form method="post" action="/settings/company" className="space-y-6">
                        {/* ── Finances ── */}
                                <Card>
                                    <SectionTitle icon={DollarSign} title="Paramètres financiers" />
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="currency">Devise</Label>
                                                <Select name="settings[currency]" defaultValue={s.currency ?? 'XOF'}>
                                                    <SelectTrigger id="currency">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {CURRENCIES.map((c) => (
                                                            <SelectItem key={c.value} value={c.value}>
                                                                {c.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="tax_number">Numéro fiscal / RCCM</Label>
                                                <Input
                                                    id="tax_number"
                                                    name="settings[tax_number]"
                                                    defaultValue={String(s.tax_number ?? '')}
                                                    placeholder="Ex: TF-12345 ou RCCM-2022-B"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="default_tax_rate">Taux de TVA par défaut (%)</Label>
                                                <Input
                                                    id="default_tax_rate"
                                                    name="settings[default_tax_rate]"
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    step={0.1}
                                                    defaultValue={String(s.default_tax_rate ?? '18')}
                                                    placeholder="18"
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="fiscal_year_start_month">Début d'exercice fiscal</Label>
                                                <Select
                                                    name="settings[fiscal_year_start_month]"
                                                    defaultValue={String(s.fiscal_year_start_month ?? '1')}
                                                >
                                                    <SelectTrigger id="fiscal_year_start_month">
                                                        <SelectValue placeholder="Mois de début" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {MONTHS.map((m) => (
                                                            <SelectItem key={m.value} value={String(m.value)}>
                                                                {m.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* ── POS ── */}
                                <Card>
                                    <SectionTitle icon={ShoppingCart} title="Paramètres point de vente (POS)" />
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="max_discount_percent">Remise maximale autorisée (%)</Label>
                                            <Input
                                                id="max_discount_percent"
                                                name="settings[max_discount_percent]"
                                                type="number"
                                                min={0}
                                                max={100}
                                                step={1}
                                                defaultValue={String(s.max_discount_percent ?? '20')}
                                                placeholder="20"
                                                className="max-w-xs"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="receipt_header">En-tête de reçu / ticket</Label>
                                            <Textarea
                                                id="receipt_header"
                                                name="settings[receipt_header]"
                                                defaultValue={s.receipt_header ?? ''}
                                                rows={3}
                                                placeholder="Nom entreprise, slogan, adresse…"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="receipt_footer">Pied de page de reçu / ticket</Label>
                                            <Textarea
                                                id="receipt_footer"
                                                name="settings[receipt_footer]"
                                                defaultValue={s.receipt_footer ?? ''}
                                                rows={3}
                                                placeholder="Merci de votre visite ! Revenez bientôt."
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* ── Stock ── */}
                                <Card>
                                    <SectionTitle icon={Package} title="Paramètres de stock" />
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="low_stock_threshold">Seuil d'alerte stock faible (quantité)</Label>
                                            <Input
                                                id="low_stock_threshold"
                                                name="settings[low_stock_threshold]"
                                                type="number"
                                                min={0}
                                                step={1}
                                                defaultValue={String(s.low_stock_threshold ?? '5')}
                                                placeholder="5"
                                                className="max-w-xs"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                En dessous de ce seuil, une alerte de stock faible sera déclenchée.
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id="auto_track_stock"
                                                name="settings[auto_track_stock]"
                                                defaultChecked={s.auto_track_stock !== false}
                                            />
                                            <Label htmlFor="auto_track_stock">Suivi automatique des stocks activé</Label>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* ── Régional ── */}
                                <Card>
                                    <SectionTitle icon={Building2} title="Paramètres régionaux" />
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="language">Langue</Label>
                                                <Select name="settings[language]" defaultValue={s.language ?? 'fr'}>
                                                    <SelectTrigger id="language">
                                                        <SelectValue placeholder="Choisir une langue" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {LANGUAGES.map((l) => (
                                                            <SelectItem key={l.value} value={l.value}>
                                                                {l.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="timezone">Fuseau horaire</Label>
                                                <Input
                                                    id="timezone"
                                                    name="settings[timezone]"
                                                    defaultValue={s.timezone ?? 'Africa/Abidjan'}
                                                    placeholder="Africa/Abidjan"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Ex: Africa/Abidjan, Africa/Dakar, Europe/Paris
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* ── Notifications ── */}
                                <Card>
                                    <SectionTitle icon={Bell} title="Notifications" />
                                    <CardContent className="space-y-6">
                                        {/* Email */}
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium">Par e-mail</p>
                                            <Separator />
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    id="email_enabled"
                                                    name="notification_settings[email_enabled]"
                                                    defaultChecked={!!n.email_enabled}
                                                />
                                                <Label htmlFor="email_enabled">Activer les notifications e-mail</Label>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="email_recipients">
                                                    Destinataires
                                                    <span className="ml-1 text-xs text-muted-foreground">(séparés par des virgules)</span>
                                                </Label>
                                                <Input
                                                    id="email_recipients"
                                                    name="notification_settings[email_recipients]"
                                                    defaultValue={n.email_recipients ?? ''}
                                                    placeholder="admin@example.com, manager@example.com"
                                                />
                                            </div>
                                        </div>

                                        {/* SMS */}
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium">Par SMS</p>
                                            <Separator />
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    id="sms_enabled"
                                                    name="notification_settings[sms_enabled]"
                                                    defaultChecked={!!n.sms_enabled}
                                                />
                                                <Label htmlFor="sms_enabled">Activer les notifications SMS</Label>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Intégration SMS disponible dans une prochaine mise à jour.
                                            </p>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="sms_provider">Fournisseur</Label>
                                                    <Input
                                                        id="sms_provider"
                                                        name="notification_settings[sms_provider]"
                                                        defaultValue={n.sms_provider ?? ''}
                                                        placeholder="Twilio, Infobip…"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="sms_phone">Numéro</Label>
                                                    <Input
                                                        id="sms_phone"
                                                        name="notification_settings[sms_phone]"
                                                        defaultValue={n.sms_phone ?? ''}
                                                        placeholder="+2250700000000"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="sms_api_key">Clé API</Label>
                                                <Input
                                                    id="sms_api_key"
                                                    name="notification_settings[sms_api_key]"
                                                    type="password"
                                                    defaultValue={n.sms_api_key ?? ''}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>

                                        {/* WhatsApp */}
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium">Par WhatsApp</p>
                                            <Separator />
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    id="whatsapp_enabled"
                                                    name="notification_settings[whatsapp_enabled]"
                                                    defaultChecked={!!n.whatsapp_enabled}
                                                />
                                                <Label htmlFor="whatsapp_enabled">Activer les notifications WhatsApp</Label>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Intégration WhatsApp disponible dans une prochaine mise à jour.
                                            </p>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="whatsapp_provider">Fournisseur</Label>
                                                    <Input
                                                        id="whatsapp_provider"
                                                        name="notification_settings[whatsapp_provider]"
                                                        defaultValue={n.whatsapp_provider ?? ''}
                                                        placeholder="Meta, Twilio…"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="whatsapp_phone">Numéro</Label>
                                                    <Input
                                                        id="whatsapp_phone"
                                                        name="notification_settings[whatsapp_phone]"
                                                        defaultValue={n.whatsapp_phone ?? ''}
                                                        placeholder="+2250700000000"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="whatsapp_api_key">Clé API</Label>
                                                <Input
                                                    id="whatsapp_api_key"
                                                    name="notification_settings[whatsapp_api_key]"
                                                    type="password"
                                                    defaultValue={n.whatsapp_api_key ?? ''}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="flex items-center gap-4">
                                    <Button type="submit">Enregistrer les paramètres</Button>
                                </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
