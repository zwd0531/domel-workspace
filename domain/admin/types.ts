import type { AppRole } from "@/domain/permissions/policy";

export const IMPORT_DATASETS = ["sales", "production", "quality", "costs"] as const;
export type ImportDataset = (typeof IMPORT_DATASETS)[number];

export type ImportValue = string | number | null;
export type ImportRow = Record<string, ImportValue>;

export type ImportValidation = {
  dataset: ImportDataset;
  headers: string[];
  rows: ImportRow[];
  errors: string[];
};

export type AdminUser = {
  id: string;
  displayName: string;
  active: boolean;
  createdAt: string;
  roles: AppRole[];
};

export type ImportRun = {
  id: string;
  sourceType: string;
  sourceName: string;
  status: "pending" | "completed" | "failed";
  rowsReceived: number;
  rowsImported: number;
  errors: string[];
  importedBy: string;
  createdAt: string;
  completedAt: string | null;
};

export type AdminWorkspaceData = {
  currentUserId: string;
  displayName: string;
  roles: AppRole[];
  plantCount: number;
  productCount: number;
  users: AdminUser[];
  importRuns: ImportRun[];
};
