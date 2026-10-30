# Conditional decision workflow UAT

This check requires a configured Supabase UAT environment and two different active accounts. It proves the four-eyes control; a single account cannot complete it.

## Accounts and setup

- Account A: `decision_owner`, owns the test scenario.
- Account B: a different `decision_owner` or `admin`.
- Optional Account C: `sales`, `production_planner` or `quality_engineer` for denial checks.
- Apply migrations `0001` through `0006` in order and load the development seed only in UAT.

## Acceptance path

1. Sign in as Account A, create a scenario and save at least one immutable snapshot.
2. In **Conditional decision**, select the intended snapshot, enter a recommendation and a measurable review trigger, then submit it.
3. Confirm the scenario status becomes `submitted`, its snapshot controls become read-only and a `decision.submitted` audit event exists.
4. Confirm Account B receives **Decision awaiting review**. Account A must not receive the approval request.
5. While still signed in as Account A, verify no approval controls appear. A direct call to `review_scenario_decision` with Account A's token must return SQLSTATE `42501`.
6. Sign in as Account B, open the notification and approve the decision with an optional review note.
7. Confirm the decision and scenario become `approved`, the reviewer and timestamp are stored, and `decision.approved` exists in `audit_events`.
8. Return to Account A and confirm **Decision approved** appears. Mark it read and confirm only `read_at` changes.

## Rejection path

1. Repeat with a new scenario and Account A.
2. As Account B, try to reject without a note; the request must fail.
3. Reject with a clear reason. Confirm the decision and scenario become `rejected`, `decision.rejected` is audited and Account A is notified.
4. As Account A, save a revised snapshot and submit a new decision. The rejected decision must remain in history.

## Denial and integrity checks

- Account C cannot call either decision function.
- Direct `insert`, `update` or `delete` on `decisions` is denied to `authenticated`.
- A snapshot ID from another scenario is rejected.
- A second pending decision for the same scenario is rejected.
- A submitted, approved or archived scenario cannot receive another snapshot.
- An approved or archived scenario cannot be submitted again.
- A user can read and mark only their own notifications; notification creation remains database-controlled.

Record the two account IDs, decision ID, snapshot ID, HTTP results and matching audit-event IDs as UAT evidence. Do not use production customer data for this test.
