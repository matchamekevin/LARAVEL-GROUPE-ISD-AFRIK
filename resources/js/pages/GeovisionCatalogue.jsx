import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCategories } from "../services/ProduitService";
import { matchCategory, normalizeGeovisionKey } from "../utils/geovision";

export default function GeovisionCatalogue() {
  const navigate = useNavigate();
  const { typeId } = useParams();

  useEffect(() => {
    let isMounted = true;

    getCategories({ segment: "geovision", tree: 1, parent_id: "null" })
      .then((response) => {
        if (!isMounted) return;

        const families = Array.isArray(response.data?.data) ? response.data.data : (response.data || []);
        const family = matchCategory(families, typeId) || matchCategory(families, normalizeGeovisionKey(typeId));

        if (family?.slug) {
          navigate(family.parent_id ? `/geovision/categorie/${family.slug}` : `/geovision?famille=${family.slug}`, { replace: true });
          return;
        }

        navigate("/geovision", { replace: true });
      })
      .catch(() => {
        if (isMounted) navigate("/geovision", { replace: true });
      });

    return () => {
      isMounted = false;
    };
  }, [navigate, typeId]);

  return null;
}
