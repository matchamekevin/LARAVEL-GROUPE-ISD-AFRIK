<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // ✅ Récupérer toutes les notifications de l’utilisateur connecté
    public function index(Request $request)
    {
        return response()->json(
            $request->user()->notifications->map(function ($n) {
                return [
                    'id' => $n->id,
                    'type' => $n->type,
                    'data' => json_decode($n->data, true), // transforme en tableau
                    'read_at' => $n->read_at,
                    'created_at' => $n->created_at,
                ];
            })
        );
    }

    // ✅ Récupérer uniquement les notifications non lues
    public function unread(Request $request)
    {
        return response()->json(
            $request->user()->unreadNotifications->map(function ($n) {
                return [
                    'id' => $n->id,
                    'type' => $n->type,
                    'data' => json_decode($n->data, true),
                    'read_at' => $n->read_at,
                    'created_at' => $n->created_at,
                ];
            })
        );
    }

    // ✅ Marquer une notification comme lue
    public function markAsRead(Request $request, $id)
    {
        $notification = $request->user()->notifications()->find($id);

        if ($notification) {
            $notification->markAsRead();
            return response()->json(['message' => 'Notification marquée comme lue']);
        }

        return response()->json(['message' => 'Notification introuvable'], 404);
    }

    // ✅ Marquer toutes les notifications comme lues
    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();
        return response()->json(['message' => 'Toutes les notifications marquées comme lues']);
    }
}
