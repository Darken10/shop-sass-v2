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
declare namespace App.Enums {
export enum CompanyStatusEnum { Active = 'active', Inactive = 'inactive', Suspended = 'suspended' };
export enum CompanyTypeEnum { ALIMENTATION = 'alimentation', BOUTIQUE = 'boutique', RESTAURANT = 'restaurant', PHARMACY = 'pharmacy', SERVICE = 'service' };
export enum PermissionEnum { CreateProduct = 'create product', ReadProduct = 'read product', UpdateProduct = 'update product', DeleteProduct = 'delete product', CreateOrder = 'create order', ReadOrder = 'read order', UpdateOrder = 'update order', DeleteOrder = 'delete order', ApproveOrder = 'approve order', CreateUser = 'create user', ReadUser = 'read user', UpdateUser = 'update user', DeleteUser = 'delete user', ManageCash = 'manage cash', ViewTransactions = 'view transactions', ManageInventory = 'manage inventory', ViewInventory = 'view inventory', ManageDelivery = 'manage delivery', ViewDelivery = 'view delivery', ViewReports = 'view reports', ViewSales = 'view sales' };
export enum RoleEnum { SuperAdmin = 'super admin', Admin = 'admin', Gestionnaire = 'gestionnaire', Caissier = 'caissier', Logisticien = 'logisticien', Magasinier = 'magasinier' };
}
