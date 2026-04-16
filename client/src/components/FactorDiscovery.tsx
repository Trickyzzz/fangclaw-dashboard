import { useEffect, useState } from "react";
import { useCausalAnalysis, useFactorDiscovery } from "@/lib/api";
import { buildCandidateAnalysisMessage } from "@/lib/candidateAnalysis";
import {
  Radar, Loader2, AlertTriangle, Shield, Eye, Zap,
  ArrowRight, ChevronDown, ChevronUp, Scale, Lightbulb, ShieldAlert, ExternalLink
} from "lucide-react";
import { Link } from "wouter";

/**
 * P0-A: 因子发现模式 v3.1 - Agent Swarm 增强版
 * 系统主动扫描当前目标池状态，发现非显而易见的关联和潜在因子信号
 */

type DiscoveredSignal = {
  signalName: string;
  signalNameEn: string;
  templateCode: string;
  severity: "high" | "medium" | "low";
  description: string;
  affectedSymbols: string[];
  suggestedAction: string;
  confidence: number;
  counterArgument?: string;
  nonObviousReason?: string;
};

type DiscoveryResult = {
  discoveredSignals: DiscoveredSignal[];
  pendingReviewSignals?: {
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
  }[];
  candidateSignals?: {
    title: string;
    severity: "watch" | "candidate" | "near_trigger";
    confidence: number;
    upgradeReadiness?: number;
    upgradeRecommendation?: {
      level: "ready_for_review" | "needs_evidence" | "watch_only";
      label: string;
      reason: string;
    };
    upgradeChecklist?: {
      label: string;
      passed: boolean;
      detail: string;
    }[];
    affectedSymbols: string[];
    factorCodes: string[];
    evidenceCount: number;
    reasons: string[];
    missingEvidence: string[];
    suggestedAction: string;
  }[];
  poolHealthAssessment: string;
  trendSummary: string;
  watchlist: string[];
  riskWarnings: string[];
  scanExplanation?: {
    status: "has_signal" | "no_high_confidence_signal";
    headline: string;
    reviewedMaterials: {
      label: string;
      count: number;
      interpretation: string;
    }[];
    whyNoSignal: string[];
    closestTriggers: string[];
    nextSteps: string[];
  };
  scanMeta?: {
    companyCount: number;
    highWeightCount: number;
    avgWeight: number;
    indicatorCount: number;
    triggeredIndicatorCount: number;
    crossTriggeredIndicatorCount: number;
    templateCount: number;
    recentEvidenceCount: number;
    dataSources?: {
      marketNewsCount: number;
      announcementCount: number;
      secFilingCount: number;
      quoteCount: number;
      sourceErrorCount: number;
      hasFreshExternalData: boolean;
    };
  };
  discoveryMode?: "llm" | "fallback";
  llmModel?: string;
  llmError?: string | null;
  elapsedMs?: number;
  disclaimer: string;
  timestamp: number;
};

function SeverityBadge({ severity }: { severity: string }) {
  const styles = {
    high: "bg-fang-red/15 text-fang-red border-fang-red/30",
    medium: "bg-fang-amber/15 text-fang-amber border-fang-amber/30",
    low: "bg-fang-green/15 text-fang-green border-fang-green/30",
  };
  const labels = { high: "高", medium: "中", low: "低" };
  return (
    <span className={`text-[10px] px-2 py-0.5 border font-data ${styles[severity as keyof typeof styles] || styles.low}`}>
      {labels[severity as keyof typeof labels] || severity}
    </span>
  );
}

export default function FactorDiscovery() {
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [expandedSignal, setExpandedSignal] = useState<number | null>(null);
  const [scanStartedAt, setScanStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [candidateEvidence, setCandidateEvidence] = useState<Record<number, string>>({});
  const [activeCandidateIndex, setActiveCandidateIndex] = useState<number | null>(null);
  const mutation = useFactorDiscovery();
  const candidateAnalysis = useCausalAnalysis();
  const safeResult = result
    ? {
        discoveredSignals: Array.isArray(result.discoveredSignals) ? result.discoveredSignals : [],
        pendingReviewSignals: Array.isArray(result.pendingReviewSignals) ? result.pendingReviewSignals : [],
        candidateSignals: Array.isArray(result.candidateSignals) ? result.candidateSignals : [],
        poolHealthAssessment: result.poolHealthAssessment || "暂无目标池健康度评估",
        trendSummary: result.trendSummary || "暂无趋势总结",
        watchlist: Array.isArray(result.watchlist) ? result.watchlist : [],
        riskWarnings: Array.isArray(result.riskWarnings) ? result.riskWarnings : [],
        scanExplanation: result.scanExplanation,
        scanMeta: result.scanMeta,
        discoveryMode: result.discoveryMode || "fallback",
        llmModel: result.llmModel || "",
        llmError: result.llmError || null,
        elapsedMs: result.elapsedMs || 0,
        disclaimer: result.disclaimer || "",
        timestamp: result.timestamp || Date.now(),
      }
    : null;

  useEffect(() => {
    if (!mutation.isPending || !scanStartedAt) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - scanStartedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [mutation.isPending, scanStartedAt]);

  const scanStage =
    elapsedSeconds < 8
      ? "正在读取目标池、指标模板、外部快讯和行情数据..."
      : elapsedSeconds < 25
        ? "正在调用 LLM 进行非显而易见关联发现..."
        : elapsedSeconds < 55
          ? "正在生成反对论点、风险预警和关注清单..."
          : "深度扫描仍在运行，复杂推理可能需要更久，请保持页面打开。";

  const handleDiscover = async () => {
    if (mutation.isPending) return;
    try {
      setScanStartedAt(Date.now());
      setElapsedSeconds(0);
      const res = await mutation.mutateAsync();
      setResult(res as DiscoveryResult);
    } catch (err) {
      console.error("Discovery failed:", err);
    } finally {
      setScanStartedAt(null);
    }
  };

  const handleAnalyzeCandidate = async (
    candidate: NonNullable<DiscoveryResult["candidateSignals"]>[number],
    index: number,
  ) => {
    if (candidateAnalysis.isPending) return;
    setActiveCandidateIndex(index);
    try {
      const response = await candidateAnalysis.mutateAsync({
        message: buildCandidateAnalysisMessage(candidate),
        sourceType: "candidate_signal",
      });
      const evidenceId = (response as { evidenceId?: string }).evidenceId;
      if (evidenceId) {
        setCandidateEvidence(current => ({ ...current, [index]: evidenceId }));
      }
    } finally {
      setActiveCandidateIndex(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Radar className="w-5 h-5 text-fang-cyan" />
            <h2 className="text-lg font-bold text-foreground">因子发现</h2>
            <span className="text-[10px] text-muted-foreground font-data tracking-wider">FACTOR DISCOVERY</span>
          </div>
          <button
            onClick={handleDiscover}
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-fang-cyan/15 text-fang-cyan border border-fang-cyan/30 text-sm font-semibold hover:bg-fang-cyan/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                深度扫描中...
              </>
            ) : (
              <>
                <Radar className="w-4 h-4" />
                主动扫描
              </>
            )}
          </button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          基于目标池当前状态，AI 主动发现潜在因子信号和投资机会
        </p>
      </div>

      {/* Loading */}
      {mutation.isPending && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-10">
          <div className="relative">
            <Radar className="w-12 h-12 text-fang-cyan/30" />
            <Loader2 className="w-7 h-7 text-fang-cyan animate-spin absolute top-2.5 left-2.5" />
          </div>
          <div className="text-center">
            <p className="text-base text-foreground font-semibold">LLM 正在执行深度因子发现...</p>
            <p className="text-sm text-muted-foreground mt-1.5">{scanStage}</p>
            <div className="mt-4 w-80 max-w-[80vw] mx-auto">
              <div className="flex justify-between text-[10px] text-muted-foreground font-data mb-1">
                <span>目标池上下文</span>
                <span>{elapsedSeconds}s</span>
              </div>
              <div className="h-1.5 bg-muted/30 overflow-hidden">
                <div
                  className="h-full bg-fang-cyan transition-all duration-700"
                  style={{ width: `${Math.min(92, 18 + elapsedSeconds * 2)}%` }}
                />
              </div>
              <div className="grid grid-cols-4 gap-1 mt-2 text-[10px] text-muted-foreground">
                <span className={elapsedSeconds >= 0 ? "text-fang-cyan" : ""}>上下文</span>
                <span className={elapsedSeconds >= 8 ? "text-fang-cyan" : ""}>LLM推理</span>
                <span className={elapsedSeconds >= 25 ? "text-fang-cyan" : ""}>风险校验</span>
                <span className={elapsedSeconds >= 55 ? "text-fang-cyan" : ""}>结构化</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {mutation.isError && (
        <div className="mx-5 mt-3 px-4 py-3 bg-fang-red/10 border border-fang-red/30 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-fang-red flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-fang-red font-semibold">扫描失败</p>
            <p className="text-sm text-fang-red/70 mt-0.5">{mutation.error?.message || "请稍后重试"}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {safeResult && !mutation.isPending && (
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-3 border-b border-border/30 bg-[#07121f]/80 flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 border font-data ${
              safeResult.discoveryMode === "llm"
                ? "border-fang-cyan/30 text-fang-cyan bg-fang-cyan/10"
                : "border-fang-amber/30 text-fang-amber bg-fang-amber/10"
            }`}>
              {safeResult.discoveryMode === "llm" ? "LLM 深度扫描" : "LLM 失败后兜底"}
            </span>
            {safeResult.llmModel && (
              <span className="text-[10px] px-2 py-0.5 border border-fang-green/30 text-fang-green bg-fang-green/10 font-data">
                MODEL {safeResult.llmModel}
              </span>
            )}
            {safeResult.elapsedMs > 0 && (
              <span className="text-[10px] text-muted-foreground font-data">
                耗时 {(safeResult.elapsedMs / 1000).toFixed(1)}s
              </span>
            )}
            {safeResult.llmError && (
              <span className="text-[10px] text-fang-amber truncate">
                降级原因：{safeResult.llmError}
              </span>
            )}
          </div>

          {safeResult.scanMeta && (
            <div className="px-5 py-4 border-b border-border/30">
              <div className="flex items-center gap-2 mb-3">
                <Radar className="w-4 h-4 text-fang-cyan" />
                <span className="text-sm font-semibold text-foreground uppercase tracking-wider">扫描覆盖</span>
                <span className="text-[10px] text-muted-foreground font-data">SCAN COVERAGE</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {[
                  ["目标公司", safeResult.scanMeta.companyCount, `高权重 ${safeResult.scanMeta.highWeightCount}`],
                  ["监控指标", safeResult.scanMeta.indicatorCount, `触发 ${safeResult.scanMeta.triggeredIndicatorCount}`],
                  ["交叉因子", safeResult.scanMeta.crossTriggeredIndicatorCount, "跨维信号"],
                  ["因子模板", safeResult.scanMeta.templateCount, `证据链 ${safeResult.scanMeta.recentEvidenceCount}`],
                ].map(([label, value, sub]) => (
                  <div key={label} className="border border-border/30 bg-[#0A0F1A] px-3 py-2">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
                    <div className="font-data text-lg font-bold text-fang-cyan mt-1">{value}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
                  </div>
                ))}
              </div>
              {safeResult.discoveredSignals.length === 0 && safeResult.discoveryMode === "llm" && (
                <div className="mt-3 px-3 py-2 border border-fang-amber/20 bg-fang-amber/5 text-sm text-foreground/75">
                  本次 LLM 已完成覆盖扫描，但没有形成高置信新增信号。建议补充更近的公告、快讯或行情数据后再次扫描。
                </div>
              )}
              {safeResult.scanMeta.dataSources && (
                <div className="mt-3">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">外部数据源覆盖</div>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                    {[
                      ["7x24", safeResult.scanMeta.dataSources.marketNewsCount, "快讯"],
                      ["公告", safeResult.scanMeta.dataSources.announcementCount, "CNINFO"],
                      ["行情", safeResult.scanMeta.dataSources.quoteCount, "IFIND"],
                      ["披露", safeResult.scanMeta.dataSources.secFilingCount, "SEC"],
                      ["异常", safeResult.scanMeta.dataSources.sourceErrorCount, "源错误"],
                    ].map(([label, value, sub]) => (
                      <div key={label} className="border border-border/30 bg-[#060A13] px-3 py-2">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
                        <div className="font-data text-base font-bold text-fang-green mt-1">{value}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Health Assessment */}
          <div className="px-5 py-4 border-b border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-fang-green" />
              <span className="text-sm font-semibold text-foreground uppercase tracking-wider">目标池健康度</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{safeResult.poolHealthAssessment}</p>
          </div>

          {/* Trend Summary */}
          <div className="px-5 py-4 border-b border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-fang-cyan" />
              <span className="text-sm font-semibold text-foreground uppercase tracking-wider">趋势总结</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{safeResult.trendSummary}</p>
          </div>

          {/* Discovered Signals */}
          <div className="px-5 py-4 border-b border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-fang-amber" />
              <span className="text-sm font-semibold text-foreground uppercase tracking-wider">
                发现信号（{safeResult.discoveredSignals.length}）
              </span>
            </div>
            {safeResult.pendingReviewSignals.length > 0 && (
              <div className="border border-fang-green/25 bg-fang-green/5 p-4 mb-3">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-fang-green" />
                  <span className="text-sm font-semibold text-foreground">待复核发现（{safeResult.pendingReviewSignals.length}）</span>
                  <span className="text-[10px] text-muted-foreground font-data">PENDING REVIEW</span>
                </div>
                <div className="space-y-2">
                  {safeResult.pendingReviewSignals.map((signal, index) => (
                    <div key={`${signal.signalName}-${index}`} className="border border-border/30 bg-[#060A13] px-3 py-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <SeverityBadge severity={signal.severity} />
                            <span className="text-sm font-semibold text-foreground">{signal.signalName}</span>
                            <span className="font-data text-[10px] text-fang-green">准备 {signal.upgradeReadiness}%</span>
                            <span className="font-data text-[10px] px-1.5 py-0.5 border border-fang-amber/20 text-fang-amber/80">
                              {signal.templateCode}
                            </span>
                          </div>
                          <p className="text-xs text-foreground/70 mt-1.5 leading-relaxed">{signal.description}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 border border-fang-green/30 text-fang-green bg-fang-green/10 font-data">
                          待复核
                        </span>
                      </div>
                      <div className="mt-2 grid gap-2 lg:grid-cols-2">
                        <div className="text-xs text-muted-foreground leading-relaxed">
                          <p>复核原因：{signal.reviewReason}</p>
                          <p className="mt-1">缺口：{signal.evidenceGap.join("；") || "暂无"}</p>
                        </div>
                        <div className="text-xs text-fang-green/80 leading-relaxed">
                          <p>建议：{signal.suggestedAction}</p>
                          <p className="mt-1">标的：{signal.affectedSymbols.join(" / ") || "暂无"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {safeResult.discoveredSignals.length === 0 && safeResult.candidateSignals.length > 0 && (
              <div className="border border-fang-amber/25 bg-fang-amber/5 p-4 mb-3">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-fang-amber" />
                  <span className="text-sm font-semibold text-foreground">候选信号（未升级为高置信）</span>
                  <span className="text-[10px] text-muted-foreground font-data">CANDIDATES</span>
                </div>
                <div className="space-y-2">
                  {safeResult.candidateSignals.map((candidate, index) => (
                    <div key={`${candidate.title}-${index}`} className="border border-border/30 bg-[#060A13] px-3 py-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-foreground">{candidate.title}</span>
                            <span className="font-data text-[10px] text-fang-amber">{candidate.confidence}%</span>
                            {typeof candidate.upgradeReadiness === "number" && (
                              <span className="font-data text-[10px] text-fang-cyan">升级准备 {candidate.upgradeReadiness}%</span>
                            )}
                            {candidate.upgradeRecommendation && (
                              <span className={`font-data text-[10px] px-1.5 py-0.5 border ${
                                candidate.upgradeRecommendation.level === "ready_for_review"
                                  ? "border-fang-green/30 text-fang-green bg-fang-green/10"
                                  : candidate.upgradeRecommendation.level === "needs_evidence"
                                    ? "border-fang-amber/30 text-fang-amber bg-fang-amber/10"
                                    : "border-border/30 text-muted-foreground bg-muted/10"
                              }`}>
                                {candidate.upgradeRecommendation.label}
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground">证据 {candidate.evidenceCount}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {candidate.affectedSymbols.map(symbol => (
                              <span key={symbol} className="font-data text-[10px] px-1.5 py-0.5 border border-fang-cyan/20 text-fang-cyan/80">
                                {symbol}
                              </span>
                            ))}
                            {candidate.factorCodes.map(code => (
                              <span key={code} className="font-data text-[10px] px-1.5 py-0.5 border border-fang-amber/20 text-fang-amber/80">
                                {code}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 border font-data ${
                          candidate.severity === "near_trigger"
                            ? "border-fang-red/30 text-fang-red bg-fang-red/10"
                            : candidate.severity === "candidate"
                              ? "border-fang-amber/30 text-fang-amber bg-fang-amber/10"
                              : "border-fang-cyan/30 text-fang-cyan bg-fang-cyan/10"
                        }`}>
                          {candidate.severity === "near_trigger" ? "接近触发" : candidate.severity === "candidate" ? "候选" : "观察"}
                        </span>
                      </div>
                      <div className="mt-2 grid gap-2 lg:grid-cols-2">
                        <div className="text-xs text-foreground/70 leading-relaxed">
                          {candidate.reasons.slice(0, 2).map((reason, reasonIndex) => (
                            <p key={reasonIndex}>· {reason}</p>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground leading-relaxed">
                          <p>缺口：{candidate.missingEvidence.join("；")}</p>
                          {candidate.upgradeRecommendation && (
                            <p className="text-fang-amber/80 mt-1">升级建议：{candidate.upgradeRecommendation.reason}</p>
                          )}
                          <p className="text-fang-green/80 mt-1">建议：{candidate.suggestedAction}</p>
                        </div>
                      </div>
                      {Array.isArray(candidate.upgradeChecklist) && candidate.upgradeChecklist.length > 0 && (
                        <div className="mt-2 grid grid-cols-2 lg:grid-cols-5 gap-1.5">
                          {candidate.upgradeChecklist.map(item => (
                            <div
                              key={item.label}
                              className={`border px-2 py-1.5 ${
                                item.passed
                                  ? "border-fang-green/20 bg-fang-green/5"
                                  : "border-border/30 bg-[#03070d]"
                              }`}
                              title={item.detail}
                            >
                              <div className={`text-[10px] font-semibold ${item.passed ? "text-fang-green" : "text-muted-foreground"}`}>
                                {item.passed ? "✓" : "·"} {item.label}
                              </div>
                              <div className="text-[9px] text-muted-foreground/70 mt-0.5 line-clamp-2">{item.detail}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAnalyzeCandidate(candidate, index)}
                          disabled={candidateAnalysis.isPending}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-fang-cyan/30 text-fang-cyan hover:bg-fang-cyan/10 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {candidateAnalysis.isPending && activeCandidateIndex === index ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ArrowRight className="w-3.5 h-3.5" />
                          )}
                          转认知分析
                        </button>
                        {candidateEvidence[index] && (
                          <Link
                            href={`/evidence/${candidateEvidence[index]}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-fang-green/30 text-fang-green hover:bg-fang-green/10"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            查看证据链 {candidateEvidence[index]}
                          </Link>
                        )}
                        {candidateAnalysis.isError && activeCandidateIndex === index && (
                          <span className="text-xs text-fang-red">分析失败：{candidateAnalysis.error?.message}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {safeResult.discoveredSignals.length === 0 && safeResult.scanExplanation && (
              <div className="border border-fang-cyan/20 bg-[#07121f] p-4 mb-3">
                <div className="flex items-start gap-2.5 mb-3">
                  <Lightbulb className="w-4 h-4 text-fang-cyan flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">扫描解释报告</div>
                    <p className="text-sm text-foreground/75 mt-1 leading-relaxed">
                      {safeResult.scanExplanation.headline}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
                  {safeResult.scanExplanation.reviewedMaterials.map(item => (
                    <div key={item.label} className="border border-border/30 bg-[#060A13] px-3 py-2">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</div>
                      <div className="font-data text-base font-bold text-fang-cyan mt-1">{item.count}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{item.interpretation}</div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">为什么没触发</div>
                    <div className="space-y-1.5">
                      {safeResult.scanExplanation.whyNoSignal.map((item, index) => (
                        <p key={index} className="text-xs text-foreground/70 leading-relaxed border-l border-fang-amber/30 pl-2">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">最接近触发</div>
                    <div className="space-y-1.5">
                      {safeResult.scanExplanation.closestTriggers.map((item, index) => (
                        <p key={index} className="text-xs text-foreground/70 leading-relaxed border-l border-fang-cyan/30 pl-2">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">下一步建议</div>
                    <div className="space-y-1.5">
                      {safeResult.scanExplanation.nextSteps.map((item, index) => (
                        <p key={index} className="text-xs text-foreground/70 leading-relaxed border-l border-fang-green/30 pl-2">
                          {item}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {safeResult.discoveredSignals.map((signal, i) => (
                <div key={i} className="border border-border/30 bg-[#0A0F1A]">
                  <button
                    onClick={() => setExpandedSignal(expandedSignal === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-fang-cyan/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <SeverityBadge severity={signal.severity} />
                      <span className="text-sm font-semibold text-foreground">{signal.signalName}</span>
                      <span className="text-[10px] text-muted-foreground font-data">{signal.signalNameEn}</span>
                      {signal.templateCode && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-fang-cyan/10 text-fang-cyan border border-fang-cyan/20 font-data">
                          {signal.templateCode}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-data text-sm ${
                        signal.confidence >= 70 ? "text-fang-green" :
                        signal.confidence >= 40 ? "text-fang-amber" : "text-fang-red"
                      }`}>
                        {signal.confidence}%
                      </span>
                      {expandedSignal === i ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                  {expandedSignal === i && (
                    <div className="px-4 pb-3 space-y-2.5">
                      <p className="text-sm text-foreground/70 leading-relaxed">{signal.description}</p>
                      {Array.isArray(signal.affectedSymbols) && signal.affectedSymbols.length > 0 && (
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">受影响标的</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {signal.affectedSymbols.map(s => (
                              <span key={s} className="text-xs px-2 py-0.5 bg-fang-cyan/8 text-fang-cyan/80 border border-fang-cyan/15 font-data">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-2 px-3 py-2 bg-fang-green/5 border border-fang-green/15">
                        <ArrowRight className="w-4 h-4 text-fang-green flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-fang-green/80">{signal.suggestedAction}</p>
                      </div>
                      {/* 非显而易见关联 */}
                      {signal.nonObviousReason && (
                        <div className="flex items-start gap-2 px-3 py-2 bg-fang-amber/5 border border-fang-amber/15">
                          <Lightbulb className="w-4 h-4 text-fang-amber flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] text-fang-amber uppercase tracking-wider font-semibold">NON-OBVIOUS</span>
                            <p className="text-sm text-foreground/70 mt-0.5">{signal.nonObviousReason}</p>
                          </div>
                        </div>
                      )}
                      {/* 反对论点 */}
                      {signal.counterArgument && (
                        <div className="flex items-start gap-2 px-3 py-2 bg-fang-red/5 border border-fang-red/15">
                          <Scale className="w-4 h-4 text-fang-red flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] text-fang-red uppercase tracking-wider font-semibold">DEVIL'S ADVOCATE</span>
                            <p className="text-sm text-foreground/70 mt-0.5">{signal.counterArgument}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Watchlist */}
          {safeResult.watchlist.length > 0 && (
            <div className="px-5 py-3 border-b border-border/20">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">重点关注</span>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {safeResult.watchlist.map(s => (
                  <span key={s} className="text-sm px-2.5 py-1 bg-fang-amber/10 text-fang-amber border border-fang-amber/20 font-data">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Risk Warnings */}
          {safeResult.riskWarnings.length > 0 && (
            <div className="px-5 py-4 border-b border-border/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-fang-red" />
                <span className="text-sm text-fang-red uppercase tracking-wider font-semibold">风险预警</span>
              </div>
              <div className="space-y-2">
                {safeResult.riskWarnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 bg-fang-red/5 border border-fang-red/15">
                    <span className="font-data text-xs text-fang-red font-bold mt-0.5">!</span>
                    <p className="text-sm text-foreground/70">{w}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          {safeResult.disclaimer && (
            <div className="px-5 py-3 bg-[#060A13]/60">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground/60 leading-relaxed">{safeResult.disclaimer}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !mutation.isPending && !mutation.isError && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-10 text-center">
          <Radar className="w-12 h-12 text-muted-foreground/30" />
          <div>
            <p className="text-base text-muted-foreground">点击"主动扫描"启动 LLM 深度因子发现</p>
            <p className="text-sm text-muted-foreground/60 mt-1.5">
              系统会调用大模型分析目标池、因子模板、近期证据链和潜在交叉信号
            </p>
            <p className="text-xs text-muted-foreground/50 mt-1">
              现在也会同步读取 7x24 快讯、巨潮公告、iFinD 行情和 SEC 披露作为扫描依据
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
