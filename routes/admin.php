<?php

use App\Http\Controllers\Admin\CompanyController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:super admin|admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::resource('companies', CompanyController::class);
    });
