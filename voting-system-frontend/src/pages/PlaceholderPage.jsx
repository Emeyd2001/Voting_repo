import { Construction } from "lucide-react";

export default function PlaceholderPage({ title = "هذه الصفحة" }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <Construction className="h-12 w-12 text-muted-foreground/40" />
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">
        هذه الصفحة قيد التطوير وستكون متاحة قريباً
      </p>
    </div>
  );
}
