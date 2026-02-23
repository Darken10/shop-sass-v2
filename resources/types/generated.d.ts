declare namespace App.Data {
export type CompanyData = {
name: string;
email: string | null;
phone: string | null;
address: string | null;
type: App.Enums.CompanyTypeEnum;
status: App.Enums.CompanyStatusEnum;
city: string | null;
state: string | null;
postal_code: string | null;
country: string | null;
website: string | null;
description: string | null;
logo: string | null;
};
}
declare namespace App.Data.Logistics {
export type FuelLogData = {
quantity_liters: number;
cost: number;
odometer_reading: number | null;
fueled_at: string;
notes: string | null;
vehicle_id: string;
stock_movement_id: string | null;
};
export type LogisticChargeData = {
label: string;
type: App.Enums.LogisticChargeType;
amount: number;
notes: string | null;
stock_movement_id: string | null;
supply_request_id: string | null;
};
export type ShopData = {
name: string;
code: string;
address: string | null;
city: string | null;
phone: string | null;
status: App.Enums.ShopStatus;
description: string | null;
};
export type StockMovementData = {
type: App.Enums.StockMovementType;
quantity: number;
reason: string | null;
notes: string | null;
product_id: string;
source_warehouse_id: string | null;
destination_warehouse_id: string | null;
supply_request_id: string | null;
supplier_id: string | null;
source_shop_id: string | null;
destination_shop_id: string | null;
transfer_id: string | null;
};
export type SupplierData = {
name: string;
code: string;
contact_name: string | null;
email: string | null;
phone: string | null;
address: string | null;
city: string | null;
notes: string | null;
is_active: boolean;
};
export type SupplyRequestData = {
notes: string | null;
source_warehouse_id: string;
destination_warehouse_id: string | null;
items: Array<App.Data.Logistics.SupplyRequestItemData>;
};
export type SupplyRequestItemData = {
product_id: string;
quantity_requested: number;
};
export type TransferData = {
type: App.Enums.TransferType;
notes: string | null;
source_warehouse_id: string;
destination_warehouse_id: string | null;
destination_shop_id: string | null;
vehicle_id: string | null;
items: { [key: number]: any };
};
export type VehicleData = {
name: string;
type: App.Enums.VehicleType;
registration_number: string;
load_capacity: number | null;
average_consumption: number | null;
status: App.Enums.VehicleStatus;
notes: string | null;
};
export type WarehouseData = {
name: string;
code: string;
address: string | null;
city: string | null;
phone: string | null;
status: App.Enums.WarehouseStatus;
description: string | null;
};
export type WarehouseStockData = {
quantity: number;
stock_alert: number | null;
product_id: string;
warehouse_id: string;
};
}
declare namespace App.Enums {
export enum CompanyStatusEnum { Active = 'active', Inactive = 'inactive', Suspended = 'suspended' };
export enum CompanyTypeEnum { ALIMENTATION = 'alimentation', BOUTIQUE = 'boutique', RESTAURANT = 'restaurant', PHARMACY = 'pharmacy', SERVICE = 'service' };
export enum LogisticChargeType { Fuel = 'fuel', Handling = 'handling', Loading = 'loading', Unloading = 'unloading', Toll = 'toll', Packaging = 'packaging', Insurance = 'insurance', Other = 'other' };
export enum PermissionEnum { CreateProduct = 'create product', ReadProduct = 'read product', UpdateProduct = 'update product', DeleteProduct = 'delete product', CreateProductCategory = 'create product category', ReadProductCategory = 'read product category', UpdateProductCategory = 'update product category', DeleteProductCategory = 'delete product category', CreateProductTag = 'create product tag', ReadProductTag = 'read product tag', UpdateProductTag = 'update product tag', DeleteProductTag = 'delete product tag', CreateOrder = 'create order', ReadOrder = 'read order', UpdateOrder = 'update order', DeleteOrder = 'delete order', ApproveOrder = 'approve order', CreateUser = 'create user', ReadUser = 'read user', UpdateUser = 'update user', DeleteUser = 'delete user', ManageCash = 'manage cash', ViewTransactions = 'view transactions', ManageInventory = 'manage inventory', ViewInventory = 'view inventory', ManageDelivery = 'manage delivery', ViewDelivery = 'view delivery', ViewReports = 'view reports', ViewSales = 'view sales', CreateWarehouse = 'create warehouse', ReadWarehouse = 'read warehouse', UpdateWarehouse = 'update warehouse', DeleteWarehouse = 'delete warehouse', CreateShop = 'create shop', ReadShop = 'read shop', UpdateShop = 'update shop', DeleteShop = 'delete shop', CreateSupplier = 'create supplier', ReadSupplier = 'read supplier', UpdateSupplier = 'update supplier', DeleteSupplier = 'delete supplier', CreateStock = 'create stock', ReadStock = 'read stock', UpdateStock = 'update stock', DeleteStock = 'delete stock', CreateStockMovement = 'create stock movement', ReadStockMovement = 'read stock movement', CreateSupplyRequest = 'create supply request', ReadSupplyRequest = 'read supply request', UpdateSupplyRequest = 'update supply request', ApproveSupplyRequest = 'approve supply request', CreateTransfer = 'create transfer', ReadTransfer = 'read transfer', UpdateTransfer = 'update transfer', ApproveTransfer = 'approve transfer', CreateVehicle = 'create vehicle', ReadVehicle = 'read vehicle', UpdateVehicle = 'update vehicle', DeleteVehicle = 'delete vehicle', CreateFuelLog = 'create fuel log', ReadFuelLog = 'read fuel log', CreateLogisticCharge = 'create logistic charge', ReadLogisticCharge = 'read logistic charge' };
export enum ProductStatus { ACTIVE = 'active', INACTIVE = 'inactive' };
export enum ProductUnity { PIECE = 'piece', KILOGRAM = 'kilogram', LITER = 'liter', METER = 'meter', SQUARE_METER = 'square_meter', CUBIC_METER = 'cubic_meter', PACK = 'pack', BOX = 'box' };
export enum RoleEnum { SuperAdmin = 'super admin', Admin = 'admin', Gestionnaire = 'gestionnaire', Caissier = 'caissier', Logisticien = 'logisticien', Magasinier = 'magasinier' };
export enum ShopStatus { Active = 'active', Inactive = 'inactive', UnderMaintenance = 'under_maintenance' };
export enum StockMovementType { PurchaseEntry = 'purchase_entry', SupplierReturn = 'supplier_return', WarehouseToShop = 'warehouse_to_shop', WarehouseToWarehouse = 'warehouse_to_warehouse', ShopToCustomer = 'shop_to_customer', Loss = 'loss', Adjustment = 'adjustment' };
export enum SupplyRequestStatus { Pending = 'pending', Approved = 'approved', InTransit = 'in_transit', Delivered = 'delivered', Rejected = 'rejected', Cancelled = 'cancelled' };
export enum TransferStatus { Pending = 'pending', Approved = 'approved', InTransit = 'in_transit', Delivered = 'delivered', Rejected = 'rejected', Cancelled = 'cancelled' };
export enum TransferType { WarehouseToShop = 'warehouse_to_shop', WarehouseToWarehouse = 'warehouse_to_warehouse' };
export enum VehicleStatus { Active = 'active', InMaintenance = 'in_maintenance', OutOfService = 'out_of_service' };
export enum VehicleType { Truck = 'truck', Tricycle = 'tricycle', Van = 'van', Pickup = 'pickup', Other = 'other' };
export enum WarehouseStatus { Active = 'active', Inactive = 'inactive', UnderMaintenance = 'under_maintenance' };
}
