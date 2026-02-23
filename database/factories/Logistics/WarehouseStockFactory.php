<?php

namespace Database\Factories\Logistics;

use App\Models\Company\Company;
use App\Models\Logistics\Warehouse;
use App\Models\Product\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Logistics\WarehouseStock>
 */
class WarehouseStockFactory extends Factory
{
    public function definition(): array
    {
        return [
            'quantity' => fake()->numberBetween(0, 1000),
            'stock_alert' => fake()->numberBetween(5, 50),
            'product_id' => Product::factory(),
            'warehouse_id' => Warehouse::factory(),
            'company_id' => Company::factory(),
        ];
    }
}
