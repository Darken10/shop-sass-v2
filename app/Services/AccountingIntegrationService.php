<?php

namespace App\Services;

use App\Enums\AccountType;
use App\Enums\ExpenseStatus;
use App\Enums\JournalEntryStatus;
use App\Enums\StockMovementType;
use App\Models\Finance\Account;
use App\Models\Finance\Expense;
use App\Models\Finance\ExpenseCategory;
use App\Models\Finance\JournalEntry;
use App\Models\Finance\JournalEntryLine;
use App\Models\Logistics\FuelLog;
use App\Models\Logistics\LogisticCharge;
use App\Models\Logistics\StockMovement;
use App\Models\Logistics\SupplyRequest;
use App\Models\Logistics\Transfer;
use App\Models\Pos\Sale;
use App\Models\Pos\SalePayment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Automatically creates journal entries and expenses from business operations.
 *
 * This service bridges the operational modules (POS, Logistics, Supply Chain)
 * with the financial module, ensuring every real business event is reflected
 * in the accounting system.
 */
class AccountingIntegrationService
{
    // ── System Account Codes ───────────────────────────────────────
    // Convention OHADA/SYSCOHADA-compatible chart of accounts
    public const CASH_ACCOUNT = '571000';          // Caisse

    public const BANK_ACCOUNT = '521000';          // Banque

    public const RECEIVABLES_ACCOUNT = '411000';   // Clients

    public const PAYABLES_ACCOUNT = '401000';      // Fournisseurs

    public const INVENTORY_ACCOUNT = '310000';     // Stock de marchandises

    public const SALES_REVENUE_ACCOUNT = '701000'; // Ventes de marchandises

    public const COGS_ACCOUNT = '601000';          // Achats de marchandises

    public const FUEL_EXPENSE_ACCOUNT = '624100';  // Carburant

    public const LOGISTICS_EXPENSE_ACCOUNT = '613000'; // Frais de transport et logistique

    public const LOSS_EXPENSE_ACCOUNT = '658000';  // Pertes sur créances et dépréciation

    public const DISCOUNT_ACCOUNT = '709000';      // Remises accordées

    public const MOBILE_MONEY_ACCOUNT = '572000';  // Mobile Money

    public const BANK_CARD_ACCOUNT = '513000';     // Carte bancaire

    public const CUSTOMER_CREDIT_ACCOUNT = '419000'; // Crédit client

    // ── Sale → Journal Entry ───────────────────────────────────────

    /**
     * Record a completed sale in the accounting system.
     *
     * Debit: Cash/Bank/MobileMoney (amount received per payment method)
     * Debit: Receivables (amount due if credit sale)
     * Credit: Sales Revenue (total sale amount)
     * Credit: Discount given (if any)
     *
     * Also records COGS:
     * Debit: COGS (cost price × quantity for each item)
     * Credit: Inventory (same amount — goods leave stock)
     */
    public function recordSale(Sale $sale): ?JournalEntry
    {
        if (! $this->hasSystemAccounts($sale->company_id)) {
            return null;
        }

        $sale->loadMissing(['items.product', 'payments']);

        return DB::transaction(function () use ($sale) {
            $lines = [];

            // Revenue entry: payments received per method
            foreach ($sale->payments as $payment) {
                $accountCode = $this->getPaymentAccountCode($payment->method->value);
                $account = $this->resolveAccount($accountCode, $sale->company_id);

                if ($account) {
                    $lines[] = [
                        'account_id' => $account->id,
                        'debit' => (float) $payment->amount,
                        'credit' => 0,
                        'description' => "Paiement {$payment->method->label()} — {$sale->reference}",
                    ];
                }
            }

            // Amount due → Receivables
            if ((float) $sale->amount_due > 0) {
                $receivables = $this->resolveAccount(self::RECEIVABLES_ACCOUNT, $sale->company_id);
                if ($receivables) {
                    $lines[] = [
                        'account_id' => $receivables->id,
                        'debit' => (float) $sale->amount_due,
                        'credit' => 0,
                        'description' => "Créance client — {$sale->reference}",
                    ];
                }
            }

            // Credit: Sales Revenue (subtotal before discount)
            $revenueAccount = $this->resolveAccount(self::SALES_REVENUE_ACCOUNT, $sale->company_id);
            if ($revenueAccount) {
                $lines[] = [
                    'account_id' => $revenueAccount->id,
                    'debit' => 0,
                    'credit' => (float) $sale->subtotal,
                    'description' => "Vente {$sale->reference}",
                ];
            }

            // Discount given
            if ((float) $sale->discount_total > 0) {
                $discountAccount = $this->resolveAccount(self::DISCOUNT_ACCOUNT, $sale->company_id);
                if ($discountAccount) {
                    $lines[] = [
                        'account_id' => $discountAccount->id,
                        'debit' => (float) $sale->discount_total,
                        'credit' => 0,
                        'description' => "Remises — {$sale->reference}",
                    ];
                }
            }

            // COGS entries (cost of goods sold)
            $totalCogs = 0;
            foreach ($sale->items as $item) {
                $costPrice = (float) ($item->product->cost_price ?? 0);
                $cogs = $costPrice * (int) $item->quantity;
                $totalCogs += $cogs;
            }

            if ($totalCogs > 0) {
                $cogsAccount = $this->resolveAccount(self::COGS_ACCOUNT, $sale->company_id);
                $inventoryAccount = $this->resolveAccount(self::INVENTORY_ACCOUNT, $sale->company_id);

                if ($cogsAccount && $inventoryAccount) {
                    $lines[] = [
                        'account_id' => $cogsAccount->id,
                        'debit' => $totalCogs,
                        'credit' => 0,
                        'description' => "Coût des marchandises vendues — {$sale->reference}",
                    ];
                    $lines[] = [
                        'account_id' => $inventoryAccount->id,
                        'debit' => 0,
                        'credit' => $totalCogs,
                        'description' => "Sortie stock — {$sale->reference}",
                    ];
                }
            }

            if (empty($lines)) {
                return null;
            }

            return $this->createAndPostEntry(
                description: "Vente POS — {$sale->reference}",
                date: $sale->created_at,
                lines: $lines,
                sourceType: 'sale',
                sourceId: $sale->id,
                companyId: $sale->company_id,
                shopId: $sale->shop_id,
                createdBy: $sale->cashier_id,
            );
        });
    }

    // ── Credit Payment → Journal Entry ────────────────────────────

    /**
     * Record a credit payment (customer paying down their debt).
     *
     * Debit: Cash/Bank (payment received)
     * Credit: Receivables (debt reduced)
     */
    public function recordCreditPayment(SalePayment $payment, Sale $sale): ?JournalEntry
    {
        if (! $this->hasSystemAccounts($sale->company_id)) {
            return null;
        }

        return DB::transaction(function () use ($payment, $sale) {
            $paymentAccountCode = $this->getPaymentAccountCode($payment->method->value);
            $paymentAccount = $this->resolveAccount($paymentAccountCode, $sale->company_id);
            $receivables = $this->resolveAccount(self::RECEIVABLES_ACCOUNT, $sale->company_id);

            if (! $paymentAccount || ! $receivables) {
                return null;
            }

            return $this->createAndPostEntry(
                description: "Paiement crédit client — {$sale->reference}",
                date: now(),
                lines: [
                    [
                        'account_id' => $paymentAccount->id,
                        'debit' => (float) $payment->amount,
                        'credit' => 0,
                        'description' => "Encaissement {$payment->method->label()}",
                    ],
                    [
                        'account_id' => $receivables->id,
                        'debit' => 0,
                        'credit' => (float) $payment->amount,
                        'description' => "Réduction créance — {$sale->reference}",
                    ],
                ],
                sourceType: 'sale',
                sourceId: $sale->id,
                companyId: $sale->company_id,
                shopId: $sale->shop_id,
                createdBy: auth()->id(),
            );
        });
    }

    // ── Supply Request Received → Journal Entry + Expense ─────────

    /**
     * Record a supply request reception (purchase of goods).
     *
     * Debit: Inventory (goods entering stock, valued at cost_price × qty)
     * Credit: Cash/Payables (payment to supplier)
     *
     * Also auto-creates an Expense record for the purchase cost.
     */
    public function recordSupplyReceived(SupplyRequest $supplyRequest): ?JournalEntry
    {
        if (! $this->hasSystemAccounts($supplyRequest->company_id)) {
            return null;
        }

        $supplyRequest->loadMissing(['items.product', 'supplier', 'logisticCharges']);

        return DB::transaction(function () use ($supplyRequest) {
            // Calculate total purchase cost
            $purchaseCost = 0;
            foreach ($supplyRequest->items as $item) {
                $qty = $item->quantity_received ?? $item->quantity_requested;
                $costPrice = (float) ($item->product->cost_price ?? 0);
                $purchaseCost += $costPrice * $qty;
            }

            if ($purchaseCost <= 0) {
                return null;
            }

            $inventoryAccount = $this->resolveAccount(self::INVENTORY_ACCOUNT, $supplyRequest->company_id);
            $payablesAccount = $this->resolveAccount(self::PAYABLES_ACCOUNT, $supplyRequest->company_id);

            if (! $inventoryAccount || ! $payablesAccount) {
                return null;
            }

            $lines = [
                [
                    'account_id' => $inventoryAccount->id,
                    'debit' => $purchaseCost,
                    'credit' => 0,
                    'description' => "Entrée stock — {$supplyRequest->reference}",
                ],
                [
                    'account_id' => $payablesAccount->id,
                    'debit' => 0,
                    'credit' => $purchaseCost,
                    'description' => "Achat fournisseur — {$supplyRequest->reference}",
                ],
            ];

            // Include logistic charges in the journal entry
            $totalCharges = (float) $supplyRequest->logisticCharges->sum('amount');
            if ($totalCharges > 0) {
                $logisticsAccount = $this->resolveAccount(self::LOGISTICS_EXPENSE_ACCOUNT, $supplyRequest->company_id);
                $cashAccount = $this->resolveAccount(self::CASH_ACCOUNT, $supplyRequest->company_id);

                if ($logisticsAccount && $cashAccount) {
                    $lines[] = [
                        'account_id' => $logisticsAccount->id,
                        'debit' => $totalCharges,
                        'credit' => 0,
                        'description' => "Frais logistiques — {$supplyRequest->reference}",
                    ];
                    $lines[] = [
                        'account_id' => $cashAccount->id,
                        'debit' => 0,
                        'credit' => $totalCharges,
                        'description' => "Paiement frais — {$supplyRequest->reference}",
                    ];
                }
            }

            $entry = $this->createAndPostEntry(
                description: "Approvisionnement — {$supplyRequest->reference}",
                date: $supplyRequest->received_at ?? now(),
                lines: $lines,
                sourceType: 'supply_request',
                sourceId: $supplyRequest->id,
                companyId: $supplyRequest->company_id,
                warehouseId: $supplyRequest->destination_warehouse_id,
                createdBy: auth()->id(),
            );

            // Auto-create an approved expense for the purchase
            $this->createAutoExpense(
                label: "Achat marchandises — {$supplyRequest->reference}",
                amount: $purchaseCost + $totalCharges,
                date: $supplyRequest->received_at ?? now(),
                categoryCode: 'purchases',
                companyId: $supplyRequest->company_id,
                warehouseId: $supplyRequest->destination_warehouse_id,
                supplierId: $supplyRequest->supplier_id,
                journalEntryId: $entry?->id,
                createdBy: auth()->id(),
            );

            return $entry;
        });
    }

    // ── Transfer Received → Journal Entry ─────────────────────────

    /**
     * Record a transfer reception (internal stock movement).
     * Internal transfers don't create P&L entries but track inventory movement.
     * Only the associated logistic charges create expenses.
     *
     * Debit: Inventory (destination)
     * Credit: Inventory (source)
     */
    public function recordTransferReceived(Transfer $transfer): ?JournalEntry
    {
        if (! $this->hasSystemAccounts($transfer->company_id)) {
            return null;
        }

        $transfer->loadMissing(['items.product', 'logisticCharges']);

        return DB::transaction(function () use ($transfer) {
            $totalValue = 0;
            foreach ($transfer->items as $item) {
                $qty = $item->quantity_received ?? $item->quantity_requested;
                $costPrice = (float) ($item->product->cost_price ?? 0);
                $totalValue += $costPrice * $qty;
            }

            $lines = [];
            $inventoryAccount = $this->resolveAccount(self::INVENTORY_ACCOUNT, $transfer->company_id);

            // For transfers, we record the movement as inventory reallocation
            // This is a memo entry — same account debit/credit to track the movement
            if ($inventoryAccount && $totalValue > 0) {
                $lines[] = [
                    'account_id' => $inventoryAccount->id,
                    'debit' => $totalValue,
                    'credit' => 0,
                    'description' => "Transfert entrant — {$transfer->reference}",
                ];
                $lines[] = [
                    'account_id' => $inventoryAccount->id,
                    'debit' => 0,
                    'credit' => $totalValue,
                    'description' => "Transfert sortant — {$transfer->reference}",
                ];
            }

            // Logistic charges ARE actual expenses
            $totalCharges = (float) $transfer->logisticCharges->sum('amount');
            if ($totalCharges > 0) {
                $logisticsAccount = $this->resolveAccount(self::LOGISTICS_EXPENSE_ACCOUNT, $transfer->company_id);
                $cashAccount = $this->resolveAccount(self::CASH_ACCOUNT, $transfer->company_id);

                if ($logisticsAccount && $cashAccount) {
                    $lines[] = [
                        'account_id' => $logisticsAccount->id,
                        'debit' => $totalCharges,
                        'credit' => 0,
                        'description' => "Frais logistiques transfert — {$transfer->reference}",
                    ];
                    $lines[] = [
                        'account_id' => $cashAccount->id,
                        'debit' => 0,
                        'credit' => $totalCharges,
                        'description' => "Paiement frais transfert — {$transfer->reference}",
                    ];
                }

                // Auto-create expense for transfer logistics
                $this->createAutoExpense(
                    label: "Frais transfert — {$transfer->reference}",
                    amount: $totalCharges,
                    date: $transfer->received_at ?? now(),
                    categoryCode: 'logistics',
                    companyId: $transfer->company_id,
                    warehouseId: $transfer->source_warehouse_id,
                    journalEntryId: null,
                    createdBy: auth()->id(),
                );
            }

            if (empty($lines)) {
                return null;
            }

            return $this->createAndPostEntry(
                description: "Transfert — {$transfer->reference}",
                date: $transfer->received_at ?? now(),
                lines: $lines,
                sourceType: 'transfer',
                sourceId: $transfer->id,
                companyId: $transfer->company_id,
                warehouseId: $transfer->source_warehouse_id,
                createdBy: auth()->id(),
            );
        });
    }

    // ── Stock Loss/Adjustment → Journal Entry ─────────────────────

    /**
     * Record a stock loss or adjustment in the accounting system.
     *
     * Loss:
     *   Debit: Loss/Depreciation Expense
     *   Credit: Inventory
     *
     * Adjustment (positive):
     *   Debit: Inventory
     *   Credit: Loss/Depreciation (reversal)
     */
    public function recordStockMovement(StockMovement $movement): ?JournalEntry
    {
        // Only record losses and adjustments — other types are handled by their parent operations
        if (! in_array($movement->type, [StockMovementType::Loss, StockMovementType::Adjustment])) {
            return null;
        }

        if (! $this->hasSystemAccounts($movement->company_id)) {
            return null;
        }

        $movement->loadMissing('product');

        return DB::transaction(function () use ($movement) {
            $costPrice = (float) ($movement->product->cost_price ?? 0);
            $value = $costPrice * (int) $movement->quantity;

            if ($value <= 0) {
                return null;
            }

            $inventoryAccount = $this->resolveAccount(self::INVENTORY_ACCOUNT, $movement->company_id);
            $lossAccount = $this->resolveAccount(self::LOSS_EXPENSE_ACCOUNT, $movement->company_id);

            if (! $inventoryAccount || ! $lossAccount) {
                return null;
            }

            $isLoss = $movement->type === StockMovementType::Loss;

            $lines = [
                [
                    'account_id' => $isLoss ? $lossAccount->id : $inventoryAccount->id,
                    'debit' => $value,
                    'credit' => 0,
                    'description' => ($isLoss ? 'Perte stock' : 'Ajustement stock')." — {$movement->product->name}",
                ],
                [
                    'account_id' => $isLoss ? $inventoryAccount->id : $lossAccount->id,
                    'debit' => 0,
                    'credit' => $value,
                    'description' => ($isLoss ? 'Sortie stock perte' : 'Correction stock')." — {$movement->product->name}",
                ],
            ];

            $entry = $this->createAndPostEntry(
                description: ($isLoss ? 'Perte de stock' : 'Ajustement de stock')." — {$movement->product->name}",
                date: $movement->created_at ?? now(),
                lines: $lines,
                sourceType: 'stock_movement',
                sourceId: $movement->id,
                companyId: $movement->company_id,
                warehouseId: $movement->source_warehouse_id ?? $movement->destination_warehouse_id,
                createdBy: auth()->id(),
            );

            // For stock loss, also create an expense
            if ($isLoss) {
                $this->createAutoExpense(
                    label: "Perte stock — {$movement->product->name} (×{$movement->quantity})",
                    amount: $value,
                    date: $movement->created_at ?? now(),
                    categoryCode: 'stock_loss',
                    companyId: $movement->company_id,
                    warehouseId: $movement->source_warehouse_id ?? $movement->destination_warehouse_id,
                    journalEntryId: $entry?->id,
                    createdBy: auth()->id(),
                );
            }

            return $entry;
        });
    }

    // ── Fuel Log → Journal Entry + Expense ────────────────────────

    /**
     * Record a fuel log as an expense.
     *
     * Debit: Fuel Expense
     * Credit: Cash
     */
    public function recordFuelLog(FuelLog $fuelLog): ?JournalEntry
    {
        if (! $this->hasSystemAccounts($fuelLog->company_id)) {
            return null;
        }

        $fuelLog->loadMissing('vehicle');

        return DB::transaction(function () use ($fuelLog) {
            $amount = (float) $fuelLog->cost;

            if ($amount <= 0) {
                return null;
            }

            $fuelAccount = $this->resolveAccount(self::FUEL_EXPENSE_ACCOUNT, $fuelLog->company_id);
            $cashAccount = $this->resolveAccount(self::CASH_ACCOUNT, $fuelLog->company_id);

            if (! $fuelAccount || ! $cashAccount) {
                return null;
            }

            $vehicleName = $fuelLog->vehicle?->name ?? 'Véhicule';

            $entry = $this->createAndPostEntry(
                description: "Carburant — {$vehicleName} ({$fuelLog->quantity_liters}L)",
                date: $fuelLog->fueled_at ?? now(),
                lines: [
                    [
                        'account_id' => $fuelAccount->id,
                        'debit' => $amount,
                        'credit' => 0,
                        'description' => "Carburant {$fuelLog->quantity_liters}L — {$vehicleName}",
                    ],
                    [
                        'account_id' => $cashAccount->id,
                        'debit' => 0,
                        'credit' => $amount,
                        'description' => "Paiement carburant — {$vehicleName}",
                    ],
                ],
                sourceType: 'fuel_log',
                sourceId: $fuelLog->id,
                companyId: $fuelLog->company_id,
                createdBy: $fuelLog->created_by,
            );

            $this->createAutoExpense(
                label: "Carburant — {$vehicleName} ({$fuelLog->quantity_liters}L)",
                amount: $amount,
                date: $fuelLog->fueled_at ?? now(),
                categoryCode: 'fuel',
                companyId: $fuelLog->company_id,
                journalEntryId: $entry?->id,
                createdBy: $fuelLog->created_by,
            );

            return $entry;
        });
    }

    // ── Logistic Charge → Journal Entry + Expense ─────────────────

    /**
     * Record a standalone logistic charge (not already part of supply/transfer).
     *
     * Debit: Logistics Expense
     * Credit: Cash
     */
    public function recordLogisticCharge(LogisticCharge $charge): ?JournalEntry
    {
        // Skip charges already linked to supply requests or transfers
        // (those are handled when the supply/transfer is received)
        if ($charge->supply_request_id || $charge->transfer_id) {
            return null;
        }

        if (! $this->hasSystemAccounts($charge->company_id)) {
            return null;
        }

        return DB::transaction(function () use ($charge) {
            $amount = (float) $charge->amount;

            if ($amount <= 0) {
                return null;
            }

            $logisticsAccount = $this->resolveAccount(self::LOGISTICS_EXPENSE_ACCOUNT, $charge->company_id);
            $cashAccount = $this->resolveAccount(self::CASH_ACCOUNT, $charge->company_id);

            if (! $logisticsAccount || ! $cashAccount) {
                return null;
            }

            $entry = $this->createAndPostEntry(
                description: "Charge logistique — {$charge->label}",
                date: $charge->created_at ?? now(),
                lines: [
                    [
                        'account_id' => $logisticsAccount->id,
                        'debit' => $amount,
                        'credit' => 0,
                        'description' => "{$charge->type->label()} — {$charge->label}",
                    ],
                    [
                        'account_id' => $cashAccount->id,
                        'debit' => 0,
                        'credit' => $amount,
                        'description' => "Paiement — {$charge->label}",
                    ],
                ],
                sourceType: 'logistic_charge',
                sourceId: $charge->id,
                companyId: $charge->company_id,
                createdBy: $charge->created_by,
            );

            $this->createAutoExpense(
                label: "Charge logistique — {$charge->label}",
                amount: $amount,
                date: $charge->created_at ?? now(),
                categoryCode: 'logistics',
                companyId: $charge->company_id,
                journalEntryId: $entry?->id,
                createdBy: $charge->created_by,
            );

            return $entry;
        });
    }

    // ── Approved Expense → Journal Entry ──────────────────────────

    /**
     * Record a manually approved expense in the journal.
     *
     * Debit: Expense account (category-linked or generic)
     * Credit: Cash/Bank (based on payment method)
     */
    public function recordApprovedExpense(Expense $expense): ?JournalEntry
    {
        if (! $this->hasSystemAccounts($expense->company_id)) {
            return null;
        }

        // Skip if already linked to a journal entry (auto-created expenses)
        if ($expense->journal_entry_id) {
            return null;
        }

        $expense->loadMissing('category.account');

        return DB::transaction(function () use ($expense) {
            $amount = (float) $expense->amount;

            if ($amount <= 0) {
                return null;
            }

            // Use category-linked account or the generic logistics expense account
            $expenseAccount = $expense->category?->account
                ?? $this->resolveAccount(self::LOGISTICS_EXPENSE_ACCOUNT, $expense->company_id);

            $paymentAccountCode = $expense->payment_method
                ? $this->getPaymentAccountCode($expense->payment_method->value)
                : self::CASH_ACCOUNT;

            $cashAccount = $this->resolveAccount($paymentAccountCode, $expense->company_id);

            if (! $expenseAccount || ! $cashAccount) {
                return null;
            }

            $entry = $this->createAndPostEntry(
                description: "Dépense — {$expense->label}",
                date: $expense->date ?? now(),
                lines: [
                    [
                        'account_id' => $expenseAccount->id,
                        'debit' => $amount,
                        'credit' => 0,
                        'description' => $expense->label,
                    ],
                    [
                        'account_id' => $cashAccount->id,
                        'debit' => 0,
                        'credit' => $amount,
                        'description' => "Paiement — {$expense->label}",
                    ],
                ],
                sourceType: 'expense',
                sourceId: $expense->id,
                companyId: $expense->company_id,
                shopId: $expense->shop_id,
                warehouseId: $expense->warehouse_id,
                createdBy: auth()->id(),
            );

            // Link the journal entry back to the expense
            $expense->update(['journal_entry_id' => $entry?->id]);

            return $entry;
        });
    }

    // ── System Account Initialization ─────────────────────────────

    /**
     * Create the standard chart of accounts for a company.
     * Called once when financial module is first accessed or via seeder.
     */
    public static function initializeSystemAccounts(string $companyId, ?string $createdBy = null): void
    {
        $accounts = [
            // Assets
            ['code' => self::INVENTORY_ACCOUNT, 'name' => 'Stock de marchandises', 'type' => AccountType::Asset],
            ['code' => self::RECEIVABLES_ACCOUNT, 'name' => 'Clients', 'type' => AccountType::Asset],
            ['code' => self::CASH_ACCOUNT, 'name' => 'Caisse', 'type' => AccountType::Asset],
            ['code' => self::MOBILE_MONEY_ACCOUNT, 'name' => 'Mobile Money', 'type' => AccountType::Asset],
            ['code' => self::BANK_CARD_ACCOUNT, 'name' => 'Carte bancaire', 'type' => AccountType::Asset],
            ['code' => self::BANK_ACCOUNT, 'name' => 'Banque', 'type' => AccountType::Asset],
            ['code' => self::CUSTOMER_CREDIT_ACCOUNT, 'name' => 'Avances clients', 'type' => AccountType::Asset],

            // Liabilities
            ['code' => self::PAYABLES_ACCOUNT, 'name' => 'Fournisseurs', 'type' => AccountType::Liability],

            // Revenue
            ['code' => self::SALES_REVENUE_ACCOUNT, 'name' => 'Ventes de marchandises', 'type' => AccountType::Revenue],

            // Expenses
            ['code' => self::COGS_ACCOUNT, 'name' => 'Achats de marchandises', 'type' => AccountType::Expense],
            ['code' => self::FUEL_EXPENSE_ACCOUNT, 'name' => 'Carburant', 'type' => AccountType::Expense],
            ['code' => self::LOGISTICS_EXPENSE_ACCOUNT, 'name' => 'Frais de transport et logistique', 'type' => AccountType::Expense],
            ['code' => self::LOSS_EXPENSE_ACCOUNT, 'name' => 'Pertes et dépréciations de stock', 'type' => AccountType::Expense],
            ['code' => self::DISCOUNT_ACCOUNT, 'name' => 'Remises accordées', 'type' => AccountType::Expense],
        ];

        $expenseCategories = [
            ['code' => 'purchases', 'name' => 'Achats de marchandises', 'color' => '#3b82f6'],
            ['code' => 'fuel', 'name' => 'Carburant', 'color' => '#f59e0b'],
            ['code' => 'logistics', 'name' => 'Frais logistiques', 'color' => '#8b5cf6'],
            ['code' => 'stock_loss', 'name' => 'Pertes de stock', 'color' => '#ef4444'],
        ];

        DB::transaction(function () use ($accounts, $expenseCategories, $companyId, $createdBy) {
            foreach ($accounts as $data) {
                Account::withoutGlobalScopes()->firstOrCreate(
                    ['code' => $data['code'], 'company_id' => $companyId],
                    [
                        'name' => $data['name'],
                        'type' => $data['type'],
                        'balance' => 0,
                        'is_active' => true,
                        'is_system' => true,
                        'created_by' => $createdBy,
                    ]
                );
            }

            foreach ($expenseCategories as $cat) {
                ExpenseCategory::withoutGlobalScopes()->firstOrCreate(
                    ['code' => $cat['code'], 'company_id' => $companyId],
                    [
                        'name' => $cat['name'],
                        'color' => $cat['color'],
                    ]
                );
            }
        });
    }

    // ── Private Helpers ───────────────────────────────────────────

    private function resolveAccount(string $code, string $companyId): ?Account
    {
        return Account::withoutGlobalScopes()
            ->where('code', $code)
            ->where('company_id', $companyId)
            ->where('is_active', true)
            ->first();
    }

    private function hasSystemAccounts(string $companyId): bool
    {
        return Account::withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->where('is_system', true)
            ->exists();
    }

    private function getPaymentAccountCode(string $method): string
    {
        return match ($method) {
            'cash' => self::CASH_ACCOUNT,
            'mobile_money' => self::MOBILE_MONEY_ACCOUNT,
            'bank_card' => self::BANK_CARD_ACCOUNT,
            'bank_transfer' => self::BANK_ACCOUNT,
            'customer_credit' => self::CUSTOMER_CREDIT_ACCOUNT,
            default => self::CASH_ACCOUNT,
        };
    }

    private function createAndPostEntry(
        string $description,
        Carbon|\DateTimeInterface $date,
        array $lines,
        ?string $sourceType = null,
        ?string $sourceId = null,
        ?string $companyId = null,
        ?string $shopId = null,
        ?string $warehouseId = null,
        ?string $createdBy = null,
    ): ?JournalEntry {
        $totalDebit = collect($lines)->sum('debit');
        $totalCredit = collect($lines)->sum('credit');

        // Validate balanced entry
        if (bccomp((string) $totalDebit, (string) $totalCredit, 2) !== 0) {
            Log::error("AccountingIntegration: Unbalanced entry for {$sourceType}/{$sourceId}", [
                'debit' => $totalDebit,
                'credit' => $totalCredit,
                'description' => $description,
            ]);

            return null;
        }

        $reference = $this->generateReference($sourceType);

        $entry = JournalEntry::withoutGlobalScopes()->create([
            'reference' => $reference,
            'date' => $date instanceof Carbon ? $date->toDateString() : Carbon::parse($date)->toDateString(),
            'description' => $description,
            'status' => JournalEntryStatus::Posted,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'total_debit' => $totalDebit,
            'total_credit' => $totalCredit,
            'shop_id' => $shopId,
            'warehouse_id' => $warehouseId,
            'company_id' => $companyId,
            'created_by' => $createdBy,
            'posted_by' => $createdBy,
            'posted_at' => now(),
        ]);

        foreach ($lines as $line) {
            JournalEntryLine::create([
                'journal_entry_id' => $entry->id,
                'account_id' => $line['account_id'],
                'debit' => $line['debit'] ?? 0,
                'credit' => $line['credit'] ?? 0,
                'description' => $line['description'] ?? null,
            ]);

            // Update account balances
            $account = Account::withoutGlobalScopes()->find($line['account_id']);
            if ($account) {
                if (($line['debit'] ?? 0) > 0) {
                    $account->debit((float) $line['debit']);
                }
                if (($line['credit'] ?? 0) > 0) {
                    $account->credit((float) $line['credit']);
                }
            }
        }

        return $entry;
    }

    private function createAutoExpense(
        string $label,
        float $amount,
        Carbon|\DateTimeInterface $date,
        string $categoryCode,
        string $companyId,
        ?string $shopId = null,
        ?string $warehouseId = null,
        ?string $supplierId = null,
        ?string $journalEntryId = null,
        ?string $createdBy = null,
    ): Expense {
        $category = ExpenseCategory::withoutGlobalScopes()
            ->where('code', $categoryCode)
            ->where('company_id', $companyId)
            ->first();

        $prefix = 'DEP-AUTO-'.now()->format('Ymd');
        $count = Expense::withoutGlobalScopes()
            ->where('reference', 'like', $prefix.'%')
            ->count();
        $reference = $prefix.'-'.str_pad((string) ($count + 1), 4, '0', STR_PAD_LEFT);

        return Expense::withoutGlobalScopes()->create([
            'reference' => $reference,
            'label' => $label,
            'amount' => $amount,
            'date' => $date instanceof Carbon ? $date->toDateString() : Carbon::parse($date)->toDateString(),
            'status' => ExpenseStatus::Approved,
            'payment_method' => null,
            'category_id' => $category?->id,
            'shop_id' => $shopId,
            'warehouse_id' => $warehouseId,
            'supplier_id' => $supplierId,
            'journal_entry_id' => $journalEntryId,
            'company_id' => $companyId,
            'created_by' => $createdBy,
            'approved_by' => $createdBy,
        ]);
    }

    private function generateReference(?string $sourceType = null): string
    {
        $prefix = match ($sourceType) {
            'sale' => 'JE-VTE',
            'supply_request' => 'JE-APR',
            'transfer' => 'JE-TRF',
            'stock_movement' => 'JE-STK',
            'fuel_log' => 'JE-CBR',
            'logistic_charge' => 'JE-LOG',
            'expense' => 'JE-DEP',
            default => 'JE-AUTO',
        };

        $date = now()->format('Ymd');
        $count = JournalEntry::withoutGlobalScopes()
            ->where('reference', 'like', "{$prefix}-{$date}%")
            ->count();

        return "{$prefix}-{$date}-".str_pad((string) ($count + 1), 4, '0', STR_PAD_LEFT);
    }
}
