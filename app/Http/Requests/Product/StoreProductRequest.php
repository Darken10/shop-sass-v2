<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('products', 'code')],
            'description' => ['nullable', 'string', 'max:1000'],
            'price' => ['required', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'stock_alert' => ['nullable', 'integer', 'min:0'],
            'unity' => ['required', 'string', Rule::in(array_column(\App\Enums\ProductUnity::cases(), 'value'))],
            'status' => ['required', 'string', Rule::in(array_column(\App\Enums\ProductStatus::cases(), 'value'))],
            'category_id' => ['required', 'uuid', Rule::exists('product_categories', 'id')],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['uuid', Rule::exists('product_tags', 'id')],
            'image' => ['nullable', 'image', 'max:2048'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.required' => 'Le nom du produit est obligatoire.',
            'code.required' => 'Le code du produit est obligatoire.',
            'code.unique' => 'Ce code est déjà utilisé.',
            'price.required' => 'Le prix est obligatoire.',
            'price.min' => 'Le prix doit être positif.',
            'stock.required' => 'Le stock est obligatoire.',
            'category_id.required' => 'La catégorie est obligatoire.',
            'category_id.exists' => 'La catégorie sélectionnée est invalide.',
        ];
    }
}
