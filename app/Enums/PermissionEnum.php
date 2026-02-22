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

    public static function all(): array
    {
        return array_map(fn (self $permission) => $permission->value, self::cases());
    }
}
