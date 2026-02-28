import { Form, Head } from '@inertiajs/react';
import CompanySettingsController from '@/actions/App/Http/Controllers/Settings/CompanySettingsController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
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
    notification_settings: NotificationSettings | null;
};

export default function CompanySettings({ company }: { company: Company }) {
    const settings = company.notification_settings ?? {};

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Paramètres entreprise" />

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Notifications entreprise"
                        description={`Configurez les canaux de notification pour ${company.name}`}
                    />

                    <Form
                        {...CompanySettingsController.update.form()}
                        options={{ preserveScroll: true }}
                        className="space-y-8"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                {/* ── Email ── */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold">Notifications par e-mail</h3>
                                    <Separator />

                                    <div className="flex items-center gap-3">
                                        <Switch
                                            id="email_enabled"
                                            name="notification_settings[email_enabled]"
                                            defaultChecked={!!settings.email_enabled}
                                        />
                                        <Label htmlFor="email_enabled">Activer les notifications e-mail</Label>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email_recipients">
                                            Destinataires e-mail
                                            <span className="ml-1 text-xs text-muted-foreground">(séparés par des virgules)</span>
                                        </Label>
                                        <Input
                                            id="email_recipients"
                                            name="notification_settings[email_recipients]"
                                            type="email"
                                            defaultValue={settings.email_recipients ?? ''}
                                            placeholder="admin@example.com, manager@example.com"
                                        />
                                        <InputError message={errors['notification_settings.email_recipients']} />
                                    </div>
                                </div>

                                {/* ── SMS ── */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold">Notifications par SMS</h3>
                                    <Separator />

                                    <div className="flex items-center gap-3">
                                        <Switch
                                            id="sms_enabled"
                                            name="notification_settings[sms_enabled]"
                                            defaultChecked={!!settings.sms_enabled}
                                        />
                                        <Label htmlFor="sms_enabled">Activer les notifications SMS</Label>
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        Intégration SMS prévue dans une prochaine mise à jour. Vous pouvez déjà renseigner vos informations.
                                    </p>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="sms_provider">Fournisseur SMS</Label>
                                            <Input
                                                id="sms_provider"
                                                name="notification_settings[sms_provider]"
                                                defaultValue={settings.sms_provider ?? ''}
                                                placeholder="Twilio, Infobip…"
                                            />
                                            <InputError message={errors['notification_settings.sms_provider']} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="sms_phone">Numéro de réception</Label>
                                            <Input
                                                id="sms_phone"
                                                name="notification_settings[sms_phone]"
                                                defaultValue={settings.sms_phone ?? ''}
                                                placeholder="+33600000000"
                                            />
                                            <InputError message={errors['notification_settings.sms_phone']} />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="sms_api_key">Clé API SMS</Label>
                                        <Input
                                            id="sms_api_key"
                                            name="notification_settings[sms_api_key]"
                                            type="password"
                                            defaultValue={settings.sms_api_key ?? ''}
                                            placeholder="••••••••"
                                        />
                                        <InputError message={errors['notification_settings.sms_api_key']} />
                                    </div>
                                </div>

                                {/* ── WhatsApp ── */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold">Notifications WhatsApp</h3>
                                    <Separator />

                                    <div className="flex items-center gap-3">
                                        <Switch
                                            id="whatsapp_enabled"
                                            name="notification_settings[whatsapp_enabled]"
                                            defaultChecked={!!settings.whatsapp_enabled}
                                        />
                                        <Label htmlFor="whatsapp_enabled">Activer les notifications WhatsApp</Label>
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        Intégration WhatsApp prévue dans une prochaine mise à jour. Vous pouvez déjà renseigner vos informations.
                                    </p>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="whatsapp_provider">Fournisseur WhatsApp</Label>
                                            <Input
                                                id="whatsapp_provider"
                                                name="notification_settings[whatsapp_provider]"
                                                defaultValue={settings.whatsapp_provider ?? ''}
                                                placeholder="Meta, Twilio…"
                                            />
                                            <InputError message={errors['notification_settings.whatsapp_provider']} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="whatsapp_phone">Numéro WhatsApp</Label>
                                            <Input
                                                id="whatsapp_phone"
                                                name="notification_settings[whatsapp_phone]"
                                                defaultValue={settings.whatsapp_phone ?? ''}
                                                placeholder="+33600000000"
                                            />
                                            <InputError message={errors['notification_settings.whatsapp_phone']} />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="whatsapp_api_key">Clé API WhatsApp</Label>
                                        <Input
                                            id="whatsapp_api_key"
                                            name="notification_settings[whatsapp_api_key]"
                                            type="password"
                                            defaultValue={settings.whatsapp_api_key ?? ''}
                                            placeholder="••••••••"
                                        />
                                        <InputError message={errors['notification_settings.whatsapp_api_key']} />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button disabled={processing}>Enregistrer</Button>

                                    {recentlySuccessful && (
                                        <p className="text-sm text-muted-foreground">Enregistré.</p>
                                    )}
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
