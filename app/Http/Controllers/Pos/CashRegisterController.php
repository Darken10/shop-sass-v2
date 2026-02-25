<?php

namespace App\Http\Controllers\Pos;

use App\Data\Pos\CloseCashRegisterData;
use App\Data\Pos\OpenCashRegisterData;
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
     * Show session summary (for closing or review).
     */
    public function show(CashRegisterSession $session): Response
    {
        $this->authorize('view', $session);

        $session->load([
            'shop',
            'cashier',
            'sales' => fn ($q) => $q->with(['items.product', 'payments', 'customer']),
        ]);

        return Inertia::render('pos/session-summary', [
            'session' => $session,
        ]);
    }
}
