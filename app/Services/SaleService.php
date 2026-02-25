<?php

namespace App\Services;

use App\Data\Pos\CreateSaleData;
use App\Data\Pos\PaymentData;
use App\Data\Pos\SaleItemData;
use App\Enums\SaleStatus;
use App\Enums\StockMovementType;
use App\Models\Logistics\ShopStock;
use App\Models\Logistics\StockMovement;
use App\Models\Pos\CashRegisterSession;
use App\Models\Pos\Customer;
use App\Models\Pos\Promotion;
use App\Models\Pos\Sale;
use App\Models\Pos\SaleItem;
use App\Models\Pos\SalePayment;
use App\Models\Product\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class SaleService
{
    /**
     * Create a new sale from the POS.
     */
    public function createSale(CreateSaleData $data, CashRegisterSession $session, User $cashier): Sale
    {
        return DB::transaction(function () use ($data, $session, $cashier) {
            $this->validateStockAvailability($data->items, $session->shop_id);

            $itemsWithPricing = $this->calculateItemPricing($data->items, $session->shop_id);
            $subtotal = collect($itemsWithPricing)->sum('subtotal');
            $discountTotal = collect($itemsWithPricing)->sum('discount');
            $total = $subtotal - $discountTotal;

            $totalPayments = collect($data->payments)->sum('amount');
            $amountDue = max(0, $total - $totalPayments);
            $changeAmount = max(0, $totalPayments - $total);

            $changeGiven = $changeAmount;
            $changeResidue = 0;

            if ($data->change_action === 'keep_residue' && $changeAmount > 0 && $data->amount_given !== null) {
                $actualChange = $data->amount_given - $total;
                if ($actualChange > 0 && $actualChange < $changeAmount) {
                    $changeGiven = $actualChange;
                    $changeResidue = $changeAmount - $actualChange;
                }
            }

            $status = $this->determineSaleStatus($total, $totalPayments, $changeResidue);

            $sale = Sale::create([
                'reference' => $this->generateReference(),
                'status' => $status,
                'subtotal' => $subtotal,
                'discount_total' => $discountTotal,
                'total' => $total,
                'amount_paid' => min($totalPayments, $total),
                'amount_due' => $amountDue,
                'change_given' => $changeGiven,
                'change_residue' => $changeResidue,
                'qr_code_token' => Str::uuid()->toString(),
                'notes' => $data->notes,
                'session_id' => $session->id,
                'shop_id' => $session->shop_id,
                'customer_id' => $data->customer_id,
                'cashier_id' => $cashier->id,
                'company_id' => $cashier->company_id,
            ]);

            $this->createSaleItems($sale, $itemsWithPricing);
            $this->createPayments($sale, $data->payments, $session);
            $this->decrementStock($itemsWithPricing, $session->shop_id, $sale, $cashier);

            if ($data->change_action === 'credit_customer' && $changeResidue > 0 && $data->customer_id) {
                $customer = Customer::findOrFail($data->customer_id);
                $customer->addCredit($changeResidue);
            }

            if ($amountDue > 0 && $data->customer_id) {
                $customer = Customer::findOrFail($data->customer_id);
                $customer->increment('credit_balance', -$amountDue);
            }

            return $sale->load(['items.product', 'payments', 'customer', 'cashier', 'shop']);
        });
    }

    /**
     * Process a credit payment on an existing sale.
     */
    public function processCreditPayment(Sale $sale, PaymentData $paymentData, CashRegisterSession $session): Sale
    {
        return DB::transaction(function () use ($sale, $paymentData, $session) {
            SalePayment::create([
                'method' => $paymentData->method,
                'amount' => $paymentData->amount,
                'reference' => $paymentData->reference,
                'notes' => $paymentData->notes,
                'sale_id' => $sale->id,
                'session_id' => $session->id,
            ]);

            $newAmountPaid = (float) $sale->amount_paid + $paymentData->amount;
            $newAmountDue = max(0, (float) $sale->total - $newAmountPaid);
            $newStatus = $newAmountDue <= 0 ? SaleStatus::Completed : SaleStatus::PartiallyPaid;

            $sale->update([
                'amount_paid' => min($newAmountPaid, (float) $sale->total),
                'amount_due' => $newAmountDue,
                'status' => $newStatus,
            ]);

            return $sale->fresh(['items.product', 'payments', 'customer', 'cashier', 'shop']);
        });
    }

    /**
     * Validate that all products have sufficient stock in the shop.
     *
     * @param  array<SaleItemData>  $items
     */
    private function validateStockAvailability(array $items, string $shopId): void
    {
        foreach ($items as $item) {
            $stock = ShopStock::withoutGlobalScopes()
                ->where('shop_id', $shopId)
                ->where('product_id', $item->product_id)
                ->first();

            if (! $stock || $stock->quantity < $item->quantity) {
                $product = Product::withoutGlobalScopes()->findOrFail($item->product_id);
                $available = $stock ? $stock->quantity : 0;
                throw new InvalidArgumentException(
                    "Stock insuffisant pour {$product->name}. Disponible: {$available}, Demandé: {$item->quantity}"
                );
            }
        }
    }

    /**
     * Calculate pricing for each item including promotions.
     *
     * @param  array<SaleItemData>  $items
     * @return array<array{product_id: string, quantity: int, unit_price: float, discount: float, subtotal: float, promotion_id: string|null}>
     */
    private function calculateItemPricing(array $items, string $shopId): array
    {
        $result = [];

        foreach ($items as $item) {
            $product = Product::withoutGlobalScopes()->findOrFail($item->product_id);
            $unitPrice = (float) $product->price;
            $discount = 0;
            $promotionId = null;

            if ($item->promotion_id) {
                $promotion = Promotion::withoutGlobalScopes()->find($item->promotion_id);
                if ($promotion && $promotion->isCurrentlyActive()) {
                    $discount = $promotion->calculateDiscount($unitPrice) * $item->quantity;
                    $promotionId = $promotion->id;
                }
            }

            $lineTotal = ($unitPrice * $item->quantity);

            $result[] = [
                'product_id' => $item->product_id,
                'quantity' => $item->quantity,
                'unit_price' => $unitPrice,
                'discount' => $discount,
                'subtotal' => $lineTotal,
                'promotion_id' => $promotionId,
            ];
        }

        return $result;
    }

    /**
     * @param  array<array{product_id: string, quantity: int, unit_price: float, discount: float, subtotal: float, promotion_id: string|null}>  $items
     */
    private function createSaleItems(Sale $sale, array $items): void
    {
        foreach ($items as $item) {
            SaleItem::create([
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'discount' => $item['discount'],
                'subtotal' => $item['subtotal'] - $item['discount'],
                'sale_id' => $sale->id,
                'product_id' => $item['product_id'],
                'promotion_id' => $item['promotion_id'],
            ]);
        }
    }

    /**
     * @param  array<PaymentData>  $payments
     */
    private function createPayments(Sale $sale, array $payments, CashRegisterSession $session): void
    {
        foreach ($payments as $payment) {
            SalePayment::create([
                'method' => $payment->method,
                'amount' => $payment->amount,
                'reference' => $payment->reference,
                'notes' => $payment->notes,
                'sale_id' => $sale->id,
                'session_id' => $session->id,
            ]);
        }
    }

    /**
     * Decrement shop stock for sold items and create stock movements.
     *
     * @param  array<array{product_id: string, quantity: int, unit_price: float, discount: float, subtotal: float, promotion_id: string|null}>  $items
     */
    private function decrementStock(array $items, string $shopId, Sale $sale, User $cashier): void
    {
        foreach ($items as $index => $item) {
            ShopStock::withoutGlobalScopes()
                ->where('shop_id', $shopId)
                ->where('product_id', $item['product_id'])
                ->decrement('quantity', $item['quantity']);

            $suffix = count($items) > 1 ? '-'.($index + 1) : '';

            StockMovement::withoutGlobalScopes()->create([
                'reference' => 'MVT-'.$sale->reference.$suffix,
                'type' => StockMovementType::ShopToCustomer,
                'quantity' => $item['quantity'],
                'reason' => 'Vente POS - '.$sale->reference,
                'product_id' => $item['product_id'],
                'source_shop_id' => $shopId,
                'company_id' => $cashier->company_id,
                'created_by' => $cashier->id,
            ]);
        }
    }

    private function determineSaleStatus(float $total, float $totalPayments, float $changeResidue): SaleStatus
    {
        if ($totalPayments >= $total && $changeResidue <= 0) {
            return SaleStatus::Completed;
        }

        if ($totalPayments > 0) {
            return SaleStatus::PartiallyPaid;
        }

        return SaleStatus::Unpaid;
    }

    private function generateReference(): string
    {
        return 'VNT-'.now()->format('Ymd').'-'.strtoupper(Str::random(5));
    }
}
