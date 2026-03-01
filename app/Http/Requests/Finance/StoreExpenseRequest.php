<?php

namespace App\Http\Requests\Finance;

use App\Enums\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'label' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'date' => ['required', 'date'],
            'payment_method' => ['nullable', 'string', Rule::in(PaymentMethod::all())],
            'receipt_number' => ['nullable', 'string', 'max:100'],
            'category_id' => ['nullable', 'uuid', Rule::exists('expense_categories', 'id')],
            'shop_id' => ['nullable', 'uuid', Rule::exists('shops', 'id')],
            'warehouse_id' => ['nullable', 'uuid', Rule::exists('warehouses', 'id')],
            'supplier_id' => ['nullable', 'uuid', Rule::exists('suppliers', 'id')],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'label.required' => 'Le libellé est obligatoire.',
            'amount.required' => 'Le montant est obligatoire.',
            'amount.min' => 'Le montant doit être supérieur à 0.',
            'date.required' => 'La date est obligatoire.',
        ];
    }
}
