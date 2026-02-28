import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import type { User } from '@/types';

type Props = {
    user: User;
};

export function UserHeaderDropdown({ user }: Props) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <UserInfo user={user} />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-56 rounded-lg" align="end" side="bottom">
                <UserMenuContent user={user} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
