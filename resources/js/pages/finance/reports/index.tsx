import { Head, Link, router } from '@inertiajs/react';
import { Eye, FileBarChart, Plus, Trash2 } from 'lucide-react';
import { create, destroy, show } from '@/actions/App/Http/Controllers/Finance/FinancialReportController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Report = {
    id: string;
    title: string;
    type: string;
    period_start: string;
    period_end: string;
    status: string;
    generator: { id: string; name: string } | null;
    created_at: string;
};

type Paginated = {
    data: Report[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
};

type ReportType = { value: string; label: string };
type Props = { reports: Paginated; reportTypes: ReportType[] };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Finance', href: '/finance' },
    { title: 'Rapports', href: '/finance/reports' },
];

export default function ReportsIndex({ reports, reportTypes }: Props) {
    function handleDelete(report: Report) {
        if (!confirm(`Supprimer le rapport "${report.title}" ?`)) return;
        router.delete(destroy(report.id).url);
    }

    const typeLabel = (val: string) => reportTypes.find((t) => t.value === val)?.label ?? val;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Finance — Rapports" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg border bg-muted">
                            <FileBarChart className="size-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Rapports financiers</h1>
                            <p className="text-sm text-muted-foreground">{reports.total} rapport(s) généré(s)</p>
                        </div>
                    </div>
                    <Button asChild size="sm">
                        <Link href={create().url}>
                            <Plus className="size-4" />
                            Nouveau rapport
                        </Link>
                    </Button>
                </div>

                <Separator />

                {/* Table */}
                {reports.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <FileBarChart className="size-10 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Aucun rapport généré</p>
                        <Button asChild variant="outline" size="sm" className="mt-4">
                            <Link href={create().url}>Générer un rapport</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Titre</th>
                                    <th className="px-4 py-3 font-medium">Type</th>
                                    <th className="px-4 py-3 font-medium">Période</th>
                                    <th className="px-4 py-3 font-medium">Généré par</th>
                                    <th className="px-4 py-3 font-medium">Date</th>
                                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {reports.data.map((report) => (
                                    <tr key={report.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium">{report.title}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant="secondary">{typeLabel(report.type)}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            {new Date(report.period_start).toLocaleDateString('fr-FR')} — {new Date(report.period_end).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="px-4 py-3">{report.generator?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-xs">{new Date(report.created_at).toLocaleString('fr-FR')}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button asChild variant="ghost" size="icon" className="size-8">
                                                    <Link href={show(report.id).url}>
                                                        <Eye className="size-4" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => handleDelete(report)}>
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {reports.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {reports.links.map((link) => (
                            <Button
                                asChild={!!link.url}
                                key={link.label}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                            >
                                {link.url ? (
                                    <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                                ) : (
                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                )}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
