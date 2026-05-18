import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function PaiementResult() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const status = params.get("status");
  const message = params.get("message") || "Erreur inconnue";
  const type = params.get("type");
  const id = params.get("id");

  const isSuccess = status === "reussi";

  const backLink = (() => {
    if (type === "formation" && id) return `/formations/${id}/details`;
    if (type === "produit" && id) return `/produits/${id}`;
    if (type === "commande") return "/profile/commandes";
    return "/";
  })();

  return (
    <div style={{
      maxWidth: 500, margin: "80px auto", padding: "2rem",
      textAlign: "center", fontFamily: "sans-serif",
    }}>
      <div style={{
        fontSize: 64, marginBottom: "1rem",
        color: isSuccess ? "#2e7d32" : "#c62828",
      }}>
        <span className="material-icons" style={{ fontSize: 72 }}>
          {isSuccess ? "check_circle" : "cancel"}
        </span>
      </div>

      <h2 style={{ color: isSuccess ? "#2e7d32" : "#c62828", marginBottom: "1rem" }}>
        {isSuccess ? "Paiement réussi" : "Paiement échoué"}
      </h2>

      <p style={{ color: "#555", fontSize: "1.1rem", marginBottom: "2rem", lineHeight: 1.6 }}>
        {message}
      </p>

      <Link
        to={backLink}
        style={{
          display: "inline-block", padding: "12px 28px",
          background: "#172243", color: "#fff", textDecoration: "none",
          borderRadius: 6, fontWeight: 600, fontSize: "1rem",
        }}
      >
        <span className="material-icons" style={{ fontSize: 18, verticalAlign: "middle", marginRight: 6 }}>arrow_back</span>
        Retour
      </Link>
    </div>
  );
}
