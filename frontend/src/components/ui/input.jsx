import * as React from "react"
import { cn } from "../../libs/utils";

const Input = React.forwardRef(({ className, type, borderless, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        borderless
          ? "flex h-10 w-full rounded-md bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-0 focus:border-none border-none outline-none ring-0"
          : "flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
