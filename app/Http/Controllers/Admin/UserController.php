<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company\Company;
use App\Models\User;
use App\Notifications\AccountActivationNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $query = User::query()
            ->with(['company:id,name', 'roles:id,name'])
            ->latest();

        // Admin can only see users from their company
        if ($request->user()->isAdmin() && ! $request->user()->isSuperAdmin()) {
            $query->where('company_id', $request->user()->company_id);
        }

        $users = $query->paginate(15)->withQueryString();

        return Inertia::render('admin/users/index', [
            'users' => $users,
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize('create', User::class);

        $authUser = $request->user();

        return Inertia::render('admin/users/create', [
            'roles' => $authUser->assignableRoles(),
            'companies' => $this->getCompaniesForUser($authUser),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', User::class);

        $authUser = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)],
            'role' => ['required', 'string', Rule::in($authUser->assignableRoles())],
            'company_id' => [
                $authUser->isSuperAdmin() ? 'required' : 'nullable',
                'string',
                Rule::exists(Company::class, 'id'),
            ],
        ]);

        $companyId = $authUser->isSuperAdmin()
            ? $validated['company_id']
            : $authUser->company_id;

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => null,
            'company_id' => $companyId,
        ]);

        $user->assignRole($validated['role']);
        $user->notify(new AccountActivationNotification);

        return to_route('admin.users.index')
            ->with('success', "Utilisateur créé. Un email d'activation a été envoyé.");
    }

    public function edit(Request $request, User $user): Response
    {
        $this->authorize('update', $user);

        $authUser = $request->user();

        return Inertia::render('admin/users/edit', [
            'user' => $this->userPayload($user),
            'roles' => $authUser->assignableRoles(),
            'companies' => $this->getCompaniesForUser($authUser),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $authUser = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)->ignore($user->id)],
            'role' => ['required', 'string', Rule::in($authUser->assignableRoles())],
            'company_id' => [
                $authUser->isSuperAdmin() ? 'required' : 'nullable',
                'string',
                Rule::exists(Company::class, 'id'),
            ],
        ]);

        $companyId = $authUser->isSuperAdmin()
            ? $validated['company_id']
            : $user->company_id;

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'company_id' => $companyId,
        ]);

        $user->syncRoles([$validated['role']]);

        return to_route('admin.users.index')
            ->with('success', 'Utilisateur mis à jour.');
    }

    public function destroy(User $user): RedirectResponse
    {
        abort_if($user->id === Auth::user()->id, 403, 'Vous ne pouvez pas supprimer votre propre compte.');

        $this->authorize('delete', $user);

        $user->delete();

        return to_route('admin.users.index')
            ->with('success', 'Utilisateur supprimé.');
    }

    /**
     * Resend the activation email.
     */
    public function resendActivation(User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        if ($user->password !== null) {
            return back()->with('error', 'Ce compte est déjà activé.');
        }

        $user->notify(new AccountActivationNotification);

        return back()->with('success', "Email d'activation renvoyé.");
    }

    /**
     * @return array<string, mixed>
     */
    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'company_id' => $user->company_id,
            'role' => $user->roles->first()?->name,
            'is_activated' => $user->password !== null,
            'email_verified_at' => $user->email_verified_at,
        ];
    }

    /**
     * @return \Illuminate\Support\Collection<int, array{id: string, name: string}>
     */
    private function getCompaniesForUser(User $authUser): \Illuminate\Support\Collection
    {
        if ($authUser->isSuperAdmin()) {
            return Company::query()->select(['id', 'name'])->orderBy('name')->get();
        }

        return Company::query()
            ->select(['id', 'name'])
            ->where('id', $authUser->company_id)
            ->get();
    }
}
