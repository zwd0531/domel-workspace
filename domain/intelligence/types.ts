import type { AppRole } from "@/domain/permissions/policy";
import type { EvidenceStatus, EvidenceTopic } from "@/domain/intelligence/constants";

export type IntelligenceEvidence = {
  id: string;
  title: string;
  publisher: string;
  sourceUrl: string;
  publishedOn: string | null;
  capturedOn: string;
  topic: EvidenceTopic;
  fact: string;
  interpretation: string;
  limitations: string;
  verificationStatus: EvidenceStatus;
  reviewNote: string;
  reviewedAt: string | null;
  linkedScenarioCount: number;
};

export type IntelligenceData = {
  displayName: string;
  roles: AppRole[];
  records: IntelligenceEvidence[];
};

export type IntelligenceFilters = {
  query: string;
  topic: string;
  status: string;
};
