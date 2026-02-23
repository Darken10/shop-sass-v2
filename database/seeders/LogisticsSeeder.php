<?php

namespace Database\Seeders;

use App\Enums\WarehouseStatus;
use App\Models\Company\Company;
use App\Models\Logistics\Warehouse;
use App\Models\Logistics\WarehouseStock;
use App\Models\Product\Product;
use Illuminate\Database\Seeder;

class LogisticsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $companies = Company::withoutGlobalScopes()->get();

        foreach ($companies as $company) {
            $users = $company->creator;

            // Créer 2 entrepôts par entreprise
            $warehouses = Warehouse::withoutGlobalScopes()->factory()
                ->count(2)
                ->create([
                    'status' => WarehouseStatus::Active,
                    'company_id' => $company->id,
                    'created_by' => $users?->id,
                ]);

            // Créer des stocks pour chaque entrepôt avec les produits de l'entreprise
            $products = Product::withoutGlobalScopes()
                ->where('company_id', $company->id)
                ->get();

            foreach ($warehouses as $warehouse) {
                foreach ($products->random(min(5, $products->count())) as $product) {
                    WarehouseStock::withoutGlobalScopes()->create([
                        'quantity' => fake()->numberBetween(10, 500),
                        'stock_alert' => fake()->numberBetween(5, 20),
                        'product_id' => $product->id,
                        'warehouse_id' => $warehouse->id,
                        'company_id' => $company->id,
                    ]);
                }
            }
        }
    }
}
