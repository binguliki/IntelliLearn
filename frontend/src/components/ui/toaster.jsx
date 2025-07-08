import { useToast } from "../../hooks/use-toast.jsx"
import { cn } from "../../libs/utils";
import { X } from "lucide-react"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
            toast.variant === "destructive"
              ? "bg-fuchsia-900 border-fuchsia-700 text-gray-100"
              : "bg-gray-900 border-gray-700 text-gray-100"
          )}
        >
          <div className="grid gap-1">
            {toast.title && (
              <div className="text-sm font-semibold">{toast.title}</div>
            )}
            {toast.description && (
              <div className="text-sm opacity-90">{toast.description}</div>
            )}
          </div>
          <button
            className={cn(
              "absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100",
              toast.variant === "destructive"
                ? "text-gray-400 hover:text-fuchsia-400"
                : "text-gray-400 hover:text-indigo-400"
            )}
            onClick={() => dismiss(toast.id)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}