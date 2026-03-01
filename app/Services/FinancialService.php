<?php

namespace App\Services;

use App\Enums\AccountType;
use App\Enums\ExpenseStatus;
use App\Enums\JournalEntryStatus;
use App\Enums\SaleStatus;
use App\Models\Finance\Account;
use App\Models\Finance\Expense;
use App\Models\Finance\JournalEntry;
use App\Models\Logistics\LogisticCharge;
use App\Models\Pos\Sale;
use App\Models\Pos\SaleItem;
use App\Models\Pos\SalePayment;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class FinancialService
{
    // ── Overview KPIs ──────────────────────────────────────────────

    /**
     * @return array{
     *     totalRevenue: float,
     *     totalExpenses: float,
     *     netProfit: float,
     *     profitMargin: float,
     *     totalSalesCount: int,
     *     averageOrderValue: float,
     *     totalReceivables: float,
     *     totalLogisticCosts: float,
     *     revenueGrowth: float|null,
     *     expenseGrowth: float|null,
     * }
     */
    public function getOverviewKpis(Carbon $startDate, Carbon $endDate, ?string $shopId = null, ?string $warehouseId = null): array
    {
        $previousStart = $startDate->copy()->sub($startDate->diffAsCarbonInterval($endDate));
        $previousEnd = $startDate->copy()->subDay();

        $revenue = $this->getTotalRevenue($startDate, $endDate, $shopId);
        $previousRevenue = $this->getTotalRevenue($previousStart, $previousEnd, $shopId);
        $expenses = $this->getTotalExpenses($startDate, $endDate, $shopId, $warehouseId);
        $previousExpenses = $this->getTotalExpenses($previousStart, $previousEnd, $shopId, $warehouseId);
        $logisticCosts = $this->getTotalLogisticCosts($startDate, $endDate);
        $totalExpensesWithLogistics = $expenses + $logisticCosts;

        $salesCount = $this->getSalesCount($startDate, $endDate, $shopId);
        $receivables = $this->getTotalReceivables($shopId);

        $netProfit = $revenue - $totalExpensesWithLogistics;
        $profitMargin = $revenue > 0 ? round(($netProfit / $revenue) * 100, 1) : 0;
        $averageOrderValue = $salesCount > 0 ? round($revenue / $salesCount, 2) : 0;

        $revenueGrowth = $previousRevenue > 0
            ? round((($revenue - $previousRevenue) / $previousRevenue) * 100, 1)
            : null;

        $expenseGrowth = $previousExpenses > 0
            ? round((($expenses - $previousExpenses) / $previousExpenses) * 100, 1)
            : null;

        return [
            'totalRevenue' => $revenue,
            'totalExpenses' => $totalExpensesWithLogistics,
            'netProfit' => $netProfit,
            'profitMargin' => $profitMargin,
            'totalSalesCount' => $salesCount,
            'averageOrderValue' => $averageOrderValue,
            'totalReceivables' => $receivables,
            'totalLogisticCosts' => $logisticCosts,
            'revenueGrowth' => $revenueGrowth,
            'expenseGrowth' => $expenseGrowth,
        ];
    }

    // ── Revenue Analytics ───────────────────────────────────────────

    /**
     * @return Collection<int, array{date: string, revenue: float, cost: float, profit: float, count: int}>
     */
    public function getRevenueTimeSeries(Carbon $startDate, Carbon $endDate, ?string $shopId = null, string $groupBy = 'day'): Collection
    {
        $dateFormat = match ($groupBy) {
            'week' => 'YEARWEEK(sales.created_at, 1)',
            'month' => "DATE_FORMAT(sales.created_at, '%Y-%m')",
            default => 'DATE(sales.created_at)',
        };

        $query = Sale::query()
            ->where('status', '!=', SaleStatus::Cancelled)
            ->whereBetween('sales.created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->selectRaw("{$dateFormat} as period, SUM(total) as revenue, COUNT(*) as count")
            ->groupByRaw($dateFormat)
            ->orderBy('period');

        if ($shopId) {
            $query->where('shop_id', $shopId);
        }

        $sales = $query->get();

        // Get cost of goods sold per period
        $costQuery = SaleItem::query()
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.status', '!=', SaleStatus::Cancelled)
            ->whereBetween('sales.created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->selectRaw("{$dateFormat} as period, SUM(products.cost_price * sale_items.quantity) as cost")
            ->groupByRaw($dateFormat);

        if ($shopId) {
            $costQuery->where('sales.shop_id', $shopId);
        }

        $costs = $costQuery->get()->keyBy('period');

        return $sales->map(function ($row) use ($costs, $groupBy) {
            $cost = (float) ($costs[$row->period]->cost ?? 0);
            $revenue = (float) $row->revenue;

            return [
                'date' => $this->formatPeriodLabel($row->period, $groupBy),
                'revenue' => $revenue,
                'cost' => $cost,
                'profit' => $revenue - $cost,
                'count' => (int) $row->count,
            ];
        });
    }

    /**
     * @return Collection<int, array{shop: string, shop_id: string, revenue: float, count: int, percentage: float}>
     */
    public function getRevenueByShop(Carbon $startDate, Carbon $endDate): Collection
    {
        $total = $this->getTotalRevenue($startDate, $endDate);

        return Sale::query()
            ->join('shops', 'sales.shop_id', '=', 'shops.id')
            ->where('sales.status', '!=', SaleStatus::Cancelled)
            ->whereBetween('sales.created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->selectRaw('shops.id as shop_id, shops.name as shop, SUM(sales.total) as revenue, COUNT(sales.id) as count')
            ->groupBy('shops.id', 'shops.name')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($row) => [
                'shop' => $row->shop,
                'shop_id' => $row->shop_id,
                'revenue' => (float) $row->revenue,
                'count' => (int) $row->count,
                'percentage' => $total > 0 ? round(((float) $row->revenue / $total) * 100, 1) : 0,
            ]);
    }

    /**
     * @return Collection<int, array{method: string, label: string, total: float, percentage: float}>
     */
    public function getPaymentMethodBreakdown(Carbon $startDate, Carbon $endDate, ?string $shopId = null): Collection
    {
        $query = SalePayment::query()
            ->whereBetween('sale_payments.created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->selectRaw('method, SUM(amount) as total')
            ->groupBy('method')
            ->orderByDesc('total');

        if ($shopId) {
            $query->join('sales', 'sale_payments.sale_id', '=', 'sales.id')
                ->where('sales.shop_id', $shopId);
        }

        $results = $query->get();
        $grandTotal = $results->sum('total') ?: 1;

        return $results->map(fn ($row) => [
            'method' => $row->method->value,
            'label' => $row->method->label(),
            'total' => (float) $row->total,
            'percentage' => round(((float) $row->total / $grandTotal) * 100, 1),
        ]);
    }

    // ── Expense Analytics ──────────────────────────────────────────

    /**
     * @return Collection<int, array{date: string, amount: float, count: int}>
     */
    public function getExpenseTimeSeries(Carbon $startDate, Carbon $endDate, ?string $shopId = null, ?string $warehouseId = null, string $groupBy = 'day'): Collection
    {
        $dateFormat = match ($groupBy) {
            'week' => 'YEARWEEK(expenses.date, 1)',
            'month' => "DATE_FORMAT(expenses.date, '%Y-%m')",
            default => 'DATE(expenses.date)',
        };

        $query = Expense::query()
            ->where('status', ExpenseStatus::Approved)
            ->whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])
            ->selectRaw("{$dateFormat} as period, SUM(amount) as amount, COUNT(*) as count")
            ->groupByRaw($dateFormat)
            ->orderBy('period');

        if ($shopId) {
            $query->where('shop_id', $shopId);
        }

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        return $query->get()->map(fn ($row) => [
            'date' => $this->formatPeriodLabel($row->period, $groupBy),
            'amount' => (float) $row->amount,
            'count' => (int) $row->count,
        ]);
    }

    /**
     * @return Collection<int, array{category: string, category_id: string|null, amount: float, count: int, percentage: float}>
     */
    public function getExpensesByCategory(Carbon $startDate, Carbon $endDate, ?string $shopId = null, ?string $warehouseId = null): Collection
    {
        $query = Expense::query()
            ->leftJoin('expense_categories', 'expenses.category_id', '=', 'expense_categories.id')
            ->where('expenses.status', ExpenseStatus::Approved)
            ->whereBetween('expenses.date', [$startDate->toDateString(), $endDate->toDateString()])
            ->selectRaw('expense_categories.id as category_id, COALESCE(expense_categories.name, \'Non catégorisé\') as category, SUM(expenses.amount) as amount, COUNT(*) as count')
            ->groupBy('expense_categories.id', 'expense_categories.name')
            ->orderByDesc('amount');

        if ($shopId) {
            $query->where('expenses.shop_id', $shopId);
        }

        if ($warehouseId) {
            $query->where('expenses.warehouse_id', $warehouseId);
        }

        $results = $query->get();
        $grandTotal = $results->sum('amount') ?: 1;

        return $results->map(fn ($row) => [
            'category' => $row->category,
            'category_id' => $row->category_id,
            'amount' => (float) $row->amount,
            'count' => (int) $row->count,
            'percentage' => round(((float) $row->amount / $grandTotal) * 100, 1),
        ]);
    }

    // ── Profit & Loss ──────────────────────────────────────────────

    /**
     * @return array{
     *     revenue: array{sales: float, otherIncome: float, total: float},
     *     costOfGoodsSold: float,
     *     grossProfit: float,
     *     grossMargin: float,
     *     expenses: array{categories: Collection, logisticCosts: float, total: float},
     *     netProfit: float,
     *     netMargin: float,
     * }
     */
    public function getProfitAndLoss(Carbon $startDate, Carbon $endDate, ?string $shopId = null, ?string $warehouseId = null): array
    {
        $salesRevenue = $this->getTotalRevenue($startDate, $endDate, $shopId);
        $cogs = $this->getCostOfGoodsSold($startDate, $endDate, $shopId);
        $grossProfit = $salesRevenue - $cogs;
        $grossMargin = $salesRevenue > 0 ? round(($grossProfit / $salesRevenue) * 100, 1) : 0;

        $expensesByCategory = $this->getExpensesByCategory($startDate, $endDate, $shopId, $warehouseId);
        $totalExpenses = $expensesByCategory->sum('amount');
        $logisticCosts = $this->getTotalLogisticCosts($startDate, $endDate);
        $totalAllExpenses = $totalExpenses + $logisticCosts;

        $netProfit = $grossProfit - $totalAllExpenses;
        $netMargin = $salesRevenue > 0 ? round(($netProfit / $salesRevenue) * 100, 1) : 0;

        return [
            'revenue' => [
                'sales' => $salesRevenue,
                'otherIncome' => 0,
                'total' => $salesRevenue,
            ],
            'costOfGoodsSold' => $cogs,
            'grossProfit' => $grossProfit,
            'grossMargin' => $grossMargin,
            'expenses' => [
                'categories' => $expensesByCategory,
                'logisticCosts' => $logisticCosts,
                'total' => $totalAllExpenses,
            ],
            'netProfit' => $netProfit,
            'netMargin' => $netMargin,
        ];
    }

    // ── Cash Flow ─────────────────────────────────────────────────

    /**
     * @return array{
     *     inflows: array{sales: float, creditPayments: float, total: float},
     *     outflows: array{expenses: float, logisticCosts: float, total: float},
     *     netCashFlow: float,
     *     byPeriod: Collection,
     * }
     */
    public function getCashFlow(Carbon $startDate, Carbon $endDate, ?string $shopId = null, string $groupBy = 'day'): array
    {
        // Cash inflows: actual payments received
        $salesInflow = (float) SalePayment::query()
            ->join('sales', 'sale_payments.sale_id', '=', 'sales.id')
            ->where('sales.status', '!=', SaleStatus::Cancelled)
            ->whereBetween('sale_payments.created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->when($shopId, fn ($q) => $q->where('sales.shop_id', $shopId))
            ->sum('sale_payments.amount');

        // Credit payments (customers paying down their credit)
        $creditPayments = 0; // Could be tracked separately

        // Cash outflows
        $expenseOutflow = $this->getTotalExpenses($startDate, $endDate, $shopId);
        $logisticOutflow = $this->getTotalLogisticCosts($startDate, $endDate);

        $totalInflow = $salesInflow + $creditPayments;
        $totalOutflow = $expenseOutflow + $logisticOutflow;

        // Cash flow by period
        $dateFormat = match ($groupBy) {
            'week' => 'YEARWEEK(created_at, 1)',
            'month' => "DATE_FORMAT(created_at, '%Y-%m')",
            default => 'DATE(created_at)',
        };

        $inflowByPeriod = SalePayment::query()
            ->join('sales', 'sale_payments.sale_id', '=', 'sales.id')
            ->where('sales.status', '!=', SaleStatus::Cancelled)
            ->whereBetween('sale_payments.created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->when($shopId, fn ($q) => $q->where('sales.shop_id', $shopId))
            ->selectRaw(str_replace('created_at', 'sale_payments.created_at', $dateFormat).' as period, SUM(sale_payments.amount) as inflow')
            ->groupByRaw(str_replace('created_at', 'sale_payments.created_at', $dateFormat))
            ->pluck('inflow', 'period');

        $expDateFormat = match ($groupBy) {
            'week' => 'YEARWEEK(date, 1)',
            'month' => "DATE_FORMAT(date, '%Y-%m')",
            default => 'DATE(date)',
        };

        $outflowByPeriod = Expense::query()
            ->where('status', ExpenseStatus::Approved)
            ->whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])
            ->when($shopId, fn ($q) => $q->where('shop_id', $shopId))
            ->selectRaw("{$expDateFormat} as period, SUM(amount) as outflow")
            ->groupByRaw($expDateFormat)
            ->pluck('outflow', 'period');

        $allPeriods = $inflowByPeriod->keys()->merge($outflowByPeriod->keys())->unique()->sort();

        $byPeriod = $allPeriods->map(function ($period) use ($inflowByPeriod, $outflowByPeriod, $groupBy) {
            $inflow = (float) ($inflowByPeriod[$period] ?? 0);
            $outflow = (float) ($outflowByPeriod[$period] ?? 0);

            return [
                'date' => $this->formatPeriodLabel($period, $groupBy),
                'inflow' => $inflow,
                'outflow' => $outflow,
                'net' => $inflow - $outflow,
            ];
        })->values();

        return [
            'inflows' => [
                'sales' => $salesInflow,
                'creditPayments' => $creditPayments,
                'total' => $totalInflow,
            ],
            'outflows' => [
                'expenses' => $expenseOutflow,
                'logisticCosts' => $logisticOutflow,
                'total' => $totalOutflow,
            ],
            'netCashFlow' => $totalInflow - $totalOutflow,
            'byPeriod' => $byPeriod,
        ];
    }

    // ── Balance Sheet ──────────────────────────────────────────────

    /**
     * @return array{
     *     assets: Collection,
     *     liabilities: Collection,
     *     equity: Collection,
     *     totalAssets: float,
     *     totalLiabilities: float,
     *     totalEquity: float,
     * }
     */
    public function getBalanceSheet(): array
    {
        $accounts = Account::query()
            ->where('is_active', true)
            ->orderBy('code')
            ->get();

        $assets = $accounts->where('type', AccountType::Asset)->map(fn (Account $a) => [
            'id' => $a->id,
            'code' => $a->code,
            'name' => $a->name,
            'balance' => (float) $a->balance,
        ])->values();

        $liabilities = $accounts->where('type', AccountType::Liability)->map(fn (Account $a) => [
            'id' => $a->id,
            'code' => $a->code,
            'name' => $a->name,
            'balance' => (float) $a->balance,
        ])->values();

        $equity = $accounts->where('type', AccountType::Equity)->map(fn (Account $a) => [
            'id' => $a->id,
            'code' => $a->code,
            'name' => $a->name,
            'balance' => (float) $a->balance,
        ])->values();

        return [
            'assets' => $assets,
            'liabilities' => $liabilities,
            'equity' => $equity,
            'totalAssets' => $assets->sum('balance'),
            'totalLiabilities' => $liabilities->sum('balance'),
            'totalEquity' => $equity->sum('balance'),
        ];
    }

    // ── Top Products Financial ─────────────────────────────────────

    /**
     * @return Collection<int, array{name: string, product_id: string, revenue: float, cost: float, profit: float, margin: float, qty: int}>
     */
    public function getTopProductsByProfit(Carbon $startDate, Carbon $endDate, ?string $shopId = null, int $limit = 10): Collection
    {
        $query = SaleItem::query()
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.status', '!=', SaleStatus::Cancelled)
            ->whereBetween('sales.created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->selectRaw('products.id as product_id, products.name, SUM(sale_items.subtotal) as revenue, SUM(products.cost_price * sale_items.quantity) as cost, SUM(sale_items.quantity) as qty')
            ->groupBy('products.id', 'products.name')
            ->orderByRaw('SUM(sale_items.subtotal) - SUM(products.cost_price * sale_items.quantity) DESC')
            ->limit($limit);

        if ($shopId) {
            $query->where('sales.shop_id', $shopId);
        }

        return $query->get()->map(fn ($row) => [
            'name' => $row->name,
            'product_id' => $row->product_id,
            'revenue' => (float) $row->revenue,
            'cost' => (float) $row->cost,
            'profit' => (float) $row->revenue - (float) $row->cost,
            'margin' => (float) $row->revenue > 0 ? round((((float) $row->revenue - (float) $row->cost) / (float) $row->revenue) * 100, 1) : 0,
            'qty' => (int) $row->qty,
        ]);
    }

    // ── Journal Entry Management ───────────────────────────────────

    /**
     * @param  array<array{account_id: string, debit: float, credit: float, description?: string}>  $lines
     */
    public function createJournalEntry(
        string $description,
        Carbon $date,
        array $lines,
        ?string $sourceType = null,
        ?string $sourceId = null,
        ?string $shopId = null,
        ?string $warehouseId = null,
        ?string $notes = null,
    ): JournalEntry {
        return DB::transaction(function () use ($description, $date, $lines, $sourceType, $sourceId, $shopId, $warehouseId, $notes) {
            $totalDebit = collect($lines)->sum('debit');
            $totalCredit = collect($lines)->sum('credit');

            $entry = JournalEntry::create([
                'reference' => $this->generateJournalReference(),
                'date' => $date,
                'description' => $description,
                'status' => JournalEntryStatus::Draft,
                'source_type' => $sourceType,
                'source_id' => $sourceId,
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
                'notes' => $notes,
                'shop_id' => $shopId,
                'warehouse_id' => $warehouseId,
                'created_by' => auth()->id(),
            ]);

            foreach ($lines as $line) {
                $entry->lines()->create([
                    'account_id' => $line['account_id'],
                    'debit' => $line['debit'] ?? 0,
                    'credit' => $line['credit'] ?? 0,
                    'description' => $line['description'] ?? null,
                ]);
            }

            return $entry;
        });
    }

    public function postJournalEntry(JournalEntry $entry): void
    {
        if (! $entry->isDraft()) {
            throw new \RuntimeException('Seules les écritures en brouillon peuvent être validées.');
        }

        if (! $entry->isBalanced()) {
            throw new \RuntimeException('L\'écriture n\'est pas équilibrée (débit ≠ crédit).');
        }

        DB::transaction(function () use ($entry) {
            foreach ($entry->lines as $line) {
                if ($line->debit > 0) {
                    $line->account->debit((float) $line->debit);
                }
                if ($line->credit > 0) {
                    $line->account->credit((float) $line->credit);
                }
            }

            $entry->update([
                'status' => JournalEntryStatus::Posted,
                'posted_by' => auth()->id(),
                'posted_at' => now(),
            ]);
        });
    }

    public function voidJournalEntry(JournalEntry $entry): void
    {
        if (! $entry->isPosted()) {
            throw new \RuntimeException('Seules les écritures validées peuvent être annulées.');
        }

        DB::transaction(function () use ($entry) {
            // Reverse the effect on accounts
            foreach ($entry->lines as $line) {
                if ($line->debit > 0) {
                    $line->account->credit((float) $line->debit);
                }
                if ($line->credit > 0) {
                    $line->account->debit((float) $line->credit);
                }
            }

            $entry->update([
                'status' => JournalEntryStatus::Voided,
            ]);
        });
    }

    // ── Expense Management ────────────────────────────────────────

    public function createExpense(array $data): Expense
    {
        $data['reference'] = $this->generateExpenseReference();
        $data['created_by'] = auth()->id();

        return Expense::create($data);
    }

    public function approveExpense(Expense $expense): void
    {
        $expense->update([
            'status' => ExpenseStatus::Approved,
            'approved_by' => auth()->id(),
        ]);

        // Record approved expense in accounting system
        app(AccountingIntegrationService::class)->recordApprovedExpense($expense);
    }

    public function rejectExpense(Expense $expense): void
    {
        $expense->update([
            'status' => ExpenseStatus::Rejected,
            'approved_by' => auth()->id(),
        ]);
    }

    // ── Private Helpers ──────────────────────────────────────────

    private function getTotalRevenue(Carbon $startDate, Carbon $endDate, ?string $shopId = null): float
    {
        return (float) Sale::query()
            ->where('status', '!=', SaleStatus::Cancelled)
            ->whereBetween('created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->when($shopId, fn ($q) => $q->where('shop_id', $shopId))
            ->sum('total');
    }

    private function getTotalExpenses(Carbon $startDate, Carbon $endDate, ?string $shopId = null, ?string $warehouseId = null): float
    {
        return (float) Expense::query()
            ->where('status', ExpenseStatus::Approved)
            ->whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])
            ->when($shopId, fn ($q) => $q->where('shop_id', $shopId))
            ->when($warehouseId, fn ($q) => $q->where('warehouse_id', $warehouseId))
            ->sum('amount');
    }

    private function getTotalLogisticCosts(Carbon $startDate, Carbon $endDate): float
    {
        return (float) LogisticCharge::query()
            ->whereBetween('created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->sum('amount');
    }

    private function getCostOfGoodsSold(Carbon $startDate, Carbon $endDate, ?string $shopId = null): float
    {
        return (float) SaleItem::query()
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.status', '!=', SaleStatus::Cancelled)
            ->whereBetween('sales.created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->when($shopId, fn ($q) => $q->where('sales.shop_id', $shopId))
            ->selectRaw('SUM(products.cost_price * sale_items.quantity) as total')
            ->value('total') ?? 0;
    }

    private function getSalesCount(Carbon $startDate, Carbon $endDate, ?string $shopId = null): int
    {
        return Sale::query()
            ->where('status', '!=', SaleStatus::Cancelled)
            ->whereBetween('created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->when($shopId, fn ($q) => $q->where('shop_id', $shopId))
            ->count();
    }

    private function getTotalReceivables(?string $shopId = null): float
    {
        return (float) Sale::query()
            ->whereIn('status', [SaleStatus::Unpaid, SaleStatus::PartiallyPaid])
            ->when($shopId, fn ($q) => $q->where('shop_id', $shopId))
            ->sum('amount_due');
    }

    private function generateJournalReference(): string
    {
        $prefix = 'JE-'.now()->format('Ymd');
        $count = JournalEntry::query()
            ->where('reference', 'like', $prefix.'%')
            ->count();

        return $prefix.'-'.str_pad((string) ($count + 1), 4, '0', STR_PAD_LEFT);
    }

    private function generateExpenseReference(): string
    {
        $prefix = 'DEP-'.now()->format('Ymd');
        $count = Expense::query()
            ->where('reference', 'like', $prefix.'%')
            ->count();

        return $prefix.'-'.str_pad((string) ($count + 1), 4, '0', STR_PAD_LEFT);
    }

    private function formatPeriodLabel(string $period, string $groupBy): string
    {
        return match ($groupBy) {
            'week' => 'S'.substr($period, -2),
            'month' => Carbon::createFromFormat('Y-m', $period)?->translatedFormat('M Y') ?? $period,
            default => Carbon::parse($period)->format('d/m'),
        };
    }
}
