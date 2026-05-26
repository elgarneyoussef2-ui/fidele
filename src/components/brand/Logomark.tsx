export function Logomark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-label="Fidèle"
    >
      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="50" cy="50" r="11" fill="currentColor" />
    </svg>
  )
}
