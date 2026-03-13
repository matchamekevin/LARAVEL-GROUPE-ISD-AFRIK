<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use App\Notifications\CustomResetPasswordNotification;

class ForgotPasswordController extends Controller
{
    /**
     * Envoyer le lien de réinitialisation
     */
    public function sendResetLink(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $status = Password::broker('users')->sendResetLink(
            $request->only('email'),
            function ($user, $token) {
                // ✅ Utiliser APP_URL (backend) ou APP_FRONTEND_URL si défini
                $frontendUrl = env('APP_FRONTEND_URL', env('APP_URL', 'http://localhost:8000'));

                // ✅ Générer un lien vers ton frontend React intégré à Laravel
                $url = "{$frontendUrl}/reset-password/{$token}?email=" . urlencode($user->email);

                // ✅ Envoyer notification personnalisée
                $user->notify(new CustomResetPasswordNotification($token, $url));
            }
        );

        return $status === Password::RESET_LINK_SENT
            ? response()->json(['message' => __($status)], 200)
            : response()->json(['message' => __($status)], 400);
    }

    /**
     * Réinitialiser le mot de passe
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required',
            'password' => 'required|min:6|confirmed',
        ]);

        $status = Password::broker('users')->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                // ✅ Ton modèle utilise "mot_de_passe" au lieu de "password"
                $user->mot_de_passe = $password; // mutator hash automatiquement
                $user->setRememberToken(Str::random(60));
                $user->save();
            }
        );

        return $status === Password::PASSWORD_RESET
            ? response()->json(['message' => __($status)], 200)
            : response()->json(['message' => __($status)], 400);
    }

    public function showResetForm(Request $request, $token)
    {
        $frontendUrl = env('APP_FRONTEND_URL', env('APP_URL', 'http://localhost:5173'));
        return redirect("{$frontendUrl}/reset-password/{$token}?email=" . urlencode($request->email));
    }
}