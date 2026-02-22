<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductCategoryRequest;
use App\Models\Product\ProductCategory;
use Illuminate\Http\JsonResponse;

class ProductCategoryController extends Controller
{
    public function store(StoreProductCategoryRequest $request): JsonResponse
    {
        $this->authorize('create', ProductCategory::class);

        $category = ProductCategory::create([
            'name' => $request->validated('name'),
            'description' => $request->validated('description'),
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'id' => $category->id,
            'name' => $category->name,
        ], 201);
    }
}
