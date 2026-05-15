import React from "react";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Rechercher...",
  onClear,
  onSubmit,
  submitLabel,
  id,
  name,
  autoFocus,
  className = "",
  wrapperClassName = "",
  children,
  accentColor,
  compact,
}) {
  const style = accentColor
    ? { "--pp-accent": accentColor, "--pp-accent-rgb": hexToRgb(accentColor) }
    : undefined;

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: "" } });
    }
  };

  const searchContent = (
    <>
      <svg className="pp-search-icon" viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        id={id}
        name={name}
        autoFocus={autoFocus}
      />
      {value && (
        <button type="button" onClick={handleClear} className="pp-search-clear" aria-label="Effacer la recherche">
          ✕
        </button>
      )}
      {submitLabel && (
        <button type="submit" className="pp-search-submit">
          {submitLabel}
        </button>
      )}
    </>
  );

  const wrapperClass = [
    "pp-search-wrapper",
    compact ? "pp-search-wrapper--compact" : "",
    wrapperClassName,
  ].filter(Boolean).join(" ");

  const searchBar = (
    <label className={`pp-search ${className}`.trim()} aria-label={placeholder} style={style}>
      {searchContent}
    </label>
  );

  if (children) {
    return (
      <div className={wrapperClass}>
        <div className="pp-search-extra" style={style}>
          {searchBar}
          {children}
        </div>
      </div>
    );
  }

  if (onSubmit) {
    return (
      <div className={wrapperClass}>
        <form onSubmit={onSubmit} style={{ width: "100%", maxWidth: "680px" }}>
          {searchBar}
        </form>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      {searchBar}
    </div>
  );
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "29, 78, 216";
}
