import { cn } from '@/lib/utils/cn'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
  loading?: boolean
}

export function Button({ variant = 'primary', loading, children, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-accent text-accent-ink hover:brightness-110',
        variant === 'ghost'   && 'text-ink-3 hover:text-ink hover:bg-bg-elev',
        className
      )}
      {...props}
    >
      {loading ? '處理中…' : children}
    </button>
  )
}
