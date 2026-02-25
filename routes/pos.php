<?php

use App\Http\Controllers\Pos\CashRegisterController;
use App\Http\Controllers\Pos\CustomerController;
use App\Http\Controllers\Pos\PromotionController;
use App\Http\Controllers\Pos\SaleController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])
    ->prefix('pos')
    ->name('pos.')
    ->group(function () {
        // Cash register
        Route::get('/', [CashRegisterController::class, 'index'])->name('index');
        Route::post('/open', [CashRegisterController::class, 'open'])->name('open');
        Route::get('/sessions', [CashRegisterController::class, 'sessions'])->name('sessions.index');
        Route::post('/sessions/{session}/close', [CashRegisterController::class, 'close'])->name('close');
        Route::get('/sessions/{session}', [CashRegisterController::class, 'show'])->name('sessions.show');

        // POS terminal
        Route::get('/terminal', [SaleController::class, 'create'])->name('terminal');
        Route::post('/sales', [SaleController::class, 'store'])->name('sales.store');
        Route::get('/sales', [SaleController::class, 'index'])->name('sales.index');
        Route::get('/sales/credits', [SaleController::class, 'credits'])->name('sales.credits');
        Route::get('/sales/{sale}/receipt', [SaleController::class, 'receipt'])->name('sales.receipt');
        Route::get('/sales/{sale}', [SaleController::class, 'show'])->name('sales.show');
        Route::post('/sales/{sale}/credit-payment', [SaleController::class, 'creditPayment'])->name('sales.credit-payment');

        // Product search (AJAX)
        Route::get('/products/search', [SaleController::class, 'searchProducts'])->name('products.search');
        Route::get('/products/barcode', [SaleController::class, 'lookupBarcode'])->name('products.barcode');

        // QR code verification (public-ish)
        Route::get('/verify/{token}', [SaleController::class, 'verify'])->name('verify')->withoutMiddleware(['auth', 'verified']);

        // Customers
        Route::resource('customers', CustomerController::class)->except(['create', 'show', 'edit']);
        Route::post('/customers/quick-store', [CustomerController::class, 'quickStore'])->name('customers.quick-store');

        // Promotions
        Route::resource('promotions', PromotionController::class)->except(['show']);
    });
