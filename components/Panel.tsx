export default function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.1em] text-text">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
