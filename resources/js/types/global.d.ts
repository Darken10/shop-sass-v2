import type { Auth, NotificationsSharedData } from '@/types';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            notifications: NotificationsSharedData;
            [key: string]: unknown;
        };
    }
}
