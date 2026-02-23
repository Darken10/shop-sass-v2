<?php

namespace App\Providers;

use App\Models\Company\Company;
use App\Models\Logistics\FuelLog;
use App\Models\Logistics\LogisticCharge;
use App\Models\Logistics\Shop;
use App\Models\Logistics\StockMovement;
use App\Models\Logistics\Supplier;
use App\Models\Logistics\SupplyRequest;
use App\Models\Logistics\Transfer;
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
use App\Policies\ShopPolicy;
use App\Policies\StockMovementPolicy;
use App\Policies\SupplierPolicy;
use App\Policies\SupplyRequestPolicy;
use App\Policies\TransferPolicy;
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
        $this->configureGates();
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
        Gate::policy(Shop::class, ShopPolicy::class);
        Gate::policy(Supplier::class, SupplierPolicy::class);
        Gate::policy(StockMovement::class, StockMovementPolicy::class);
        Gate::policy(SupplyRequest::class, SupplyRequestPolicy::class);
        Gate::policy(Transfer::class, TransferPolicy::class);
        Gate::policy(Vehicle::class, VehiclePolicy::class);
        Gate::policy(FuelLog::class, FuelLogPolicy::class);
        Gate::policy(LogisticCharge::class, LogisticChargePolicy::class);
    }

    /**
     * Register gate "before" callback so super admins bypass all checks.
     * Admins get all permissions via role assignment, and policies
     * enforce company-scoping for them.
     */
    protected function configureGates(): void
    {
        Gate::before(function ($user, $ability) {
            if ($user->isSuperAdmin()) {
                return true;
            }
        });
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
