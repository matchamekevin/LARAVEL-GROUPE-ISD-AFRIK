<?php
namespace App\Http\Controllers;

use App\Models\Newsletter;
use App\Services\FormMailDispatcher;
use App\Services\FormMailRouteService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class NewsletterController extends Controller
{
    public function __construct(private readonly FormMailDispatcher $formMailDispatcher)
    {
    }

    // POST /api/newsletter
    public function store(Request $request)
    {
        $request->validate([
            'email' => 'required|email|unique:newsletters,email',
        ]);

        $newsletter = Newsletter::create([
            'email' => $request->email,
        ]);

        try {
            $user = $request->user();
            $this->formMailDispatcher->sendText(
                formKey: FormMailRouteService::FORM_NEWSLETTER,
                subject: 'Nouvelle inscription newsletter',
                lines: [
                    'Nouvelle inscription a la newsletter.',
                    '',
                    'Email: ' . $request->email,
                    'Date: ' . now()->format('d/m/Y H:i:s'),
                ],
                replyToEmail: $request->email,
                replyToName: $user ? trim(($user->prenom ?? '') . ' ' . ($user->nom ?? '')) : null,
            );
        } catch (\Throwable $exception) {
            Log::error('Echec envoi email newsletter', [
                'exception' => $exception->getMessage(),
                'email' => $request->email,
            ]);
        }

        return response()->json(['success' => true, 'data' => $newsletter]);
    }

    // GET /api/newsletter
    public function index()
    {
        return response()->json(Newsletter::all());
    }

    // GET /api/newsletter/{id}
    public function show($id)
    {
        $newsletter = Newsletter::findOrFail($id);
        return response()->json($newsletter);
    }

    // PUT /api/newsletter/{id}
    public function update(Request $request, $id)
    {
        $newsletter = Newsletter::findOrFail($id);

        $request->validate([
            'email' => 'required|email|unique:newsletters,email,' . $newsletter->id,
        ]);

        $newsletter->update(['email' => $request->email]);

        return response()->json(['success' => true, 'data' => $newsletter]);
    }

    // DELETE /api/newsletter/{id}
    public function destroy($id)
    {
        $newsletter = Newsletter::findOrFail($id);
        $newsletter->delete();

        return response()->json(['success' => true]);
    }
}
