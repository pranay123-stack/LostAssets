export type ProbateUnderwritingInput = {
  heirEvidence: number;
  assetLiquidity: number;
  liabilityCertainty: number;
  contestRisk: number;
  stateComplexity: number;
  dataFreshnessDays: number;
  expectedNetShare: number;
  requestedAdvance: number;
  timelineMonths: number;
  estateConcentrationPct: number;
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function scoreProbateAdvance(input: ProbateUnderwritingInput) {
  const ltv = input.expectedNetShare > 0 ? (input.requestedAdvance / input.expectedNetShare) * 100 : 100;
  const coverage = input.expectedNetShare > 0 ? Math.min(100, (input.expectedNetShare / Math.max(input.requestedAdvance, 1) / 3) * 100) : 0;
  const heirConfidence = clamp(input.heirEvidence);
  const estateQuality = clamp(input.assetLiquidity * 0.35 + input.liabilityCertainty * 0.35 + coverage * 0.30);
  const freshnessPenalty = Math.min(25, Math.floor(input.dataFreshnessDays / 14) * 3);
  const timelineScore = clamp(100 - input.timelineMonths * 3 - input.contestRisk * 0.4 - input.stateComplexity * 0.2 - freshnessPenalty);
  const exposureScore = clamp(100 - Math.max(0, input.estateConcentrationPct - 10) * 2 - Math.max(0, ltv - 20) * 1.5);
  const composite = Math.round(heirConfidence * 0.30 + estateQuality * 0.35 + timelineScore * 0.20 + exposureScore * 0.15);

  const hardStop = heirConfidence < 70 || estateQuality < 65 || ltv > 40 || input.contestRisk > 65;
  const pricingBand = hardStop ? "Manual review — do not price" : composite >= 85 && ltv <= 20 && input.timelineMonths <= 9
    ? "Scenario A · 10–18% discount"
    : composite >= 75 && ltv <= 28
      ? "Scenario B · 18–24% discount"
      : composite >= 65 && ltv <= 35
        ? "Scenario C · 24–30% discount"
        : "Manual review — do not price";

  const drivers = [
    heirConfidence < 75 ? "Heir evidence is below the preferred threshold." : "Heir evidence is strong.",
    estateQuality < 70 ? "Estate coverage or liability evidence needs work." : "Estate coverage supports the requested advance.",
    timelineScore < 65 ? "Timeline, contest risk, state complexity, or stale data increases duration risk." : "Timeline and process risk are within the model range.",
    ltv > 30 ? "Advance-to-expected-share ratio exceeds the preferred range." : "Advance-to-expected-share ratio is within the preferred range."
  ];

  return { heirConfidence: Math.round(heirConfidence), estateQuality: Math.round(estateQuality), timelineScore: Math.round(timelineScore), exposureScore: Math.round(exposureScore), composite, ltv: Math.round(ltv * 10) / 10, pricingBand, hardStop, drivers };
}
