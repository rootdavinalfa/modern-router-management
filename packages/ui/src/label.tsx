import * as React from "react";

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  const classes = [
    "text-xs font-semibold uppercase tracking-[0.18em] text-[var(--kicker)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <label className={classes} {...props} />;
}
