<?php

namespace Database\Factories\Logistics;

use App\Models\Logistics\SupplyRequest;
use App\Models\Product\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Logistics\SupplyRequestItem>
 */
class SupplyRequestItemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'quantity_requested' => fake()->numberBetween(1, 100),
            'quantity_delivered' => 0,
            'supply_request_id' => SupplyRequest::factory(),
            'product_id' => Product::factory(),
        ];
    }
}
