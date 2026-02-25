<?php

namespace Database\Factories\Pos;

use App\Enums\PaymentMethod;
use App\Models\Pos\CashRegisterSession;
use App\Models\Pos\Sale;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Pos\SalePayment>
 */
class SalePaymentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'method' => PaymentMethod::Cash,
            'amount' => fake()->randomFloat(2, 1000, 50000),
            'reference' => null,
            'notes' => null,
            'sale_id' => Sale::factory(),
            'session_id' => CashRegisterSession::factory(),
        ];
    }

    public function mobileMoney(): static
    {
        return $this->state(fn () => [
            'method' => PaymentMethod::MobileMoney,
            'reference' => fake()->numerify('MM-########'),
        ]);
    }

    public function bankCard(): static
    {
        return $this->state(fn () => [
            'method' => PaymentMethod::BankCard,
            'reference' => fake()->numerify('CB-########'),
        ]);
    }
}
