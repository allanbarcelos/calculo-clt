export default function BrandMark({ size = 32 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path d="M21.5 11.2A7 7 0 1 0 21.5 20.8" fill="none" stroke="var(--bg)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
