<?php

namespace Database\Factories\Logistics;

use App\Enums\SupplyRequestStatus;
use App\Models\Company\Company;
use App\Models\Logistics\Warehouse;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Logistics\SupplyRequest>
 */
class SupplyRequestFactory extends Factory
{
    public function definition(): array
    {
        return [
            'reference' => 'SR-'.strtoupper(fake()->unique()->bothify('??######')),
            'status' => fake()->randomElement(SupplyRequestStatus::cases()),
            'notes' => fake()->optional()->sentence(),
            'source_warehouse_id' => Warehouse::factory(),
            'destination_warehouse_id' => Warehouse::factory(),
            'company_id' => Company::factory(),
            'created_by' => User::factory(),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => [
            'status' => SupplyRequestStatus::Pending,
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn () => [
            'status' => SupplyRequestStatus::Approved,
            'approved_at' => now(),
            'approved_by' => User::factory(),
        ]);
    }

    public function delivered(): static
    {
        return $this->state(fn () => [
            'status' => SupplyRequestStatus::Delivered,
            'approved_at' => now()->subDay(),
            'delivered_at' => now(),
            'approved_by' => User::factory(),
        ]);
    }
}
