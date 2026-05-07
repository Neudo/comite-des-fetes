import * as React from 'react'
import { Progress as Primitive } from 'radix-ui'
import { cn } from '@/lib/utils'

interface ProgressProps extends React.ComponentProps<typeof Primitive.Root> {
  indicatorClassName?: string
}

function Progress({ className, value, indicatorClassName, ...props }: ProgressProps) {
  return (
    <Primitive.Root
      data-slot="progress"
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <Primitive.Indicator
        data-slot="progress-indicator"
        className={cn('h-full w-full flex-1 bg-primary transition-transform', indicatorClassName)}
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </Primitive.Root>
  )
}

export { Progress }
