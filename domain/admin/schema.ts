import { z } from "zod";
import { APP_ROLES } from "@/domain/permissions/policy";

const databaseId = z.string().uuid();

export const roleAssignmentSchema = z.object({
  userId: databaseId,
  roles: z.array(z.enum(APP_ROLES)).max(APP_ROLES.length),
}).superRefine((value, context) => {
  if (new Set(value.roles).size !== value.roles.length) {
    context.addIssue({ code: "custom", path: ["roles"], message: "Roles must be unique." });
  }
});
