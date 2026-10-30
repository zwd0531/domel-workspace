import type { AppRole } from "@/domain/permissions/policy";
import type { ScenarioInputs, ScenarioResult } from "@/domain/scenario/types";

export type ScenarioProduct = {
  id: string;
  code: string;
  name: string;
  family: string;
  baseline: ScenarioInputs | null;
};

export type EvidenceRecord = {
  id: string;
  title: string;
  publisher: string;
  sourceUrl: string;
  publishedOn: string | null;
  topic: string;
  fact: string;
  interpretation: string;
  limitations: string;
  verificationStatus: string;
};

export type ScenarioSnapshot = {
  id: string;
  inputs: ScenarioInputs;
  result: ScenarioResult;
  formulaVersion: string;
  rationale: string;
  createdAt: string;
  createdBy: string;
};

export type SavedScenario = {
  id: string;
  productId: string;
  businessMonth: string;
  name: string;
  status: "draft" | "submitted" | "approved" | "rejected" | "archived";
  version: number;
  ownerId: string;
  updatedAt: string;
  evidenceIds: string[];
  snapshots: ScenarioSnapshot[];
};

export type ScenarioWorkspaceData = {
  userId: string;
  displayName: string;
  roles: AppRole[];
  businessMonth: string;
  products: ScenarioProduct[];
  evidence: EvidenceRecord[];
  scenarios: SavedScenario[];
};
