import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function LabeledSwitch({
  checked,
  onCheckedChange,
  ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "min-w-6 text-xs font-medium",
          !checked ? "text-foreground" : "text-muted-foreground",
        )}
      >
        off
      </span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={ariaLabel}
      />
      <span
        className={cn(
          "min-w-6 text-xs font-medium",
          checked ? "text-foreground" : "text-muted-foreground",
        )}
      >
        on
      </span>
    </div>
  );
}

export function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-5 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function ToggleButtons<T extends string | number>({
  value,
  options,
  onChange,
  format = (option) => String(option),
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  format?: (option: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={String(option)}
          type="button"
          size="sm"
          variant={value === option ? "default" : "outline"}
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {format(option)}
        </Button>
      ))}
    </div>
  );
}
