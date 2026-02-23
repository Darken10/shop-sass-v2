<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shop_stocks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->integer('quantity')->default(0);
            $table->integer('stock_alert')->default(0);

            $table->uuid('product_id');
            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();

            $table->uuid('shop_id');
            $table->foreign('shop_id')->references('id')->on('shops')->cascadeOnDelete();

            $table->uuid('company_id');
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();

            $table->unique(['product_id', 'shop_id']);

            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shop_stocks');
    }
};
