export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-center sm:flex-row sm:px-6 sm:text-left">
        <p className="text-sm text-muted-foreground">
          &copy; {year} Modern Router Management. All rights reserved.
        </p>
        <p className="text-sm text-muted-foreground">Router-Core control plane</p>
      </div>
    </footer>
  )
}
