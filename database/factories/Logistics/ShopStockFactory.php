<?php

namespace Database\Factories\Logistics;

use App\Models\Company\Company;
use App\Models\Logistics\Shop;
use App\Models\Product\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Logistics\ShopStock>
 */
class ShopStockFactory extends Factory
{
    public function definition(): array
    {
        return [
            'quantity' => fake()->numberBetween(0, 500),
            'stock_alert' => fake()->numberBetween(5, 50),
            'product_id' => Product::factory(),
            'shop_id' => Shop::factory(),
            'company_id' => Company::factory(),
        ];
    }
}
