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

class CashFlowController extends Controller
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
        $groupBy = $request->input('group_by', 'day');

        $cashFlow = $this->financialService->getCashFlow($startDate, $endDate, $shopId, $groupBy);
        $paymentBreakdown = $this->financialService->getPaymentMethodBreakdown($startDate, $endDate, $shopId);

        return Inertia::render('finance/cash-flow', [
            'cashFlow' => $cashFlow,
            'paymentBreakdown' => $paymentBreakdown,
            'filters' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'shop_id' => $shopId,
                'group_by' => $groupBy,
            ],
            'shops' => Shop::query()->where('status', 'active')->select('id', 'name')->orderBy('name')->get(),
            'warehouses' => Warehouse::query()->where('status', 'active')->select('id', 'name')->orderBy('name')->get(),
        ]);
    }
}
