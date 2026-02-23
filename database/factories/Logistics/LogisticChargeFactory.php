<?php

namespace Database\Factories\Logistics;

use App\Enums\LogisticChargeType;
use App\Models\Company\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Logistics\LogisticCharge>
 */
class LogisticChargeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'label' => fake()->words(3, true),
            'type' => fake()->randomElement(LogisticChargeType::cases()),
            'amount' => fake()->randomFloat(2, 500, 50000),
            'notes' => fake()->optional()->sentence(),
            'stock_movement_id' => null,
            'supply_request_id' => null,
            'company_id' => Company::factory(),
            'created_by' => User::factory(),
        ];
    }
}
