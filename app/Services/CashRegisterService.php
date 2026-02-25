<?php

namespace App\Services;

use App\Data\Pos\CloseCashRegisterData;
use App\Data\Pos\OpenCashRegisterData;
use App\Enums\CashRegisterSessionStatus;
use App\Enums\PaymentMethod;
use App\Models\Pos\CashRegisterSession;
use App\Models\User;
use Illuminate\Support\Str;

class CashRegisterService
{
    /**
     * Open a new cash register session.
     */
    public function openSession(OpenCashRegisterData $data, User $cashier): CashRegisterSession
    {
        return CashRegisterSession::create([
            'session_number' => $this->generateSessionNumber(),
            'status' => CashRegisterSessionStatus::Open,
            'opening_amount' => $data->opening_amount,
            'opened_at' => now(),
            'shop_id' => $data->shop_id,
            'cashier_id' => $cashier->id,
            'company_id' => $cashier->company_id,
        ]);
    }

    /**
     * Close an existing cash register session.
     */
    public function closeSession(CashRegisterSession $session, CloseCashRegisterData $data): CashRegisterSession
    {
        $totals = $this->calculateSessionTotals($session);

        $session->update([
            'status' => CashRegisterSessionStatus::Closed,
            'closing_amount' => $session->opening_amount + $totals['total_cash'] - $totals['total_change'],
            'total_sales' => $totals['total_sales'],
            'total_cash' => $totals['total_cash'],
            'total_mobile_money' => $totals['total_mobile_money'],
            'total_bank_card' => $totals['total_bank_card'],
            'total_bank_transfer' => $totals['total_bank_transfer'],
            'total_credit' => $totals['total_credit'],
            'closing_notes' => $data->closing_notes,
            'closed_at' => now(),
        ]);

        return $session->fresh();
    }

    /**
     * Get the currently open session for a cashier.
     */
    public function getOpenSession(User $cashier): ?CashRegisterSession
    {
        return CashRegisterSession::query()
            ->where('cashier_id', $cashier->id)
            ->where('status', CashRegisterSessionStatus::Open)
            ->with(['shop', 'cashier'])
            ->latest('opened_at')
            ->first();
    }

    /**
     * Calculate totals for a session based on its payments.
     *
     * @return array{total_sales: float, total_cash: float, total_mobile_money: float, total_bank_card: float, total_bank_transfer: float, total_credit: float, total_change: float}
     */
    private function calculateSessionTotals(CashRegisterSession $session): array
    {
        $payments = $session->payments()->get();
        $sales = $session->sales()->get();

        return [
            'total_sales' => (float) $sales->sum('total'),
            'total_cash' => (float) $payments->where('method', PaymentMethod::Cash)->sum('amount'),
            'total_mobile_money' => (float) $payments->where('method', PaymentMethod::MobileMoney)->sum('amount'),
            'total_bank_card' => (float) $payments->where('method', PaymentMethod::BankCard)->sum('amount'),
            'total_bank_transfer' => (float) $payments->where('method', PaymentMethod::BankTransfer)->sum('amount'),
            'total_credit' => (float) $payments->where('method', PaymentMethod::CustomerCredit)->sum('amount'),
            'total_change' => (float) $sales->sum('change_given'),
        ];
    }

    private function generateSessionNumber(): string
    {
        return 'SES-'.now()->format('Ymd').'-'.strtoupper(Str::random(4));
    }
}
