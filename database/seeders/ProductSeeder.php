<?php

namespace Database\Seeders;

use App\Models\Company\Company;
use App\Models\Product\Product;
use App\Models\Product\ProductCategory;
use App\Models\Product\ProductTag;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $companies = Company::all();

        foreach ($companies as $company) {
            $creator = $company->creator;
            $categories = ProductCategory::withoutGlobalScopes()
                ->where('company_id', $company->id)
                ->get();

            if ($categories->isEmpty()) {
                continue;
            }

            $tags = collect(['Promo', 'Nouveau', 'Populaire', 'Bio'])->map(
                fn (string $tagName) => ProductTag::withoutGlobalScopes()->firstOrCreate(
                    ['name' => $tagName, 'company_id' => $company->id],
                    ['created_by' => $creator?->id],
                ),
            );

            Product::factory()
                ->count(10)
                ->sequence(fn (\Illuminate\Database\Eloquent\Factories\Sequence $sequence) => [
                    'category_id' => $categories->random()->id,
                    'company_id' => $company->id,
                    'created_by' => $creator?->id,
                ])
                ->create()
                ->each(fn (Product $product) => $product->tags()->attach(
                    $tags->random(rand(1, 3))->pluck('id'),
                ));
        }
    }
}
