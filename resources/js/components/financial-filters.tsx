import { router } from '@inertiajs/react';
import { Calendar, Filter, Store, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type FilterOption = { id: string; name: string };

type Props = {
    filters: {
        start_date?: string;
        end_date?: string;
        shop_id?: string | null;
        warehouse_id?: string | null;
        group_by?: string;
    };
    shops?: FilterOption[];
    warehouses?: FilterOption[];
    baseUrl: string;
    showGroupBy?: boolean;
    showWarehouse?: boolean;
};

export default function FinancialFilters({ filters, shops = [], warehouses = [], baseUrl, showGroupBy = true, showWarehouse = true }: Props) {
    function applyFilters(newFilters: Partial<Props['filters']>) {
        const merged = { ...filters, ...newFilters };

        // Remove empty values
        const cleaned = Object.fromEntries(Object.entries(merged).filter(([, v]) => v !== null && v !== '' && v !== undefined));

        router.get(baseUrl, cleaned, { preserveState: true, preserveScroll: true });
    }

    return (
        <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <Input
                    type="date"
                    value={filters.start_date ?? ''}
                    onChange={(e) => applyFilters({ start_date: e.target.value })}
                    className="h-9 w-36"
                />
                <span className="text-sm text-muted-foreground">au</span>
                <Input
                    type="date"
                    value={filters.end_date ?? ''}
                    onChange={(e) => applyFilters({ end_date: e.target.value })}
                    className="h-9 w-36"
                />
            </div>

            {shops.length > 0 && (
                <Select
                    value={filters.shop_id ?? 'all'}
                    onValueChange={(v) => applyFilters({ shop_id: v === 'all' ? null : v })}
                >
                    <SelectTrigger className="h-9 w-44">
                        <Store className="mr-1 size-3.5 text-muted-foreground" />
                        <SelectValue placeholder="Toutes les boutiques" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes les boutiques</SelectItem>
                        {shops.map((shop) => (
                            <SelectItem key={shop.id} value={shop.id}>
                                {shop.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {showWarehouse && warehouses.length > 0 && (
                <Select
                    value={filters.warehouse_id ?? 'all'}
                    onValueChange={(v) => applyFilters({ warehouse_id: v === 'all' ? null : v })}
                >
                    <SelectTrigger className="h-9 w-44">
                        <Warehouse className="mr-1 size-3.5 text-muted-foreground" />
                        <SelectValue placeholder="Tous les entrepôts" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les entrepôts</SelectItem>
                        {warehouses.map((wh) => (
                            <SelectItem key={wh.id} value={wh.id}>
                                {wh.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {showGroupBy && (
                <Select
                    value={filters.group_by ?? 'day'}
                    onValueChange={(v) => applyFilters({ group_by: v })}
                >
                    <SelectTrigger className="h-9 w-36">
                        <Filter className="mr-1 size-3.5 text-muted-foreground" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="day">Par jour</SelectItem>
                        <SelectItem value="week">Par semaine</SelectItem>
                        <SelectItem value="month">Par mois</SelectItem>
                    </SelectContent>
                </Select>
            )}
        </div>
    );
}
