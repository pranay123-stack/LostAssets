export interface StateRule {
  state: string;
  name: string;
  website: string;
  claimProcess: string;
  documentationRequired: string[];
  timeline: string;
  maxCommission: string;
  probateAdvanceStatus?: string;
  probateAdvanceNotes?: string;
}

const STATE_RULE_OVERRIDES: Record<string, StateRule> = {
  CA: {
    state: "CA",
    name: "California State Controller's Office",
    website: "https://www.sco.ca.gov/upd_msg.html",
    claimProcess: "Search the online database. E-claim is available for many properties. Paper forms required if proving heirship or business entity.",
    documentationRequired: ["Photo ID", "SSN Proof", "Proof of Address (current and past)", "Death certificate (if claiming as heir)"],
    timeline: "Usually 30-60 days for e-claims, 180 days for paper claims.",
    maxCommission: "10%",
  },
  NV: {
    state: "NV",
    name: "Nevada State Treasurer",
    website: "https://unclaimednv.com",
    claimProcess: "FastTrack online claiming available for clear matches. Otherwise, notarized claim forms must be mailed.",
    documentationRequired: ["Government Issued ID", "SSN Card / Tax Document", "Proof of address matching the property"],
    timeline: "Up to 90 days, but FastTrack claims can clear in 2-3 weeks.",
    maxCommission: "10%",
  },
  OR: {
    state: "OR",
    name: "Oregon State Treasury",
    website: "https://unclaimed.oregon.gov/",
    claimProcess: "Submit claim online. An email with a claim ID and required documentation list will be sent. Upload documents to the portal.",
    documentationRequired: ["Driver's License", "Social Security Number proof", "Utility bill or bank statement"],
    timeline: "Usually 120-180 days due to backlog.",
    maxCommission: "10%",
  },
  WA: {
    state: "WA",
    name: "Washington State Department of Revenue",
    website: "https://ucp.dor.wa.gov/",
    claimProcess: "Search database, add properties to a 'cart', and submit. Some cases are approved instantly without documentation.",
    documentationRequired: ["ID", "SSN", "Proof of residency"],
    timeline: "1-2 weeks for express claims, 90 days for complex heirship claims.",
    maxCommission: "5%",
  },
  AZ: {
    state: "AZ",
    name: "Arizona Department of Revenue",
    website: "https://azdor.gov/unclaimed-property",
    claimProcess: "Generate a claim form online, print, sign, and mail/upload with documentation.",
    documentationRequired: ["Valid Photo ID", "Official document verifying SSN", "Original holder documents if possible"],
    timeline: "Typically 60-90 days from receipt of all documents.",
    maxCommission: "30%",
  },
  UT: {
    state: "UT",
    name: "Utah State Treasurer",
    website: "https://mycash.utah.gov/",
    claimProcess: "Online claim generation. Fast-track process handles many simple individual claims completely online.",
    documentationRequired: ["Driver's License or ID", "SSN verification", "Proof of previous address"],
    timeline: "Often resolved within 2-4 weeks for simple claims.",
    maxCommission: "10%",
  },
  ID: {
    state: "ID",
    name: "Idaho State Treasurer's Office",
    website: "https://yourmoney.idaho.gov/",
    claimProcess: "Search and submit a claim online. The system will prompt whether paper documentation is required.",
    documentationRequired: ["Photocopy of picture ID", "Proof of Social Security Number"],
    timeline: "Generally 30-90 days.",
    maxCommission: "20%",
  },
  CO: {
    state: "CO",
    name: "Colorado State Treasurer",
    website: "https://colorado.findyourunclaimedproperty.com/",
    claimProcess: "Submit digitally. CO allows direct document uploads via their web portal for most claim types.",
    documentationRequired: ["Copy of ID", "Proof of Social", "Evidence linking to the old address"],
    timeline: "Usually 30-60 days.",
    maxCommission: "20%",
  },
  IL: {
    state: "IL",
    name: "Illinois State Treasurer",
    website: "https://icash.illinoistreasurer.gov/",
    claimProcess: "Fast Track available for many simple claims online. Others require printing a form, getting it notarized, and mailing.",
    documentationRequired: ["Photo ID", "Social Security Number proof", "Proof of previous addresses"],
    timeline: "Fast Track often pays within 2 weeks. Standard paper claims can take 12-16 weeks.",
    maxCommission: "10%",
  },
  WI: {
    state: "WI",
    name: "Wisconsin Department of Revenue",
    website: "https://tap.revenue.wi.gov/UCP/",
    claimProcess: "Search and file electronically via My Tax Account. Verification usually done electronically.",
    documentationRequired: ["Driver's License or State ID", "Additional docs if requested via mail/email later"],
    timeline: "Usually 2-6 weeks depending on complexity.",
    maxCommission: "20%",
  },
  KY: {
    state: "KY",
    name: "Kentucky State Treasurer",
    website: "https://treasury.ky.gov/unclaimedproperty/",
    claimProcess: "Submit claim online and upload necessary verification documents. Heirship claims and complex claims require notarization.",
    documentationRequired: ["Copy of ID", "Proof of SSN", "Original records (if available)"],
    timeline: "Approximately 60-90 days.",
    maxCommission: "10%",
  },
  TN: {
    state: "TN",
    name: "Tennessee Department of Treasury",
    website: "https://claimit.tn.gov/",
    claimProcess: "Online claim filing with the option to upload supporting documents securely to their portal.",
    documentationRequired: ["Government Issued ID", "Official document showing SSN", "Proof of connection to reported address"],
    timeline: "Typically 4-6 weeks for straightforward electronic filings.",
    maxCommission: "10%",
  },
  TX: {
    state: "TX",
    name: "Texas Comptroller of Public Accounts",
    website: "https://claimittexas.org",
    claimProcess: "Fast Track online processing is available. For complex or high value claims, mailed forms with original signatures are required.",
    documentationRequired: ["Photo ID", "Social Security Number proof", "Proof of address or business relation"],
    timeline: "Generally 30-90 days, though Fast Track is quicker.",
    maxCommission: "10%",
  },
  NY: {
    state: "NY",
    name: "New York State Comptroller",
    website: "https://www.osc.ny.gov/unclaimed-funds",
    claimProcess: "Submit online or print forms. High-value or complex claims often require additional verification and physical mail.",
    documentationRequired: ["Copy of ID", "Proof of SSN/TIN", "Proof of association with the reported address"],
    timeline: "Can take 90-120 days due to high volume.",
    maxCommission: "15%",
  },
};

const ALL_STATES: Array<[string, string]> = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["FL", "Florida"], ["GA", "Georgia"],
  ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"],
  ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
  ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"]
];

const defaultStateRule = (state: string, name: string): StateRule => ({
  state,
  name: `${name} — Unclaimed Property Program`,
  website: "https://unclaimed.org/",
  claimProcess: "Use the NAUPA state directory to open the official state program. Search is free; validate ownership and claim requirements directly with the state office.",
  documentationRequired: ["Government-issued ID", "Evidence linking claimant to reported owner/address", "Heirship or estate authority documents when applicable"],
  timeline: "State-specific; confirm the current processing estimate with the official program before setting client expectations.",
  maxCommission: "Counsel review required: finder registration, contract, fee, solicitation, and cooling-off rules vary by jurisdiction.",
  probateAdvanceStatus: "Counsel review required before any offer or assignment.",
  probateAdvanceNotes: "Confirm probate assignment enforceability, notice/court requirements, consumer-finance treatment, disclosures, and county procedure for the specific estate."
});

export const STATE_RULES: Record<string, StateRule> = Object.fromEntries(
  ALL_STATES.map(([state, name]) => [state, { ...defaultStateRule(state, name), ...STATE_RULE_OVERRIDES[state], state, probateAdvanceStatus: STATE_RULE_OVERRIDES[state]?.probateAdvanceStatus || defaultStateRule(state, name).probateAdvanceStatus, probateAdvanceNotes: STATE_RULE_OVERRIDES[state]?.probateAdvanceNotes || defaultStateRule(state, name).probateAdvanceNotes }])
) as Record<string, StateRule>;
