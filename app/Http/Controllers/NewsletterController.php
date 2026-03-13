<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Newsletter;

class NewsletterController extends Controller
{
    // POST /api/newsletter
    public function store(Request $request)
    {
        $request->validate([
            'email' => 'required|email|unique:newsletters,email',
        ]);

        $newsletter = Newsletter::create([
            'email' => $request->email,
        ]);

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
