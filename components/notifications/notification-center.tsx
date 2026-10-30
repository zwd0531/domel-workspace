"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ScenarioWorkspaceData } from "@/domain/scenario/workspace";

export function NotificationCenter({ data }: { data: ScenarioWorkspaceData }) {
  const router = useRouter();
  const [markingId, setMarkingId] = useState<string | null>(null);
  const unread = data.notifications.filter((notification) => !notification.readAt).length;

  async function markRead(id: string) {
    setMarkingId(id);
    try {
      const response = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      if (response.ok) router.refresh();
    } finally {
      setMarkingId(null);
    }
  }

  return <details className="panel notification-center">
    <summary><span><strong>Workflow notifications</strong><small>Approval requests and outcomes for this account</small></span><span className={unread ? "badge amber" : "badge green"}>{unread} unread</span></summary>
    <div className="notification-list">{data.notifications.length ? data.notifications.map((notification) => {
      const decision = data.decisions.find((item) => item.id === notification.entityId);
      return <article key={notification.id} className={notification.readAt ? "read" : ""}>
        <div><strong>{notification.title}</strong><p>{notification.body}</p><small>{formatDate(notification.createdAt)}</small></div>
        <div className="button-row">{decision ? <a className="btn small" href={`/scenarios?scenario=${decision.scenarioId}`}>Open</a> : null}{!notification.readAt ? <button className="btn small" onClick={() => markRead(notification.id)} disabled={markingId === notification.id}>{markingId === notification.id ? "Saving…" : "Mark read"}</button> : null}</div>
      </article>;
    }) : <p className="small muted empty-state">No workflow notifications yet.</p>}</div>
  </details>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
