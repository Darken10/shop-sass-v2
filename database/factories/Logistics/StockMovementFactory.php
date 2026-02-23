<?php

namespace Database\Factories\Logistics;

use App\Enums\StockMovementType;
use App\Models\Company\Company;
use App\Models\Logistics\Warehouse;
use App\Models\Product\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Logistics\StockMovement>
 */
class StockMovementFactory extends Factory
{
    public function definition(): array
    {
        return [
            'reference' => 'MOV-'.strtoupper(fake()->unique()->bothify('??######')),
            'type' => fake()->randomElement(StockMovementType::cases()),
            'quantity' => fake()->numberBetween(1, 200),
            'reason' => fake()->sentence(),
            'notes' => fake()->optional()->sentence(),
            'product_id' => Product::factory(),
            'source_warehouse_id' => Warehouse::factory(),
            'destination_warehouse_id' => null,
            'supply_request_id' => null,
            'company_id' => Company::factory(),
            'created_by' => User::factory(),
        ];
    }

    public function entry(): static
    {
        return $this->state(fn () => [
            'type' => StockMovementType::PurchaseEntry,
        ]);
    }

    public function exit(): static
    {
        return $this->state(fn () => [
            'type' => StockMovementType::StoreTransfer,
        ]);
    }

    public function internalTransfer(): static
    {
        return $this->state(fn () => [
            'type' => StockMovementType::InternalTransfer,
            'destination_warehouse_id' => Warehouse::factory(),
        ]);
    }
}
