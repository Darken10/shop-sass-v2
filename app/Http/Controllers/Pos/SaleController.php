<?php

namespace App\Http\Controllers\Pos;

use App\Data\Pos\CreateSaleData;
use App\Data\Pos\PaymentData;
use App\Enums\PromotionType;
use App\Enums\SaleStatus;
use App\Http\Controllers\Controller;
use App\Models\Logistics\ShopStock;
use App\Models\Pos\Customer;
use App\Models\Pos\Promotion;
use App\Models\Pos\Sale;
use App\Services\CashRegisterService;
use App\Services\SaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    public function __construct(
        private SaleService $saleService,
        private CashRegisterService $cashRegisterService,
    ) {}

    /**
     * POS terminal — main selling page.
     */
    public function create(): Response
    {
        $this->authorize('create', Sale::class);

        $user = auth()->user();
        $session = $this->cashRegisterService->getOpenSession($user);

        if (! $session) {
            return Inertia::render('pos/index', [
                'currentSession' => null,
                'shops' => [],
            ]);
        }

        $shopStocks = ShopStock::withoutGlobalScopes()
            ->where('shop_id', $session->shop_id)
            ->where('quantity', '>', 0)
            ->with(['product:id,name,code,price,cost_price,unity,image,category_id', 'product.category:id,name'])
            ->get()
            ->map(fn ($stock) => [
                'product' => $stock->product,
                'available_quantity' => $stock->quantity,
                'stock_alert' => $stock->stock_alert,
                'is_low_stock' => $stock->isLowStock(),
            ]);

        $activePromotions = Promotion::query()
            ->where(function ($q) use ($session) {
                $q->whereNull('shop_id')
                    ->orWhere('shop_id', $session->shop_id);
            })
            ->where('is_active', true)
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>=', now())
            ->with('products:id,name')
            ->get();

        $customers = Customer::query()
            ->select(['id', 'name', 'phone', 'credit_balance'])
            ->orderBy('name')
            ->get();

        return Inertia::render('pos/terminal', [
            'session' => $session->load('shop'),
            'shopStocks' => $shopStocks,
            'promotions' => $activePromotions,
            'customers' => $customers,
            'paymentMethods' => collect(\App\Enums\PaymentMethod::cases())->map(fn ($m) => [
                'value' => $m->value,
                'label' => $m->label(),
            ]),
            'promotionTypes' => PromotionType::cases(),
        ]);
    }

    /**
     * Store a new sale.
     */
    public function store(CreateSaleData $data): RedirectResponse
    {
        $this->authorize('create', Sale::class);

        $user = auth()->user();
        $session = $this->cashRegisterService->getOpenSession($user);

        if (! $session) {
            return back()->withErrors(['session' => 'Aucune session de caisse ouverte.']);
        }

        try {
            $sale = $this->saleService->createSale($data, $session, $user);

            return to_route('pos.sales.receipt', $sale)
                ->with('success', 'Vente enregistrée avec succès.');
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['stock' => $e->getMessage()]);
        }
    }

    /**
     * Show the receipt for a sale.
     */
    public function receipt(Sale $sale): Response
    {
        $this->authorize('view', $sale);

        $sale->load(['items.product', 'items.promotion', 'payments', 'customer', 'cashier', 'shop', 'session']);

        return Inertia::render('pos/receipt', [
            'sale' => $sale,
        ]);
    }

    /**
     * Sales history for the current session.
     */
    public function index(): Response
    {
        $this->authorize('viewAny', Sale::class);

        $sales = Sale::query()
            ->with(['customer:id,name', 'cashier:id,name', 'shop:id,name'])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('pos/sales/index', [
            'sales' => $sales,
        ]);
    }

    /**
     * Show sale details.
     */
    public function show(Sale $sale): Response
    {
        $this->authorize('view', $sale);

        $sale->load(['items.product', 'items.promotion', 'payments', 'customer', 'cashier', 'shop', 'session']);

        return Inertia::render('pos/sales/show', [
            'sale' => $sale,
        ]);
    }

    /**
     * Process a credit payment on an existing sale.
     */
    public function creditPayment(Sale $sale, PaymentData $data): RedirectResponse
    {
        $this->authorize('processCreditPayment', $sale);

        $user = auth()->user();
        $session = $this->cashRegisterService->getOpenSession($user);

        if (! $session) {
            return back()->withErrors(['session' => 'Aucune session de caisse ouverte.']);
        }

        $this->saleService->processCreditPayment($sale, $data, $session);

        return back()->with('success', 'Paiement enregistré avec succès.');
    }

    /**
     * Verify a sale via QR code token.
     */
    public function verify(string $token): JsonResponse
    {
        $sale = Sale::withoutGlobalScopes()
            ->where('qr_code_token', $token)
            ->with(['items.product', 'payments', 'customer', 'cashier:id,name', 'shop:id,name'])
            ->firstOrFail();

        return response()->json([
            'sale' => $sale,
            'verified' => true,
        ]);
    }

    /**
     * Search products from the POS terminal (AJAX).
     */
    public function searchProducts(Request $request): JsonResponse
    {
        $user = auth()->user();
        $session = $this->cashRegisterService->getOpenSession($user);

        if (! $session) {
            return response()->json(['products' => []], 400);
        }

        $search = $request->input('search', '');

        $stocks = ShopStock::withoutGlobalScopes()
            ->where('shop_id', $session->shop_id)
            ->where('quantity', '>', 0)
            ->whereHas('product', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
            ->with(['product:id,name,code,price,unity,image,category_id', 'product.category:id,name'])
            ->limit(20)
            ->get()
            ->map(fn ($stock) => [
                'product' => $stock->product,
                'available_quantity' => $stock->quantity,
                'is_low_stock' => $stock->isLowStock(),
            ]);

        return response()->json(['products' => $stocks]);
    }

    /**
     * Get sales with outstanding amounts (credits).
     */
    public function credits(): Response
    {
        $this->authorize('viewAny', Sale::class);

        $sales = Sale::query()
            ->whereIn('status', [SaleStatus::PartiallyPaid, SaleStatus::Unpaid])
            ->where('amount_due', '>', 0)
            ->with(['customer:id,name,phone', 'cashier:id,name', 'shop:id,name'])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('pos/sales/credits', [
            'sales' => $sales,
        ]);
    }
}
