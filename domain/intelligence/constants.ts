export const EVIDENCE_TOPICS = [
  "Technology",
  "Competition",
  "Policy",
  "Demand",
  "Supply chain",
  "Cost",
  "Capacity",
  "Quality",
  "Regulation",
] as const;

export type EvidenceTopic = (typeof EVIDENCE_TOPICS)[number];

export const EVIDENCE_STATUSES = [
  "unverified",
  "source_reviewed",
  "needs_follow_up",
  "rejected",
] as const;

export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, string> = {
  unverified: "Unverified",
  source_reviewed: "Source reviewed",
  needs_follow_up: "Needs follow-up",
  rejected: "Rejected",
};
