import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Ban, CalendarDays, CheckCircle, FileText, Store, User, Warehouse } from 'lucide-react';
import { postJournalEntry, voidJournalEntry } from '@/actions/App/Http/Controllers/Finance/AccountingController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Line = {
    id: string;
    debit: string;
    credit: string;
    description: string | null;
    account: { id: string; code: string; name: string; type: string };
};

type JournalEntry = {
    id: string;
    reference: string;
    date: string;
    description: string;
    status: string;
    total_debit: string;
    total_credit: string;
    notes: string | null;
    source_type: string | null;
    lines: Line[];
    creator: { id: string; name: string } | null;
    poster: { id: string; name: string } | null;
    shop: { id: string; name: string } | null;
    warehouse: { id: string; name: string } | null;
    posted_at: string | null;
    created_at: string;
};

type Props = { entry: JournalEntry };

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft: { label: 'Brouillon', variant: 'outline' },
    posted: { label: 'Validée', variant: 'default' },
    voided: { label: 'Annulée', variant: 'destructive' },
};

function fmt(v: string | number): string {
    return Number(v).toLocaleString('fr-FR');
}

export default function JournalShow({ entry }: Props) {
    const st = statusMap[entry.status] ?? { label: entry.status, variant: 'outline' as const };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Finance', href: '/finance' },
        { title: 'Journal', href: '/finance/accounting/journal' },
        { title: entry.reference, href: '#' },
    ];

    function handlePost() {
        if (!confirm('Valider et comptabiliser cette écriture ?')) return;
        router.post(postJournalEntry(entry.id).url);
    }

    function handleVoid() {
        if (!confirm('Annuler cette écriture ? Les soldes des comptes seront contre-passés.')) return;
        router.post(voidJournalEntry(entry.id).url);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Écriture ${entry.reference}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="icon">
                            <Link href="/finance/accounting/journal">
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-xl font-semibold">{entry.description}</h1>
                            <p className="font-mono text-sm text-muted-foreground">{entry.reference}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={st.variant} className="text-sm">{st.label}</Badge>
                        {entry.status === 'draft' && (
                            <Button size="sm" onClick={handlePost}>
                                <CheckCircle className="size-4" />
                                Valider
                            </Button>
                        )}
                        {entry.status === 'posted' && (
                            <Button size="sm" variant="destructive" onClick={handleVoid}>
                                <Ban className="size-4" />
                                Annuler
                            </Button>
                        )}
                    </div>
                </div>

                <div className="mx-auto w-full max-w-4xl space-y-6">
                    {/* Meta */}
                    <Card>
                        <CardContent className="grid gap-3 p-6 sm:grid-cols-2">
                            <DetailRow icon={CalendarDays} label="Date" value={new Date(entry.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} />
                            {entry.shop && <DetailRow icon={Store} label="Boutique" value={entry.shop.name} />}
                            {entry.warehouse && <DetailRow icon={Warehouse} label="Entrepôt" value={entry.warehouse.name} />}
                            {entry.creator && <DetailRow icon={User} label="Créé par" value={entry.creator.name} />}
                            {entry.poster && <DetailRow icon={User} label="Validé par" value={entry.poster.name} />}
                            {entry.posted_at && <DetailRow icon={CalendarDays} label="Validé le" value={new Date(entry.posted_at).toLocaleString('fr-FR')} />}
                            {entry.source_type && <DetailRow icon={FileText} label="Source" value={entry.source_type} />}
                        </CardContent>
                    </Card>

                    {entry.notes && (
                        <Card>
                            <CardContent className="p-6">
                                <p className="text-xs font-medium text-muted-foreground">Notes</p>
                                <p className="mt-1 text-sm">{entry.notes}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Lines */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Lignes d'écriture</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Compte</TableHead>
                                        <TableHead>Libellé</TableHead>
                                        <TableHead className="text-right">Débit</TableHead>
                                        <TableHead className="text-right">Crédit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entry.lines.map((line) => (
                                        <TableRow key={line.id}>
                                            <TableCell className="font-mono text-xs">{line.account.code}</TableCell>
                                            <TableCell className="font-medium">{line.account.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{line.description ?? '—'}</TableCell>
                                            <TableCell className="text-right font-semibold">{Number(line.debit) > 0 ? `${fmt(line.debit)} F` : ''}</TableCell>
                                            <TableCell className="text-right font-semibold">{Number(line.credit) > 0 ? `${fmt(line.credit)} F` : ''}</TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Totals */}
                                    <TableRow className="bg-muted/50 font-bold">
                                        <TableCell colSpan={3} className="text-right">Total</TableCell>
                                        <TableCell className="text-right">{fmt(entry.total_debit)} F</TableCell>
                                        <TableCell className="text-right">{fmt(entry.total_credit)} F</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof Store; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3">
            <Icon className="size-4 text-muted-foreground" />
            <span className="w-28 text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}
