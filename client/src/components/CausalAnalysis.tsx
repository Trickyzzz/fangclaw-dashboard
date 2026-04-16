import { useState, useRef, useEffect } from "react";
import { useCausalAnalysis, useSystemReadiness } from "@/lib/api";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  Brain, Send, Loader2, AlertTriangle, CheckCircle2,
  ArrowUpRight, ArrowDownRight, Minus, Link2, HelpCircle,
  ChevronDown, ChevronUp, Sparkles, ExternalLink, TrendingUp, TrendingDown, BarChart3,
  ShieldAlert, Globe, Lightbulb, Scale, Search, Eye, EyeOff, FileText, Play, Zap
} from "lucide-react";

/**
 * 认知引擎 v3.4 - 统一蜂群共识视图 + 可交互案例体验
 * 改进：雷达图+投票矩阵整合为统一面板
 * 新增：查看完整分析报告入口 + 预置案例一键体验
 */

const EXAMPLE_NEWS = [
  "NVIDIA发布新一代B300 GPU，AI推理性能较上代提升3倍，预计2026年Q3量产",
  "美国商务部宣布将进一步收紧对华半导体设备出口管制，涉及先进封装设备",
  "中芯国际2026年Q1营收同比增长45%，超市场一致预期22%，先进制程产能利用率达95%",
  "字节跳动发布2026年AI算力采购计划，总规模同比翻倍，重点采购国产AI芯片",
  "央行宣布定向降准50bp支持科技创新企业，释放长期资金约8000亿元",
];

/** 预置案例 */
const DEMO_CASE = {
  title: "宇树科技上市 → 理工光科影响分析",
  titleEn: "Unitree IPO → WUTOS Impact",
  message: "宇树科技（Unitree）科创板IPO获上交所受理，拟募资42亿元。2025年营收17.08亿元同比增长335%，人形机器人出货量5500台全球第一。理工光科（300557）作为宇树科技G端市场唯一代理商，双方于2023年签署战略合作协议，共同开发'光纤传感+机器人'一体化解决方案。",
  description: "体验 StockClaw 如何从一条 IPO 新闻出发，自动发现产业链上下游关联，分析对目标池公司的影响。",
};

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

type DimScore = {
  score: number;
  direction: "up" | "down" | "neutral";
  brief: string;
};

type Scenario = {
  name: string;
  nameEn: string;
  probability: number;
  description: string;
  trigger: string;
  poolImpact: string;
};

type AnalysisResult = {
  evidenceId: string;
  summary: string;
  entities: string[];
  relatedIndicators: { id: number; name: string; category: string }[];
  impacts: {
    symbol: string;
    name: string;
    oldWeight: number;
    newWeight: number;
    direction: "up" | "down" | "neutral";
    reason: string;
  }[];
  impactAssessment: string;
  confidence: number;
  confidenceLevel?: "high" | "medium" | "low";
  reasoning: string;
  counterArgument?: string;
  macroRegime?: "expansion" | "contraction" | "policy_pivot" | "liquidity_squeeze" | "stagflation";
  nonObviousInsight?: string;
  verificationQuestions: string[];
  dimensionScores?: {
    fundamental: DimScore;
    technical: DimScore;
    flow: DimScore;
    catalyst: DimScore;
    sentiment: DimScore;
    alternative: DimScore;
  };
  scenarios?: Scenario[];
  totalCompaniesAffected: number;
  signalType?: string;
  disclaimer?: string;
  llmModel?: string;
  llmMode?: "llm" | "fallback";
};

/** 宏观体制映射 */
const MACRO_REGIME_MAP: Record<string, { label: string; labelEn: string; color: string; icon: string }> = {
  expansion: { label: "扩张期", labelEn: "Expansion", color: "#00D4AA", icon: "📈" },
  contraction: { label: "收缩期", labelEn: "Contraction", color: "#EF4444", icon: "📉" },
  policy_pivot: { label: "政策转向", labelEn: "Policy Pivot", color: "#F59E0B", icon: "🔄" },
  liquidity_squeeze: { label: "流动性收紧", labelEn: "Liq. Squeeze", color: "#8B5CF6", icon: "💧" },
  stagflation: { label: "滞胀期", labelEn: "Stagflation", color: "#EC4899", icon: "⚠️" },
};

/** 六维因子定义 */
const DIMENSION_META: { key: string; name: string; nameEn: string; color: string }[] = [
  { key: "fundamental", name: "基本面", nameEn: "Fund.", color: "#00D4AA" },
  { key: "technical", name: "技术面", nameEn: "Tech.", color: "#3B82F6" },
  { key: "flow", name: "资金", nameEn: "Flow", color: "#F59E0B" },
  { key: "catalyst", name: "事件", nameEn: "Cat.", color: "#EF4444" },
  { key: "sentiment", name: "情绪", nameEn: "Sent.", color: "#A855F7" },
  { key: "alternative", name: "替代", nameEn: "Alt.", color: "#06B6D4" },
];

// ========== 统一蜂群共识面板（雷达图 + 投票矩阵整合） ==========
function SwarmConsensusPanel({ scores, confidence }: { scores: Record<string, DimScore>; confidence: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sanitizeScore = (value: unknown) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.min(10, n)) : 0;
  };
  const upCount = Object.values(scores).filter(s => s.direction === "up").length;
  const downCount = Object.values(scores).filter(s => s.direction === "down").length;
  const neutralCount = Object.values(scores).filter(s => s.direction === "neutral").length;
  const avgScore = Object.values(scores).reduce((sum, s) => sum + sanitizeScore(s.score), 0) / 6;

  // 综合信号判断
  const signal = upCount > downCount + 1 ? "bullish" : downCount > upCount + 1 ? "bearish" : "mixed";
  const signalConfig = {
    bullish: { label: "看涨共识", labelEn: "BULLISH", color: "#00D4AA", bg: "bg-fang-green/8", border: "border-fang-green/20" },
    bearish: { label: "看跌共识", labelEn: "BEARISH", color: "#EF4444", bg: "bg-fang-red/8", border: "border-fang-red/20" },
    mixed: { label: "分歧信号", labelEn: "MIXED", color: "#F59E0B", bg: "bg-fang-amber/8", border: "border-fang-amber/20" },
  };
  const sc = signalConfig[signal];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 200;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const maxR = 75;
    const dims = DIMENSION_META;
    const n = dims.length;

    ctx.clearRect(0, 0, size, size);

    // Concentric rings
    for (let ring = 1; ring <= 5; ring++) {
      const r = (ring / 5) * maxR;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = ring === 5 ? `${sc.color}50` : "rgba(255,255,255,0.06)";
      ctx.lineWidth = ring === 5 ? 1.5 : 0.5;
      ctx.stroke();
    }

    // Axes
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Data polygon
    const values = dims.map(d => {
      const s = scores[d.key as keyof typeof scores];
      return s ? sanitizeScore(s.score) / 10 : 0;
    });

    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const idx = i % n;
      const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
      const r = values[idx] * maxR;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = `${sc.color}18`;
    ctx.fill();
    ctx.strokeStyle = `${sc.color}CC`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Data points + labels
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const r = values[i] * maxR;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);

      // Glow effect for high scores
      if (values[i] > 0.7) {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = `${dims[i].color}20`;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = dims[i].color;
      ctx.fill();

      const labelR = maxR + 18;
      const lx = cx + labelR * Math.cos(angle);
      const ly = cy + labelR * Math.sin(angle);
      ctx.font = "bold 10px 'Noto Sans SC', sans-serif";
      ctx.fillStyle = dims[i].color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(dims[i].name, lx, ly);
    }

    // Center score
    ctx.font = "bold 24px 'JetBrains Mono', monospace";
    ctx.fillStyle = sc.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(avgScore.toFixed(1), cx, cy - 6);
    ctx.font = "9px 'Noto Sans SC', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText("综合评分", cx, cy + 12);
  }, [scores, signal]);

  return (
    <div className={`mx-4 mt-3 mb-2 border ${sc.border} ${sc.bg} overflow-hidden`}>
      {/* Panel header */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-border/15">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: sc.color }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: sc.color }}>
            蜂群共识 · SWARM CONSENSUS
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-data text-xs px-2 py-0.5 border" style={{ color: sc.color, borderColor: `${sc.color}40`, backgroundColor: `${sc.color}10` }}>
            {sc.label}
          </span>
          <span className={`font-data text-xs px-2 py-0.5 border ${
            confidence >= 70 ? "text-fang-green border-fang-green/30 bg-fang-green/10" :
            confidence >= 40 ? "text-fang-amber border-fang-amber/30 bg-fang-amber/10" :
            "text-fang-red border-fang-red/30 bg-fang-red/10"
          }`}>
            {confidence}%
          </span>
        </div>
      </div>

      {/* Content: Radar + Dimension details side by side */}
      <div className="flex items-start gap-0">
        {/* Left: Radar chart */}
        <div className="flex-shrink-0 p-3 flex items-center justify-center">
          <canvas ref={canvasRef} className="block" />
        </div>

        {/* Right: Dimension detail cards + vote summary */}
        <div className="flex-1 py-3 pr-4">
          {/* Vote summary bar */}
          <div className="flex items-center gap-4 mb-2.5">
            <div className="flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-fang-green" />
              <span className="font-data text-base font-bold text-fang-green">{upCount}</span>
              <span className="text-[9px] text-muted-foreground">看涨</span>
            </div>
            <div className="flex items-center gap-1">
              <Minus className="w-3 h-3 text-muted-foreground" />
              <span className="font-data text-base font-bold text-muted-foreground">{neutralCount}</span>
              <span className="text-[9px] text-muted-foreground">中性</span>
            </div>
            <div className="flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3 text-fang-red" />
              <span className="font-data text-base font-bold text-fang-red">{downCount}</span>
              <span className="text-[9px] text-muted-foreground">看跌</span>
            </div>
          </div>

          {/* Consensus progress bar */}
          <div className="flex h-1.5 mb-3 overflow-hidden">
            {upCount > 0 && <div className="h-full bg-fang-green" style={{ width: `${(upCount / 6) * 100}%` }} />}
            {neutralCount > 0 && <div className="h-full bg-muted-foreground/30" style={{ width: `${(neutralCount / 6) * 100}%` }} />}
            {downCount > 0 && <div className="h-full bg-fang-red" style={{ width: `${(downCount / 6) * 100}%` }} />}
          </div>

          {/* Dimension cards - 3x2 grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {DIMENSION_META.map(dim => {
              const s = scores[dim.key as keyof typeof scores];
              if (!s) return null;
              const dirColor = s.direction === "up" ? "text-fang-green" : s.direction === "down" ? "text-fang-red" : "text-muted-foreground";
              const dirBg = s.direction === "up" ? "bg-fang-green/6" : s.direction === "down" ? "bg-fang-red/6" : "bg-muted/15";
              return (
                <div key={dim.key} className={`px-2 py-1.5 ${dirBg} border border-border/15 group relative`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: dim.color }} />
                      <span className="text-[10px] font-bold" style={{ color: dim.color }}>{dim.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`font-data text-xs font-bold ${dirColor}`}>{sanitizeScore(s.score)}</span>
                      <DirectionIcon direction={s.direction} />
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight truncate">{s.brief}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== 分析摘要头部 ==========
function AnalysisSummaryHeader({
  result,
  onSwitchToOverview,
}: {
  result: AnalysisResult;
  onSwitchToOverview?: () => void;
}) {
  const regime = result.macroRegime ? MACRO_REGIME_MAP[result.macroRegime] : null;
  const handleSwitchToOverview = () => {
    if (onSwitchToOverview) {
      onSwitchToOverview();
      return;
    }

    window.dispatchEvent(new CustomEvent("fangclaw:switch-tab", { detail: "overview" }));
    window.history.replaceState(null, "", "/?tab=overview");
  };

  return (
    <div className="px-5 py-3 border-b border-border/30">
      {/* Summary line */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 mr-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-fang-green flex-shrink-0" />
            <span className="text-sm font-bold text-foreground">分析完成</span>
            {regime && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold border" style={{ color: regime.color, borderColor: `${regime.color}30`, backgroundColor: `${regime.color}08` }}>
                {regime.icon} {regime.label}
              </span>
            )}
            {result.llmModel && (
              <span
                className={`px-2 py-0.5 text-[10px] font-bold border ${
                  result.llmMode === "fallback"
                    ? "text-fang-amber border-fang-amber/30 bg-fang-amber/10"
                    : "text-fang-cyan border-fang-cyan/30 bg-fang-cyan/10"
                }`}
              >
                MODEL {result.llmModel}
              </span>
            )}
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">{result.summary}</p>
          <div className="mt-2">
            <Link
              href={`/evidence/${result.evidenceId}`}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 border border-fang-cyan/30 bg-fang-cyan/8 text-fang-cyan hover:bg-fang-cyan/15 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Evidence ID: {result.evidenceId}
            </Link>
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground">下一步建议:</span>
            <Link
              href={`/evidence/${result.evidenceId}`}
              className="text-[11px] px-2 py-0.5 border border-fang-cyan/30 text-fang-cyan bg-fang-cyan/10 hover:bg-fang-cyan/20 transition-colors"
            >
              查看证据链详情
            </Link>
            <button
              type="button"
              onClick={handleSwitchToOverview}
              className="text-[11px] px-2 py-0.5 border border-fang-amber/30 text-fang-amber bg-fang-amber/10 hover:bg-fang-amber/20 transition-colors"
            >
              切到态势大屏讲解
            </button>
          </div>
        </div>
      </div>

      {/* Non-obvious insight */}
      {result.nonObviousInsight && (
        <div className="flex items-start gap-2 px-3 py-2 bg-fang-amber/5 border border-fang-amber/15 mb-2">
          <Lightbulb className="w-3.5 h-3.5 text-fang-amber flex-shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/80 leading-relaxed">{result.nonObviousInsight}</p>
        </div>
      )}

      {/* Entity + indicator tags */}
      <div className="flex flex-wrap gap-1.5">
        {result.entities.map((entity, i) => (
          <span key={i} className="text-[10px] px-2 py-0.5 bg-fang-cyan/8 text-fang-cyan/80 border border-fang-cyan/15">
            {entity}
          </span>
        ))}
        {result.relatedIndicators.map((ind) => (
          <span key={ind.id} className="text-[10px] px-2 py-0.5 bg-fang-amber/10 text-fang-amber border border-fang-amber/20">
            #{ind.id} {ind.name}
          </span>
        ))}
      </div>
    </div>
  );
}

// ========== 可视化公司影响卡片 ==========
function ImpactCards({ impacts, total, evidenceId }: { impacts: AnalysisResult["impacts"]; total: number; evidenceId: string }) {
  if (impacts.length === 0) return null;

  return (
    <div className="px-5 py-3 border-b border-border/20">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
          目标池影响 · {total} 家公司 · POOL IMPACT
        </div>
        {/* 查看完整分析报告按钮 */}
        <Link
          href={`/evidence/${evidenceId}`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-fang-cyan/10 text-fang-cyan border border-fang-cyan/25 text-xs font-semibold hover:bg-fang-cyan/20 transition-colors"
        >
          <FileText className="w-3 h-3" />
          查看完整报告
          <ExternalLink className="w-2.5 h-2.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {impacts.map((impact) => {
          const isUp = impact.direction === "up";
          const isDown = impact.direction === "down";
          const borderColor = isUp ? "border-fang-green/30" : isDown ? "border-fang-red/30" : "border-border/30";
          const bgColor = isUp ? "bg-fang-green/5" : isDown ? "bg-fang-red/5" : "bg-muted/10";

          return (
            <div key={impact.symbol} className={`px-3 py-2.5 border ${borderColor} ${bgColor} hover:brightness-110 transition-all`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <DirectionIcon direction={impact.direction} />
                  <span className="text-sm font-bold text-foreground">{impact.name}</span>
                </div>
                <span className="font-data text-xs text-muted-foreground">{impact.symbol}</span>
              </div>
              {/* Weight change visual with animated bar */}
              <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center gap-1">
                  <span className="font-data text-xs text-muted-foreground">W{impact.oldWeight}</span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className={`font-data text-sm font-bold ${
                    isUp ? "text-fang-green" : isDown ? "text-fang-red" : "text-muted-foreground"
                  }`}>
                    W{impact.newWeight}
                  </span>
                </div>
                <span className={`font-data text-[10px] px-1.5 py-0.5 ${
                  isUp ? "bg-fang-green/15 text-fang-green" : isDown ? "bg-fang-red/15 text-fang-red" : "bg-muted/30 text-muted-foreground"
                }`}>
                  {isUp ? "+" : ""}{impact.newWeight - impact.oldWeight}
                </span>
                {/* Mini progress bar */}
                <div className="flex-1 h-1 bg-muted/20 ml-1">
                  <div
                    className={`h-full transition-all duration-700 ${isUp ? "bg-fang-green" : isDown ? "bg-fang-red" : "bg-muted-foreground"}`}
                    style={{ width: `${(impact.newWeight / 10) * 100}%` }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{impact.reason}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ========== 情景推演（简化版） ==========
function ScenarioBar({ scenarios }: { scenarios: Scenario[] }) {
  const sorted = [...scenarios].sort((a, b) => b.probability - a.probability);
  const [expanded, setExpanded] = useState(false);

  const getStyle = (nameEn: string) => {
    switch (nameEn.toLowerCase()) {
      case "bull": return { color: "#00D4AA", icon: TrendingUp, label: "乐观" };
      case "bear": return { color: "#EF4444", icon: TrendingDown, label: "悲观" };
      default: return { color: "#3B82F6", icon: BarChart3, label: "基准" };
    }
  };

  return (
    <div className="px-5 py-3 border-b border-border/20">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full mb-2"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-fang-cyan" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            趋势推演 · SCENARIOS
          </span>
        </div>
        <div className="flex items-center gap-3">
          {sorted.map(s => {
            const style = getStyle(s.nameEn);
            return (
              <span key={s.nameEn} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: style.color }} />
                <span className="font-data text-xs font-bold" style={{ color: style.color }}>{s.probability}%</span>
              </span>
            );
          })}
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>

      <div className="flex h-2 overflow-hidden">
        {sorted.map(s => {
          const style = getStyle(s.nameEn);
          return (
            <div
              key={s.nameEn}
              className="h-full"
              style={{ width: `${s.probability}%`, backgroundColor: style.color, opacity: 0.7 }}
              title={`${s.name} ${s.probability}%`}
            />
          );
        })}
      </div>

      {expanded && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {sorted.map(s => {
            const style = getStyle(s.nameEn);
            const Icon = style.icon;
            return (
              <div key={s.nameEn} className="p-2.5 border" style={{ backgroundColor: `${style.color}08`, borderColor: `${style.color}25` }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className="w-3.5 h-3.5" style={{ color: style.color }} />
                  <span className="text-xs font-bold" style={{ color: style.color }}>{s.name}</span>
                  <span className="font-data text-sm font-bold ml-auto" style={{ color: style.color }}>{s.probability}%</span>
                </div>
                <p className="text-[11px] text-foreground/70 leading-snug mb-1.5">{s.description}</p>
                <div className="text-[10px] text-muted-foreground">
                  <span className="uppercase tracking-wider">触发: </span>{(s.trigger || "").trim() || "待补充触发条件"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ========== 可折叠详情区块 ==========
function CollapsibleSection({ title, titleEn, icon: Icon, color, children }: {
  title: string;
  titleEn: string;
  icon: React.ElementType;
  color: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-5 py-2 border-b border-border/20">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full py-1">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" style={{ color }} />
          <span className="text-xs uppercase tracking-wider font-semibold" style={{ color }}>{title}</span>
          <span className="text-[10px] text-muted-foreground font-data">{titleEn}</span>
        </div>
        {open ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      {open && <div className="mt-2 pb-1">{children}</div>}
    </div>
  );
}

// ========== 预置案例体验入口 ==========
function DemoCaseBanner({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-5 mt-3 border border-fang-cyan/25 bg-fang-cyan/5 overflow-hidden">
      <div className="px-4 py-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Play className="w-4 h-4 text-fang-cyan" />
              <span className="text-sm font-bold text-fang-cyan">案例体验</span>
              <span className="text-[10px] text-muted-foreground font-data">LIVE DEMO</span>
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1">{DEMO_CASE.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{DEMO_CASE.description}</p>
          </div>
          <button
            onClick={onStart}
            className="flex items-center gap-2 px-4 py-2 bg-fang-cyan text-black text-xs font-bold hover:bg-fang-cyan/80 transition-colors flex-shrink-0"
          >
            <Zap className="w-3.5 h-3.5" />
            一键体验
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CausalAnalysis({ onSwitchToOverview }: { onSwitchToOverview?: () => void }) {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showExamples, setShowExamples] = useState(false);
  const [showDemo, setShowDemo] = useState(true);

  const utils = trpc.useUtils();
  const mutation = useCausalAnalysis();
  const { readiness } = useSystemReadiness();

  const normalizeUserInput = (raw: string) => {
    const text = raw.trim();
    if (!text) return text;
    const relationQuestion = /[?？]|有关系|关联|相关|是否/.test(text);
    if (!relationQuestion) return text;
    return [
      `【关系研判请求】${text}`,
      "请先识别消息中的公司实体，并判断是否存在：",
      "1) 直接业务合作关系",
      "2) 供应链上下游关系",
      "3) 共同受益/受损的政策或行业关系",
      "若证据不足，请明确说明“需补充的数据点”。",
    ].join("\n");
  };

  const handleAnalyze = async (inputMessage?: string) => {
    const msg = inputMessage || message;
    if (!msg.trim() || mutation.isPending) return;

    const normalized = normalizeUserInput(msg);
    if (inputMessage) setMessage(normalized);

    try {
      const res = await mutation.mutateAsync({
        message: normalized,
        sourceType: "manual",
      });
      setResult(res as AnalysisResult);
      setShowDemo(false);
      utils.companies.list.invalidate();
      utils.companies.stats.invalidate();
      utils.indicators.list.invalidate();
      utils.changeLogs.list.invalidate();
    } catch (err) {
      console.error("Analysis failed:", err);
    }
  };

  const handleExampleClick = (example: string) => {
    setMessage(example);
    setShowExamples(false);
  };

  const handleDemoStart = () => {
    setMessage(DEMO_CASE.message);
    handleAnalyze(DEMO_CASE.message);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <Brain className="w-5 h-5 text-fang-cyan" />
          <h2 className="text-lg font-bold text-foreground">认知引擎</h2>
          <span className="text-[10px] text-muted-foreground font-data ml-1">COGNITIVE ENGINE · 乐石智能</span>
        </div>
      </div>

      <div className="px-5 py-2 border-b border-border/20 bg-fang-cyan/5 text-[11px] text-muted-foreground flex flex-wrap items-center gap-1.5">
        <span className="text-fang-cyan/90">推荐演示:</span>
        <span>1. 一键体验</span>
        <span>→</span>
        <span>2. 公司影响</span>
        <span>→</span>
        <span>3. 证据链</span>
      </div>

      {/* Input area */}
      <div className="px-5 py-3 border-b border-border/30">
        {readiness?.mode === "demo" && (
          <div className="mb-2 px-3 py-2 border border-fang-amber/30 bg-fang-amber/10 text-xs text-fang-amber">
            当前为演示模式：当外部 LLM 或实时数据不可用时，系统会自动使用本地兜底分析，保证流程可展示。
          </div>
        )}
        <div className="relative">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="输入市场消息、新闻或数据信号..."
            className="w-full h-24 bg-[#0A0F1A] border border-border/50 text-sm text-foreground px-4 py-3 resize-none focus:outline-none focus:border-fang-cyan/50 placeholder:text-muted-foreground/50"
            disabled={mutation.isPending}
          />
          <div className="flex items-center justify-between mt-2">
            <button
              onClick={() => setShowExamples(!showExamples)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-fang-cyan transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              示例
              <ChevronDown className={`w-3 h-3 transition-transform ${showExamples ? "rotate-180" : ""}`} />
            </button>
            <button
              onClick={() => handleAnalyze()}
              disabled={!message.trim() || mutation.isPending}
              className="flex items-center gap-2 px-4 py-1.5 bg-fang-cyan/15 text-fang-cyan border border-fang-cyan/30 text-sm font-semibold hover:bg-fang-cyan/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  开始分析
                </>
              )}
            </button>
          </div>
        </div>

        {showExamples && (
          <div className="mt-2 border border-border/30 bg-[#0A0F1A] divide-y divide-border/20">
            {EXAMPLE_NEWS.map((example, i) => (
              <button
                key={i}
                onClick={() => handleExampleClick(example)}
                className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-fang-cyan/5 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Demo case banner (shown when no result) */}
      {showDemo && !result && !mutation.isPending && (
        <DemoCaseBanner onStart={handleDemoStart} />
      )}

      {/* Error */}
      {mutation.isError && (
        <div className="mx-5 mt-3 px-4 py-3 bg-fang-red/10 border border-fang-red/30 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-fang-red flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-fang-red font-semibold">分析失败</p>
            <p className="text-xs text-fang-red/70 mt-0.5">{mutation.error?.message || "请稍后重试"}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {mutation.isPending && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-10">
          <div className="relative">
            <Brain className="w-12 h-12 text-fang-cyan/30" />
            <Loader2 className="w-7 h-7 text-fang-cyan animate-spin absolute top-2.5 left-2.5" />
          </div>
          <div className="text-center">
            <p className="text-sm text-foreground font-semibold">6个Agent正在协同分析...</p>
            <p className="text-xs text-muted-foreground mt-1">
              基本面 · 技术面 · 资金 · 事件 · 情绪 · 替代数据
            </p>
          </div>
        </div>
      )}

      {/* ========== Results ========== */}
      {result && !mutation.isPending && (
        <div className="flex-1 overflow-y-auto">
          {/* Analysis Summary Header */}
          <AnalysisSummaryHeader result={result} onSwitchToOverview={onSwitchToOverview} />

          {/* Unified Swarm Consensus Panel (Radar + Vote Matrix integrated) */}
          {result.dimensionScores && (
            <SwarmConsensusPanel scores={result.dimensionScores} confidence={result.confidence} />
          )}

          {/* Company Impact Cards with "View Full Report" button */}
          <ImpactCards impacts={result.impacts} total={result.totalCompaniesAffected} evidenceId={result.evidenceId} />

          {/* Scenario Bar */}
          {result.scenarios && result.scenarios.length > 0 && (
            <ScenarioBar scenarios={result.scenarios} />
          )}

          {/* Collapsible: Reasoning */}
          <CollapsibleSection title="推理过程" titleEn="REASONING" icon={Link2} color="#888">
            <p className="text-xs text-foreground/70 leading-relaxed">{result.reasoning}</p>
          </CollapsibleSection>

          {/* Collapsible: Counter Argument */}
          {result.counterArgument && (
            <CollapsibleSection title="反对论点" titleEn="DEVIL'S ADVOCATE" icon={Scale} color="#EF4444">
              <div className="px-3 py-2 bg-fang-red/5 border border-fang-red/15">
                <p className="text-xs text-foreground/80 leading-relaxed">{result.counterArgument}</p>
              </div>
            </CollapsibleSection>
          )}

          {/* Collapsible: Verification */}
          {result.verificationQuestions.length > 0 && (
            <CollapsibleSection title="验证清单" titleEn="VERIFICATION" icon={HelpCircle} color="#F59E0B">
              <div className="space-y-1.5">
                {result.verificationQuestions.map((q, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-2 bg-fang-amber/5 border border-fang-amber/15">
                    <span className="font-data text-xs text-fang-amber font-bold mt-0.5">Q{i + 1}</span>
                    <p className="text-xs text-foreground/80">{q}</p>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Disclaimer */}
          {result.disclaimer && (
            <div className="px-5 py-2">
              <div className="flex items-start gap-2 px-3 py-2 bg-muted/30 border border-border/30">
                <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">{result.disclaimer}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state (when no demo, no result) */}
      {!result && !mutation.isPending && !mutation.isError && !showDemo && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-10 text-center">
          <Brain className="w-12 h-12 text-muted-foreground/30" />
          <div>
            <p className="text-sm text-muted-foreground">输入市场消息，6个Agent将协同分析</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              基本面 · 技术面 · 资金行为 · 事件驱动 · 情绪 · 替代数据
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
