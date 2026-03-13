import React, { useState, useEffect, useRef } from "react";
import "../styles/CountrySelector.css";

// ✅ Corrigé avec les bons codes ISO
const countries = [
  { code: "TG", name: "Togo", flag: "/flags/tg.png" },
  { code: "NE", name: "Niger", flag: "/flags/ni.png" }, // corrigé
  { code: "CI", name: "Côte d’Ivoire", flag: "/flags/co.png" }, // corrigé
  { code: "BJ", name: "Bénin", flag: "/flags/be.png" }, // corrigé
  { code: "BF", name: "Burkina ", flag: "/flags/bk.png" }, // corrigé
];

export default function CountrySelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = countries.find((c) => c.code === value) || countries[0];
  const ref = useRef();

  // ✅ Fermer si clic en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="country-selector" ref={ref}>
      <div className="selected" onClick={() => setOpen(!open)}>
        <img src={selected.flag} alt={selected.name} className="flag" />
        <span>{selected.name}</span>
        <span className="arrow">{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <ul className="dropdown">
          {countries.map((c) => (
            <li
              key={c.code}
              onClick={() => {
                onChange(c.code);
                setOpen(false); // ✅ ferme après sélection
              }}
            >
              <img src={c.flag} alt={c.name} className="flag" />
              <span>{c.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}