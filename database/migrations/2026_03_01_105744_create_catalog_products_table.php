<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catalog_products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('barcode')->unique();
            $table->string('name');
            $table->string('brand')->nullable();
            $table->text('description')->nullable();
            $table->string('image_url')->nullable();
            $table->string('category')->nullable();
            $table->string('unity')->default('piece');
            $table->string('source')->default('manual')->comment('manual, open_food_facts, …');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_products');
    }
};
