<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivateAccountController extends Controller
{
    /**
     * Show the activation form (set password).
     */
    public function show(Request $request, User $user): Response|RedirectResponse
    {
        if (! $request->hasValidSignature()) {
            abort(403, 'Ce lien d\'activation a expiré ou est invalide.');
        }

        if ($user->password !== null) {
            return redirect()->route('login')
                ->with('status', 'Votre compte est déjà activé. Connectez-vous.');
        }

        return Inertia::render('auth/activate-account', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'queryString' => $request->getQueryString() ?? '',
        ]);
    }

    /**
     * Activate the account by setting the password.
     */
    public function store(Request $request, User $user): RedirectResponse
    {
        if (! $request->hasValidSignature()) {
            abort(403, 'Ce lien d\'activation a expiré ou est invalide.');
        }

        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user->update([
            'password' => $validated['password'],
        ]);

        $user->forceFill(['email_verified_at' => now()])->save();

        return redirect()->route('login')
            ->with('status', 'Votre compte est activé. Vous pouvez maintenant vous connecter.');
    }
}
