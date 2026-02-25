<?php

namespace App\Enums;

enum PermissionEnum: string
{
    // Produits
    case CreateProduct = 'create product';
    case ReadProduct = 'read product';
    case UpdateProduct = 'update product';
    case DeleteProduct = 'delete product';

    // Catégories de produits
    case CreateProductCategory = 'create product category';
    case ReadProductCategory = 'read product category';
    case UpdateProductCategory = 'update product category';
    case DeleteProductCategory = 'delete product category';

    // Tags de produits
    case CreateProductTag = 'create product tag';
    case ReadProductTag = 'read product tag';
    case UpdateProductTag = 'update product tag';
    case DeleteProductTag = 'delete product tag';

    // Commandes
    case CreateOrder = 'create order';
    case ReadOrder = 'read order';
    case UpdateOrder = 'update order';
    case DeleteOrder = 'delete order';
    case ApproveOrder = 'approve order';

    // Utilisateurs
    case CreateUser = 'create user';
    case ReadUser = 'read user';
    case UpdateUser = 'update user';
    case DeleteUser = 'delete user';

    // Caisse
    case ManageCash = 'manage cash';
    case ViewTransactions = 'view transactions';

    // Inventaire
    case ManageInventory = 'manage inventory';
    case ViewInventory = 'view inventory';

    // Livraison
    case ManageDelivery = 'manage delivery';
    case ViewDelivery = 'view delivery';

    // Rapports
    case ViewReports = 'view reports';
    case ViewSales = 'view sales';

    // Entrepôts
    case CreateWarehouse = 'create warehouse';
    case ReadWarehouse = 'read warehouse';
    case UpdateWarehouse = 'update warehouse';
    case DeleteWarehouse = 'delete warehouse';

    // Magasins / Points de vente
    case CreateShop = 'create shop';
    case ReadShop = 'read shop';
    case UpdateShop = 'update shop';
    case DeleteShop = 'delete shop';

    // Fournisseurs
    case CreateSupplier = 'create supplier';
    case ReadSupplier = 'read supplier';
    case UpdateSupplier = 'update supplier';
    case DeleteSupplier = 'delete supplier';

    // Stocks
    case CreateStock = 'create stock';
    case ReadStock = 'read stock';
    case UpdateStock = 'update stock';
    case DeleteStock = 'delete stock';

    // Mouvements de stock
    case CreateStockMovement = 'create stock movement';
    case ReadStockMovement = 'read stock movement';

    // Demandes d'approvisionnement
    case CreateSupplyRequest = 'create supply request';
    case ReadSupplyRequest = 'read supply request';
    case UpdateSupplyRequest = 'update supply request';
    case ApproveSupplyRequest = 'approve supply request';

    // Transferts
    case CreateTransfer = 'create transfer';
    case ReadTransfer = 'read transfer';
    case UpdateTransfer = 'update transfer';
    case ApproveTransfer = 'approve transfer';

    // Engins / Véhicules
    case CreateVehicle = 'create vehicle';
    case ReadVehicle = 'read vehicle';
    case UpdateVehicle = 'update vehicle';
    case DeleteVehicle = 'delete vehicle';

    // Carburant
    case CreateFuelLog = 'create fuel log';
    case ReadFuelLog = 'read fuel log';

    // Manutention / Charges logistiques
    case CreateLogisticCharge = 'create logistic charge';
    case ReadLogisticCharge = 'read logistic charge';

    // Point de vente (POS)
    case OpenCashRegister = 'open cash register';
    case CloseCashRegister = 'close cash register';
    case CreateSale = 'create sale';
    case ReadSale = 'read sale';
    case CancelSale = 'cancel sale';
    case ProcessCreditPayment = 'process credit payment';

    // Clients
    case CreateCustomer = 'create customer';
    case ReadCustomer = 'read customer';
    case UpdateCustomer = 'update customer';
    case DeleteCustomer = 'delete customer';

    // Promotions
    case CreatePromotion = 'create promotion';
    case ReadPromotion = 'read promotion';
    case UpdatePromotion = 'update promotion';
    case DeletePromotion = 'delete promotion';

    public static function all(): array
    {
        return array_map(fn (self $permission) => $permission->value, self::cases());
    }
}
