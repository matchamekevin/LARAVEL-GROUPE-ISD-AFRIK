<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Catalogue des formations - ISD AFRIK</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            color: #1a1a2e;
            line-height: 1.5;
            margin: 0;
            padding: 0;
        }
        .header {
            text-align: center;
            padding: 30px 0 20px 0;
            border-bottom: 3px solid #c8a44e;
            margin-bottom: 25px;
        }
        .header h1 {
            font-size: 24px;
            color: #0f1829;
            margin: 0 0 5px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .header p {
            font-size: 14px;
            color: #666;
            margin: 0;
        }
        .header .subtitle {
            font-size: 11px;
            color: #999;
            margin-top: 5px;
        }
        .category-title {
            font-size: 16px;
            color: #c8a44e;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding-bottom: 5px;
            border-bottom: 1px solid #ddd;
            margin: 25px 0 12px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        th {
            background-color: #0f1829;
            color: #ffffff;
            font-size: 11px;
            padding: 7px 8px;
            text-align: left;
            text-transform: uppercase;
        }
        td {
            padding: 7px 8px;
            border-bottom: 1px solid #eee;
            vertical-align: top;
        }
        tr:nth-child(even) td {
            background-color: #f9f9f9;
        }
        .col-titre { width: 30%; }
        .col-duree { width: 8%; text-align: center; }
        .col-prix { width: 12%; text-align: right; }
        .col-date { width: 15%; text-align: center; }
        .col-places { width: 10%; text-align: center; }
        .col-desc { width: 25%; }
        .prix {
            font-weight: bold;
            color: #c8a44e;
        }
        .places {
            font-size: 11px;
        }
        .footer {
            text-align: center;
            font-size: 10px;
            color: #999;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
        }
        .footer .contact {
            color: #666;
            margin-top: 5px;
            font-size: 11px;
        }
        .total-badge {
            text-align: right;
            font-size: 12px;
            color: #666;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ISD AFRIK</h1>
        <p>Catalogue des formations {{ date('Y') }}</p>
        <div class="subtitle">Groupe ISD AFRIK - Formation Professionnelle et Certifiante</div>
    </div>

    @php use Illuminate\Support\Str; @endphp
    <div class="total-badge">{{ $total }} formation(s) disponible(s)</div>

    @foreach (['etudiant', 'particulier', 'entreprise'] as $cat)
        @if (isset($formations[$cat]) && count($formations[$cat]) > 0)
            <div class="category-title">{{ $labels[$cat] ?? $cat }}</div>
            <table>
                <thead>
                    <tr>
                        <th class="col-titre">Formation</th>
                        <th class="col-duree">Durée</th>
                        <th class="col-prix">Prix</th>
                        <th class="col-date">Début</th>
                        <th class="col-places">Places</th>
                        <th class="col-desc">Description</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($formations[$cat] as $f)
                        <tr>
                            <td><strong>{{ $f->titre }}</strong></td>
                            <td style="text-align:center;">{{ $f->duree }} h</td>
                            <td style="text-align:right;" class="prix">{{ number_format($f->prix, 0, ',', ' ') }} FCFA</td>
                            <td style="text-align:center;">{{ $f->date_debut?->format('d/m/Y') ?? '—' }}</td>
                            <td style="text-align:center;" class="places">{{ $f->places_disponibles }}</td>
                            <td style="font-size:11px; color:#555;">{{ Str::limit($f->description, 100) }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endif
    @endforeach

    <div class="footer">
        <p><strong>ISD AFRIK</strong> — Votre partenaire formation</p>
        <div class="contact">
            Contact : contact@isdafrik.com | +229 XX XX XX XX<br>
            Site web : www.isdafrik.com
        </div>
    </div>
</body>
</html>
