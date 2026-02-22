<?php

use App\Http\Controllers\Admin\CompanyController;
use App\Http\Controllers\Admin\ProductCategoryController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\ProductTagController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:super admin|admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::resource('companies', CompanyController::class);
        Route::post('users/{user}/resend-activation', [UserController::class, 'resendActivation'])
            ->name('users.resend-activation');
        Route::resource('users', UserController::class)->except(['show']);
    });

Route::middleware(['auth', 'verified'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::resource('products', ProductController::class);
        Route::post('product-categories', [ProductCategoryController::class, 'store'])
            ->name('product-categories.store');
        Route::post('product-tags', [ProductTagController::class, 'store'])
            ->name('product-tags.store');
    });
