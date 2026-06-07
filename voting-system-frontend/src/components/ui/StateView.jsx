import { AlertCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export function LoadingState({ label }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-white py-16 text-center text-secondary">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-bold">{label ?? t("common.loading")}</p>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const { t } = useTranslation();
  const message =
    typeof error === "string"
      ? error
      : error?.message ?? t("common.error");
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 py-12 text-center text-red-700">
      <AlertCircle className="h-8 w-8" />
      <p className="text-sm font-bold">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors"
        >
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, label }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-white py-16 text-center">
      {Icon && <Icon className="h-10 w-10 text-secondary/40" />}
      <p className="text-sm font-bold text-secondary">{label ?? t("common.noData")}</p>
    </div>
  );
}
