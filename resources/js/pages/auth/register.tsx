import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEventHandler } from 'react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

type CompanyType = {
    value: string;
    label: string;
};

type RegisterProps = {
    companyTypes: CompanyType[];
};

type RegisterForm = {
    // Step 1: User info
    name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
    // Step 2: Company info
    company_name: string;
    company_type: string;
    company_address: string;
    company_phone: string;
    company_email: string;
    company_city: string;
    company_country: string;
    company_currency: string;
    company_description: string;
    // Step 3: Terms
    terms_accepted: boolean;
    privacy_accepted: boolean;
};

const STEP_TITLES = [
    'Informations personnelles',
    'Informations de l\'entreprise',
    'Conditions d\'utilisation',
] as const;

const STEP_DESCRIPTIONS = [
    'Renseignez vos informations pour créer votre compte',
    'Configurez votre entreprise sur la plateforme',
    'Acceptez les conditions pour finaliser votre inscription',
] as const;

const STEP_1_FIELDS = ['name', 'email', 'phone', 'password', 'password_confirmation'] as const;
const STEP_2_FIELDS = [
    'company_name',
    'company_type',
    'company_address',
    'company_phone',
    'company_email',
    'company_city',
    'company_country',
    'company_currency',
    'company_description',
] as const;

function StepIndicator({ currentStep }: { currentStep: number }) {
    return (
        <div className="flex items-center justify-center gap-2">
            {STEP_TITLES.map((title, index) => (
                <div key={title} className="flex items-center gap-2">
                    <div
                        className={`flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                            index < currentStep
                                ? 'bg-primary text-primary-foreground'
                                : index === currentStep
                                  ? 'bg-primary text-primary-foreground ring-primary/30 ring-4'
                                  : 'bg-muted text-muted-foreground'
                        }`}
                    >
                        {index < currentStep ? '✓' : index + 1}
                    </div>
                    {index < STEP_TITLES.length - 1 && (
                        <div
                            className={`h-0.5 w-8 transition-colors ${
                                index < currentStep ? 'bg-primary' : 'bg-muted'
                            }`}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

function StepUserInfo({
    data,
    errors,
    setData,
}: {
    data: RegisterForm;
    errors: Partial<Record<keyof RegisterForm, string>>;
    setData: <K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) => void;
}) {
    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                    id="name"
                    type="text"
                    required
                    autoFocus
                    autoComplete="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Prénom et nom"
                />
                <InputError message={errors.name} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="email@exemple.com"
                />
                <InputError message={errors.email} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="phone">Téléphone (optionnel)</Label>
                <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    value={data.phone}
                    onChange={(e) => setData('phone', e.target.value)}
                    placeholder="+225 00 00 00 00"
                />
                <InputError message={errors.phone} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                    id="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    placeholder="Mot de passe"
                />
                <InputError message={errors.password} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="password_confirmation">Confirmer le mot de passe</Label>
                <Input
                    id="password_confirmation"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={data.password_confirmation}
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                    placeholder="Confirmer le mot de passe"
                />
                <InputError message={errors.password_confirmation} />
            </div>
        </div>
    );
}

function StepCompanyInfo({
    data,
    errors,
    setData,
    companyTypes,
}: {
    data: RegisterForm;
    errors: Partial<Record<keyof RegisterForm, string>>;
    setData: <K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) => void;
    companyTypes: CompanyType[];
}) {
    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="company_name">Nom de l'entreprise</Label>
                <Input
                    id="company_name"
                    type="text"
                    required
                    autoFocus
                    value={data.company_name}
                    onChange={(e) => setData('company_name', e.target.value)}
                    placeholder="Nom de votre entreprise"
                />
                <InputError message={errors.company_name} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="company_type">Type d'activité</Label>
                <Select
                    value={data.company_type}
                    onValueChange={(value) => setData('company_type', value)}
                >
                    <SelectTrigger id="company_type">
                        <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                        {companyTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                                {type.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={errors.company_type} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="company_phone">Téléphone</Label>
                    <Input
                        id="company_phone"
                        type="tel"
                        value={data.company_phone}
                        onChange={(e) => setData('company_phone', e.target.value)}
                        placeholder="+225 00 00 00 00"
                    />
                    <InputError message={errors.company_phone} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="company_email">E-mail entreprise</Label>
                    <Input
                        id="company_email"
                        type="email"
                        value={data.company_email}
                        onChange={(e) => setData('company_email', e.target.value)}
                        placeholder="contact@entreprise.com"
                    />
                    <InputError message={errors.company_email} />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="company_address">Adresse</Label>
                <Input
                    id="company_address"
                    type="text"
                    value={data.company_address}
                    onChange={(e) => setData('company_address', e.target.value)}
                    placeholder="Adresse de l'entreprise"
                />
                <InputError message={errors.company_address} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="company_city">Ville</Label>
                    <Input
                        id="company_city"
                        type="text"
                        value={data.company_city}
                        onChange={(e) => setData('company_city', e.target.value)}
                        placeholder="Ville"
                    />
                    <InputError message={errors.company_city} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="company_country">Pays</Label>
                    <Input
                        id="company_country"
                        type="text"
                        value={data.company_country}
                        onChange={(e) => setData('company_country', e.target.value)}
                        placeholder="Pays"
                    />
                    <InputError message={errors.company_country} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="company_currency">Devise</Label>
                    <Input
                        id="company_currency"
                        type="text"
                        value={data.company_currency}
                        onChange={(e) => setData('company_currency', e.target.value)}
                        placeholder="XOF"
                    />
                    <InputError message={errors.company_currency} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="company_description">Description</Label>
                    <Input
                        id="company_description"
                        type="text"
                        value={data.company_description}
                        onChange={(e) => setData('company_description', e.target.value)}
                        placeholder="Brève description"
                    />
                    <InputError message={errors.company_description} />
                </div>
            </div>
        </div>
    );
}

function StepTerms({
    data,
    errors,
    setData,
}: {
    data: RegisterForm;
    errors: Partial<Record<keyof RegisterForm, string>>;
    setData: <K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) => void;
}) {
    return (
        <div className="grid gap-6">
            <div className="rounded-md border bg-muted/50 p-4 text-sm text-muted-foreground">
                <p className="mb-2 font-medium text-foreground">
                    Avant de finaliser votre inscription, veuillez lire et accepter les conditions suivantes.
                </p>
                <p>
                    En créant votre compte, vous devenez automatiquement l'administrateur principal de votre
                    entreprise avec un accès complet au système : gestion des utilisateurs, paramétrage de
                    l'entreprise, gestion des rôles et permissions.
                </p>
            </div>

            <div className="grid gap-4">
                <div className="flex items-start gap-3">
                    <Checkbox
                        id="terms_accepted"
                        checked={data.terms_accepted}
                        onCheckedChange={(checked) =>
                            setData('terms_accepted', checked === true)
                        }
                    />
                    <div className="grid gap-1">
                        <Label
                            htmlFor="terms_accepted"
                            className="cursor-pointer text-sm leading-normal font-normal"
                        >
                            J'accepte les{' '}
                            <span className="font-medium text-primary underline underline-offset-4">
                                conditions d'adhésion
                            </span>{' '}
                            de la plateforme.
                        </Label>
                        <InputError message={errors.terms_accepted} />
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <Checkbox
                        id="privacy_accepted"
                        checked={data.privacy_accepted}
                        onCheckedChange={(checked) =>
                            setData('privacy_accepted', checked === true)
                        }
                    />
                    <div className="grid gap-1">
                        <Label
                            htmlFor="privacy_accepted"
                            className="cursor-pointer text-sm leading-normal font-normal"
                        >
                            J'accepte la{' '}
                            <span className="font-medium text-primary underline underline-offset-4">
                                politique de confidentialité
                            </span>{' '}
                            de la plateforme.
                        </Label>
                        <InputError message={errors.privacy_accepted} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Register({ companyTypes }: RegisterProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const { data, setData, post, processing, errors, clearErrors } = useForm<RegisterForm>({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        company_name: '',
        company_type: '',
        company_address: '',
        company_phone: '',
        company_email: '',
        company_city: '',
        company_country: '',
        company_currency: '',
        company_description: '',
        terms_accepted: false,
        privacy_accepted: false,
    });

    const canGoNext = (): boolean => {
        if (currentStep === 0) {
            return !!(data.name && data.email && data.password && data.password_confirmation);
        }

        if (currentStep === 1) {
            return !!(data.company_name && data.company_type);
        }

        return data.terms_accepted && data.privacy_accepted;
    };

    const hasStepErrors = (step: number): boolean => {
        if (step === 0) {
            return STEP_1_FIELDS.some((field) => errors[field]);
        }

        if (step === 1) {
            return STEP_2_FIELDS.some((field) => errors[field]);
        }

        return !!(errors.terms_accepted || errors.privacy_accepted);
    };

    const goToStepWithErrors = (): void => {
        for (let i = 0; i < 3; i++) {
            if (hasStepErrors(i)) {
                setCurrentStep(i);

                return;
            }
        }
    };

    const handleNext = (): void => {
        if (currentStep < 2) {
            clearErrors();
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = (): void => {
        if (currentStep > 0) {
            clearErrors();
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        const routeConfig = store();

        post(routeConfig.url, {
            onError: () => {
                goToStepWithErrors();
            },
        });
    };

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
            <div className="w-full max-w-lg">
                <div className="flex flex-col gap-6">
                    <Head title="Créer un compte" />

                    <div className="space-y-4 text-center">
                        <h1 className="text-xl font-medium">
                            {STEP_TITLES[currentStep]}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {STEP_DESCRIPTIONS[currentStep]}
                        </p>
                    </div>

                    <StepIndicator currentStep={currentStep} />

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        {currentStep === 0 && (
                            <StepUserInfo data={data} errors={errors} setData={setData} />
                        )}
                        {currentStep === 1 && (
                            <StepCompanyInfo
                                data={data}
                                errors={errors}
                                setData={setData}
                                companyTypes={companyTypes}
                            />
                        )}
                        {currentStep === 2 && (
                            <StepTerms data={data} errors={errors} setData={setData} />
                        )}

                        <div className="flex items-center justify-between gap-4">
                            {currentStep > 0 ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBack}
                                >
                                    Retour
                                </Button>
                            ) : (
                                <div />
                            )}

                            {currentStep < 2 ? (
                                <Button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={!canGoNext()}
                                >
                                    Suivant
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={processing || !canGoNext()}
                                    data-test="register-user-button"
                                >
                                    {processing && <Spinner />}
                                    Créer mon compte
                                </Button>
                            )}
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Vous avez déjà un compte ?{' '}
                            <TextLink href={login()}>
                                Se connecter
                            </TextLink>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
