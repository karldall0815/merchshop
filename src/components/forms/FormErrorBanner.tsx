import type { ActionResult } from "@/lib/action-result";
import { labelForCode } from "@/lib/error-messages";

interface Props {
  /** Failure result from a Server Action. If ok or null, banner is not rendered. */
  result?: ActionResult<unknown> | null;
  /** Override the message — useful for client-side validation messages. */
  message?: string | null;
}

export function FormErrorBanner({ result, message }: Props) {
  const text =
    message ??
    (result && !result.ok ? (result.message || labelForCode(result.code)) : null);
  if (!text) return null;
  const details = result && !result.ok ? result.details : undefined;

  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/5 text-destructive p-3 text-sm flex gap-2">
      <span aria-hidden>⚠️</span>
      <div className="space-y-1">
        <p className="font-medium">{text}</p>
        {details && Object.keys(details).length > 0 && (
          <ul className="text-xs space-y-0.5 list-disc pl-4">
            {Object.entries(details).map(([k, v]) => (
              <li key={k}>{k}: {String(v)}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
