import { calculateScenario, validateScenarioInputs } from "@/domain/scenario/calculate";
import { canAny } from "@/domain/permissions/policy";
import { scenarioInputSchema } from "@/domain/scenario/schema";
import { getAuthorizationContext } from "@/server/auth/context";

export async function POST(request: Request) {
  const auth = await getAuthorizationContext();

  if (!auth) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!canAny(auth.roles, "scenario:calculate")) {
    return Response.json({ error: "You do not have permission to calculate scenarios." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = scenarioInputSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid scenario inputs.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const validationErrors = validateScenarioInputs(parsed.data);
  if (validationErrors.length) {
    return Response.json({ error: "Invalid scenario inputs.", details: validationErrors }, { status: 400 });
  }

  return Response.json(calculateScenario(parsed.data));
}
