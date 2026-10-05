import type { BriefingItem, BriefingSection, SourceEventEnvelope } from "../contracts";

// Display copy for fixture items whose source text is English. Facts are unchanged; only wording.
const ITEM_TEXT: Record<string, string> = {
  demo_shipping_alert: "サンプル注文1件の送料が見積を超えている可能性があります",
  demo_focus: "デモの予定表で2時間の集中枠を取れます",
  demo_mix: "サンプルのMIX問い合わせ2件が返信待ちです",
  demo_deepwork: "広告の追加実験より先に、商品ページを見直す",
};

export const SECTION_LABEL: Record<BriefingSection["kind"], string> = {
  anomalies: "異常",
  schedule: "今日",
  pending: "保留",
  suggestions: "提案",
};

/** Run-generated headlines are already Japanese; untouched fixture headlines get a Japanese rendering. */
export function briefItemText(item: BriefingItem): string {
  return /[ぁ-んァ-ン一-龯]/.test(item.headline) ? item.headline : ITEM_TEXT[item.id] ?? item.headline;
}

export function money(minor: number, currency: string): string {
  try {
    const digits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
    return new Intl.NumberFormat("ja-JP", { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(minor / 10 ** digits);
  } catch { return `${minor} ${currency}`; }
}

export const yen = (minor: unknown) => (typeof minor === "number" ? `¥${minor.toLocaleString("ja-JP")}` : "不明");

export const jstTime = (iso: string) => {
  const date = new Date(iso);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" }).format(date)
    : "--:--";
};

export const jstDateTime = (iso: string) => {
  const date = new Date(iso);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date)
    : "不明";
};

export function eventTitle(evt: SourceEventEnvelope): string {
  if (evt.type === "commerce.order.paid") return "サンプル注文を受信";
  if (evt.type === "commerce.order.received") return `注文 ${String(evt.data.order ?? "")} を受信`;
  if (evt.type === "commerce.order.updated") return `注文 ${String(evt.data.order ?? "")} が更新`;
  if (evt.type === "creative.mix.lead") return "MIX問い合わせの例";
  if (evt.type === "calendar.event.upcoming") return "予定の例";
  if (evt.type === "task.run.started") return "出典の照合を開始";
  if (evt.type === "task.run.fixture_read_complete") return "出典の照合が完了";
  if (evt.type === "task.run.waiting_approval") return "報告を作成 · 承認待ち";
  if (evt.type === "task.run.failed") return "照合に失敗";
  if (evt.type === "task.run.demo_decision" || evt.type === "approval.demo_decision") {
    const message = typeof evt.data.message === "string" ? evt.data.message : "";
    return message.startsWith("approved") ? "模擬承認を記録 · 外部効果なし" : message.startsWith("rejected") ? "見送りを記録 · 外部効果なし" : "模擬判断を記録";
  }
  if (evt.type === "system.simulation.ready") return "デモ環境を準備";
  if (evt.type.startsWith("voice.")) return "音声モックの状態変化";
  if (evt.type.startsWith("system.") || evt.type.startsWith("client.") || evt.type.startsWith("command.") || evt.type.startsWith("speech.")) return "画面の操作";
  return "デモ履歴";
}

export interface LogItem { key: string; at: string; title: string; sub: string }
export interface AuditLike { id: string; at: string; type: string; correlationId: string; detail: string }

const AUDIT_TITLE: Record<string, string> = {
  "task.run.started": "読み取りを開始",
  "sync.shopify.succeeded": "Shopifyを読み取り",
  "sync.shopify.failed": "Shopifyの読み取りに失敗",
  "webhook.shopify.received": "注文の通知を受信",
  "webhook.shopify.unparsed": "読めない通知を記録",
  "task.run.waiting_approval": "報告を作成 · 確認待ち",
  "task.run.completed": "報告を作成",
  "task.run.failed": "報告を作成できず",
  "review.decision": "確認を記録 · 外部効果なし",
};

export function auditLog(entries: AuditLike[]): LogItem[] {
  return entries.map((e) => ({ key: e.id, at: e.at, title: AUDIT_TITLE[e.type] ?? e.type, sub: e.detail.slice(0, 80) }));
}

export function eventLog(events: SourceEventEnvelope[]): LogItem[] {
  return events.map((evt) => ({ key: `${evt.source}:${evt.event_id}`, at: evt.occurred_at, title: eventTitle(evt), sub: `${evt.event_id.length > 12 ? evt.correlation_id.slice(0, 8) : evt.event_id} · ${evt.source}` }));
}
