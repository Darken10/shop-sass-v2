import { Link, usePage } from '@inertiajs/react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import AppLogoIcon from '@/components/app-logo-icon';
import { NotificationBell } from '@/components/notification-bell';
import { UserHeaderDropdown } from '@/components/user-header-dropdown';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth } = usePage().props;

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex w-full items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                {/* Logo visible on mobile only */}
                <Link href={dashboard()} className="flex items-center md:hidden">
                    <AppLogoIcon className="size-6 text-foreground" />
                </Link>
                {/* Breadcrumbs hidden on mobile */}
                <div className="hidden md:flex">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
                {/* Right actions */}
                <div className="ml-auto flex items-center gap-1">
                    <NotificationBell />
                    <div className="md:hidden">
                        <UserHeaderDropdown user={auth.user} />
                    </div>
                </div>
            </div>
        </header>
    );
}
