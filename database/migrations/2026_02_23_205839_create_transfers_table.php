<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('reference')->unique();
            $table->string('type'); // warehouse_to_shop, warehouse_to_warehouse
            $table->string('status')->default('pending');
            $table->text('notes')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('delivered_at')->nullable();

            $table->uuid('source_warehouse_id');
            $table->foreign('source_warehouse_id')->references('id')->on('warehouses')->cascadeOnDelete();

            // Destination: either a warehouse or a shop
            $table->uuid('destination_warehouse_id')->nullable();
            $table->foreign('destination_warehouse_id')->references('id')->on('warehouses')->nullOnDelete();

            $table->uuid('destination_shop_id')->nullable();
            $table->foreign('destination_shop_id')->references('id')->on('shops')->nullOnDelete();

            $table->uuid('vehicle_id')->nullable();
            $table->foreign('vehicle_id')->references('id')->on('vehicles')->nullOnDelete();

            $table->uuid('approved_by')->nullable();
            $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();

            $table->uuid('company_id');
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();

            $table->uuid('created_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();

            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfers');
    }
};
