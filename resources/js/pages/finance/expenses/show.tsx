import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, CheckCircle, FileText, Store, Tag, Truck, User, Warehouse, XCircle } from 'lucide-react';
import { approve, reject } from '@/actions/App/Http/Controllers/Finance/ExpenseController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Expense = {
    id: string;
    reference: string;
    label: string;
    description: string | null;
    amount: string;
    date: string;
    status: string;
    payment_method: string;
    receipt_number: string | null;
    category: { id: string; name: string; color: string | null; code: string | null } | null;
    shop: { id: string; name: string } | null;
    warehouse: { id: string; name: string } | null;
    supplier: { id: string; name: string } | null;
    creator: { id: string; name: string } | null;
    approver: { id: string; name: string } | null;
    journal_entry: { id: string; reference: string } | null;
    created_at: string;
};

type Props = { expense: Expense };

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'En attente', variant: 'outline' },
    approved: { label: 'Approuvée', variant: 'default' },
    rejected: { label: 'Rejetée', variant: 'destructive' },
};

const paymentLabels: Record<string, string> = {
    cash: 'Espèces',
    card: 'Carte bancaire',
    mobile_money: 'Mobile Money',
    bank_transfer: 'Virement bancaire',
    credit: 'Crédit',
};

function fmt(v: string | number): string {
    return Number(v).toLocaleString('fr-FR');
}

export default function ExpenseShow({ expense }: Props) {
    const st = statusMap[expense.status] ?? { label: expense.status, variant: 'outline' as const };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Finance', href: '/finance' },
        { title: 'Dépenses', href: '/finance/expenses' },
        { title: expense.reference, href: '#' },
    ];

    function handleApprove() {
        if (!confirm('Approuver cette dépense ?')) return;
        router.post(approve(expense.id).url);
    }

    function handleReject() {
        if (!confirm('Rejeter cette dépense ?')) return;
        router.post(reject(expense.id).url);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Dépense ${expense.reference}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="icon">
                            <Link href="/finance/expenses">
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-xl font-semibold">{expense.label}</h1>
                            <p className="font-mono text-sm text-muted-foreground">{expense.reference}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={st.variant} className="text-sm">{st.label}</Badge>
                        {expense.status === 'pending' && (
                            <>
                                <Button size="sm" variant="default" onClick={handleApprove}>
                                    <CheckCircle className="size-4" />
                                    Approuver
                                </Button>
                                <Button size="sm" variant="destructive" onClick={handleReject}>
                                    <XCircle className="size-4" />
                                    Rejeter
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="mx-auto w-full max-w-3xl space-y-6">
                    {/* Amount */}
                    <Card>
                        <CardContent className="flex items-center justify-between p-6">
                            <div>
                                <p className="text-sm text-muted-foreground">Montant</p>
                                <p className="text-3xl font-bold">{fmt(expense.amount)} F</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Mode de paiement</p>
                                <p className="font-medium">{paymentLabels[expense.payment_method] ?? expense.payment_method}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Détails</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <DetailRow icon={CalendarDays} label="Date" value={new Date(expense.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} />
                            {expense.category && (
                                <DetailRow icon={Tag} label="Catégorie" value={expense.category.name} color={expense.category.color} />
                            )}
                            {expense.shop && <DetailRow icon={Store} label="Boutique" value={expense.shop.name} />}
                            {expense.warehouse && <DetailRow icon={Warehouse} label="Entrepôt" value={expense.warehouse.name} />}
                            {expense.supplier && <DetailRow icon={Truck} label="Fournisseur" value={expense.supplier.name} />}
                            {expense.receipt_number && <DetailRow icon={FileText} label="N° de reçu" value={expense.receipt_number} />}
                            {expense.description && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="mb-1 text-xs font-medium text-muted-foreground">Description</p>
                                        <p className="text-sm">{expense.description}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Audit */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Historique</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {expense.creator && <DetailRow icon={User} label="Créé par" value={expense.creator.name} />}
                            <DetailRow icon={CalendarDays} label="Créé le" value={new Date(expense.created_at).toLocaleString('fr-FR')} />
                            {expense.approver && <DetailRow icon={User} label="Traité par" value={expense.approver.name} />}
                            {expense.journal_entry && (
                                <DetailRow icon={FileText} label="Écriture comptable" value={expense.journal_entry.reference} />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

function DetailRow({ icon: Icon, label, value, color }: { icon: typeof Store; label: string; value: string; color?: string | null }) {
    return (
        <div className="flex items-center gap-3">
            <Icon className="size-4 text-muted-foreground" />
            <span className="w-32 text-sm text-muted-foreground">{label}</span>
            <span className="flex items-center gap-1.5 text-sm font-medium">
                {color && <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />}
                {value}
            </span>
        </div>
    );
}
