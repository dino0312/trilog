import { cn } from '@/lib/utils/cn'

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-ink-2">
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          'w-full rounded-lg border bg-bg-elev px-3.5 py-2.5 text-sm text-ink',
          'placeholder:text-ink-4 outline-none transition',
          'focus:border-accent focus:ring-2 focus:ring-accent/20',
          error ? 'border-red' : 'border-border-strong',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red">{error}</p>}
    </div>
  )
}
