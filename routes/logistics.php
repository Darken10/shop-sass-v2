<?php

use App\Http\Controllers\Admin\Logistics\FuelLogController;
use App\Http\Controllers\Admin\Logistics\LogisticChargeController;
use App\Http\Controllers\Admin\Logistics\StockMovementController;
use App\Http\Controllers\Admin\Logistics\SupplyRequestController;
use App\Http\Controllers\Admin\Logistics\VehicleController;
use App\Http\Controllers\Admin\Logistics\WarehouseController;
use App\Http\Controllers\Admin\Logistics\WarehouseStockController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])
    ->prefix('admin/logistics')
    ->name('admin.logistics.')
    ->group(function () {
        // Entrepôts
        Route::resource('warehouses', WarehouseController::class);

        // Stocks
        Route::resource('stocks', WarehouseStockController::class)->except(['show', 'edit']);

        // Mouvements de stock
        Route::resource('movements', StockMovementController::class)->only(['index', 'create', 'store', 'show']);

        // Demandes d'approvisionnement
        Route::resource('supply-requests', SupplyRequestController::class)->only(['index', 'create', 'store', 'show']);
        Route::post('supply-requests/{supply_request}/approve', [SupplyRequestController::class, 'approve'])
            ->name('supply-requests.approve');
        Route::post('supply-requests/{supply_request}/deliver', [SupplyRequestController::class, 'deliver'])
            ->name('supply-requests.deliver');
        Route::post('supply-requests/{supply_request}/reject', [SupplyRequestController::class, 'reject'])
            ->name('supply-requests.reject');

        // Engins / Véhicules
        Route::resource('vehicles', VehicleController::class);

        // Carburant
        Route::resource('fuel-logs', FuelLogController::class)->only(['index', 'create', 'store', 'show']);

        // Charges logistiques
        Route::resource('charges', LogisticChargeController::class)->only(['index', 'create', 'store', 'show']);
    });
