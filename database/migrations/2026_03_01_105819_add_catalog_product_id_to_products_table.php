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
        Schema::table('products', function (Blueprint $table) {
            $table->uuid('catalog_product_id')->nullable()->after('company_id');
            $table->foreign('catalog_product_id')
                ->references('id')
                ->on('catalog_products')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['catalog_product_id']);
            $table->dropColumn('catalog_product_id');
        });
    }
};
