<?php

namespace Database\Seeders;

use App\Models\Company\Company;
use App\Models\Product\ProductCategory;
use Illuminate\Database\Seeder;

class ProductCategorySeeder extends Seeder
{
    public function run(): void
    {
        $companies = Company::all();

        $categories = ['Alimentaire', 'Boissons', 'Hygiène', 'Électronique', 'Vêtements'];

        foreach ($companies as $company) {
            $creator = $company->creator;

            foreach ($categories as $categoryName) {
                ProductCategory::withoutGlobalScopes()->firstOrCreate(
                    ['name' => $categoryName, 'company_id' => $company->id],
                    [
                        'description' => "Catégorie {$categoryName}",
                        'created_by' => $creator?->id,
                    ],
                );
            }
        }
    }
}
