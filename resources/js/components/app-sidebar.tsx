import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Building2,
    ChevronRight,
    Coins,
    Folder,
    Fuel,
    LayoutGrid,
    Package,
    PackageSearch,
    Repeat2,
    Truck,
    Users,
    Warehouse,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { index as companiesIndex } from '@/actions/App/Http/Controllers/Admin/CompanyController';
import { index as productsIndex } from '@/actions/App/Http/Controllers/Admin/ProductController';
import { index as usersIndex } from '@/actions/App/Http/Controllers/Admin/UserController';
import { index as warehousesIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/WarehouseController';
import { index as stocksIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/WarehouseStockController';
import { index as movementsIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/StockMovementController';
import { index as supplyRequestsIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/SupplyRequestController';
import { index as vehiclesIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/VehicleController';
import { index as fuelLogsIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/FuelLogController';
import { index as chargesIndex } from '@/actions/App/Http/Controllers/Admin/Logistics/LogisticChargeController';
import { dashboard } from '@/routes';

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

type LogisticsSubItem = {
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

    // Logistics sub-items (visible per-permission)
    const logisticsItems: LogisticsSubItem[] = [
        ...(has('read warehouse') ? [{ title: 'Entrepôts', href: warehousesIndex().url, icon: Warehouse }] : []),
        ...(has('read stock') ? [{ title: 'Stocks', href: stocksIndex().url, icon: PackageSearch }] : []),
        ...(has('read stock movement') ? [{ title: 'Mouvements', href: movementsIndex().url, icon: Repeat2 }] : []),
        ...(has('read supply request') ? [{ title: 'Approvisionnements', href: supplyRequestsIndex().url, icon: Package }] : []),
        ...(has('read vehicle') ? [{ title: 'Engins', href: vehiclesIndex().url, icon: Truck }] : []),
        ...(has('read fuel log') ? [{ title: 'Carburant', href: fuelLogsIndex().url, icon: Fuel }] : []),
        ...(has('read logistic charge') ? [{ title: 'Charges', href: chargesIndex().url, icon: Coins }] : []),
    ];

    const showLogistics = logisticsItems.length > 0;
    const isLogisticsActive = logisticsItems.some((item) => isCurrentUrl(item.href));

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
                            <Collapsible asChild defaultOpen={isLogisticsActive} className="group/collapsible">
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton tooltip="Logistique" isActive={isLogisticsActive}>
                                            <Truck />
                                            <span>Logistique</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {logisticsItems.map((item) => (
                                                <SidebarMenuSubItem key={item.title}>
                                                    <SidebarMenuSubButton asChild isActive={isCurrentUrl(item.href)}>
                                                        <Link href={item.href} prefetch>
                                                            <item.icon />
                                                            <span>{item.title}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
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
