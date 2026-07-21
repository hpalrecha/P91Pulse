import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

// --- classnames helper ------------------------------------------------------
export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// --- Button -----------------------------------------------------------------
type Variant = "primary" | "outline" | "ghost" | "danger";
const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50",
  outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-100",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-500 disabled:opacity-50",
};
export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// --- Input ------------------------------------------------------------------
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary",
        className,
      )}
      {...props}
    />
  );
}

// --- Select -----------------------------------------------------------------
// The arrow icon + its right-side breathing room come from the global `select`
// rule in index.css — do not add a background-image or padding-right here, or
// it will crowd the arrow against the box wall again.
export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cx(
        "w-full rounded-md border border-slate-300 bg-white py-2 pl-3 text-sm outline-none",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

// --- Badge ------------------------------------------------------------------
export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800",
    amber: "bg-amber-100 text-amber-800",
    purple: "bg-purple-100 text-purple-800",
    indigo: "bg-indigo-100 text-indigo-800",
  };
  return (
    <span className={cx("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", tones[tone] ?? tones.slate)}>
      {children}
    </span>
  );
}

// --- Switch -------------------------------------------------------------------
// Ported from p91pulse_stage's shadcn/Radix switch.tsx: a border-2 + flex
// layout (not absolute positioning) is what keeps the thumb inside the track
// at every state — the classic "ball outside the cylinder" bug comes from
// absolutely-positioning the thumb with an implicit (unreliable) left origin.
export function Switch({
  checked,
  onCheckedChange,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cx(
        "inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-slate-300",
      )}
    >
      <span
        className={cx(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg transition-transform",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

// --- Card -------------------------------------------------------------------
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-lg border border-slate-200 bg-white shadow-sm", className)}>{children}</div>;
}

// --- Spinner ----------------------------------------------------------------
export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        "inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700",
        className,
      )}
    />
  );
}

// --- Modal ------------------------------------------------------------------
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div
        className={cx(
          "mt-16 w-full rounded-lg bg-white shadow-xl",
          wide ? "max-w-2xl" : "max-w-md",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// --- Field label wrapper ----------------------------------------------------
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
