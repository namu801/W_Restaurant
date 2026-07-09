import { clsx } from "clsx";
import { Check, Minus, TriangleAlert } from "lucide-react";
import type { Checkpoint } from "@/lib/checkpoints";

const ICON: Record<Checkpoint["tone"], typeof Check> = {
  positive: Check,
  neutral: Minus,
  warning: TriangleAlert,
};

const ICON_STYLE: Record<Checkpoint["tone"], string> = {
  positive: "text-sage",
  neutral: "text-ink-faint",
  warning: "text-clay",
};

export function CheckpointList({ checkpoints }: { checkpoints: Checkpoint[] }) {
  return (
    <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {checkpoints.map((c) => {
        const Icon = ICON[c.tone];
        return (
          <li
            key={c.label}
            className="flex items-start gap-2.5 rounded-xl border border-line bg-white px-3.5 py-3"
          >
            <Icon className={clsx("mt-0.5 h-4 w-4 shrink-0", ICON_STYLE[c.tone])} />
            <div>
              <p className="text-xs font-medium text-ink-faint">{c.label}</p>
              <p className="text-sm text-ink">{c.value}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
