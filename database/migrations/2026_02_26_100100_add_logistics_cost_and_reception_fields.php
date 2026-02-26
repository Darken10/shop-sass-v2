<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Transfers: cost tracking + reception
        Schema::table('transfers', function (Blueprint $table) {
            $table->boolean('company_bears_costs')->default(false)->after('notes');
            $table->string('driver_name')->nullable()->after('company_bears_costs');
            $table->string('driver_phone', 50)->nullable()->after('driver_name');
            $table->timestamp('received_at')->nullable()->after('delivered_at');
            $table->uuid('received_by')->nullable()->after('approved_by');
            $table->foreign('received_by')->references('id')->on('users')->nullOnDelete();
        });

        // Transfer items: reception quantities + discrepancy notes
        Schema::table('transfer_items', function (Blueprint $table) {
            $table->integer('quantity_received')->nullable()->after('quantity_delivered');
            $table->text('discrepancy_note')->nullable()->after('quantity_received');
        });

        // Supply requests: cost tracking + reception
        Schema::table('supply_requests', function (Blueprint $table) {
            $table->boolean('company_bears_costs')->default(false)->after('notes');
            $table->string('driver_name')->nullable()->after('company_bears_costs');
            $table->string('driver_phone', 50)->nullable()->after('driver_name');
            $table->timestamp('received_at')->nullable()->after('delivered_at');
            $table->uuid('received_by')->nullable()->after('approved_by');
            $table->foreign('received_by')->references('id')->on('users')->nullOnDelete();
        });

        // Supply request items: reception quantities + discrepancy notes
        Schema::table('supply_request_items', function (Blueprint $table) {
            $table->integer('quantity_received')->nullable()->after('quantity_delivered');
            $table->text('discrepancy_note')->nullable()->after('quantity_received');
        });

        // Logistic charges: link to transfers too
        Schema::table('logistic_charges', function (Blueprint $table) {
            $table->uuid('transfer_id')->nullable()->after('supply_request_id');
            $table->foreign('transfer_id')->references('id')->on('transfers')->nullOnDelete();
        });

        // Fuel logs: link to transfers too
        Schema::table('fuel_logs', function (Blueprint $table) {
            $table->uuid('transfer_id')->nullable()->after('stock_movement_id');
            $table->foreign('transfer_id')->references('id')->on('transfers')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('fuel_logs', function (Blueprint $table) {
            $table->dropForeign(['transfer_id']);
            $table->dropColumn('transfer_id');
        });

        Schema::table('logistic_charges', function (Blueprint $table) {
            $table->dropForeign(['transfer_id']);
            $table->dropColumn('transfer_id');
        });

        Schema::table('supply_request_items', function (Blueprint $table) {
            $table->dropColumn(['quantity_received', 'discrepancy_note']);
        });

        Schema::table('supply_requests', function (Blueprint $table) {
            $table->dropForeign(['received_by']);
            $table->dropColumn(['company_bears_costs', 'driver_name', 'driver_phone', 'received_at', 'received_by']);
        });

        Schema::table('transfer_items', function (Blueprint $table) {
            $table->dropColumn(['quantity_received', 'discrepancy_note']);
        });

        Schema::table('transfers', function (Blueprint $table) {
            $table->dropForeign(['received_by']);
            $table->dropColumn(['company_bears_costs', 'driver_name', 'driver_phone', 'received_at', 'received_by']);
        });
    }
};
