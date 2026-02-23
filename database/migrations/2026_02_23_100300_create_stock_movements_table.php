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
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('reference')->unique();
            $table->string('type');
            $table->integer('quantity');
            $table->text('reason')->nullable();
            $table->text('notes')->nullable();

            $table->uuid('product_id');
            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();

            $table->uuid('source_warehouse_id')->nullable();
            $table->foreign('source_warehouse_id')->references('id')->on('warehouses')->nullOnDelete();

            $table->uuid('destination_warehouse_id')->nullable();
            $table->foreign('destination_warehouse_id')->references('id')->on('warehouses')->nullOnDelete();

            $table->uuid('supply_request_id')->nullable();
            $table->foreign('supply_request_id')->references('id')->on('supply_requests')->nullOnDelete();

            $table->uuid('company_id');
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();

            $table->uuid('created_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();

            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
