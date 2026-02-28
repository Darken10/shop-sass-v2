import { router, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AppNotification, SharedPageProps } from '@/types';

function timeAgo(isoDate: string): string {
    const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
    if (diff < 60) return 'à l\'instant';
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
    return `il y a ${Math.floor(diff / 86400)} j`;
}

export function NotificationBell() {
    const { notifications } = usePage<SharedPageProps>().props;
    const unreadCount = notifications?.unread_count ?? 0;
    const items: AppNotification[] = notifications?.recent ?? [];

    function markRead(id: string) {
        router.post(`/notifications/${id}/mark-read`, {}, { preserveScroll: true });
    }

    function markAllRead() {
        router.post('/notifications/mark-all-read', {}, { preserveScroll: true });
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                    <Bell className="size-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto" align="end" side="bottom">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                            onClick={markAllRead}
                        >
                            Tout marquer comme lu
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {items.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                        Aucune notification
                    </div>
                ) : (
                    <DropdownMenuGroup>
                        {items.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                                onClick={() => {
                                    if (!notification.read_at) {
                                        markRead(notification.id);
                                    }
                                }}
                            >
                                <div className="flex w-full items-start gap-2">
                                    {!notification.read_at && (
                                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                                    )}
                                    <div className={`flex-1 ${notification.read_at ? 'pl-4' : ''}`}>
                                        <p className="text-sm font-medium leading-snug">
                                            {notification.data.title ?? notification.type}
                                        </p>
                                        {notification.data.message && (
                                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                                                {notification.data.message}
                                            </p>
                                        )}
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {timeAgo(notification.created_at)}
                                        </p>
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuGroup>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
