<?php

namespace App\Filament\Auth;

use Filament\Pages\Page;
use Filament\Forms\Contracts\HasForms;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Components\TextInput;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Filament\Notifications\Notification;
use Carbon\Carbon;
use App\Models\Utilisateur;
use App\Notifications\TwoFactorCodeNotification;

class TwoFactorChallenge extends Page implements HasForms
{
    use InteractsWithForms;

    protected static ?string $title = 'Vérification en deux étapes';
    protected string $view = 'filament.pages.auth.two-factor-challenge';

    public ?array $data = [];
    public string $code = ''; // ✅ requis pour wire:model="code"

    public function getFormSchema(): array
    {
        return [
            TextInput::make('code')
                ->label('Code de vérification')
                ->required()
                ->length(6)
                ->numeric()
                ->placeholder('000000')
                ->helperText('Entrez le code à 6 chiffres envoyé par email')
                ->autofocus()
                ->extraInputAttributes(['autocomplete' => 'one-time-code']),
        ];
    }

    public function verify(): void
    {
        $user = Utilisateur::find(Session::get('2fa:user:id'));

        if (!$user) {
            Session::forget(['2fa:user:id', '2fa:remember']);
            Notification::make()
                ->danger()
                ->title('Erreur')
                ->body('Session expirée. Veuillez vous reconnecter.')
                ->send();

            $this->redirect('/admin/login');
            return;
        }

        if (!$user->two_factor_expires_at || Carbon::now()->isAfter($user->two_factor_expires_at)) {
            $user->generateTwoFactorCode();
            $user->notify(new TwoFactorCodeNotification($user->two_factor_code));

            Notification::make()
                ->danger()
                ->title('Code expiré')
                ->body('Le code a expiré. Un nouveau code vous a été envoyé.')
                ->send();

            return;
        }

        if ($user->two_factor_code === $this->code) {
            Auth::login($user, Session::get('2fa:remember', false));

            $sessionKey = '2fa:validated:' . $user->id_utilisateur . ':' . session()->getId();
            Session::put($sessionKey, true);
            Session::forget(['2fa:user:id', '2fa:remember']);

            $user->resetTwoFactorCode();

            Notification::make()
                ->success()
                ->title('Connexion réussie')
                ->body('Bienvenue !')
                ->send();

            $this->redirect('/admin');
        } else {
            Notification::make()
                ->danger()
                ->title('Code incorrect')
                ->body('Le code saisi est invalide. Veuillez réessayer.')
                ->send();
        }
    }

    public function resendCode(): void
    {
        $user = Utilisateur::find(Session::get('2fa:user:id'));

        if (!$user) {
            Session::forget(['2fa:user:id', '2fa:remember']);
            Notification::make()
                ->danger()
                ->title('Erreur')
                ->body('Session expirée. Veuillez vous reconnecter.')
                ->send();

            $this->redirect('/admin/login');
            return;
        }

        $user->generateTwoFactorCode();
        $user->notify(new TwoFactorCodeNotification($user->two_factor_code));

        Notification::make()
            ->success()
            ->title('Code renvoyé')
            ->body('Un nouveau code vous a été envoyé par email.')
            ->send();
    }
}