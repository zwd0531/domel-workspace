import type { AppRole } from "@/domain/permissions/policy";

export type DashboardRole = Extract<AppRole, "sales" | "production_planner" | "quality_engineer">;

export type DashboardProduct = {
  id: string;
  code: string;
  name: string;
  family: string;
  application: string;
  ownerLabel: string | null;
};

export type DashboardRow = DashboardProduct & {
  month: string;
  orderCount?: number;
  shippedUnits?: number;
  unitPrice?: number;
  currency?: string;
  plannedUnits?: number;
  producedUnits?: number;
  onTimeRate?: number | null;
  testedUnits?: number;
  passedUnits?: number;
  fieldReturns?: number;
  defectRate?: number | null;
  risk?: "Low" | "Medium" | "High";
  qualityNote?: string | null;
};

export type WorkItem = {
  id: string;
  productId: string | null;
  title: string;
  action: string;
  priority: "Low" | "Medium" | "High";
  dueAt: string | null;
  status: "open" | "completed" | "cancelled";
};

export type DashboardData = {
  role: DashboardRole;
  displayName: string;
  products: DashboardProduct[];
  rows: DashboardRow[];
  workItems: WorkItem[];
  month: string;
  productId: string | null;
};
