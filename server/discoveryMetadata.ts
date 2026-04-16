type DiscoverySummaryLike = {
  poolSnapshot: {
    totalCompanies: number;
    highWeightCount: number;
    avgWeight: number;
  };
  indicatorSnapshot: {
    total: number;
    triggered: number;
    crossTriggered: number;
  };
  activeTemplates: unknown[];
  recentActivity: unknown[];
};

export function buildDiscoveryScanMeta(summary: DiscoverySummaryLike) {
  return {
    companyCount: summary.poolSnapshot.totalCompanies,
    highWeightCount: summary.poolSnapshot.highWeightCount,
    avgWeight: summary.poolSnapshot.avgWeight,
    indicatorCount: summary.indicatorSnapshot.total,
    triggeredIndicatorCount: summary.indicatorSnapshot.triggered,
    crossTriggeredIndicatorCount: summary.indicatorSnapshot.crossTriggered,
    templateCount: summary.activeTemplates.length,
    recentEvidenceCount: summary.recentActivity.length,
  };
}
