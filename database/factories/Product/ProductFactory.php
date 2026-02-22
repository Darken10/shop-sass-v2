<?php

namespace Database\Factories\Product;

use App\Enums\ProductStatus;
use App\Enums\ProductUnity;
use App\Models\Company\Company;
use App\Models\Product\ProductCategory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product\Product>
 */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'code' => fake()->unique()->numerify('PRD-#####'),
            'description' => fake()->sentence(),
            'price' => fake()->randomFloat(2, 1, 1000),
            'cost_price' => fake()->randomFloat(2, 1, 500),
            'stock' => fake()->numberBetween(0, 500),
            'stock_alert' => fake()->numberBetween(0, 20),
            'unity' => fake()->randomElement(ProductUnity::cases()),
            'status' => fake()->randomElement(ProductStatus::cases()),
            'category_id' => ProductCategory::factory(),
            'company_id' => Company::factory(),
            'created_by' => User::factory(),
        ];
    }

    public function active(): static
    {
        return $this->state(fn () => [
            'status' => ProductStatus::ACTIVE,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => [
            'status' => ProductStatus::INACTIVE,
        ]);
    }
}
