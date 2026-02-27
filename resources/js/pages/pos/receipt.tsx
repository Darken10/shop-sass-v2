import { Head, Link } from '@inertiajs/react';
import { Check, Printer, QrCode, ShoppingCart } from 'lucide-react';
import { useRef } from 'react';
import { index as posIndex } from '@/actions/App/Http/Controllers/Pos/CashRegisterController';
import { create as terminalRoute } from '@/actions/App/Http/Controllers/Pos/SaleController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type SaleItem = {
    id: string;
    quantity: number;
    unit_price: string;
    discount: string;
    subtotal: string;
    product: { id: string; name: string; code: string };
    promotion: { id: string; name: string } | null;
};

type Payment = {
    id: string;
    method: string;
    amount: string;
    reference: string | null;
};

type Sale = {
    id: string;
    reference: string;
    status: string;
    subtotal: string;
    discount_total: string;
    total: string;
    amount_paid: string;
    amount_due: string;
    change_given: string;
    change_residue: string;
    qr_code_token: string;
    created_at: string;
    items: SaleItem[];
    payments: Payment[];
    customer: { id: string; name: string; phone: string | null } | null;
    cashier: { id: string; name: string };
    shop: { id: string; name: string; code: string };
    session: { id: string; session_number: string };
};

const methodLabels: Record<string, string> = {
    cash: 'Espèces',
    mobile_money: 'Mobile Money',
    bank_card: 'Carte bancaire',
    bank_transfer: 'Virement',
    customer_credit: 'Crédit client',
};

const statusLabels: Record<string, string> = {
    completed: 'Payée',
    partially_paid: 'Partiellement payée',
    unpaid: 'Impayée',
    cancelled: 'Annulée',
};

export default function PosReceipt({ sale }: { sale: Sale }) {
    const printRef = useRef<HTMLDivElement>(null);

    function handlePrint() {
        window.print();
    }

    const date = new Date(sale.created_at);
    const formattedDate = date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <>
            <Head title={`Reçu ${sale.reference}`}>
                <style>{`
                    @page {
                        size: 80mm auto;
                        margin: 2mm;
                    }
                    @media print {
                        html, body {
                            width: 80mm !important;
                            min-width: 80mm !important;
                            max-width: 80mm !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            background: white !important;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        /* Hide the sidebar, nav, and non-receipt UI */
                        nav, aside, header, footer,
                        [data-sidebar], [data-slot="sidebar"] {
                            display: none !important;
                        }
                        #receipt-root {
                            width: 76mm !important;
                            max-width: 76mm !important;
                            margin: 0 !important;
                            padding: 2mm !important;
                            position: absolute;
                            top: 0;
                            left: 0;
                        }
                        #receipt-root * {
                            color: black !important;
                            border-color: #ccc !important;
                        }
                    }
                `}</style>
            </Head>

            {/* Action bar (hidden on print) */}
            <div className="flex items-center justify-center gap-3 border-b bg-card p-4 print:hidden">
                <Badge variant="default" className="gap-1">
                    <Check className="size-3" /> Vente enregistrée
                </Badge>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="size-4" /> Imprimer
                </Button>
                <Button variant="outline" size="sm" asChild>
                    <Link href={terminalRoute().url}>
                        <ShoppingCart className="size-4" /> Nouvelle vente
                    </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                    <Link href={posIndex().url}>Retour POS</Link>
                </Button>
            </div>

            {/* Receipt */}
            <div id="receipt-root" className="mx-auto max-w-sm p-4 print:p-0" ref={printRef}>
                <div className="rounded-lg border bg-white p-6 text-sm print:rounded-none print:border-none print:p-0 print:text-[11px] print:shadow-none dark:bg-card">
                    {/* Header */}
                    <div className="mb-4 text-center">
                        <h1 className="text-lg font-bold">{sale.shop.name}</h1>
                        <p className="text-xs text-muted-foreground">Code : {sale.shop.code}</p>
                        <Separator className="my-2" />
                        <p className="font-mono text-xs">
                            {formattedDate} à {formattedTime}
                        </p>
                        <p className="font-mono text-xs">Réf : {sale.reference}</p>
                        <p className="font-mono text-xs">Session : #{sale.session.session_number}</p>
                        <p className="font-mono text-xs">Caissier : {sale.cashier.name}</p>
                        {sale.customer && <p className="font-mono text-xs">Client : {sale.customer.name}</p>}
                    </div>

                    <Separator className="my-2" />

                    {/* Items */}
                    <div className="space-y-1">
                        {sale.items.map((item) => (
                            <div key={item.id}>
                                <div className="flex justify-between">
                                    <span className="flex-1 truncate">{item.product.name}</span>
                                    <span className="ml-2 font-mono">{Number(item.subtotal).toLocaleString('fr-FR')}</span>
                                </div>
                                <div className="flex justify-between font-mono text-xs text-muted-foreground">
                                    <span>
                                        {item.quantity} × {Number(item.unit_price).toLocaleString('fr-FR')}
                                    </span>
                                    {Number(item.discount) > 0 && <span className="text-green-600">-{Number(item.discount).toLocaleString('fr-FR')}</span>}
                                </div>
                                {item.promotion && <p className="text-xs text-green-600">↳ {item.promotion.name}</p>}
                            </div>
                        ))}
                    </div>

                    <Separator className="my-2" />

                    {/* Totals */}
                    <div className="space-y-0.5 font-mono text-xs">
                        <div className="flex justify-between">
                            <span>Sous-total</span>
                            <span>{Number(sale.subtotal).toLocaleString('fr-FR')}</span>
                        </div>
                        {Number(sale.discount_total) > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Remises</span>
                                <span>-{Number(sale.discount_total).toLocaleString('fr-FR')}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-base font-bold">
                            <span>TOTAL</span>
                            <span>{Number(sale.total).toLocaleString('fr-FR')} FCFA</span>
                        </div>
                    </div>

                    <Separator className="my-2" />

                    {/* Payments */}
                    <div className="space-y-0.5 font-mono text-xs">
                        <p className="text-[10px] font-semibold uppercase tracking-wider">Paiements</p>
                        {sale.payments.map((p) => (
                            <div key={p.id} className="flex justify-between">
                                <span>
                                    {methodLabels[p.method] ?? p.method}
                                    {p.reference ? ` (${p.reference})` : ''}
                                </span>
                                <span>{Number(p.amount).toLocaleString('fr-FR')}</span>
                            </div>
                        ))}
                        {Number(sale.change_given) > 0 && (
                            <div className="flex justify-between">
                                <span>Monnaie rendue</span>
                                <span>{Number(sale.change_given).toLocaleString('fr-FR')}</span>
                            </div>
                        )}
                        {Number(sale.amount_due) > 0 && (
                            <div className="flex justify-between text-orange-600">
                                <span>Reste dû</span>
                                <span>{Number(sale.amount_due).toLocaleString('fr-FR')}</span>
                            </div>
                        )}
                    </div>

                    <Separator className="my-3" />

                    {/* QR Code placeholder */}
                    <div className="flex flex-col items-center gap-1">
                        <QrCode className="size-16 text-muted-foreground/50" />
                        <p className="font-mono text-[9px] text-muted-foreground">{sale.qr_code_token}</p>
                        <p className="text-center text-[9px] text-muted-foreground">
                            Scannez pour vérifier le reçu
                        </p>
                    </div>

                    <Separator className="my-2" />

                    <p className="text-center text-[10px] text-muted-foreground">
                        Merci pour votre achat !
                    </p>
                    <p className="text-center font-mono text-[9px] text-muted-foreground">
                        {statusLabels[sale.status] ?? sale.status}
                    </p>
                </div>
            </div>
        </>
    );
}
