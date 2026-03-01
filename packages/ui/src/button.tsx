import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className, ...props }: ButtonProps) {
  const classes = [
    "inline-flex items-center justify-center rounded-full border border-[rgba(47,106,74,0.2)] bg-[rgba(79,184,178,0.18)] px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink)] transition hover:-translate-y-0.5 hover:border-[rgba(47,106,74,0.35)] hover:bg-[rgba(79,184,178,0.28)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <button className={classes} {...props} />;
}
