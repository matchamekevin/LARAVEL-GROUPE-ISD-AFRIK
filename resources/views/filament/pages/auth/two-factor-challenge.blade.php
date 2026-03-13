<x-filament::page>
    <form wire:submit.prevent="verify">
        {{ $this->form }}

        <div class="mt-4 flex items-center justify-between">
            <x-filament::button type="submit" color="primary">
                Vérifier
            </x-filament::button>

            <x-filament::link wire:click="resendCode" tag="button" color="gray">
                Renvoyer le code
            </x-filament::link>
        </div>
    </form>

    <div class="mt-6">
        <form method="POST" action="{{ route('logout') }}">
            @csrf
            <x-filament::button type="submit" color="danger">
                Déconnexion
            </x-filament::button>
        </form>
    </div>
</x-filament::page>