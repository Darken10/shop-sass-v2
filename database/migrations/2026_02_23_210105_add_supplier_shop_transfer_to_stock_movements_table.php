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
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->uuid('supplier_id')->nullable()->after('supply_request_id');
            $table->foreign('supplier_id')->references('id')->on('suppliers')->nullOnDelete();

            $table->uuid('source_shop_id')->nullable()->after('supplier_id');
            $table->foreign('source_shop_id')->references('id')->on('shops')->nullOnDelete();

            $table->uuid('destination_shop_id')->nullable()->after('source_shop_id');
            $table->foreign('destination_shop_id')->references('id')->on('shops')->nullOnDelete();

            $table->uuid('transfer_id')->nullable()->after('destination_shop_id');
            $table->foreign('transfer_id')->references('id')->on('transfers')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropForeign(['transfer_id']);
            $table->dropColumn('transfer_id');
            $table->dropForeign(['destination_shop_id']);
            $table->dropColumn('destination_shop_id');
            $table->dropForeign(['source_shop_id']);
            $table->dropColumn('source_shop_id');
            $table->dropForeign(['supplier_id']);
            $table->dropColumn('supplier_id');
        });
    }
};
