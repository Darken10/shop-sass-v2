<?php

namespace Database\Factories\Logistics;

use App\Enums\TransferStatus;
use App\Enums\TransferType;
use App\Models\Company\Company;
use App\Models\Logistics\Warehouse;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Logistics\Transfer>
 */
class TransferFactory extends Factory
{
    public function definition(): array
    {
        return [
            'reference' => fake()->unique()->numerify('TRF-########'),
            'type' => fake()->randomElement(TransferType::cases()),
            'status' => TransferStatus::Pending,
            'notes' => fake()->sentence(),
            'company_bears_costs' => false,
            'driver_name' => null,
            'driver_phone' => null,
            'source_warehouse_id' => Warehouse::factory(),
            'company_id' => Company::factory(),
            'created_by' => User::factory(),
        ];
    }

    public function draft(): static
    {
        return $this->state(fn () => [
            'status' => TransferStatus::Draft,
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn () => [
            'status' => TransferStatus::Approved,
            'approved_at' => now(),
        ]);
    }

    public function inTransit(): static
    {
        return $this->state(fn () => [
            'status' => TransferStatus::InTransit,
            'approved_at' => now()->subHour(),
            'shipped_at' => now(),
        ]);
    }

    public function delivered(): static
    {
        return $this->state(fn () => [
            'status' => TransferStatus::Delivered,
            'approved_at' => now()->subHour(),
            'shipped_at' => now()->subMinutes(30),
            'delivered_at' => now(),
        ]);
    }

    public function withCosts(): static
    {
        return $this->state(fn () => [
            'company_bears_costs' => true,
            'driver_name' => fake()->name(),
            'driver_phone' => fake()->phoneNumber(),
        ]);
    }
}
