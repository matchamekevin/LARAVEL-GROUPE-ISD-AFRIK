import React, { useState, useEffect, useRef } from "react";
import "../styles/LanguageSelector.css"; // 👉 ton CSS

const languages = [
  { code: "fr", name: "Français" },
  { code: "en", name: "English" },
];

export default function LanguageSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = languages.find((l) => l.code === value) || languages[0];
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
    <div className="language-selector" ref={ref}>
      <div className="selected" onClick={() => setOpen(!open)}>
        <span>{selected.name}</span>
        <span className="arrow">{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <ul className="dropdown">
          {languages.map((l) => (
            <li
              key={l.code}
              onClick={() => {
                onChange(l.code);
                setOpen(false); // ✅ ferme après sélection
              }}
            >
              <span>{l.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}