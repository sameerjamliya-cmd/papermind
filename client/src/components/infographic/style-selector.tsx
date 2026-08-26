"use client";

import { Check } from "lucide-react";
import { INFOGRAPHIC_STYLES } from "@/lib/infographic-styles";
import { cn } from "@/lib/utils";
import { StylePreview } from "./style-previews";
import type { InfographicStyleId } from "@/lib/types";

export function StyleSelector({
  value,
  onChange,
  disabled,
}: {
  value: InfographicStyleId;
  onChange: (style: InfographicStyleId) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {INFOGRAPHIC_STYLES.map((style) => {
        const isActive = value === style.id;
        return (
          <button
            key={style.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(style.id)}
            className={cn(
              "group relative flex flex-col gap-1.5 rounded-lg border p-2 text-left transition-all",
              isActive
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border bg-card hover:border-muted-foreground/40",
              disabled && "cursor-not-allowed opacity-60"
            )}
          >
            <div className="overflow-hidden rounded-md border border-border">
              <StylePreview styleId={style.id} />
            </div>
            <span
              className={cn(
                "text-xs font-medium",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {style.name}
            </span>
            {isActive && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}