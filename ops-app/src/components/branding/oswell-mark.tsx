type OswellMarkProps = {
  className?: string;
};

export function OswellMark({ className }: OswellMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="oswell-mark-gradient" x1="10" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C5CFF" />
          <stop offset="0.52" stopColor="#2563EB" />
          <stop offset="1" stopColor="#0F172A" />
        </linearGradient>
        <radialGradient id="oswell-mark-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(22 18) rotate(45) scale(34)">
          <stop stopColor="#FFFFFF" stopOpacity="0.28" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#oswell-mark-gradient)" />
      <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#oswell-mark-glow)" />
      <path
        fill="#F8FAFC"
        fillRule="evenodd"
        d="M32 14C22.059 14 14 22.059 14 32C14 41.941 22.059 50 32 50C41.941 50 50 41.941 50 32C50 22.059 41.941 14 32 14ZM22 32C22 26.477 26.477 22 32 22C37.523 22 42 26.477 42 32C42 37.523 37.523 42 32 42C26.477 42 22 37.523 22 32Z"
        clipRule="evenodd"
      />
      <circle cx="44.5" cy="19.5" r="4.5" fill="#22D3EE" />
    </svg>
  );
}
