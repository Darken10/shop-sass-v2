<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('supply_request_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->integer('quantity_requested');
            $table->integer('quantity_delivered')->default(0);

            $table->uuid('supply_request_id');
            $table->foreign('supply_request_id')->references('id')->on('supply_requests')->cascadeOnDelete();

            $table->uuid('product_id');
            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supply_request_items');
    }
};
