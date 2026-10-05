"use client";

import React from "react";
import { MorningBriefing, TaskRun } from "../contracts";
import { useDialogFocus } from "../lib/useDialogFocus";
import { SECTION_LABEL, briefItemText, jstDateTime } from "./demoText";

interface BriefingModalProps {
  briefing: MorningBriefing;
  run: TaskRun | null;
  onClose: () => void;
  onGoToApprovals: () => void;
  onSpeak: () => void;
}

export function BriefingModal({
  briefing,
  run,
  onClose,
  onGoToApprovals,
  onSpeak,
}: BriefingModalProps) {
  const dialogRef = useDialogFocus(onClose);

  return (
    <div
      className="modal-overlay"
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="briefing-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-window">
        <div className="modal-header">
          <h2 id="briefing-modal-title">朝の報告 · サンプル</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="閉じる"
          >
            閉じる
          </button>
        </div>

        <span className="pill-tag">DEMO · 実サービス未接続</span>
        <div className="tiny-label">{run?.taskRunId ? `デモタスク ${run.taskRunId.slice(0, 8)}` : "稼働中タスクなし"}</div>
        {run?.status === "running" && <p className="narrative-block">サンプルの出典を照合中です。完了後に根拠ID付きの報告を表示します。</p>}
        {run?.status !== "running" && <>

        <div className="card-grid-2">
          <div className="stat-card">
            <small>サンプルの配送費確認</small>
            <strong>01</strong>
            <small>外部操作なし</small>
          </div>
          <div className="stat-card">
            <small>MIX問い合わせの例</small>
            <strong>02</strong>
            <small>メールは送信していません</small>
          </div>
        </div>

        <div className="narrative-block">
          <p>
            <b>おはようございます。</b>
            これはサンプルデータから作成した朝の報告です。実際の店舗・メール・予定表には接続されていません。
          </p>
          <ol>
            {briefing.sections.map((sec) => (
              <li key={sec.kind}>
                <b>{SECTION_LABEL[sec.kind]}:</b>{" "}
                {sec.items.map((it) => `${briefItemText(it)}（出典 ${it.source}）`).join(" / ")}
              </li>
            ))}
          </ol>
        </div>
        {run && <div className="tiny-label">照合した出典: {run.jobs.map((job) => `${job.sourceId} ${job.status === "succeeded" ? "確認済み" : "確認できず"}`).join(" / ")}</div>}

        <div className="button-row" style={{ marginTop: "18px" }}>
          <button
            className="cyber-btn primary"
            onClick={() => {
              onClose();
              onGoToApprovals();
            }}
          >
            模擬承認の内容を見る
          </button>
          <button className="cyber-btn" onClick={onSpeak}>
            ブラウザー音声で読む
          </button>
        </div>

        <div className="tiny-label" style={{ marginTop: "16px" }}>
          出典: ローカルfixture · DEMO · 生成時刻: {jstDateTime(briefing.generated_at)} JST
        </div>
        </>}
        <p className="modal-foot">
          ローカルのサンプルのみ · 実サービスへの書込みなし
        </p>
      </div>
    </div>
  );
}
