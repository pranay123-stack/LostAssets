export type ClaimantPath = "living_owner" | "named_beneficiary" | "estate_heir";
export type AssetLocation = "state_held" | "plan_administrator" | "pbgc" | "dol_lost_found";

export type WorkflowTask = { title: string; owner: "Agent" | "Operator" | "Claimant" | "Counsel"; gate?: string };
export type WorkflowStage = { title: string; objective: string; tasks: WorkflowTask[] };

export function buildCaseWorkflow(claimantPath: ClaimantPath, assetLocation: AssetLocation, stateCode: string): WorkflowStage[] {
  const stages: WorkflowStage[] = [
    { title: "1 · Intake & authority", objective: "Establish a lawful, documented basis for work.", tasks: [
      { title: "Record claimant identity, relationship, state, and source of authority.", owner: "Operator" },
      { title: "Collect consent/engagement terms; store only masked identifiers and vault references.", owner: "Operator", gate: "No external research without documented authority." },
      { title: "Generate state-specific official-program and probate checklist.", owner: "Agent" }
    ] }
  ];

  if (claimantPath === "living_owner") stages.push({ title: "2 · Living-owner path", objective: "Support a direct owner claim; probate is not a workflow step.", tasks: [
    { title: "Verify claimant is the owner and identify direct claim channel.", owner: "Operator" },
    { title: "Prepare evidence checklist: identity and address/holder linkage.", owner: "Agent" },
    { title: "Present official portal instructions; claimant completes identity-proofed actions personally.", owner: "Claimant", gate: "No agent portal login or credential handling." }
  ] });
  if (claimantPath === "named_beneficiary") stages.push({ title: "2 · Named-beneficiary path", objective: "Confirm designation and pursue the administrator’s beneficiary process.", tasks: [
    { title: "Obtain death certificate and plan/beneficiary confirmation through authorized channels.", owner: "Operator" },
    { title: "Build plan-administrator document checklist and communication draft.", owner: "Agent" },
    { title: "Approve any administrator outreach or submission.", owner: "Operator", gate: "Human approval required." }
  ] });
  if (claimantPath === "estate_heir") stages.push({ title: "2 · Estate/heir path", objective: "Determine probate authority or a lawful simplified-estate route.", tasks: [
    { title: `Review ${stateCode} state and county requirements for estate authority, small-estate procedures, and heirs.`, owner: "Agent" },
    { title: "Validate relationship evidence, estate status, and authority documents.", owner: "Operator" },
    { title: "Counsel review before relying on an affidavit, assignment, or probate conclusion.", owner: "Counsel", gate: "No legal determination by agent." }
  ] });

  const sourceTasks: Record<AssetLocation, WorkflowStage> = {
    state_held: { title: "3 · State-held property", objective: "Use the official state program and apply finder/contract controls.", tasks: [
      { title: "Search the official state program; direct owner/heir claims are handled through the program.", owner: "Operator" },
      { title: "Verify finder registration, fee cap, contract timing, and solicitation requirements for the jurisdiction.", owner: "Counsel", gate: "Required before any paid-recovery agreement." }
    ] },
    plan_administrator: { title: "3 · Plan administrator", objective: "Locate the employer/plan administrator and follow its claim process.", tasks: [
      { title: "Prepare employer, plan, and document research checklist.", owner: "Agent" },
      { title: "Approve outreach and submit only through authorized human channels.", owner: "Operator", gate: "No autonomous contact or submission." }
    ] },
    pbgc: { title: "3 · PBGC path", objective: "Use PBGC’s matching and benefit process with identity safeguards.", tasks: [
      { title: "Prepare consent and last-four/relationship evidence checklist.", owner: "Agent" },
      { title: "Claimant or authorized representative completes PBGC interaction.", owner: "Operator", gate: "No full SSN in LA Plus; no agent search." }
    ] },
    dol_lost_found: { title: "3 · DOL Lost & Found", objective: "Route the claimant to their own identity-proofed DOL account.", tasks: [
      { title: "Provide user-guided Login.gov and DOL Lost & Found instructions.", owner: "Agent" },
      { title: "Claimant completes the ID-proofed search personally.", owner: "Claimant", gate: "No delegated or agent access." }
    ] }
  };
  stages.push(sourceTasks[assetLocation]);
  stages.push({ title: "4 · Claim package & monitoring", objective: "Build an auditable package and track outcomes.", tasks: [
    { title: "Create a source log, document checklist, and next-action record.", owner: "Agent" },
    { title: "Human review before any external filing or outreach.", owner: "Operator", gate: "Approval required." }
  ] });
  if (claimantPath === "estate_heir") stages.push({ title: "5 · Optional advance review", objective: "Decision support only—never an automatic offer.", tasks: [
    { title: "Refresh heir, estate, timeline, and exposure scores.", owner: "Agent" },
    { title: "Review disclosure, assignment, and product treatment with counsel.", owner: "Counsel", gate: "No pricing or funding without counsel and underwriter approval." },
    { title: "Record the human underwriter decision and rationale.", owner: "Operator", gate: "Human approval required." }
  ] });
  return stages;
}
