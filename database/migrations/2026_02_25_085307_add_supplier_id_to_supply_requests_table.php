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
        Schema::table('supply_requests', function (Blueprint $table) {
            $table->uuid('supplier_id')->nullable()->after('destination_warehouse_id');
            $table->foreign('supplier_id')->references('id')->on('suppliers')->nullOnDelete();

            $table->dropForeign(['source_warehouse_id']);
            $table->uuid('source_warehouse_id')->nullable()->change();
            $table->foreign('source_warehouse_id')->references('id')->on('warehouses')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('supply_requests', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
            $table->dropColumn('supplier_id');

            $table->dropForeign(['source_warehouse_id']);
            $table->uuid('source_warehouse_id')->nullable(false)->change();
            $table->foreign('source_warehouse_id')->references('id')->on('warehouses')->cascadeOnDelete();
        });
    }
};
