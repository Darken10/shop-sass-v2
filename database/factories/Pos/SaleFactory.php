<?php

namespace Database\Factories\Pos;

use App\Enums\SaleStatus;
use App\Models\Company\Company;
use App\Models\Logistics\Shop;
use App\Models\Pos\CashRegisterSession;
use App\Models\Pos\Customer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Pos\Sale>
 */
class SaleFactory extends Factory
{
    public function definition(): array
    {
        $total = fake()->randomFloat(2, 1000, 100000);

        return [
            'reference' => fake()->unique()->numerify('VNT-######'),
            'status' => SaleStatus::Completed,
            'subtotal' => $total,
            'discount_total' => 0,
            'total' => $total,
            'amount_paid' => $total,
            'amount_due' => 0,
            'change_given' => 0,
            'change_residue' => 0,
            'qr_code_token' => Str::uuid()->toString(),
            'notes' => null,
            'session_id' => CashRegisterSession::factory(),
            'shop_id' => Shop::factory(),
            'customer_id' => null,
            'cashier_id' => User::factory(),
            'company_id' => Company::factory(),
        ];
    }

    public function partiallyPaid(float $amountPaid = 5000): static
    {
        return $this->state(function (array $attributes) use ($amountPaid) {
            $total = $attributes['total'] ?? 10000;

            return [
                'status' => SaleStatus::PartiallyPaid,
                'amount_paid' => $amountPaid,
                'amount_due' => $total - $amountPaid,
            ];
        });
    }

    public function cancelled(): static
    {
        return $this->state(fn () => [
            'status' => SaleStatus::Cancelled,
        ]);
    }

    public function withCustomer(): static
    {
        return $this->state(fn () => [
            'customer_id' => Customer::factory(),
        ]);
    }
}
