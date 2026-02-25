<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('dashboard returns all expected props', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->has('kpis', fn ($kpi) => $kpi
                ->has('todaySalesCount')
                ->has('todaySalesTotal')
                ->has('monthSalesCount')
                ->has('monthSalesTotal')
                ->has('monthGrowth')
                ->has('openSessions')
                ->has('activeProducts')
                ->has('totalCustomers')
                ->has('unpaidAmount')
                ->has('pendingSupplyRequests')
                ->has('pendingTransfers')
                ->has('totalShops')
                ->has('totalWarehouses')
                ->has('totalCategories')
            )
            ->has('revenueByDay')
            ->has('paymentBreakdown')
            ->has('topProducts')
            ->has('salesByShop')
            ->has('lowStockProducts')
            ->has('recentSales')
        );
});
