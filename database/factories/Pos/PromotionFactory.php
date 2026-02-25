<?php

namespace Database\Factories\Pos;

use App\Enums\PromotionType;
use App\Models\Company\Company;
use App\Models\Logistics\Shop;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Pos\Promotion>
 */
class PromotionFactory extends Factory
{
    public function definition(): array
    {
        $type = fake()->randomElement(PromotionType::cases());

        return [
            'name' => 'Promo '.fake()->word(),
            'type' => $type,
            'value' => $type === PromotionType::Percentage
                ? fake()->numberBetween(5, 30)
                : fake()->numberBetween(100, 5000),
            'starts_at' => now()->subDays(5),
            'ends_at' => now()->addDays(30),
            'is_active' => true,
            'description' => fake()->sentence(),
            'shop_id' => null,
            'company_id' => Company::factory(),
            'created_by' => User::factory(),
        ];
    }

    public function forShop(Shop $shop): static
    {
        return $this->state(fn () => [
            'shop_id' => $shop->id,
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'starts_at' => now()->subDays(30),
            'ends_at' => now()->subDays(1),
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => [
            'is_active' => false,
        ]);
    }
}
