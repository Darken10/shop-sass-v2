<?php

use App\Http\Controllers\ActivateAccountController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('activate/{user}', [ActivateAccountController::class, 'show'])
    ->name('account.activate');
Route::post('activate/{user}', [ActivateAccountController::class, 'store'])
    ->name('account.activate.store');

require __DIR__.'/settings.php';
require __DIR__.'/admin.php';
require __DIR__.'/logistics.php';
require __DIR__.'/pos.php';
