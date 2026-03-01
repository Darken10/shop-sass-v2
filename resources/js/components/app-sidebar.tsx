import { Link, usePage } from '@inertiajs/react';
import {
    Banknote,
    BookOpen,
    Building2,
    Calculator,
    Clock,
    Coins,
    CreditCard,
    FileBarChart,
    Fuel,
    LayoutGrid,
    LineChart,
    Package,
    PackageSearch,
    Percent,
    Receipt,
    Repeat2,
    Replace,
    Scale,
    ShoppingCart,
    Store,
    TrendingUp,
    Truck,
    Users,
    UserSquare,
    Wallet,
    Warehouse,
} from 'lucide-react';
import { index as companiesIndex } from '@/actions/App/Http/Controllers/Admin/CompanyController';
import { index as fuelLogsIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/FuelLogController';
import { index as chargesIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/LogisticChargeController';
import { index as shopsIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/ShopController';
import { index as movementsIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/StockMovementController';
import { index as suppliersIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/SupplierController';
import { index as supplyRequestsIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/SupplyRequestController';
import { index as transfersIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/TransferController';
import { index as vehiclesIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/VehicleController';
import { index as warehousesIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/WarehouseController';
import { index as stocksIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/WarehouseStockController';
import { index as productsIndex } from '@/actions/App/Http/Controllers/Admin/ProductController';
import { index as usersIndex } from '@/actions/App/Http/Controllers/Admin/UserController';
import { index as posIndex, sessions as sessionsIndex } from '@/actions/App/Http/Controllers/Pos/CashRegisterController';
import { index as customersIndex } from '@/actions/App/Http/Controllers/Pos/CustomerController';
import { index as promotionsIndex } from '@/actions/App/Http/Controllers/Pos/PromotionController';
import { index as salesIndex, credits as creditsIndex } from '@/actions/App/Http/Controllers/Pos/SaleController';
import { accounts as accountsPage, journal as journalPage, balanceSheet as balanceSheetPage, ledger as ledgerPage } from '@/actions/App/Http/Controllers/Finance/AccountingController';
import { index as expensesIndex } from '@/actions/App/Http/Controllers/Finance/ExpenseController';
import FinancialOverviewController from '@/actions/App/Http/Controllers/Finance/FinancialOverviewController';
import ProfitLossController from '@/actions/App/Http/Controllers/Finance/ProfitLossController';
import CashFlowController from '@/actions/App/Http/Controllers/Finance/CashFlowController';
import { index as reportsIndex } from '@/actions/App/Http/Controllers/Finance/FinancialReportController';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

const footerNavItems: NavItem[] = [
   /*  {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    }, */
];

type LogisticsItem = {
    title: string;
    href: string;
    icon: typeof Warehouse;
};

export function AppSidebar() {
    const { auth } = usePage<{ auth: { roles: string[]; permissions: string[] } }>().props;
    const { isCurrentUrl } = useCurrentUrl();
    const isAdmin = auth.roles?.some((r) => r === 'admin' || r === 'super admin') ?? false;
    const perms = auth.permissions ?? [];
    const has = (p: string) => isAdmin || perms.includes(p);

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        ...(has('read product')
            ? [
                  {
                      title: 'Produits',
                      href: productsIndex().url,
                      icon: Package,
                  } satisfies NavItem,
                  {
                      title: 'Catalogue',
                      href: '/admin/catalog',
                      icon: PackageSearch,
                  } satisfies NavItem,
              ]
            : []),
        ...(isAdmin
            ? [
                  {
                      title: 'Entreprises',
                      href: companiesIndex().url,
                      icon: Building2,
                  } satisfies NavItem,
                  {
                      title: 'Utilisateurs',
                      href: usersIndex().url,
                      icon: Users,
                  } satisfies NavItem,
              ]
            : []),
    ];

    // Logistics items (flat, visible per-permission)
    const logisticsItems: LogisticsItem[] = [
        ...(has('read warehouse') ? [{ title: 'Entrepôts', href: warehousesIndex().url, icon: Warehouse }] : []),
        ...(has('read shop') ? [{ title: 'Magasins', href: shopsIndex().url, icon: Store }] : []),
        ...(has('read stock') ? [{ title: 'Stocks', href: stocksIndex().url, icon: PackageSearch }] : []),
        ...(has('read stock movement') ? [{ title: 'Mouvements', href: movementsIndex().url, icon: Repeat2 }] : []),
        ...(has('read supply request') ? [{ title: 'Approvisionnements', href: supplyRequestsIndex().url, icon: Package }] : []),
        ...(has('read supplier') ? [{ title: 'Fournisseurs', href: suppliersIndex().url, icon: UserSquare }] : []),
        ...(has('read transfer') ? [{ title: 'Transferts', href: transfersIndex().url, icon: Replace }] : []),
        ...(has('read vehicle') ? [{ title: 'Engins', href: vehiclesIndex().url, icon: Truck }] : []),
        ...(has('read fuel log') ? [{ title: 'Carburant', href: fuelLogsIndex().url, icon: Fuel }] : []),
        ...(has('read logistic charge') ? [{ title: 'Manutention', href: chargesIndex().url, icon: Coins }] : []),
    ];

    const showLogistics = logisticsItems.length > 0;

    // POS items (visible per-permission)
    const posItems: LogisticsItem[] = [
        ...(has('open cash register') ? [{ title: 'Caisse', href: posIndex().url, icon: ShoppingCart }] : []),
        ...(has('read sale') ? [{ title: 'Ventes', href: salesIndex().url, icon: Banknote }] : []),
        ...(has('read sale') ? [{ title: 'Créances', href: creditsIndex().url, icon: CreditCard }] : []),
        ...(has('read customer') ? [{ title: 'Clients', href: customersIndex().url, icon: Users }] : []),
        ...(has('read promotion') ? [{ title: 'Promotions', href: promotionsIndex().url, icon: Percent }] : []),
        ...(has('read sale') ? [{ title: 'Historique caisses', href: sessionsIndex().url, icon: Clock }] : []),
    ];

    const showPos = posItems.length > 0;

    // Finance items (visible per-permission)
    const financeItems: LogisticsItem[] = [
        ...(has('view financial dashboard') ? [{ title: 'Vue d\'ensemble', href: FinancialOverviewController().url, icon: LineChart }] : []),
        ...(has('view financial dashboard') ? [{ title: 'Compte de résultat', href: ProfitLossController().url, icon: TrendingUp }] : []),
        ...(has('view financial dashboard') ? [{ title: 'Flux de trésorerie', href: CashFlowController().url, icon: Wallet }] : []),
        ...(has('read expense') ? [{ title: 'Dépenses', href: expensesIndex().url, icon: Receipt }] : []),
        ...(has('manage accounts') ? [{ title: 'Plan comptable', href: accountsPage().url, icon: BookOpen }] : []),
        ...(has('read journal entry') ? [{ title: 'Journal', href: journalPage().url, icon: Calculator }] : []),
        ...(has('read journal entry') ? [{ title: 'Grand livre', href: ledgerPage().url, icon: Coins }] : []),
        ...(has('manage accounts') ? [{ title: 'Bilan', href: balanceSheetPage().url, icon: Scale }] : []),
        ...(has('read financial report') ? [{ title: 'Rapports', href: reportsIndex().url, icon: FileBarChart }] : []),
    ];

    const showFinance = financeItems.length > 0;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />

                {showLogistics && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>Logistique</SidebarGroupLabel>
                        <SidebarMenu>
                            {logisticsItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={isCurrentUrl(item.href)}>
                                        <Link href={item.href} prefetch>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {showPos && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>Point de vente</SidebarGroupLabel>
                        <SidebarMenu>
                            {posItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={isCurrentUrl(item.href)}>
                                        <Link href={item.href} prefetch>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {showFinance && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>Finances</SidebarGroupLabel>
                        <SidebarMenu>
                            {financeItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={isCurrentUrl(item.href)}>
                                        <Link href={item.href} prefetch>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
