import * as React from "react";

type TableProps = React.TableHTMLAttributes<HTMLTableElement>;
type SectionProps = React.HTMLAttributes<HTMLTableSectionElement>;
type RowProps = React.HTMLAttributes<HTMLTableRowElement>;
type HeadProps = React.ThHTMLAttributes<HTMLTableCellElement>;
type CellProps = React.TdHTMLAttributes<HTMLTableCellElement>;

export function Table({ className, ...props }: TableProps) {
  const classes = ["w-full text-left text-sm", className]
    .filter(Boolean)
    .join(" ");

  return <table className={classes} {...props} />;
}

export function TableHeader({ className, ...props }: SectionProps) {
  const classes = [
    "text-xs uppercase tracking-[0.2em] text-[var(--sea-ink-soft)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <thead className={classes} {...props} />;
}

export function TableBody({ className, ...props }: SectionProps) {
  const classes = ["divide-y divide-[var(--line)]", className]
    .filter(Boolean)
    .join(" ");

  return <tbody className={classes} {...props} />;
}

export function TableRow({ className, ...props }: RowProps) {
  const classes = ["transition hover:bg-[rgba(255,255,255,0.4)]", className]
    .filter(Boolean)
    .join(" ");

  return <tr className={classes} {...props} />;
}

export function TableHead({ className, ...props }: HeadProps) {
  const classes = ["px-3 py-3 font-semibold", className]
    .filter(Boolean)
    .join(" ");

  return <th className={classes} {...props} />;
}

export function TableCell({ className, ...props }: CellProps) {
  const classes = ["px-3 py-3 text-[var(--sea-ink)]", className]
    .filter(Boolean)
    .join(" ");

  return <td className={classes} {...props} />;
}
