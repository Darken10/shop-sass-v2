<?php

namespace Database\Factories\Logistics;

use App\Models\Company\Company;
use App\Models\Logistics\Vehicle;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Logistics\FuelLog>
 */
class FuelLogFactory extends Factory
{
    public function definition(): array
    {
        return [
            'quantity_liters' => fake()->randomFloat(2, 5, 200),
            'cost' => fake()->randomFloat(2, 1000, 50000),
            'odometer_reading' => fake()->optional()->randomFloat(2, 1000, 500000),
            'fueled_at' => fake()->date(),
            'notes' => fake()->optional()->sentence(),
            'vehicle_id' => Vehicle::factory(),
            'stock_movement_id' => null,
            'company_id' => Company::factory(),
            'created_by' => User::factory(),
        ];
    }
}
