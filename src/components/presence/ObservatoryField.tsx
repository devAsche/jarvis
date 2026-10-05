import { CoreVisualState } from "../../contracts";

export function ObservatoryField({ state }: { state: CoreVisualState }) {
  const accent = state === "error" ? "#d69491" : state === "offline" ? "#7c9ba6" : "#a9e3e3";
  const label = state === "idle" ? "IDLE" : state === "awaiting_approval" ? "REVIEW" : state.toUpperCase().replace("_", " ");
  return <svg className="observatory-field" viewBox="0 0 820 410" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="observatory-glow"><stop stopColor={accent} stopOpacity=".68" /><stop offset=".25" stopColor="#5bbfc8" stopOpacity=".25" /><stop offset="1" stopColor="#194357" stopOpacity="0" /></radialGradient>
      <linearGradient id="observatory-line"><stop stopColor="#375d71" stopOpacity=".03" /><stop offset=".33" stopColor={accent} stopOpacity=".76" /><stop offset=".62" stopColor="#6cb9ca" stopOpacity=".32" /><stop offset="1" stopColor="#395c6e" stopOpacity=".02" /></linearGradient>
    </defs>
    <g opacity=".27" stroke="#426879" fill="none">
      <path d="M40 200H780M410 25V380" strokeDasharray="2 9" />
      <ellipse cx="410" cy="206" rx="239" ry="130" strokeDasharray="3 8" />
      <ellipse cx="410" cy="206" rx="147" ry="147" strokeDasharray="2 7" />
    </g>
    <ellipse cx="410" cy="206" rx="145" ry="135" fill="url(#observatory-glow)" opacity=".7" />
    <g className="orbit-field">
    <g fill="none" stroke="url(#observatory-line)" strokeLinecap="round">
      <path d="M266 189C327 85 462 53 544 133c71 72 44 161-43 195-89 35-177-3-215-64" strokeWidth="2.4" />
      <path d="M301 276C283 207 320 126 391 111c69-15 132 45 143 100 16 74-30 120-100 125" strokeWidth="1.2" opacity=".7" />
      <path d="M346 310c-48-41-45-121 12-164 55-42 138-8 143 62 4 58-44 94-109 89" strokeWidth="1.1" opacity=".6" />
      <path d="M327 124c123 136 255 130 318 55" strokeWidth=".9" opacity=".4" />
      <path d="M216 253c75-92 176-94 288-46 60 27 102 22 129 1" strokeWidth=".8" opacity=".32" />
    </g>
    <g fill={accent}><circle cx="301" cy="276" r="2.8" /><circle cx="544" cy="133" r="3" /><circle cx="434" cy="336" r="2" /><circle cx="501" cy="208" r="3" /><circle cx="358" cy="146" r="1.8" /><circle cx="410" cy="206" r="3.4" /></g>
    </g>
    <g fill="#82aebb" fontFamily="monospace" fontSize="10"><text x="84" y="91">FIELD 01 / {label}</text><text x="650" y="320">0.0 · local</text></g>
  </svg>;
}
