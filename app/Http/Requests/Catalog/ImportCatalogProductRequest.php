<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ImportCatalogProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'price' => ['required', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'stock_alert' => ['nullable', 'integer', 'min:0'],
            'unity' => ['required', 'string', Rule::in(array_column(\App\Enums\ProductUnity::cases(), 'value'))],
            'status' => ['required', 'string', Rule::in(array_column(\App\Enums\ProductStatus::cases(), 'value'))],
            'category_id' => ['required', 'uuid', Rule::exists('product_categories', 'id')],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'price.required' => 'Le prix de vente est obligatoire.',
            'price.min' => 'Le prix doit être positif.',
            'stock.required' => 'La quantité initiale en stock est obligatoire.',
            'category_id.required' => 'La catégorie est obligatoire.',
            'category_id.exists' => 'La catégorie sélectionnée est invalide.',
            'unity.required' => "L'unité est obligatoire.",
            'status.required' => 'Le statut est obligatoire.',
        ];
    }
}
