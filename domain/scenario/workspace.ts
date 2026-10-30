import type { AppRole } from "@/domain/permissions/policy";
import type { ScenarioAssumptionAnalysis } from "@/domain/ai/assumption-analysis";
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

export type DecisionRecord = {
  id: string;
  scenarioId: string;
  snapshotId: string;
  title: string;
  recommendation: string;
  reviewTrigger: string;
  status: "submitted" | "approved" | "rejected" | "archived";
  submittedBy: string;
  reviewedBy: string | null;
  reviewNote: string;
  reviewedAt: string | null;
  createdAt: string;
};

export type WorkflowNotification = {
  id: string;
  title: string;
  body: string;
  entityType: string;
  entityId: string;
  readAt: string | null;
  createdAt: string;
};

export type ScenarioAiAnalysisRecord = {
  id: string;
  scenarioId: string;
  snapshotId: string | null;
  inputText: string;
  analysis: ScenarioAssumptionAnalysis;
  engine: "local_rules" | "openai";
  model: string | null;
  createdAt: string;
};

export type ScenarioWorkspaceData = {
  userId: string;
  displayName: string;
  roles: AppRole[];
  businessMonth: string;
  products: ScenarioProduct[];
  evidence: EvidenceRecord[];
  scenarios: SavedScenario[];
  decisions: DecisionRecord[];
  notifications: WorkflowNotification[];
  aiAnalyses: ScenarioAiAnalysisRecord[];
};
