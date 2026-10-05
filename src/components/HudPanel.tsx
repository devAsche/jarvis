import React from "react";

interface HudPanelProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title?: React.ReactNode;
  code?: React.ReactNode;
  tone?: "default" | "decision";
  panelRef?: React.Ref<HTMLElement>;
}

/** Chamfered HUD frame shared by every DOM panel. */
export function HudPanel({ title, code, tone = "default", className = "", panelRef, children, ...rest }: HudPanelProps) {
  return (
    <section ref={panelRef} className={`hp${tone === "decision" ? " hp-decision" : ""} ${className}`} {...rest}>
      <span className="hp-corner tr" aria-hidden="true" />
      <span className="hp-corner bl" aria-hidden="true" />
      {title && <h2 className="hp-title"><span>{title}</span>{code && <span className="hp-code">{code}</span>}</h2>}
      {children}
    </section>
  );
}
