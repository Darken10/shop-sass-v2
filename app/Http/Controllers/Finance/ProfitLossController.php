<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Logistics\Shop;
use App\Models\Logistics\Warehouse;
use App\Services\FinancialService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfitLossController extends Controller
{
    public function __construct(
        private FinancialService $financialService,
    ) {}

    public function __invoke(Request $request): Response
    {
        $startDate = $request->filled('start_date')
            ? Carbon::parse($request->input('start_date'))
            : Carbon::now()->startOfMonth();

        $endDate = $request->filled('end_date')
            ? Carbon::parse($request->input('end_date'))
            : Carbon::now();

        $shopId = $request->input('shop_id');
        $warehouseId = $request->input('warehouse_id');

        $profitLoss = $this->financialService->getProfitAndLoss($startDate, $endDate, $shopId, $warehouseId);

        // Monthly trend (last 12 months)
        $monthlyTrend = collect();
        for ($i = 11; $i >= 0; $i--) {
            $monthStart = Carbon::now()->subMonths($i)->startOfMonth();
            $monthEnd = Carbon::now()->subMonths($i)->endOfMonth();

            if ($monthEnd->isFuture()) {
                $monthEnd = Carbon::now();
            }

            $monthPl = $this->financialService->getProfitAndLoss($monthStart, $monthEnd, $shopId, $warehouseId);
            $monthlyTrend->push([
                'month' => $monthStart->translatedFormat('M Y'),
                'revenue' => $monthPl['revenue']['total'],
                'expenses' => $monthPl['expenses']['total'] + $monthPl['costOfGoodsSold'],
                'netProfit' => $monthPl['netProfit'],
            ]);
        }

        return Inertia::render('finance/profit-loss', [
            'profitLoss' => $profitLoss,
            'monthlyTrend' => $monthlyTrend,
            'filters' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'shop_id' => $shopId,
                'warehouse_id' => $warehouseId,
            ],
            'shops' => Shop::query()->where('status', 'active')->select('id', 'name')->orderBy('name')->get(),
            'warehouses' => Warehouse::query()->where('status', 'active')->select('id', 'name')->orderBy('name')->get(),
        ]);
    }
}
