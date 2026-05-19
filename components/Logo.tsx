/**
 * The Curbside LA logo. Renders /public/logo.png — drop the logo image there.
 *
 * `LogoMark` is the standalone emblem; `LogoLockup` pairs it with a text
 * wordmark for the sidebar.
 */

export function LogoMark({
  size = 40,
  glow = false,
  className = "",
}: {
  size?: number;
  glow?: boolean;
  className?: string;
}) {
  return (
    <img
      src="/logo.png"
      alt="Curbside LA"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`shrink-0 select-none rounded-xl object-contain ${
        glow ? "drop-shadow-[0_0_18px_rgba(61,139,255,0.45)]" : ""
      } ${className}`}
    />
  );
}

export function LogoLockup({ size = 38 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} glow />
      <div className="leading-none">
        <div className="font-display text-lg font-bold uppercase tracking-[0.06em] text-text">
          Curbside
          <span className="ml-1.5 text-primary-bright">LA</span>
        </div>
        <div className="mt-1 font-display text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-muted-2">
          Finance
        </div>
      </div>
    </div>
  );
}
