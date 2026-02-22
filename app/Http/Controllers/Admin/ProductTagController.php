<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductTagRequest;
use App\Models\Product\ProductTag;
use Illuminate\Http\JsonResponse;

class ProductTagController extends Controller
{
    public function store(StoreProductTagRequest $request): JsonResponse
    {
        $this->authorize('create', ProductTag::class);

        $tag = ProductTag::create([
            'name' => $request->validated('name'),
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'id' => $tag->id,
            'name' => $tag->name,
        ], 201);
    }
}
