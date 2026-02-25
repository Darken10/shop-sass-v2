<?php

namespace Database\Factories\Pos;

use App\Models\Company\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Pos\Customer>
 */
class CustomerFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'phone' => fake()->phoneNumber(),
            'email' => fake()->unique()->safeEmail(),
            'address' => fake()->address(),
            'city' => fake()->city(),
            'credit_balance' => 0,
            'company_id' => Company::factory(),
            'created_by' => User::factory(),
        ];
    }

    public function withCredit(float $amount = 5000): static
    {
        return $this->state(fn () => [
            'credit_balance' => $amount,
        ]);
    }
}
