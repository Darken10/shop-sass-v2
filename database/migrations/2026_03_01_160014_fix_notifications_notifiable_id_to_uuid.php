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
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex(['notifiable_type', 'notifiable_id']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->char('notifiable_id', 36)->change();
            $table->index(['notifiable_type', 'notifiable_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex(['notifiable_type', 'notifiable_id']);
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->unsignedBigInteger('notifiable_id')->change();
            $table->index(['notifiable_type', 'notifiable_id']);
        });
    }
};
