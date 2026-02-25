<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('reference')->unique();
            $table->string('status')->default('completed');
            $table->decimal('subtotal', 12, 2);
            $table->decimal('discount_total', 12, 2)->default(0);
            $table->decimal('total', 12, 2);
            $table->decimal('amount_paid', 12, 2)->default(0);
            $table->decimal('amount_due', 12, 2)->default(0);
            $table->decimal('change_given', 12, 2)->default(0);
            $table->decimal('change_residue', 12, 2)->default(0);
            $table->string('qr_code_token')->unique();
            $table->text('notes')->nullable();

            $table->uuid('session_id');
            $table->foreign('session_id')->references('id')->on('cash_register_sessions')->cascadeOnDelete();

            $table->uuid('shop_id');
            $table->foreign('shop_id')->references('id')->on('shops')->cascadeOnDelete();

            $table->uuid('customer_id')->nullable();
            $table->foreign('customer_id')->references('id')->on('customers')->nullOnDelete();

            $table->uuid('cashier_id');
            $table->foreign('cashier_id')->references('id')->on('users')->cascadeOnDelete();

            $table->uuid('company_id');
            $table->foreign('company_id')->references('id')->on('companies')->cascadeOnDelete();

            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
