<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_register_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('session_number')->unique();
            $table->string('status')->default('open');
            $table->decimal('opening_amount', 12, 2)->default(0);
            $table->decimal('closing_amount', 12, 2)->nullable();
            $table->decimal('total_sales', 12, 2)->default(0);
            $table->decimal('total_cash', 12, 2)->default(0);
            $table->decimal('total_mobile_money', 12, 2)->default(0);
            $table->decimal('total_bank_card', 12, 2)->default(0);
            $table->decimal('total_bank_transfer', 12, 2)->default(0);
            $table->decimal('total_credit', 12, 2)->default(0);
            $table->text('closing_notes')->nullable();
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();

            $table->uuid('shop_id');
            $table->foreign('shop_id')->references('id')->on('shops')->cascadeOnDelete();

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
        Schema::dropIfExists('cash_register_sessions');
    }
};
