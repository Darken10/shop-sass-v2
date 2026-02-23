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
        Schema::create('logistic_charges', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('label');
            $table->string('type');
            $table->decimal('amount', 12, 2);
            $table->text('notes')->nullable();

            $table->uuid('stock_movement_id')->nullable();
            $table->foreign('stock_movement_id')->references('id')->on('stock_movements')->nullOnDelete();

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
        Schema::dropIfExists('logistic_charges');
    }
};
