<?php

namespace App\Http\Controllers\Admin\Logistics;

use App\Data\Logistics\TransferData;
use App\Enums\TransferStatus;
use App\Enums\TransferType;
use App\Http\Controllers\Controller;
use App\Models\Logistics\Shop;
use App\Models\Logistics\Transfer;
use App\Models\Logistics\TransferItem;
use App\Models\Logistics\Warehouse;
use App\Models\Product\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TransferController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Transfer::class);

        $transfers = Transfer::query()
            ->with([
                'sourceWarehouse:id,name,code',
                'destinationWarehouse:id,name,code',
                'destinationShop:id,name,code',
                'createdBy:id,name',
            ])
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/logistics/transfers/index', [
            'transfers' => $transfers,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Transfer::class);

        return Inertia::render('admin/logistics/transfers/create', [
            'warehouses' => Warehouse::query()->select(['id', 'name', 'code'])->orderBy('name')->get(),
            'shops' => Shop::query()->select(['id', 'name', 'code'])->orderBy('name')->get(),
            'products' => Product::query()->select(['id', 'name', 'code'])->orderBy('name')->get(),
            'transferTypes' => TransferType::cases(),
        ]);
    }

    public function store(TransferData $data): RedirectResponse
    {
        $this->authorize('create', Transfer::class);

        $transfer = Transfer::create([
            'reference' => 'TRF-'.strtoupper(Str::random(8)),
            'type' => $data->type,
            'status' => TransferStatus::Pending,
            'notes' => $data->notes,
            'source_warehouse_id' => $data->source_warehouse_id,
            'destination_warehouse_id' => $data->destination_warehouse_id,
            'destination_shop_id' => $data->destination_shop_id,
            'vehicle_id' => $data->vehicle_id,
            'created_by' => auth()->id(),
        ]);

        foreach ($data->items as $item) {
            TransferItem::create([
                'product_id' => $item['product_id'],
                'quantity_requested' => $item['quantity_requested'],
                'transfer_id' => $transfer->id,
            ]);
        }

        return to_route('admin.logistics.transfers.show', $transfer)
            ->with('success', 'Transfert créé avec succès.');
    }

    public function show(Transfer $transfer): Response
    {
        $this->authorize('view', $transfer);

        $transfer->load([
            'sourceWarehouse:id,name,code',
            'destinationWarehouse:id,name,code',
            'destinationShop:id,name,code',
            'vehicle:id,name,registration_number',
            'approvedBy:id,name',
            'createdBy:id,name',
            'items.product:id,name,code',
        ]);

        return Inertia::render('admin/logistics/transfers/show', [
            'transfer' => $transfer,
        ]);
    }

    public function approve(Transfer $transfer): RedirectResponse
    {
        $this->authorize('approve', $transfer);

        $transfer->update([
            'status' => TransferStatus::Approved,
            'approved_at' => now(),
            'approved_by' => auth()->id(),
        ]);

        return back()->with('success', 'Transfert approuvé avec succès.');
    }

    public function ship(Transfer $transfer): RedirectResponse
    {
        $this->authorize('update', $transfer);

        $transfer->update([
            'status' => TransferStatus::InTransit,
            'shipped_at' => now(),
        ]);

        return back()->with('success', 'Transfert expédié avec succès.');
    }

    public function deliver(Transfer $transfer): RedirectResponse
    {
        $this->authorize('update', $transfer);

        $transfer->update([
            'status' => TransferStatus::Delivered,
            'delivered_at' => now(),
        ]);

        return back()->with('success', 'Transfert livré avec succès.');
    }

    public function reject(Transfer $transfer): RedirectResponse
    {
        $this->authorize('approve', $transfer);

        $transfer->update([
            'status' => TransferStatus::Rejected,
        ]);

        return back()->with('success', 'Transfert rejeté.');
    }
}
