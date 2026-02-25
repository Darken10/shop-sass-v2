<?php

namespace App\Http\Controllers;

use App\Enums\CashRegisterSessionStatus;
use App\Enums\ProductStatus;
use App\Enums\SaleStatus;
use App\Enums\SupplyRequestStatus;
use App\Enums\TransferStatus;
use App\Models\Logistics\Shop;
use App\Models\Logistics\ShopStock;
use App\Models\Logistics\SupplyRequest;
use App\Models\Logistics\Transfer;
use App\Models\Logistics\Warehouse;
use App\Models\Pos\CashRegisterSession;
use App\Models\Pos\Customer;
use App\Models\Pos\Sale;
use App\Models\Pos\SaleItem;
use App\Models\Pos\SalePayment;
use App\Models\Product\Product;
use App\Models\Product\ProductCategory;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();
        $startOfLastMonth = Carbon::now()->subMonth()->startOfMonth();
        $endOfLastMonth = Carbon::now()->subMonth()->endOfMonth();

        // ── KPI Cards ──────────────────────────────────────────────
        $todaySales = Sale::query()
            ->where('status', '!=', SaleStatus::Cancelled)
            ->whereDate('created_at', $today)
            ->selectRaw('COUNT(*) as count, COALESCE(SUM(total), 0) as total')
            ->first();

        $monthSales = Sale::query()
            ->where('status', '!=', SaleStatus::Cancelled)
            ->where('created_at', '>=', $startOfMonth)
            ->selectRaw('COUNT(*) as count, COALESCE(SUM(total), 0) as total')
            ->first();

        $lastMonthTotal = (float) Sale::query()
            ->where('status', '!=', SaleStatus::Cancelled)
            ->whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])
            ->sum('total');

        $monthGrowth = $lastMonthTotal > 0
            ? round((((float) $monthSales->total - $lastMonthTotal) / $lastMonthTotal) * 100, 1)
            : null;

        $openSessions = CashRegisterSession::query()
            ->where('status', CashRegisterSessionStatus::Open)
            ->count();

        $activeProducts = Product::query()
            ->where('status', ProductStatus::ACTIVE)
            ->count();

        $totalCustomers = Customer::query()->count();

        $unpaidAmount = (float) Sale::query()
            ->whereIn('status', [SaleStatus::Unpaid, SaleStatus::PartiallyPaid])
            ->sum('amount_due');

        // ── Revenue by day (last 30 days) ──────────────────────────
        $revenueByDay = Sale::query()
            ->where('status', '!=', SaleStatus::Cancelled)
            ->where('created_at', '>=', Carbon::now()->subDays(29)->startOfDay())
            ->selectRaw('DATE(created_at) as date, SUM(total) as total, COUNT(*) as count')
            ->groupByRaw('DATE(created_at)')
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => [
                'date' => Carbon::parse($row->date)->format('d/m'),
                'total' => (float) $row->total,
                'count' => (int) $row->count,
            ]);

        // ── Sales by payment method (this month) ───────────────────
        $paymentBreakdown = SalePayment::query()
            ->where('sale_payments.created_at', '>=', $startOfMonth)
            ->selectRaw('method, SUM(amount) as total')
            ->groupBy('method')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'method' => $row->method->value,
                'label' => $row->method->label(),
                'total' => (float) $row->total,
            ]);

        // ── Top 10 products by revenue (this month) ────────────────
        $topProducts = SaleItem::query()
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.status', '!=', SaleStatus::Cancelled)
            ->where('sales.created_at', '>=', $startOfMonth)
            ->selectRaw('products.name, SUM(sale_items.quantity) as qty, SUM(sale_items.subtotal) as revenue')
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'name' => $row->name,
                'qty' => (int) $row->qty,
                'revenue' => (float) $row->revenue,
            ]);

        // ── Sales by shop (this month) ─────────────────────────────
        $salesByShop = Sale::query()
            ->join('shops', 'sales.shop_id', '=', 'shops.id')
            ->where('sales.status', '!=', SaleStatus::Cancelled)
            ->where('sales.created_at', '>=', $startOfMonth)
            ->selectRaw('shops.name, COUNT(sales.id) as count, SUM(sales.total) as total')
            ->groupBy('shops.id', 'shops.name')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'name' => $row->name,
                'count' => (int) $row->count,
                'total' => (float) $row->total,
            ]);

        // ── Low-stock alerts ──────────────────────────────────────
        $lowStockProducts = ShopStock::query()
            ->join('products', 'shop_stocks.product_id', '=', 'products.id')
            ->join('shops', 'shop_stocks.shop_id', '=', 'shops.id')
            ->whereColumn('shop_stocks.quantity', '<=', 'shop_stocks.stock_alert')
            ->where('shop_stocks.stock_alert', '>', 0)
            ->select([
                'products.name as product_name',
                'shops.name as shop_name',
                'shop_stocks.quantity',
                'shop_stocks.stock_alert',
            ])
            ->orderByRaw('shop_stocks.quantity - shop_stocks.stock_alert ASC')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'product' => $row->product_name,
                'shop' => $row->shop_name,
                'quantity' => (int) $row->quantity,
                'alert' => (int) $row->stock_alert,
            ]);

        // ── Recent sales (last 10) ────────────────────────────────
        $recentSales = Sale::query()
            ->with(['customer:id,name', 'shop:id,name', 'payments:id,sale_id,method,amount'])
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn (Sale $sale) => [
                'id' => $sale->id,
                'reference' => $sale->reference,
                'status' => $sale->status->value,
                'total' => (float) $sale->total,
                'amount_paid' => (float) $sale->amount_paid,
                'customer' => $sale->customer?->name,
                'shop' => $sale->shop?->name,
                'created_at' => $sale->created_at->toISOString(),
                'payments' => $sale->payments->map(fn ($p) => [
                    'method' => $p->method->value,
                    'amount' => (float) $p->amount,
                ]),
            ]);

        // ── Pending supply requests / transfers ────────────────────
        $pendingSupplyRequests = SupplyRequest::query()
            ->whereIn('status', [SupplyRequestStatus::Pending, SupplyRequestStatus::Approved, SupplyRequestStatus::InTransit])
            ->count();

        $pendingTransfers = Transfer::query()
            ->whereIn('status', [TransferStatus::Pending, TransferStatus::Approved, TransferStatus::InTransit])
            ->count();

        // ── Summary counts ────────────────────────────────────────
        $totalShops = Shop::query()->count();
        $totalWarehouses = Warehouse::query()->count();
        $totalCategories = ProductCategory::query()->count();

        return Inertia::render('dashboard', [
            'kpis' => [
                'todaySalesCount' => (int) $todaySales->count,
                'todaySalesTotal' => (float) $todaySales->total,
                'monthSalesCount' => (int) $monthSales->count,
                'monthSalesTotal' => (float) $monthSales->total,
                'monthGrowth' => $monthGrowth,
                'openSessions' => $openSessions,
                'activeProducts' => $activeProducts,
                'totalCustomers' => $totalCustomers,
                'unpaidAmount' => $unpaidAmount,
                'pendingSupplyRequests' => $pendingSupplyRequests,
                'pendingTransfers' => $pendingTransfers,
                'totalShops' => $totalShops,
                'totalWarehouses' => $totalWarehouses,
                'totalCategories' => $totalCategories,
            ],
            'revenueByDay' => $revenueByDay,
            'paymentBreakdown' => $paymentBreakdown,
            'topProducts' => $topProducts,
            'salesByShop' => $salesByShop,
            'lowStockProducts' => $lowStockProducts,
            'recentSales' => $recentSales,
        ]);
    }
}
