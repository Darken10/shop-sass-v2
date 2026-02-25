<?php

namespace Database\Factories\Pos;

use App\Models\Pos\Sale;
use App\Models\Product\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Pos\SaleItem>
 */
class SaleItemFactory extends Factory
{
    public function definition(): array
    {
        $unitPrice = fake()->randomFloat(2, 100, 10000);
        $quantity = fake()->numberBetween(1, 10);

        return [
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'discount' => 0,
            'subtotal' => $unitPrice * $quantity,
            'sale_id' => Sale::factory(),
            'product_id' => Product::factory(),
            'promotion_id' => null,
        ];
    }
}
