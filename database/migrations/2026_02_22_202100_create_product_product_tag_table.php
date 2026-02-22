<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_product_tag', function (Blueprint $table) {
            $table->uuid('product_id');
            $table->uuid('product_tag_id');

            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
            $table->foreign('product_tag_id')->references('id')->on('product_tags')->cascadeOnDelete();

            $table->primary(['product_id', 'product_tag_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_product_tag');
    }
};
