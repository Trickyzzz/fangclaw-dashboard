import type { CandidateSignal } from "./discoveryCandidates";

export type PendingReviewSignal = {
  status: "pending_review";
  signalName: string;
  signalNameEn: string;
  templateCode: string;
  severity: "high" | "medium" | "low";
  description: string;
  affectedSymbols: string[];
  suggestedAction: string;
  confidence: number;
  upgradeReadiness: number;
  reviewReason: string;
  evidenceGap: string[];
};

function severityFor(candidate: CandidateSignal): PendingReviewSignal["severity"] {
  if (candidate.confidence >= 80 || candidate.upgradeReadiness >= 80) return "high";
  if (candidate.confidence >= 60 || candidate.upgradeReadiness >= 60) return "medium";
  return "low";
}

export function buildPendingReviewSignals(candidates: CandidateSignal[]): PendingReviewSignal[] {
  return candidates
    .filter(candidate => candidate.upgradeRecommendation.level === "ready_for_review")
    .map(candidate => ({
      status: "pending_review" as const,
      signalName: candidate.title,
      signalNameEn: "Pending Review Candidate",
      templateCode: candidate.factorCodes.join("/") || "UNMAPPED",
      severity: severityFor(candidate),
      description: candidate.reasons.join("；"),
      affectedSymbols: candidate.affectedSymbols,
      suggestedAction: candidate.suggestedAction,
      confidence: candidate.confidence,
      upgradeReadiness: candidate.upgradeReadiness,
      reviewReason: candidate.upgradeRecommendation.reason,
      evidenceGap: candidate.missingEvidence,
    }));
}
