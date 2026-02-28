<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
                'roles' => $request->user()?->getRoleNames() ?? [],
                'permissions' => $request->user()?->getAllPermissions()->pluck('name')->toArray() ?? [],
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'notifications' => function () use ($request) {
                $user = $request->user();
                if (! $user) {
                    return ['unread_count' => 0, 'recent' => []];
                }

                return [
                    'unread_count' => $user->unreadNotifications()->count(),
                    'recent' => $user->notifications()->latest()->limit(15)->get()->map(fn ($n) => [
                        'id' => $n->id,
                        'type' => class_basename($n->type),
                        'data' => $n->data,
                        'read_at' => $n->read_at?->toISOString(),
                        'created_at' => $n->created_at->toISOString(),
                    ]),
                ];
            },
        ];
    }
}
