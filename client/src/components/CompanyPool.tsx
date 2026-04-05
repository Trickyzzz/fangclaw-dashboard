import { useState, useMemo } from "react";
import { useCompanies, CHAIN_COLORS, type Company } from "@/lib/api";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  ChevronDown, Filter, Loader2,
  ArrowUpRight, ArrowDownRight, Minus,
  Brain, ExternalLink, Layers, AlertTriangle
} from "lucide-react";

const CHAIN_FILTERS = ["全部", "上游", "中游", "下游"] as const;

function WeightBar({ weight }: { weight: number }) {
  const pct = (weight / 10) * 100;
  return (
    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          background: weight >= 9 ? "#00D4AA" : weight >= 7 ? "#3B82F6" : "#6B7280",
        }}
      />
    </div>
  );
}

function DirectionBadge({ direction }: { direction: string }) {
  switch (direction) {
    case "up":
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-fang-green/10 text-fang-green border border-fang-green/20">
          <ArrowUpRight className="w-3 h-3" /> 看多
        </span>
      );
    case "down":
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-fang-red/10 text-fang-red border border-fang-red/20">
          <ArrowDownRight className="w-3 h-3" /> 看空
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-muted text-muted-foreground border border-border/50">
          <Minus className="w-3 h-3" /> 中性
        </span>
      );
  }
}

function ConfidenceDot({ confidence }: { confidence: number }) {
  const color = confidence >= 70 ? "#00D4AA" : confidence >= 40 ? "#F59E0B" : "#EF4444";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-8 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${confidence}%`, backgroundColor: color }} />
      </div>
      <span className="font-data text-xs font-bold" style={{ color }}>{confidence}%</span>
    </div>
  );
}

type AnalysisData = {
  evidenceId: string;
  direction: string;
  confidence: number;
  summary: string;
  triggeredFactors: number;
  createdAt: Date;
};

function CompanyRow({ company, index, analysis, anomalies: companyAnomalies }: { company: Company; index: number; analysis?: AnalysisData; anomalies?: AnomalyItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const chainColor = CHAIN_COLORS[company.chain_position] || "#6B7280";

  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        className="border-b border-border/30 hover:bg-fang-cyan/5 transition-colors cursor-pointer"
      >
        <td className="px-3 py-3 font-data text-sm text-muted-foreground w-10 text-center">
          {String(index + 1).padStart(2, "0")}
        </td>
        <td className="py-3 w-5">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: chainColor }}
          />
        </td>
        <td className="py-3 font-data text-sm text-muted-foreground w-[80px]">
          {company.symbol}
        </td>
        <td className="py-3 text-base font-semibold text-foreground">
          <span className="inline-flex items-center gap-1.5">
            {company.name}
            {companyAnomalies && companyAnomalies.length > 0 && (
              <AlertTriangle className={`w-3.5 h-3.5 ${
                companyAnomalies.some(a => a.severity === 'high') ? 'text-fang-red' :
                companyAnomalies.some(a => a.severity === 'medium') ? 'text-fang-amber' : 'text-muted-foreground'
              }`} />
            )}
          </span>
        </td>
        <td className="py-3 w-[60px]">
          <span className="text-xs px-2 py-0.5 border whitespace-nowrap" style={{ borderColor: chainColor + "40", color: chainColor }}>
            {company.chain_position}
          </span>
        </td>
        <td className="py-3 text-sm text-muted-foreground w-[100px] truncate">
          {company.sector}
        </td>
        {/* P1: 迷你行动卡 - 方向信号 */}
        <td className="py-3 w-[60px]">
          {analysis ? (
            <DirectionBadge direction={analysis.direction} />
          ) : (
            <span className="text-[10px] text-muted-foreground/40">—</span>
          )}
        </td>
        <td className="py-3 w-[88px]">
          <WeightBar weight={company.weight} />
        </td>
        <td className="py-3 font-data text-base font-bold w-10 text-right" style={{ color: company.weight >= 9 ? "#00D4AA" : company.weight >= 7 ? "#3B82F6" : "#9CA3AF" }}>
          {company.weight}
        </td>
        <td className="py-3 w-6 text-center">
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform inline-block ${expanded ? "rotate-180" : ""}`} />
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-border/30 bg-[#060A13]/40">
          <td colSpan={10} className="px-4 pb-4 pt-3">
            <div className="pl-10 space-y-3">
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {company.tags.map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-1 bg-fang-cyan/8 text-fang-cyan/80 border border-fang-cyan/15">
                    {tag}
                  </span>
                ))}
                <span className="text-xs text-muted-foreground ml-3">
                  加入时间: {company.added_at}
                  {company.last_change && ` | 最近变更: ${company.last_change}`}
                </span>
              </div>

              {/* P1: 迷你行动卡 */}
              {analysis && (
                <div className="border border-border/30 bg-[#0A0F1A] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-3.5 h-3.5 text-fang-cyan" />
                    <span className="text-xs font-semibold text-foreground">AI 最新分析</span>
                    <span className="text-[10px] text-muted-foreground font-data">MINI ACTION CARD</span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                    {/* Direction signal */}
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">方向信号</span>
                      <div className="mt-1">
                        <DirectionBadge direction={analysis.direction} />
                      </div>
                    </div>
                    {/* Confidence */}
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">置信度</span>
                      <div className="mt-1">
                        <ConfidenceDot confidence={analysis.confidence} />
                      </div>
                    </div>
                    {/* Triggered factors */}
                    <div>
                      <div className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">触发因子</span>
                      </div>
                      <span className="font-data text-sm font-bold text-fang-amber mt-1 inline-block">
                        {analysis.triggeredFactors} 个
                      </span>
                    </div>
                    {/* Evidence link */}
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">证据链</span>
                      <div className="mt-1">
                        <Link
                          href={`/evidence/${analysis.evidenceId}`}
                          className="inline-flex items-center gap-1 text-xs text-fang-cyan hover:underline"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" />
                          {analysis.evidenceId}
                        </Link>
                      </div>
                    </div>
                  </div>
                  {/* Summary */}
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                    {analysis.summary}
                  </p>
                </div>
              )}

              {/* P1-B: 异常信号展示 */}
              {companyAnomalies && companyAnomalies.length > 0 && (
                <div className="border border-fang-red/20 bg-fang-red/5 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-fang-red" />
                    <span className="text-xs font-semibold text-fang-red">异常信号</span>
                    <span className="text-[10px] text-muted-foreground font-data">ANOMALY ALERT</span>
                  </div>
                  <div className="space-y-1.5">
                    {companyAnomalies.map((a, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 border font-data ${
                          a.severity === 'high' ? 'bg-fang-red/15 text-fang-red border-fang-red/30' :
                          a.severity === 'medium' ? 'bg-fang-amber/15 text-fang-amber border-fang-amber/30' :
                          'bg-muted text-muted-foreground border-border/50'
                        }`}>
                          {a.severity === 'high' ? '高' : a.severity === 'medium' ? '中' : '低'}
                        </span>
                        <span className="text-xs text-foreground/70">{a.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!analysis && (!companyAnomalies || companyAnomalies.length === 0) && (
                <div className="text-xs text-muted-foreground/50 italic">
                  暂无 AI 分析记录，通过认知引擎输入相关消息后自动生成
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

type AnomalyItem = {
  type: string;
  severity: "high" | "medium" | "low";
  symbol?: string;
  name?: string;
  detail: string;
};

export default function CompanyPool() {
  const { companies, isLoading } = useCompanies();
  const [filter, setFilter] = useState<string>("全部");
  const [sortBy, setSortBy] = useState<"weight" | "name">("weight");

  // P1: 获取每家公司的最新分析摘要
  const analysisQuery = trpc.companies.latestAnalysis.useQuery();
  const analysisMap = analysisQuery.data ?? {};

  // P1-B: 获取异常信号
  const anomaliesQuery = trpc.companies.anomalies.useQuery();
  const anomalies = (anomaliesQuery.data ?? []) as AnomalyItem[];
  // 按 symbol 分组异常
  const anomalyBySymbol = useMemo(() => {
    const map: Record<string, AnomalyItem[]> = {};
    for (const a of anomalies) {
      if (a.symbol) {
        if (!map[a.symbol]) map[a.symbol] = [];
        map[a.symbol].push(a);
      }
    }
    return map;
  }, [anomalies]);

  const filtered = useMemo(() => {
    let list = [...companies];
    if (filter !== "全部") {
      list = list.filter(c => c.chain_position === filter);
    }
    if (sortBy === "weight") {
      list.sort((a, b) => b.weight - a.weight);
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
    }
    return list;
  }, [companies, filter, sortBy]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-fang-cyan animate-spin" />
        <span className="ml-2 text-base text-muted-foreground">加载目标池数据...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-foreground">动态目标池</h2>
          <span className="font-data text-sm px-2 py-0.5 bg-fang-cyan/10 text-fang-cyan border border-fang-cyan/20">
            {filtered.length}/{companies.length}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {CHAIN_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-sm px-3 py-1 border transition-colors ${
                filter === f
                  ? "border-fang-cyan/40 text-fang-cyan bg-fang-cyan/10"
                  : "border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
          <div className="h-4 w-px bg-border/50 mx-1" />
          <button
            onClick={() => setSortBy(sortBy === "weight" ? "name" : "weight")}
            className="text-sm text-muted-foreground hover:text-fang-cyan transition-colors"
          >
            排序: {sortBy === "weight" ? "权重" : "名称"}
          </button>
        </div>
      </div>

      {/* Company table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full table-auto">
          <tbody>
            {filtered.map((company, i) => (
              <CompanyRow
                key={company.symbol}
                company={company}
                index={i}
                analysis={analysisMap[company.symbol] as AnalysisData | undefined}
                anomalies={anomalyBySymbol[company.symbol]}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
