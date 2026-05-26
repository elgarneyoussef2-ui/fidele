export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display italic tracking-tight ${className}`}>
      Fid<span className="text-primary">è</span>le
    </span>
  )
}
