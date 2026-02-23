<?php

namespace App\Providers;

use App\Models\Company\Company;
use App\Models\Logistics\FuelLog;
use App\Models\Logistics\LogisticCharge;
use App\Models\Logistics\StockMovement;
use App\Models\Logistics\SupplyRequest;
use App\Models\Logistics\Vehicle;
use App\Models\Logistics\Warehouse;
use App\Models\Logistics\WarehouseStock;
use App\Models\Product\Product;
use App\Models\Product\ProductCategory;
use App\Models\Product\ProductTag;
use App\Policies\CompanyPolicy;
use App\Policies\FuelLogPolicy;
use App\Policies\LogisticChargePolicy;
use App\Policies\ProductCategoryPolicy;
use App\Policies\ProductPolicy;
use App\Policies\ProductTagPolicy;
use App\Policies\StockMovementPolicy;
use App\Policies\SupplyRequestPolicy;
use App\Policies\VehiclePolicy;
use App\Policies\WarehousePolicy;
use App\Policies\WarehouseStockPolicy;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configurePolicies();
        $this->configureDefaults();
    }

    /**
     * Register model policies.
     */
    protected function configurePolicies(): void
    {
        Gate::policy(Company::class, CompanyPolicy::class);
        Gate::policy(Product::class, ProductPolicy::class);
        Gate::policy(ProductCategory::class, ProductCategoryPolicy::class);
        Gate::policy(ProductTag::class, ProductTagPolicy::class);
        Gate::policy(Warehouse::class, WarehousePolicy::class);
        Gate::policy(WarehouseStock::class, WarehouseStockPolicy::class);
        Gate::policy(StockMovement::class, StockMovementPolicy::class);
        Gate::policy(SupplyRequest::class, SupplyRequestPolicy::class);
        Gate::policy(Vehicle::class, VehiclePolicy::class);
        Gate::policy(FuelLog::class, FuelLogPolicy::class);
        Gate::policy(LogisticCharge::class, LogisticChargePolicy::class);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }
}
