import { cn } from '../lib/cn'

/**
 * PhoneFrame — moldura de celular (390px) para visualizar telas de app
 * no showcase. Apenas apresentação.
 */
export function PhoneFrame({ className, children }) {
  return (
    <div
      className={cn(
        'relative mx-auto w-[390px] max-w-full shrink-0 rounded-[2.75rem] border-[10px] border-graphite-900 bg-surface-base shadow-xl overflow-hidden',
        className,
      )}
      style={{ height: 760 }}
    >
      {/* notch */}
      <div className="absolute left-1/2 top-0 z-overlay h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-graphite-900" />
      <div className="h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </div>
  )
}
