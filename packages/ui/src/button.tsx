import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className, ...props }: ButtonProps) {
  const classes = [
    "inline-flex items-center justify-center rounded-full border border-[rgba(47,106,74,0.25)] bg-[rgba(79,184,178,0.25)] px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink)] hover:border-[rgba(47,106,74,0.45)] hover:bg-[rgba(79,184,178,0.40)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <button className={classes} style={{ transition: "background-color 180ms ease, border-color 180ms ease" }} {...props} />;
}
