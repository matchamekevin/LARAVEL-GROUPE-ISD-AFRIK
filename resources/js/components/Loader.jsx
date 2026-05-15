import React from "react";
import "../styles/loader.css";

const SPINNER_SIZES = { sm: 20, md: 36, lg: 56 };

export default function Loader({
  variant = "spinner",
  size = "md",
  text = "",
  overlay = false,
  count = 4,
  type = "card",
  className = "",
}) {
  const px = SPINNER_SIZES[size] || SPINNER_SIZES.md;

  const spinner = (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#172243"
      strokeWidth="2.5"
      strokeLinecap="round"
      className="ldr-spinner"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );

  const skeletonCard = (key) => (
    <div key={key} className="ldr-skeleton-card">
      <div className="ldr-skeleton ldr-skeleton--img" />
      <div className="ldr-skeleton-body">
        <div className="ldr-skeleton ldr-skeleton--line ldr-skeleton--w70" />
        <div className="ldr-skeleton ldr-skeleton--line" />
        <div className="ldr-skeleton ldr-skeleton--line ldr-skeleton--w50" />
      </div>
    </div>
  );

  const skeletonDetail = (
    <div className="ldr-skeleton-detail">
      <div className="ldr-skeleton ldr-skeleton--img-lg" />
      <div className="ldr-skeleton-detail-body">
        <div className="ldr-skeleton ldr-skeleton--line ldr-skeleton--w60" />
        <div className="ldr-skeleton ldr-skeleton--line" />
        <div className="ldr-skeleton ldr-skeleton--line ldr-skeleton--w40" />
        <div className="ldr-skeleton ldr-skeleton--btn" />
      </div>
    </div>
  );

  const skeletonGrid = (
    <div className="ldr-skeleton-grid" style={{ "--ldr-count": count }}>
      {Array.from({ length: count }, (_, i) => skeletonCard(i))}
    </div>
  );

  const content = (
    <>
      {variant === "spinner" && spinner}
      {variant === "inline" && (
        <span className="ldr-inline">
          {spinner}
          {text && <span className="ldr-inline-text">{text}</span>}
        </span>
      )}
      {variant === "skeleton" && type === "detail" && skeletonDetail}
      {variant === "skeleton" && type !== "detail" && skeletonGrid}
      {variant === "spinner" && text && <span className="ldr-text">{text}</span>}
    </>
  );

  if (overlay) {
    return (
      <div className={`ldr-overlay ${className}`}>
        {content}
      </div>
    );
  }

  if (variant === "skeleton") {
    return (
      <div className={`ldr-wrapper ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <div className={`ldr-center ${className}`}>
      {content}
    </div>
  );
}
