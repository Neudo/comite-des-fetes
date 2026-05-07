import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-primary/15 text-primary',
        assoc: 'bg-blue-100 text-blue-800',
        part: 'bg-amber-100 text-amber-800',
        adh: 'bg-emerald-100 text-emerald-800',
        non: 'bg-rose-100 text-rose-800',
        bon: 'bg-emerald-100 text-emerald-800',
        end: 'bg-rose-100 text-rose-800',
        enc: 'bg-amber-100 text-amber-800',
        muted: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />
}

export { Badge, badgeVariants }
