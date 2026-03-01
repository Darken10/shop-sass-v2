<?php

namespace Database\Factories\Catalog;

use App\Enums\ProductUnity;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Catalog\CatalogProduct>
 */
class CatalogProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            'barcode' => fake()->unique()->ean13(),
            'name' => fake()->words(3, true),
            'brand' => fake()->company(),
            'description' => fake()->sentence(),
            'image_url' => null,
            'category' => fake()->word(),
            'unity' => fake()->randomElement(ProductUnity::cases()),
            'source' => 'manual',
        ];
    }

    public function fromOpenFoodFacts(): static
    {
        return $this->state(fn () => [
            'source' => 'open_food_facts',
        ]);
    }
}
