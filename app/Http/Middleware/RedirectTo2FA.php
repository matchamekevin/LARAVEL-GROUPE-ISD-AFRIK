<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Auth;
use Filament\Notifications\Notification;
use Symfony\Component\HttpFoundation\Response;

class RedirectTo2FA
{
    public function handle(Request $request, Closure $next): Response
    {
        // ✅ Ne pas rediriger si on est déjà sur la page 2FA
        if ($request->is('admin/two-factor-challenge')) {
            return $next($request);
        }

        $user = Auth::user();

        // ✅ Si l'utilisateur est connecté mais n'a pas validé le code 2FA
        if ($user && !Session::get('2fa:validated:' . $user->id_utilisateur . ':' . session()->getId())) {
            Session::put('2fa:user:id', $user->id_utilisateur);
            Session::put('2fa:remember', true);

            Notification::make()
                ->title('Code envoyé')
                ->body('Un code de vérification a été envoyé à votre adresse email.')
                ->success()
                ->send();

            return redirect('/admin/two-factor-challenge');
        }

        return $next($request);
    }
}