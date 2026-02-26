<?php

use App\Http\Controllers\Admin\Logistics\FuelLogController;
use App\Http\Controllers\Admin\Logistics\LogisticChargeController;
use App\Http\Controllers\Admin\Logistics\ShopController;
use App\Http\Controllers\Admin\Logistics\StockMovementController;
use App\Http\Controllers\Admin\Logistics\SupplierController;
use App\Http\Controllers\Admin\Logistics\SupplyRequestController;
use App\Http\Controllers\Admin\Logistics\TransferController;
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

        // Magasins / Points de vente
        Route::resource('shops', ShopController::class);

        // Fournisseurs
        Route::resource('suppliers', SupplierController::class);

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
        Route::post('supply-requests/{supply_request}/receive', [SupplyRequestController::class, 'receive'])
            ->name('supply-requests.receive');
        Route::post('supply-requests/{supply_request}/submit', [SupplyRequestController::class, 'submit'])
            ->name('supply-requests.submit');

        // Transferts
        Route::resource('transfers', TransferController::class)->only(['index', 'create', 'store', 'show']);
        Route::post('transfers/{transfer}/approve', [TransferController::class, 'approve'])
            ->name('transfers.approve');
        Route::post('transfers/{transfer}/ship', [TransferController::class, 'ship'])
            ->name('transfers.ship');
        Route::post('transfers/{transfer}/deliver', [TransferController::class, 'deliver'])
            ->name('transfers.deliver');
        Route::post('transfers/{transfer}/receive', [TransferController::class, 'receive'])
            ->name('transfers.receive');
        Route::post('transfers/{transfer}/reject', [TransferController::class, 'reject'])
            ->name('transfers.reject');
        Route::post('transfers/{transfer}/submit', [TransferController::class, 'submit'])
            ->name('transfers.submit');

        // Engins / Véhicules
        Route::resource('vehicles', VehicleController::class);

        // Carburant
        Route::resource('fuel-logs', FuelLogController::class)->only(['index', 'create', 'store', 'show']);

        // Charges logistiques
        Route::resource('charges', LogisticChargeController::class)->only(['index', 'create', 'store', 'show']);
    });
