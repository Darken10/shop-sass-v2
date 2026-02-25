<?php

namespace App\Http\Controllers\Pos;

use App\Data\Pos\CloseCashRegisterData;
use App\Data\Pos\OpenCashRegisterData;
use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Models\Logistics\Shop;
use App\Models\Pos\CashRegisterSession;
use App\Services\CashRegisterService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CashRegisterController extends Controller
{
    public function __construct(private CashRegisterService $cashRegisterService) {}

    /**
     * Show the POS dashboard / cash register status.
     */
    public function index(): Response
    {
        $this->authorize('open', CashRegisterSession::class);

        $user = auth()->user();
        $session = $this->cashRegisterService->getOpenSession($user);

        $shops = Shop::query()
            ->where('status', 'active')
            ->select(['id', 'name', 'code', 'city'])
            ->orderBy('name')
            ->get();

        return Inertia::render('pos/index', [
            'currentSession' => $session?->load(['shop', 'cashier', 'sales.payments']),
            'shops' => $shops,
        ]);
    }

    /**
     * List all cash register sessions (history).
     */
    public function sessions(): Response
    {
        $this->authorize('viewAny', CashRegisterSession::class);

        $sessions = CashRegisterSession::query()
            ->with(['shop:id,name,code', 'cashier:id,name'])
            ->withCount('sales')
            ->withSum('sales', 'total')
            ->orderByDesc('opened_at')
            ->paginate(20);

        return Inertia::render('pos/sessions/index', [
            'sessions' => $sessions,
        ]);
    }

    /**
     * Open a new cash register session.
     */
    public function open(OpenCashRegisterData $data): RedirectResponse
    {
        $this->authorize('open', CashRegisterSession::class);

        $user = auth()->user();
        $existingSession = $this->cashRegisterService->getOpenSession($user);

        if ($existingSession) {
            return back()->withErrors(['session' => 'Vous avez déjà une session de caisse ouverte.']);
        }

        $this->cashRegisterService->openSession($data, $user);

        return to_route('pos.index')
            ->with('success', 'Caisse ouverte avec succès.');
    }

    /**
     * Close the current cash register session.
     */
    public function close(CashRegisterSession $session, CloseCashRegisterData $data): RedirectResponse
    {
        $this->authorize('close', $session);

        if ($session->isClosed()) {
            return back()->withErrors(['session' => 'Cette session est déjà fermée.']);
        }

        $this->cashRegisterService->closeSession($session, $data);

        return to_route('pos.index')
            ->with('success', 'Caisse fermée avec succès.');
    }

    /**
     * Show detailed session view with stats.
     */
    public function show(CashRegisterSession $session): Response
    {
        $this->authorize('view', $session);

        $session->load([
            'shop',
            'cashier',
            'sales' => fn ($q) => $q->with(['items.product', 'items.promotion', 'payments', 'customer']),
            'payments',
        ]);

        $allPayments = $session->sales->flatMap(fn ($sale) => $sale->payments);

        $paymentBreakdown = collect(PaymentMethod::cases())->map(fn ($method) => [
            'method' => $method->value,
            'label' => $method->label(),
            'total' => $allPayments->where('method', $method)->sum('amount'),
        ])->filter(fn ($item) => $item['total'] > 0)->values();

        $totalSales = $session->sales->sum('total');
        $totalPaid = $allPayments->sum('amount');
        $totalCredits = $session->sales->sum('amount_due');
        $totalDiscounts = $session->sales->sum('discount_total');
        $totalChangeGiven = $session->sales->sum('change_given');
        $salesCount = $session->sales->count();
        $itemsCount = $session->sales->sum(fn ($sale) => $sale->items->sum('quantity'));

        $theoreticalClosing = $session->opening_amount + $totalPaid - $totalChangeGiven;
        $gap = $session->isClosed() && $session->closing_amount
            ? $session->closing_amount - $theoreticalClosing
            : null;

        $hourlySales = $session->sales
            ->groupBy(fn ($sale) => $sale->created_at->format('H'))
            ->map(fn ($sales, $hour) => [
                'hour' => $hour.'h',
                'count' => $sales->count(),
                'total' => $sales->sum('total'),
            ])
            ->sortKeys()
            ->values();

        return Inertia::render('pos/sessions/show', [
            'session' => $session,
            'stats' => [
                'totalSales' => $totalSales,
                'salesCount' => $salesCount,
                'itemsCount' => $itemsCount,
                'totalPaid' => $totalPaid,
                'totalCredits' => $totalCredits,
                'totalDiscounts' => $totalDiscounts,
                'totalChangeGiven' => $totalChangeGiven,
                'theoreticalClosing' => $theoreticalClosing,
                'gap' => $gap,
                'paymentBreakdown' => $paymentBreakdown,
                'hourlySales' => $hourlySales,
            ],
        ]);
    }
}
