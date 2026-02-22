import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Building2, Folder, LayoutGrid, Package, Users } from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';
import { index as companiesIndex } from '@/actions/App/Http/Controllers/Admin/CompanyController';
import { index as productsIndex } from '@/actions/App/Http/Controllers/Admin/ProductController';
import { index as usersIndex } from '@/actions/App/Http/Controllers/Admin/UserController';
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

export function AppSidebar() {
    const { auth } = usePage<{ auth: { roles: string[]; permissions: string[] } }>().props;
    const isAdmin = auth.roles?.some((r) => r === 'admin' || r === 'super admin') ?? false;
    const canReadProducts = auth.permissions?.includes('read product') ?? false;

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        ...(canReadProducts
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
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
