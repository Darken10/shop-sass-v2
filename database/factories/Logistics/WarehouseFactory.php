<?php

namespace Database\Factories\Logistics;

use App\Enums\WarehouseStatus;
use App\Models\Company\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Logistics\Warehouse>
 */
class WarehouseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->company().' Entrepôt',
            'code' => fake()->unique()->numerify('WH-#####'),
            'address' => fake()->address(),
            'city' => fake()->city(),
            'phone' => fake()->phoneNumber(),
            'status' => fake()->randomElement(WarehouseStatus::cases()),
            'description' => fake()->sentence(),
            'company_id' => Company::factory(),
            'created_by' => User::factory(),
        ];
    }

    public function active(): static
    {
        return $this->state(fn () => [
            'status' => WarehouseStatus::Active,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => [
            'status' => WarehouseStatus::Inactive,
        ]);
    }
}
