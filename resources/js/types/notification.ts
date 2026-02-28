import type { Auth } from './auth';

export type AppNotification = {
    id: string;
    type: string;
    data: {
        title?: string;
        message?: string;
        [key: string]: unknown;
    };
    read_at: string | null;
    created_at: string;
};

export type NotificationsSharedData = {
    unread_count: number;
    recent: AppNotification[];
};

export type SharedPageProps = {
    name: string;
    auth: Auth;
    sidebarOpen: boolean;
    notifications: NotificationsSharedData;
    [key: string]: unknown;
};
