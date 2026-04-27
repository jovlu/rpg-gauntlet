import type { ReactNode } from "react";

type QteShellProps = {
  className?: string;
  children: ReactNode;
  description: string;
  prompt: string;
  title: string;
};

export function QteShell({
  children,
  className,
  description,
  prompt,
  title,
}: QteShellProps) {
  return (
    <section
      className={className ? `fight-qte-shell ${className}` : "fight-qte-shell"}
      aria-label={title}
    >
      <div className="fight-qte-copy">
        <p className="fight-qte-kicker">Quick Time Event</p>
        <h2 className="fight-qte-title">{title}</h2>
        <p className="fight-qte-prompt">{prompt}</p>
        <p className="fight-qte-description">{description}</p>
      </div>
      <div className="fight-qte-body">{children}</div>
    </section>
  );
}
