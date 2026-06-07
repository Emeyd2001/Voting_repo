import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";

const ToastContext = createContext(null);

let toastCount = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = "success", duration = 4000) => {
    const id = ++toastCount;
    const newToast = { id, message, type };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => remove(id), duration);
    }
  }, [remove]);

  const success = useCallback((msg, duration) => addToast(msg, "success", duration), [addToast]);
  const error = useCallback((msg, duration) => addToast(msg, "error", duration), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: { success, error }, addToast, remove }}>
      {children}
      <div className="fixed top-4 end-4 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4 sm:px-0">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}

function ToastItem({ toast, onRemove }) {
  const isError = toast.type === "error";

  useEffect(() => {
    // Basic slide-in animation handled by Tailwind (animate-fade-slide-up or similar)
  }, []);

  return (
    <div className={`pointer-events-auto flex items-start gap-3 rounded-xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border backdrop-blur-md animate-fade-slide-up transition-all ${
      isError 
        ? "bg-red-50/90 border-red-200 text-red-800" 
        : "bg-emerald-50/90 border-emerald-200 text-emerald-800"
    }`}>
      <div className="shrink-0 mt-0.5">
        {isError ? (
          <AlertTriangle className="h-5 w-5 text-red-600" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-relaxed">{toast.message}</p>
      </div>
      <button 
        onClick={onRemove}
        className={`shrink-0 rounded-lg p-1 transition-colors ${
          isError ? "hover:bg-red-100 text-red-600" : "hover:bg-emerald-100 text-emerald-600"
        }`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
