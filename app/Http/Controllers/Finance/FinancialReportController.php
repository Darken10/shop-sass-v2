<?php

namespace App\Http\Controllers\Finance;

use App\Enums\FinancialReportType;
use App\Http\Controllers\Controller;
use App\Models\Finance\FinancialReport;
use App\Models\Logistics\Shop;
use App\Models\Logistics\Warehouse;
use App\Services\FinancialService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinancialReportController extends Controller
{
    public function __construct(
        private FinancialService $financialService,
    ) {}

    public function index(): Response
    {
        $reports = FinancialReport::query()
            ->with(['generator:id,name'])
            ->latest()
            ->paginate(20);

        return Inertia::render('finance/reports/index', [
            'reports' => $reports,
            'reportTypes' => collect(FinancialReportType::cases())->map(fn (FinancialReportType $t) => [
                'value' => $t->value,
                'label' => $t->label(),
            ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('finance/reports/create', [
            'reportTypes' => collect(FinancialReportType::cases())->map(fn (FinancialReportType $t) => [
                'value' => $t->value,
                'label' => $t->label(),
            ]),
            'shops' => Shop::query()->where('status', 'active')->select('id', 'name')->orderBy('name')->get(),
            'warehouses' => Warehouse::query()->where('status', 'active')->select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'type' => ['required', 'string'],
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after_or_equal:period_start'],
            'shop_id' => ['nullable', 'uuid'],
            'warehouse_id' => ['nullable', 'uuid'],
        ]);

        $type = FinancialReportType::from($request->input('type'));
        $startDate = Carbon::parse($request->input('period_start'));
        $endDate = Carbon::parse($request->input('period_end'));
        $shopId = $request->input('shop_id');
        $warehouseId = $request->input('warehouse_id');

        $data = match ($type) {
            FinancialReportType::ProfitLoss => $this->financialService->getProfitAndLoss($startDate, $endDate, $shopId, $warehouseId),
            FinancialReportType::CashFlow => $this->financialService->getCashFlow($startDate, $endDate, $shopId),
            FinancialReportType::BalanceSheet => $this->financialService->getBalanceSheet(),
            FinancialReportType::ExpenseReport => [
                'categories' => $this->financialService->getExpensesByCategory($startDate, $endDate, $shopId, $warehouseId),
                'timeSeries' => $this->financialService->getExpenseTimeSeries($startDate, $endDate, $shopId, $warehouseId, 'day'),
            ],
            FinancialReportType::RevenueReport => [
                'timeSeries' => $this->financialService->getRevenueTimeSeries($startDate, $endDate, $shopId),
                'byShop' => $this->financialService->getRevenueByShop($startDate, $endDate),
                'paymentBreakdown' => $this->financialService->getPaymentMethodBreakdown($startDate, $endDate, $shopId),
            ],
            default => [],
        };

        $report = FinancialReport::create([
            'title' => $type->label().' — '.$startDate->format('d/m/Y').' au '.$endDate->format('d/m/Y'),
            'type' => $type,
            'period_start' => $startDate,
            'period_end' => $endDate,
            'filters' => [
                'shop_id' => $shopId,
                'warehouse_id' => $warehouseId,
            ],
            'data' => $data,
            'summary' => $this->buildSummary($type, $data),
            'generated_by' => auth()->id(),
        ]);

        return to_route('finance.reports.show', $report)
            ->with('success', 'Rapport généré avec succès.');
    }

    public function show(FinancialReport $report): Response
    {
        $report->load(['generator:id,name']);

        return Inertia::render('finance/reports/show', [
            'report' => $report,
        ]);
    }

    public function destroy(FinancialReport $report): RedirectResponse
    {
        $report->delete();

        return to_route('finance.reports.index')
            ->with('success', 'Rapport supprimé.');
    }

    /**
     * @return array<string, mixed>
     */
    private function buildSummary(FinancialReportType $type, array $data): array
    {
        return match ($type) {
            FinancialReportType::ProfitLoss => [
                'revenue' => $data['revenue']['total'] ?? 0,
                'expenses' => $data['expenses']['total'] ?? 0,
                'netProfit' => $data['netProfit'] ?? 0,
                'netMargin' => $data['netMargin'] ?? 0,
            ],
            FinancialReportType::CashFlow => [
                'totalInflow' => $data['inflows']['total'] ?? 0,
                'totalOutflow' => $data['outflows']['total'] ?? 0,
                'netCashFlow' => $data['netCashFlow'] ?? 0,
            ],
            FinancialReportType::BalanceSheet => [
                'totalAssets' => $data['totalAssets'] ?? 0,
                'totalLiabilities' => $data['totalLiabilities'] ?? 0,
                'totalEquity' => $data['totalEquity'] ?? 0,
            ],
            default => [],
        };
    }
}
