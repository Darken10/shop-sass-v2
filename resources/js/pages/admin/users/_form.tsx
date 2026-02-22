import { Building2, Mail, Shield, User } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type CompanyOption = { id: string; name: string };

type Props = {
    defaults?: {
        name?: string;
        email?: string;
        role?: string;
        company_id?: string;
    };
    roles: string[];
    companies: CompanyOption[];
    isSuperAdmin: boolean;
    errors: Partial<Record<string, string>>;
};

const roleLabels: Record<string, string> = {
    'super admin': 'Super Admin',
    admin: 'Admin',
    gestionnaire: 'Gestionnaire',
    caissier: 'Caissier',
    logisticien: 'Logisticien',
    magasinier: 'Magasinier',
};

export default function UserForm({ defaults = {}, roles, companies, isSuperAdmin, errors }: Props) {
    const [roleValue, setRoleValue] = useState<string>(defaults.role ?? '');
    const [companyValue, setCompanyValue] = useState<string>(defaults.company_id ?? '');

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Identity */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <User className="size-4" />
                        Identité
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">
                            Nom complet <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={defaults.name ?? ''}
                            placeholder="Jean Dupont"
                            autoFocus
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">
                            <Mail className="mr-1 inline size-3" />
                            Email <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            defaultValue={defaults.email ?? ''}
                            placeholder="jean@entreprise.com"
                        />
                        <InputError message={errors.email} />
                    </div>
                </CardContent>
            </Card>

            {/* Role & Company */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Shield className="size-4" />
                        Rôle et entreprise
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="role">
                            Rôle <span className="text-destructive">*</span>
                        </Label>
                        <Select value={roleValue} onValueChange={setRoleValue}>
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Choisir un rôle" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem key={role} value={role}>
                                        {roleLabels[role] ?? role}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <input type="hidden" name="role" value={roleValue} />
                        <InputError message={errors.role} />
                    </div>

                    {isSuperAdmin && (
                        <div className="grid gap-2">
                            <Label htmlFor="company_id">
                                <Building2 className="mr-1 inline size-3" />
                                Entreprise <span className="text-destructive">*</span>
                            </Label>
                            <Select value={companyValue} onValueChange={setCompanyValue}>
                                <SelectTrigger id="company_id">
                                    <SelectValue placeholder="Choisir une entreprise" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <input type="hidden" name="company_id" value={companyValue} />
                            <InputError message={errors.company_id} />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
