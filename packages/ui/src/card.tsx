import * as React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  const classes = ["island-shell rounded-2xl", className]
    .filter(Boolean)
    .join(" ");

  return <div className={classes} {...props} />;
}

export function CardHeader({ className, ...props }: CardProps) {
  const classes = ["border-b border-[var(--line)] px-6 py-4", className]
    .filter(Boolean)
    .join(" ");

  return <div className={classes} {...props} />;
}

export function CardContent({ className, ...props }: CardProps) {
  const classes = ["px-6 py-5", className].filter(Boolean).join(" ");

  return <div className={classes} {...props} />;
}
