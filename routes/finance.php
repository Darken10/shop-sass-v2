<?php

use App\Http\Controllers\Finance\AccountingController;
use App\Http\Controllers\Finance\CashFlowController;
use App\Http\Controllers\Finance\ExpenseController;
use App\Http\Controllers\Finance\FinancialOverviewController;
use App\Http\Controllers\Finance\FinancialReportController;
use App\Http\Controllers\Finance\ProfitLossController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->prefix('finance')->name('finance.')->group(function () {
    // Overview Dashboard
    Route::get('/', FinancialOverviewController::class)->name('overview');

    // Profit & Loss
    Route::get('/profit-loss', ProfitLossController::class)->name('profit-loss');

    // Cash Flow
    Route::get('/cash-flow', CashFlowController::class)->name('cash-flow');

    // Expenses
    Route::get('/expenses', [ExpenseController::class, 'index'])->name('expenses.index');
    Route::get('/expenses/create', [ExpenseController::class, 'create'])->name('expenses.create');
    Route::post('/expenses', [ExpenseController::class, 'store'])->name('expenses.store');
    Route::get('/expenses/{expense}', [ExpenseController::class, 'show'])->name('expenses.show');
    Route::post('/expenses/{expense}/approve', [ExpenseController::class, 'approve'])->name('expenses.approve');
    Route::post('/expenses/{expense}/reject', [ExpenseController::class, 'reject'])->name('expenses.reject');
    Route::delete('/expenses/{expense}', [ExpenseController::class, 'destroy'])->name('expenses.destroy');
    Route::post('/expense-categories', [ExpenseController::class, 'storeCategory'])->name('expense-categories.store');

    // Accounting
    Route::get('/accounting/accounts', [AccountingController::class, 'accounts'])->name('accounting.accounts');
    Route::post('/accounting/accounts', [AccountingController::class, 'storeAccount'])->name('accounting.accounts.store');
    Route::get('/accounting/journal', [AccountingController::class, 'journal'])->name('accounting.journal');
    Route::get('/accounting/journal/create', [AccountingController::class, 'createJournalEntry'])->name('accounting.journal.create');
    Route::post('/accounting/journal', [AccountingController::class, 'storeJournalEntry'])->name('accounting.journal.store');
    Route::get('/accounting/journal/{journalEntry}', [AccountingController::class, 'showJournalEntry'])->name('accounting.journal.show');
    Route::post('/accounting/journal/{journalEntry}/post', [AccountingController::class, 'postJournalEntry'])->name('accounting.journal.post');
    Route::post('/accounting/journal/{journalEntry}/void', [AccountingController::class, 'voidJournalEntry'])->name('accounting.journal.void');
    Route::get('/accounting/balance-sheet', [AccountingController::class, 'balanceSheet'])->name('accounting.balance-sheet');
    Route::get('/accounting/ledger', [AccountingController::class, 'ledger'])->name('accounting.ledger');

    // Reports
    Route::get('/reports', [FinancialReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/create', [FinancialReportController::class, 'create'])->name('reports.create');
    Route::post('/reports', [FinancialReportController::class, 'store'])->name('reports.store');
    Route::get('/reports/{report}', [FinancialReportController::class, 'show'])->name('reports.show');
    Route::delete('/reports/{report}', [FinancialReportController::class, 'destroy'])->name('reports.destroy');
});
