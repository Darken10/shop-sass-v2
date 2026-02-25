<?php

namespace Database\Factories\Pos;

use App\Enums\CashRegisterSessionStatus;
use App\Models\Company\Company;
use App\Models\Logistics\Shop;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Pos\CashRegisterSession>
 */
class CashRegisterSessionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'session_number' => fake()->unique()->numerify('SES-######'),
            'status' => CashRegisterSessionStatus::Open,
            'opening_amount' => fake()->randomFloat(2, 0, 50000),
            'closing_amount' => null,
            'total_sales' => 0,
            'total_cash' => 0,
            'total_mobile_money' => 0,
            'total_bank_card' => 0,
            'total_bank_transfer' => 0,
            'total_credit' => 0,
            'closing_notes' => null,
            'opened_at' => now(),
            'closed_at' => null,
            'shop_id' => Shop::factory(),
            'cashier_id' => User::factory(),
            'company_id' => Company::factory(),
        ];
    }

    public function open(): static
    {
        return $this->state(fn () => [
            'status' => CashRegisterSessionStatus::Open,
        ]);
    }

    public function closed(): static
    {
        return $this->state(fn () => [
            'status' => CashRegisterSessionStatus::Closed,
            'closing_amount' => fake()->randomFloat(2, 10000, 500000),
            'total_sales' => fake()->randomFloat(2, 10000, 500000),
            'closed_at' => now(),
        ]);
    }
}
