<?php

namespace App\Http\Controllers\Finance;

use App\Enums\ExpenseStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\StoreExpenseCategoryRequest;
use App\Http\Requests\Finance\StoreExpenseRequest;
use App\Models\Finance\Expense;
use App\Models\Finance\ExpenseCategory;
use App\Models\Logistics\Shop;
use App\Models\Logistics\Supplier;
use App\Models\Logistics\Warehouse;
use App\Services\FinancialService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function __construct(
        private FinancialService $financialService,
    ) {}

    public function index(Request $request): Response
    {
        $query = Expense::query()
            ->with(['category:id,name,color', 'shop:id,name', 'warehouse:id,name', 'supplier:id,name', 'creator:id,name'])
            ->latest('date');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        if ($request->filled('shop_id')) {
            $query->where('shop_id', $request->input('shop_id'));
        }

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->input('warehouse_id'));
        }

        if ($request->filled('start_date')) {
            $query->where('date', '>=', $request->input('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->where('date', '<=', $request->input('end_date'));
        }

        $expenses = $query->paginate(20)->withQueryString();

        return Inertia::render('finance/expenses/index', [
            'expenses' => $expenses,
            'categories' => ExpenseCategory::query()->select('id', 'name', 'color')->orderBy('name')->get(),
            'shops' => Shop::query()->where('status', 'active')->select('id', 'name')->orderBy('name')->get(),
            'warehouses' => Warehouse::query()->where('status', 'active')->select('id', 'name')->orderBy('name')->get(),
            'filters' => $request->only(['status', 'category_id', 'shop_id', 'warehouse_id', 'start_date', 'end_date']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('finance/expenses/create', [
            'categories' => ExpenseCategory::query()->select('id', 'name', 'color')->orderBy('name')->get(),
            'shops' => Shop::query()->where('status', 'active')->select('id', 'name')->orderBy('name')->get(),
            'warehouses' => Warehouse::query()->where('status', 'active')->select('id', 'name')->orderBy('name')->get(),
            'suppliers' => Supplier::query()->where('is_active', true)->select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function store(StoreExpenseRequest $request): RedirectResponse
    {
        $this->financialService->createExpense($request->validated());

        return to_route('finance.expenses.index')
            ->with('success', 'Dépense enregistrée avec succès.');
    }

    public function show(Expense $expense): Response
    {
        $expense->load(['category', 'shop', 'warehouse', 'supplier', 'creator:id,name', 'approver:id,name', 'journalEntry']);

        return Inertia::render('finance/expenses/show', [
            'expense' => $expense,
        ]);
    }

    public function approve(Expense $expense): RedirectResponse
    {
        $this->financialService->approveExpense($expense);

        return back()->with('success', 'Dépense approuvée.');
    }

    public function reject(Expense $expense): RedirectResponse
    {
        $this->financialService->rejectExpense($expense);

        return back()->with('success', 'Dépense rejetée.');
    }

    public function destroy(Expense $expense): RedirectResponse
    {
        if ($expense->status !== ExpenseStatus::Pending) {
            return back()->with('error', 'Seules les dépenses en attente peuvent être supprimées.');
        }

        $expense->delete();

        return to_route('finance.expenses.index')
            ->with('success', 'Dépense supprimée.');
    }

    public function storeCategory(StoreExpenseCategoryRequest $request): RedirectResponse
    {
        ExpenseCategory::create($request->validated());

        return back()->with('success', 'Catégorie créée avec succès.');
    }
}
