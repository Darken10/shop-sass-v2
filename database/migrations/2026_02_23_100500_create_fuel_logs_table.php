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
        Schema::create('fuel_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->decimal('quantity_liters', 10, 2);
            $table->decimal('cost', 12, 2);
            $table->decimal('odometer_reading', 12, 2)->nullable();
            $table->date('fueled_at');
            $table->text('notes')->nullable();

            $table->uuid('vehicle_id');
            $table->foreign('vehicle_id')->references('id')->on('vehicles')->cascadeOnDelete();

            $table->uuid('stock_movement_id')->nullable();
            $table->foreign('stock_movement_id')->references('id')->on('stock_movements')->nullOnDelete();

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
        Schema::dropIfExists('fuel_logs');
    }
};
