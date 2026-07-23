export type FamilyAssetInput = {
  identityResolution: number;
  deathEvidence: number;
  probateEvidence: number;
  relationshipEvidence: number;
  addressContinuity: number;
  localAssetSignals: number;
  retirementSignals: number;
  insuranceSignals: number;
  probateAssetSignals: number;
  deathCertificateVerified: boolean;
  authorityVerified: boolean;
};

const bounded = (value: number) => Math.max(0, Math.min(100, value));

export function scoreFamilyAssetIntelligence(input: FamilyAssetInput) {
  const deceasedParentConfidence = Math.round(bounded(input.identityResolution * 0.20 + input.deathEvidence * 0.40 + input.probateEvidence * 0.20 + input.addressContinuity * 0.20));
  const assetLikelihood = Math.round(bounded(input.localAssetSignals * 0.35 + input.retirementSignals * 0.30 + input.insuranceSignals * 0.20 + input.probateAssetSignals * 0.15));
  const heirPathConfidence = Math.round(bounded(input.relationshipEvidence * 0.55 + input.probateEvidence * 0.25 + input.identityResolution * 0.20));
  const evidenceReady = input.deathCertificateVerified && input.authorityVerified;
  const nextAction = !input.deathCertificateVerified
    ? "Obtain and validate a death certificate or equivalent official death record."
    : !input.authorityVerified
      ? "Validate beneficiary designation, letters, or a state-appropriate estate-authority document."
      : assetLikelihood >= 70 && heirPathConfidence >= 70
        ? "Human reviewer: approve a claim-package or probate-path review."
        : "Human reviewer: gather additional asset, relationship, or estate evidence before proceeding.";
  return { deceasedParentConfidence, assetLikelihood, heirPathConfidence, evidenceReady, nextAction };
}
