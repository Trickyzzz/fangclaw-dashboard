import { useEvidence, useChangeLogs, CATEGORY_COLORS } from "@/lib/api";
import { useParams, useLocation } from "wouter";
import { useMemo } from "react";
import {
  ArrowLeft, Brain, Shield, AlertTriangle, CheckCircle2,
  ArrowUpRight, ArrowDownRight, Minus, Link2, HelpCircle,
  Clock, FileText, Crosshair, Layers, ExternalLink,
  Loader2, Target, TrendingUp, TrendingDown, BarChart3, FlaskConical, Share2
} from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { trpc } from "@/lib/trpc";

function ShareButton({ evidenceId }: { evidenceId: string }) {
  const shareMut = trpc.share.create.useMutation({
    onSuccess: (data) => {
      const url = `${window.location.origin}/share/${data.token}`;
      navigator.clipboard.writeText(url).then(() => {
        sonnerToast.success("分享链接已复制 / Share link copied");
      }).catch(() => {
        sonnerToast.info(`分享链接: ${url}`);
      });
    },
    onError: () => {
      sonnerToast.error("生成分享链接失败");
    },
  });

  return (
    <button
      onClick={() => shareMut.mutate({ evidenceId })}
      disabled={shareMut.isPending || !evidenceId}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-fang-cyan transition-colors"
      title="分享此分析 Share this analysis"
    >
      <Share2 className="w-3.5 h-3.5" />
      <span>分享</span>
    </button>
  );
}

function DirectionIcon({ direction }: { direction: string }) {
  switch (direction) {
    case "up":
      return <ArrowUpRight className="w-4 h-4 text-fang-green" />;
    case "down":
      return <ArrowDownRight className="w-4 h-4 text-fang-red" />;
    default:
      return <Minus className="w-4 h-4 text-muted-foreground" />;
  }
}

function ConfidenceMeter({ value }: { value: number }) {
  const color = value >= 70 ? "#00D4AA" : value >= 40 ? "#F59E0B" : "#EF4444";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-data text-lg font-bold" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

/**
 * P2-B: 因果链流程图节点
 * 每个节点标注：事件/实体 → 影响路径 → 受影响公司
 */
type NodeType = "event" | "entity" | "reasoning" | "impact";

function getNodeType(step: string, index: number, total: number): NodeType {
  if (index === 0) return "event";
  if (index === total - 1) return "impact";
  // 包含公司名/股票代码的节点视为 entity
  if (/[\u4e00-\u9fa5]{2,}(信息|科技|芯片|半导体|公司|集团|电子)|NVIDIA|ASML|TSM|AMD/.test(step)) return "entity";
  return "reasoning";
}

const NODE_STYLES: Record<NodeType, { color: string; bg: string; border: string; label: string; labelEn: string }> = {
  event:     { color: "#F59E0B", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.3)",  label: "事件",   labelEn: "EVENT" },
  entity:    { color: "#00D4AA", bg: "rgba(0,212,170,0.08)",   border: "rgba(0,212,170,0.3)",   label: "实体",   labelEn: "ENTITY" },
  reasoning: { color: "#3B82F6", bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.3)",  label: "推理",   labelEn: "REASON" },
  impact:    { color: "#EF4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.3)",   label: "影响",   labelEn: "IMPACT" },
};

function CausalFlowNode({ step, index, total }: { step: string; index: number; total: number }) {
  const isLast = index === total - 1;
  const nodeType = getNodeType(step, index, total);
  const style = NODE_STYLES[nodeType];

  return (
    <div className="flex gap-0">
      {/* Left: vertical connector */}
      <div className="flex flex-col items-center w-10 flex-shrink-0">
        {/* Node circle */}
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold font-data flex-shrink-0 mt-1"
          style={{ backgroundColor: style.bg, border: `2px solid ${style.border}`, color: style.color }}
        >
          {index + 1}
        </div>
        {/* Connector line */}
        {!isLast && (
          <div className="flex-1 flex flex-col items-center mt-1 mb-0">
            <div className="w-px flex-1" style={{ backgroundColor: style.border }} />
            <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent" style={{ borderTopColor: style.border }} />
          </div>
        )}
      </div>

      {/* Right: content card */}
      <div
        className="flex-1 px-4 py-3 mb-2"
        style={{ backgroundColor: style.bg, borderLeft: `3px solid ${style.border}` }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[9px] font-data px-1.5 py-0.5 uppercase tracking-wider"
            style={{ color: style.color, backgroundColor: style.color + "15", border: `1px solid ${style.border}` }}
          >
            {style.labelEn}
          </span>
          <span className="text-[10px] text-muted-foreground">{style.label}</span>
        </div>
        <p className="text-sm text-foreground/85 leading-relaxed">{step}</p>
      </div>
    </div>
  );
}

export default function EvidenceDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const evidenceId = params.id || "";

  const { evidence, isLoading, error } = useEvidence(evidenceId);
  const { logs } = useChangeLogs(100);

  // 获取指标数据用于显示名称
  const indicatorsQuery = trpc.indicators.list.useQuery();
  const allIndicators = indicatorsQuery.data ?? [];

  // 关联的变更日志
  const relatedLogs = useMemo(() => {
    return logs.filter(l => l.evidence_id === evidenceId);
  }, [logs, evidenceId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-fang-cyan animate-spin" />
          <p className="text-sm text-muted-foreground">加载证据链详情...</p>
        </div>
      </div>
    );
  }

  if (error || !evidence) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-fang-amber mx-auto" />
          <h2 className="text-lg font-semibold text-foreground">证据链未找到</h2>
          <p className="text-sm text-muted-foreground">Evidence ID: {evidenceId}</p>
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-fang-cyan/15 text-fang-cyan border border-fang-cyan/30 text-sm hover:bg-fang-cyan/25 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回主面板
          </button>
        </div>
      </div>
    );
  }

  const analysis = evidence.analysis;
  const impacts = evidence.impacts ?? [];
  const verificationQuestions = evidence.verificationQuestions ?? [];
  const createdTime = new Date(evidence.createdAt);

  // 将推理过程拆分为步骤
  const reasoningSteps = analysis?.reasoning
    ? analysis.reasoning.split(/[→➜]/).map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation bar */}
      <div className="border-b border-border/50 bg-[#060A13]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-fang-cyan transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回 Back
            </button>
            <div className="h-4 w-px bg-border/50" />
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-fang-cyan" />
              <span className="font-data text-sm text-fang-cyan font-semibold">{evidenceId}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShareButton evidenceId={evidenceId ?? ''} />
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-data text-xs text-muted-foreground">
              {createdTime.toLocaleString("zh-CN", { hour12: false })}
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">

        {/* ===== Section 1: 消息来源 Source Message ===== */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-fang-cyan" />
            <h2 className="text-sm font-semibold text-foreground">消息来源</h2>
            <span className="text-[10px] text-muted-foreground">Source Message</span>
          </div>
          <div className="bg-[#0A0F1A] border border-border/30 px-5 py-4">
            <p className="text-sm text-foreground leading-relaxed">
              "{evidence.sourceMessage}"
            </p>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-[10px] px-2 py-0.5 bg-fang-cyan/10 text-fang-cyan border border-fang-cyan/20 font-data uppercase">
                {evidence.sourceType || "manual"}
              </span>
              {evidence.sourceUrl && (
                <a
                  href={evidence.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-fang-cyan hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  原文链接
                </a>
              )}
            </div>
          </div>
        </section>

        {/* ===== Section 2: 分析概要 Analysis Summary ===== */}
        {analysis && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-fang-green" />
              <h2 className="text-sm font-semibold text-foreground">分析概要</h2>
              <span className="text-[10px] text-muted-foreground">Analysis Summary</span>
            </div>
            <div className="bg-[#0A0F1A] border border-border/30 px-5 py-4 space-y-4">
              <p className="text-sm text-foreground leading-relaxed">
                {analysis.impactAssessment}
              </p>

              {/* Confidence */}
              <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  置信度 Confidence
                </span>
                <div className="mt-1.5">
                  <ConfidenceMeter value={analysis.confidence} />
                </div>
              </div>

              {/* Entities */}
              <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  识别实体 Entities
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {analysis.entities.map((entity, i) => (
                    <span key={i} className="text-[11px] px-2.5 py-1 bg-fang-cyan/8 text-fang-cyan/80 border border-fang-cyan/15">
                      {entity}
                    </span>
                  ))}
                </div>
              </div>

              {/* Related Indicators */}
              {analysis.relatedIndicators.length > 0 && (
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    触发指标 Triggered Indicators
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {analysis.relatedIndicators.map((indId) => {
                      const ind = allIndicators.find((i: any) => i.id === indId);
                      const catColor = ind ? (CATEGORY_COLORS[ind.category] || "#6B7280") : "#6B7280";
                      return (
                        <span
                          key={indId}
                          className="text-[11px] px-2.5 py-1 border flex items-center gap-1.5"
                          style={{ borderColor: catColor + "40", color: catColor, backgroundColor: catColor + "10" }}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          #{indId} {ind?.name || "未知指标"}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ===== Section 3: 因果链流程图 Causal Flow Graph ===== */}
        {analysis && reasoningSteps.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="w-4 h-4 text-fang-cyan" />
              <h2 className="text-sm font-semibold text-foreground">因果推理链</h2>
              <span className="text-[10px] text-muted-foreground">Causal Flow Graph</span>
              <span className="font-data text-[10px] px-1.5 py-0.5 bg-fang-cyan/10 text-fang-cyan border border-fang-cyan/20 ml-1">
                {reasoningSteps.length} 步
              </span>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mb-3">
              {Object.entries(NODE_STYLES).map(([key, s]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-[10px] text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>

            <div className="bg-[#0A0F1A] border border-border/30 px-5 py-4">
              {reasoningSteps.length > 1 ? (
                <div>
                  {reasoningSteps.map((step, i) => (
                    <CausalFlowNode key={i} step={step} index={i} total={reasoningSteps.length} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {analysis.reasoning}
                </p>
              )}
            </div>

            {/* Entities → Impact summary */}
            {impacts.length > 0 && (
              <div className="mt-3 px-4 py-2.5 bg-fang-cyan/5 border border-fang-cyan/15">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">因果链终端</span>
                <span className="text-[10px] text-muted-foreground ml-2">Causal Chain Endpoints</span>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {impacts.map(imp => (
                    <span key={imp.symbol} className={`text-xs px-2 py-0.5 border font-data ${
                      imp.direction === "up" ? "bg-fang-green/10 text-fang-green border-fang-green/20" :
                      imp.direction === "down" ? "bg-fang-red/10 text-fang-red border-fang-red/20" :
                      "bg-muted text-muted-foreground border-border/50"
                    }`}>
                      {imp.name} W{imp.oldWeight}→W{imp.newWeight}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ===== Section 4: 公司池影响 Company Impacts ===== */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-fang-cyan" />
            <h2 className="text-sm font-semibold text-foreground">公司池影响</h2>
            <span className="text-[10px] text-muted-foreground">Company Pool Impacts</span>
            <span className="font-data text-[10px] px-1.5 py-0.5 bg-fang-cyan/10 text-fang-cyan border border-fang-cyan/20 ml-1">
              {impacts.length} 家
            </span>
          </div>

          {impacts.length > 0 ? (
            <div className="space-y-2">
              {impacts.map((impact) => (
                <div key={impact.symbol} className="bg-[#0A0F1A] border border-border/30 px-5 py-3">
                  <div className="flex items-center gap-3 mb-2">
                    <DirectionIcon direction={impact.direction} />
                    <span className="font-data text-xs text-muted-foreground">{impact.symbol}</span>
                    <span className="text-sm font-semibold text-foreground">{impact.name}</span>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="font-data text-sm text-muted-foreground">W{impact.oldWeight}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className={`font-data text-sm font-bold ${
                        impact.direction === "up" ? "text-fang-green" :
                        impact.direction === "down" ? "text-fang-red" :
                        "text-muted-foreground"
                      }`}>
                        W{impact.newWeight}
                      </span>
                      <span className={`font-data text-xs px-1.5 py-0.5 border ml-1 ${
                        impact.direction === "up"
                          ? "bg-fang-green/10 text-fang-green border-fang-green/20"
                          : impact.direction === "down"
                          ? "bg-fang-red/10 text-fang-red border-fang-red/20"
                          : "bg-muted text-muted-foreground border-border/50"
                      }`}>
                        {impact.newWeight > impact.oldWeight ? "+" : ""}{impact.newWeight - impact.oldWeight}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                    {impact.reason}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#0A0F1A] border border-border/30 px-5 py-6 text-center">
              <Shield className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">此消息未对公司池产生直接权重影响</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">No direct weight impact on company pool</p>
            </div>
          )}
        </section>

        {/* ===== Section 4.5: 情景推演 Trend Scenarios ===== */}
        {analysis?.scenarios && analysis.scenarios.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-fang-cyan" />
              <h2 className="text-sm font-semibold text-foreground">趋势推演 · 情景分析</h2>
              <span className="text-[10px] text-muted-foreground">Trend Scenarios</span>
            </div>

            {/* Probability bar */}
            <div className="flex h-2.5 mb-3 overflow-hidden">
              {[...analysis.scenarios].sort((a, b) => b.probability - a.probability).map((s) => {
                const color = s.nameEn.toLowerCase() === "bull" ? "#00D4AA" : s.nameEn.toLowerCase() === "bear" ? "#EF4444" : "#3B82F6";
                return (
                  <div key={s.nameEn} className="h-full" style={{ width: `${s.probability}%`, backgroundColor: color, opacity: 0.7 }} title={`${s.name} ${s.probability}%`} />
                );
              })}
            </div>

            {/* Probability labels */}
            <div className="flex justify-between mb-4">
              {[...analysis.scenarios].sort((a, b) => b.probability - a.probability).map((s) => {
                const color = s.nameEn.toLowerCase() === "bull" ? "#00D4AA" : s.nameEn.toLowerCase() === "bear" ? "#EF4444" : "#3B82F6";
                return (
                  <div key={s.nameEn} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-xs text-muted-foreground">{s.name}</span>
                    <span className="font-data text-sm font-bold" style={{ color }}>{s.probability}%</span>
                  </div>
                );
              })}
            </div>

            {/* Scenario cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {[...analysis.scenarios].sort((a, b) => b.probability - a.probability).map((s) => {
                const isBull = s.nameEn.toLowerCase() === "bull";
                const isBear = s.nameEn.toLowerCase() === "bear";
                const color = isBull ? "#00D4AA" : isBear ? "#EF4444" : "#3B82F6";
                const bg = isBull ? "rgba(0,212,170,0.08)" : isBear ? "rgba(239,68,68,0.08)" : "rgba(59,130,246,0.08)";
                const borderColor = isBull ? "rgba(0,212,170,0.25)" : isBear ? "rgba(239,68,68,0.25)" : "rgba(59,130,246,0.25)";
                const Icon = isBull ? TrendingUp : isBear ? TrendingDown : BarChart3;
                return (
                  <div key={s.nameEn} className="p-4 border" style={{ backgroundColor: bg, borderColor }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" style={{ color }} />
                        <span className="text-sm font-bold" style={{ color }}>{s.name}</span>
                        <span className="text-[10px] text-muted-foreground font-data">{s.nameEn}</span>
                      </div>
                      <span className="font-data text-lg font-bold" style={{ color }}>{s.probability}%</span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-2.5">{s.description}</p>
                    <div className="mb-2">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">触发条件</span>
                      <p className="text-xs text-foreground/60 mt-0.5">{s.trigger}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">池影响</span>
                      <p className="text-xs mt-0.5" style={{ color }}>{s.poolImpact}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ===== Section 5: 线下验证清单 Verification Checklist ===== */}
        {verificationQuestions.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="w-4 h-4 text-fang-amber" />
              <h2 className="text-sm font-semibold text-foreground">线下验证清单</h2>
              <span className="text-[10px] text-muted-foreground">Verification Checklist</span>
            </div>
            <div className="space-y-2">
              {verificationQuestions.map((q, i) => (
                <div key={i} className="bg-fang-amber/5 border border-fang-amber/15 px-5 py-3 flex items-start gap-3">
                  <span className="font-data text-sm text-fang-amber font-bold flex-shrink-0 mt-0.5">
                    Q{i + 1}
                  </span>
                  <p className="text-sm text-foreground/80 leading-relaxed">{q}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== Section 6: 关联变更日志 Related Change Logs ===== */}
        {relatedLogs.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-fang-cyan" />
              <h2 className="text-sm font-semibold text-foreground">关联变更日志</h2>
              <span className="text-[10px] text-muted-foreground">Related Change Logs</span>
              <span className="font-data text-[10px] px-1.5 py-0.5 bg-fang-cyan/10 text-fang-cyan border border-fang-cyan/20 ml-1">
                {relatedLogs.length} entries
              </span>
            </div>
            <div className="bg-[#0A0F1A] border border-border/30 divide-y divide-border/20">
              {relatedLogs.map((log) => {
                const time = new Date(log.timestamp);
                const timeStr = time.toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
                return (
                  <div key={log.id} className="px-5 py-3 flex items-center gap-3">
                    <span className="font-data text-[10px] text-muted-foreground w-16">{timeStr}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 border font-data uppercase ${
                      log.action === "weight" ? "border-fang-amber/30 text-fang-amber" :
                      log.action === "analysis" ? "border-fang-cyan/30 text-fang-cyan" :
                      "border-border/50 text-muted-foreground"
                    }`}>
                      {log.action}
                    </span>
                    {log.symbol && <span className="font-data text-[10px] text-foreground/70">{log.symbol}</span>}
                    {log.name && <span className="text-xs font-medium text-foreground">{log.name}</span>}
                    <span className="text-xs text-muted-foreground flex-1 truncate">
                      {log.message || log.reason || "—"}
                    </span>
                    {log.new_weight !== undefined && log.new_weight !== null && (
                      <span className="font-data text-sm font-bold text-fang-cyan">W{log.new_weight}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ===== Section 7: 因子回测模拟 P2-A ===== */}
        <BacktestSection evidenceId={evidenceId} />

        {/* Bottom spacer */}
        <div className="h-8" />
      </div>
    </div>
  );
}

/**
 * P2-A: 因子回测模拟区块
 */
function BacktestSection({ evidenceId }: { evidenceId: string }) {
  const backtestQuery = trpc.evidence.backtest.useQuery({ evidenceId });
  const backtest = backtestQuery.data;

  if (backtestQuery.isLoading) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-3">
          <FlaskConical className="w-4 h-4 text-fang-cyan" />
          <h2 className="text-sm font-semibold text-foreground">因子回测模拟</h2>
          <span className="text-[10px] text-muted-foreground">Factor Backtest</span>
        </div>
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="w-4 h-4 text-fang-cyan animate-spin" />
          <span className="text-sm text-muted-foreground">加载回测数据...</span>
        </div>
      </section>
    );
  }

  if (!backtest || backtestQuery.isError) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-3">
          <FlaskConical className="w-4 h-4 text-fang-cyan" />
          <h2 className="text-sm font-semibold text-foreground">因子回测模拟</h2>
          <span className="text-[10px] text-muted-foreground">Factor Backtest</span>
        </div>
        <p className="text-sm text-muted-foreground/50 italic">暂无回测数据（需要更多历史证据链数据）</p>
      </section>
    );
  }

  const bt = backtest as {
    evidenceId: string;
    currentDirection: string;
    historicalMatches: { evidenceId: string; matchScore: number; direction: string; createdAt: Date }[];
    totalMatches: number;
    consistencyRate: number;
    confidence: number;
    backtestVerdict: string;
  };

  const verdictColor = bt.backtestVerdict === "consistent" ? "#00D4AA" : bt.backtestVerdict === "mixed" ? "#F59E0B" : "#EF4444";
  const verdictLabel = bt.backtestVerdict === "consistent" ? "一致" : bt.backtestVerdict === "mixed" ? "混合" : "分歧";
  const dirLabel = bt.currentDirection === "up" ? "看多" : bt.currentDirection === "down" ? "看空" : "中性";

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <FlaskConical className="w-4 h-4 text-fang-cyan" />
        <h2 className="text-sm font-semibold text-foreground">因子回测模拟</h2>
        <span className="text-[10px] text-muted-foreground">Factor Backtest</span>
        <span className="font-data text-[10px] px-1.5 py-0.5 bg-fang-cyan/10 text-fang-cyan border border-fang-cyan/20 ml-1">
          {bt.totalMatches} matches
        </span>
      </div>
      <div className="bg-[#0A0F1A] border border-border/30 p-5">
        {/* 概览指标 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">当前方向 Direction</span>
            <div className="font-data text-xl font-bold mt-1 text-foreground">
              {dirLabel}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">一致性 Consistency</span>
            <div className="font-data text-2xl font-bold mt-1" style={{ color: verdictColor }}>
              {bt.consistencyRate}%
            </div>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">历史匹配 Match</span>
            <div className="font-data text-2xl font-bold mt-1 text-fang-cyan">
              {bt.totalMatches} 条
            </div>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">回测结论 Verdict</span>
            <div className="font-data text-xl font-bold mt-1" style={{ color: verdictColor }}>
              {verdictLabel}
            </div>
          </div>
        </div>

        {/* 历史匹配列表 */}
        {bt.historicalMatches.length > 0 && (
          <div className="border-t border-border/20 pt-3">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">历史相似证据链 Historical Matches</span>
            <div className="space-y-1.5 mt-2">
              {bt.historicalMatches.map((m, i) => {
                const matchColor = m.matchScore >= 70 ? "#00D4AA" : m.matchScore >= 40 ? "#F59E0B" : "#6B7280";
                const mDirLabel = m.direction === "up" ? "看多" : m.direction === "down" ? "看空" : "中性";
                return (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="font-data text-muted-foreground w-6">{String(i + 1).padStart(2, '0')}</span>
                    <span className="font-data text-fang-cyan">{m.evidenceId}</span>
                    <span className="font-data font-bold" style={{ color: matchColor }}>{m.matchScore}%</span>
                    <span className={m.direction === bt.currentDirection ? 'text-fang-green' : 'text-fang-red'}>{mDirLabel}</span>
                    <span className="text-muted-foreground ml-auto font-data">
                      {new Date(m.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground/50 leading-relaxed border-t border-border/20 pt-3 mt-3">
          回测基于历史证据链指标重叠度计算，不构成投资建议。历史一致性不代表未来表现。
        </p>
      </div>
    </section>
  );
}
