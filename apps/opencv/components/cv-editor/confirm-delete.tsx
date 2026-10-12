"use client";

import { AlertTriangle } from "lucide-react";

export interface ConfirmDeleteProps {
  /** Section label, as shown on the page. */
  label: string;
  /** What will be lost, e.g. "5 entries". Null when the section is empty. */
  lost: string | null;
  /** Built-ins can be added back empty; custom sections cannot be recovered. */
  recoverable: boolean;
  /** Defaults to the delete wording; a replace supplies its own. */
  title?: string;
  body?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Deleting a section throws away its content, so it asks first and says what
 * is actually at stake rather than a generic "are you sure".
 */
export function ConfirmDelete({ label, lost, recoverable, title, body, confirmLabel, onConfirm, onCancel }: ConfirmDeleteProps) {
  return (
    <div
      className="cv-modal-scrim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cv-confirm-title"
      onClick={onCancel}
    >
      <div className="cv-confirm" onClick={(e) => e.stopPropagation()}>
        <div className="cv-confirm-icon" aria-hidden="true">
          <AlertTriangle size={18} />
        </div>
        <div className="cv-confirm-body">
          <h2 id="cv-confirm-title">{title ?? `Delete ${label}?`}</h2>
          <p>
            {body ?? (lost
              ? `This removes the section and its ${lost} from your résumé.`
              : "This removes the section from your résumé.")}{" "}
            {!body &&
              (recoverable
                ? "You can add it back from the section catalogue, but it will come back empty."
                : "A custom section cannot be added back.")}
          </p>
          <div className="cv-confirm-actions">
            <button className="cv-btn" onClick={onCancel} autoFocus>
              Cancel
            </button>
            <button className="cv-btn cv-btn-danger" onClick={onConfirm}>
              {confirmLabel ?? "Delete section"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
