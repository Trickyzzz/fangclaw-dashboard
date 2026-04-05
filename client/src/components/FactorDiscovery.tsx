import { useState } from "react";
import { useFactorDiscovery } from "@/lib/api";
import {
  Radar, Loader2, AlertTriangle, Shield, Eye, Zap,
  ArrowRight, ChevronDown, ChevronUp, Scale, Lightbulb, ShieldAlert
} from "lucide-react";

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
  poolHealthAssessment: string;
  trendSummary: string;
  watchlist: string[];
  riskWarnings: string[];
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
  const mutation = useFactorDiscovery();

  const handleDiscover = async () => {
    if (mutation.isPending) return;
    try {
      const res = await mutation.mutateAsync();
      setResult(res as DiscoveryResult);
    } catch (err) {
      console.error("Discovery failed:", err);
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
                扫描中...
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
            <p className="text-base text-foreground font-semibold">AI 正在扫描因子信号...</p>
            <p className="text-sm text-muted-foreground mt-1.5">
              分析目标池 → 匹配因子模板 → 检测交叉信号 → 生成建议
            </p>
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
      {result && !mutation.isPending && (
        <div className="flex-1 overflow-y-auto">
          {/* Health Assessment */}
          <div className="px-5 py-4 border-b border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-fang-green" />
              <span className="text-sm font-semibold text-foreground uppercase tracking-wider">目标池健康度</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{result.poolHealthAssessment}</p>
          </div>

          {/* Trend Summary */}
          <div className="px-5 py-4 border-b border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-fang-cyan" />
              <span className="text-sm font-semibold text-foreground uppercase tracking-wider">趋势总结</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{result.trendSummary}</p>
          </div>

          {/* Discovered Signals */}
          <div className="px-5 py-4 border-b border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-fang-amber" />
              <span className="text-sm font-semibold text-foreground uppercase tracking-wider">
                发现信号（{result.discoveredSignals.length}）
              </span>
            </div>
            <div className="space-y-2">
              {result.discoveredSignals.map((signal, i) => (
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
                      {signal.affectedSymbols.length > 0 && (
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
          {result.watchlist.length > 0 && (
            <div className="px-5 py-3 border-b border-border/20">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">重点关注</span>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {result.watchlist.map(s => (
                  <span key={s} className="text-sm px-2.5 py-1 bg-fang-amber/10 text-fang-amber border border-fang-amber/20 font-data">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Risk Warnings */}
          {result.riskWarnings.length > 0 && (
            <div className="px-5 py-4 border-b border-border/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-fang-red" />
                <span className="text-sm text-fang-red uppercase tracking-wider font-semibold">风险预警</span>
              </div>
              <div className="space-y-2">
                {result.riskWarnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 bg-fang-red/5 border border-fang-red/15">
                    <span className="font-data text-xs text-fang-red font-bold mt-0.5">!</span>
                    <p className="text-sm text-foreground/70">{w}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          {result.disclaimer && (
            <div className="px-5 py-3 bg-[#060A13]/60">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground/60 leading-relaxed">{result.disclaimer}</p>
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
            <p className="text-base text-muted-foreground">点击"主动扫描"启动因子发现</p>
            <p className="text-sm text-muted-foreground/60 mt-1.5">
              AI 将基于目标池当前状态，主动发现潜在因子信号
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
