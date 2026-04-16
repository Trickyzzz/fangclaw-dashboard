import { useState, useMemo, useEffect, useRef } from "react";
import { getWatchOwnerKey, useCompanies, useWatchlist, CHAIN_COLORS, type Company } from "@/lib/api";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { toast as sonnerToast } from "sonner";
import {
  ChevronDown, Filter, Loader2,
  ArrowUpRight, ArrowDownRight, Minus,
  Brain, ExternalLink, Layers, AlertTriangle
  , Star, Plus, Trash2, X, Pencil, Upload
} from "lucide-react";

const CHAIN_FILTERS = ["全部", "关注", "上游", "中游", "下游"] as const;

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

function CompanyRow({
  company,
  index,
  analysis,
  anomalies: companyAnomalies,
  isWatched,
  onToggleWatch,
  onRemoveCompany,
  onEditCompany,
}: {
  company: Company;
  index: number;
  analysis?: AnalysisData;
  anomalies?: AnomalyItem[];
  isWatched: boolean;
  onToggleWatch: (symbol: string) => void;
  onRemoveCompany: (symbol: string) => void;
  onEditCompany: (company: Company) => void;
}) {
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
            <button
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onToggleWatch(company.symbol);
              }}
              className="text-muted-foreground hover:text-fang-amber transition-colors"
              title={isWatched ? "取消关注" : "加入关注"}
            >
              <Star className={`w-3.5 h-3.5 ${isWatched ? "fill-fang-amber text-fang-amber" : ""}`} />
            </button>
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
                <Link
                  href={`/company/${company.symbol}`}
                  className="text-xs text-fang-cyan hover:underline inline-flex items-center gap-1"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3 h-3" />
                  查看战情
                </Link>
                <button
                  type="button"
                  className="text-xs text-fang-cyan hover:underline inline-flex items-center gap-1"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onEditCompany(company);
                  }}
                >
                  <Pencil className="w-3 h-3" />
                  编辑
                </button>
                <button
                  type="button"
                  className="text-xs text-fang-red hover:underline inline-flex items-center gap-1"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onRemoveCompany(company.symbol);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                  移出目标池
                </button>
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
  const [location] = useLocation();
  const { companies, isLoading, refetch: refetchCompanies } = useCompanies();
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const [filter, setFilter] = useState<string>("全部");
  const [sortBy, setSortBy] = useState<"weight" | "name">("weight");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvRows, setCsvRows] = useState<Array<{
    symbol: string;
    name: string;
    sector: string;
    chainPosition: string;
    weight: number;
    tags: string[];
    valid: boolean;
    error?: string;
  }>>([]);
  const [importingCsv, setImportingCsv] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    symbol: "",
    name: "",
    sector: "",
    chainPosition: "中游",
    weight: 5,
    tags: "",
  });
  const [ownerKey, setOwnerKey] = useState<string>("");
  useEffect(() => {
    setOwnerKey(getWatchOwnerKey());
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qFilter = params.get("filter");
    const qSort = params.get("sort");
    if (qFilter && CHAIN_FILTERS.includes(qFilter as (typeof CHAIN_FILTERS)[number])) {
      setFilter(qFilter);
    }
    if (qSort === "weight" || qSort === "name") {
      setSortBy(qSort);
    }
  }, [location]);

  const watchlistApi = useWatchlist(ownerKey);
  const watchlist = watchlistApi.symbols;
  const addCompanyMut = trpc.companies.add.useMutation();
  const removeCompanyMut = trpc.companies.remove.useMutation();
  const updateCompanyMut = trpc.companies.update.useMutation();
  const bulkUpsertMut = trpc.companies.bulkUpsert.useMutation();

  const toggleWatch = (symbol: string) => {
    if (!ownerKey) return;
    if (watchlist.includes(symbol)) {
      watchlistApi.remove.mutate(
        { ownerKey, symbol },
        { onSuccess: () => watchlistApi.refetch() }
      );
    } else {
      watchlistApi.add.mutate(
        { ownerKey, symbol },
        { onSuccess: () => watchlistApi.refetch() }
      );
    }
  };

  const chainOptions = useMemo(
    () => Array.from(new Set(companies.map(c => c.chain_position))).filter(Boolean),
    [companies]
  );

  const submitAddCompany = async () => {
    if (!form.symbol.trim() || !form.name.trim()) {
      sonnerToast.error("请先填写公司代码和公司名称");
      return;
    }
    setAdding(true);
    try {
      await addCompanyMut.mutateAsync({
        symbol: form.symbol.trim().toUpperCase(),
        name: form.name.trim(),
        sector: form.sector.trim() || undefined,
        chainPosition: form.chainPosition,
        weight: Math.max(1, Math.min(10, Number(form.weight) || 5)),
        tags: form.tags
          .split(",")
          .map(v => v.trim())
          .filter(Boolean),
      });
      await refetchCompanies();
      setShowAddForm(false);
      sonnerToast.success(`已保存到目标池：${form.symbol.trim().toUpperCase()} ${form.name.trim()}`);
      setForm({
        symbol: "",
        name: "",
        sector: "",
        chainPosition: chainOptions[0] ?? "中游",
        weight: 5,
        tags: "",
      });
    } catch (error: any) {
      sonnerToast.error(error?.message || "保存失败，请重试");
    } finally {
      setAdding(false);
    }
  };

  const removeCompany = async (symbol: string) => {
    const ok = window.confirm(`确认将 ${symbol} 移出目标池吗？`);
    if (!ok) return;
    try {
      await removeCompanyMut.mutateAsync({ symbol });
      await refetchCompanies();
      sonnerToast.success(`已移出目标池：${symbol}`);
    } catch (error: any) {
      sonnerToast.error(error?.message || "移除失败，请重试");
    }
  };

  const editCompany = async (company: Company) => {
    const name = window.prompt("公司名称", company.name);
    if (name === null) return;
    const sector = window.prompt("行业", company.sector ?? "");
    if (sector === null) return;
    const chainPosition = window.prompt("产业链位置（上游/中游/下游）", company.chain_position);
    if (chainPosition === null) return;
    const weightText = window.prompt("权重（1-10）", String(company.weight));
    if (weightText === null) return;
    const tagsText = window.prompt("标签（逗号分隔）", (company.tags ?? []).join(","));
    if (tagsText === null) return;

    const parsedWeight = Math.max(1, Math.min(10, Number(weightText) || company.weight));

    try {
      await updateCompanyMut.mutateAsync({
        symbol: company.symbol,
        name: name.trim(),
        sector: sector.trim(),
        chainPosition: chainPosition.trim(),
        weight: parsedWeight,
        tags: tagsText.split(",").map(v => v.trim()).filter(Boolean),
      });
      await refetchCompanies();
      sonnerToast.success(`已更新：${company.symbol}`);
    } catch (error: any) {
      sonnerToast.error(error?.message || "更新失败，请重试");
    }
  };

  const parseCsvLine = (line: string) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleCsvImport: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map(v => v.trim())
        .filter(Boolean);
      if (lines.length === 0) {
        sonnerToast.error("CSV 文件为空");
        return;
      }

      const headers = parseCsvLine(lines[0]).map(v => v.toLowerCase());
      const idx = {
        symbol: headers.findIndex(h => ["symbol", "代码", "股票代码"].includes(h)),
        name: headers.findIndex(h => ["name", "公司名", "公司名称"].includes(h)),
        sector: headers.findIndex(h => ["sector", "行业"].includes(h)),
        chainPosition: headers.findIndex(h => ["chainposition", "chain_position", "产业链", "链路位置"].includes(h)),
        weight: headers.findIndex(h => ["weight", "权重"].includes(h)),
        tags: headers.findIndex(h => ["tags", "标签"].includes(h)),
      };

      if (idx.symbol < 0 || idx.name < 0 || idx.chainPosition < 0) {
        sonnerToast.error("CSV 需包含列：symbol(代码), name(公司名), chainPosition(产业链)");
        return;
      }

      const parsedRows = lines.slice(1).map(line => {
        const cols = parseCsvLine(line);
        const tagsRaw = idx.tags >= 0 ? (cols[idx.tags] ?? "") : "";
        const symbol = (cols[idx.symbol] ?? "").trim().toUpperCase();
        const name = (cols[idx.name] ?? "").trim();
        const chainPosition = (cols[idx.chainPosition] ?? "").trim();
        const weight = idx.weight >= 0 ? Math.max(1, Math.min(10, Number(cols[idx.weight]) || 5)) : 5;
        const valid = Boolean(symbol && name && chainPosition);
        return {
          symbol,
          name,
          sector: idx.sector >= 0 ? (cols[idx.sector] ?? "").trim() : "",
          chainPosition,
          weight,
          tags: tagsRaw.split(/[|，,]/).map(v => v.trim()).filter(Boolean),
          valid,
          error: valid ? undefined : "缺少 symbol/name/chainPosition",
        };
      });

      const validRows = parsedRows.filter(row => row.valid);
      if (validRows.length === 0) {
        sonnerToast.error("未解析到有效数据行");
        return;
      }

      setCsvFileName(file.name);
      setCsvRows(parsedRows);
      setShowCsvPreview(true);
    } catch (error: any) {
      sonnerToast.error(error?.message || "CSV 导入失败");
    } finally {
      if (csvInputRef.current) {
        csvInputRef.current.value = "";
      }
    }
  };

  const confirmCsvImport = async () => {
    const items = csvRows
      .filter(row => row.valid)
      .map(row => ({
        symbol: row.symbol,
        name: row.name,
        sector: row.sector,
        chainPosition: row.chainPosition,
        weight: row.weight,
        tags: row.tags,
      }));
    if (items.length === 0) {
      sonnerToast.error("没有可导入的有效行");
      return;
    }
    setImportingCsv(true);
    try {
      const result = await bulkUpsertMut.mutateAsync({ items });
      await refetchCompanies();
      if (result.failedCount > 0) {
        sonnerToast.warning(`导入完成：成功 ${result.successCount}，失败 ${result.failedCount}`);
      } else {
        sonnerToast.success(`导入完成：成功 ${result.successCount} 条`);
      }
      setShowCsvPreview(false);
      setCsvRows([]);
      setCsvFileName("");
    } catch (error: any) {
      sonnerToast.error(error?.message || "导入失败，请重试");
    } finally {
      setImportingCsv(false);
    }
  };

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
    if (filter === "关注") {
      list = list.filter(c => watchlist.includes(c.symbol));
    } else if (filter !== "全部") {
      list = list.filter(c => c.chain_position === filter);
    }
    if (sortBy === "weight") {
      list.sort((a, b) => b.weight - a.weight);
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
    }
    return list;
  }, [companies, filter, sortBy, watchlist]);

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
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleCsvImport}
          />
          <button
            onClick={() => csvInputRef.current?.click()}
            className="text-sm px-3 py-1 border border-fang-cyan/40 text-fang-cyan bg-fang-cyan/10 hover:bg-fang-cyan/15 transition-colors inline-flex items-center gap-1"
          >
            <Upload className="w-3.5 h-3.5" />
            批量导入CSV
          </button>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="text-sm px-3 py-1 border border-fang-green/40 text-fang-green bg-fang-green/10 hover:bg-fang-green/15 transition-colors inline-flex items-center gap-1"
          >
            {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showAddForm ? "收起" : "新增公司"}
          </button>
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

      {showAddForm && (
        <div className="px-5 py-3 border-b border-border/40 bg-[#060A13]/70">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-2.5">
            <input
              value={form.symbol}
              onChange={e => setForm(v => ({ ...v, symbol: e.target.value }))}
              placeholder="代码 (例: 600519)"
              className="bg-black/40 border border-border/40 px-2.5 py-2 text-sm text-foreground"
            />
            <input
              value={form.name}
              onChange={e => setForm(v => ({ ...v, name: e.target.value }))}
              placeholder="公司名"
              className="bg-black/40 border border-border/40 px-2.5 py-2 text-sm text-foreground"
            />
            <input
              value={form.sector}
              onChange={e => setForm(v => ({ ...v, sector: e.target.value }))}
              placeholder="行业"
              className="bg-black/40 border border-border/40 px-2.5 py-2 text-sm text-foreground"
            />
            <select
              value={form.chainPosition}
              onChange={e => setForm(v => ({ ...v, chainPosition: e.target.value }))}
              className="bg-black/40 border border-border/40 px-2.5 py-2 text-sm text-foreground"
            >
              {(chainOptions.length > 0 ? chainOptions : ["上游", "中游", "下游"]).map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={10}
              value={form.weight}
              onChange={e => setForm(v => ({ ...v, weight: Number(e.target.value) }))}
              placeholder="权重"
              className="bg-black/40 border border-border/40 px-2.5 py-2 text-sm text-foreground"
            />
            <input
              value={form.tags}
              onChange={e => setForm(v => ({ ...v, tags: e.target.value }))}
              placeholder="标签,逗号分隔"
              className="bg-black/40 border border-border/40 px-2.5 py-2 text-sm text-foreground"
            />
          </div>
          <div className="mt-2.5 flex items-center justify-end gap-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="text-sm px-3 py-1.5 border border-border/40 text-muted-foreground hover:text-foreground"
              type="button"
            >
              取消
            </button>
            <button
              onClick={submitAddCompany}
              disabled={adding || addCompanyMut.isPending}
              className="text-sm px-3 py-1.5 border border-fang-green/40 text-fang-green bg-fang-green/10 disabled:opacity-60"
              type="button"
            >
              {adding || addCompanyMut.isPending ? "提交中..." : "保存到目标池"}
            </button>
          </div>
        </div>
      )}

      {showCsvPreview && (
        <div className="px-5 py-3 border-b border-border/40 bg-[#060A13]/70">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-sm font-semibold text-foreground">CSV 导入预览</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                文件：{csvFileName} | 有效 {csvRows.filter(r => r.valid).length} 行 / 总计 {csvRows.length} 行
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-sm px-3 py-1.5 border border-border/40 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setShowCsvPreview(false);
                  setCsvRows([]);
                  setCsvFileName("");
                }}
              >
                取消
              </button>
              <button
                type="button"
                className="text-sm px-3 py-1.5 border border-fang-cyan/40 text-fang-cyan bg-fang-cyan/10 disabled:opacity-60"
                onClick={confirmCsvImport}
                disabled={importingCsv || bulkUpsertMut.isPending}
              >
                {importingCsv || bulkUpsertMut.isPending ? "导入中..." : "确认导入"}
              </button>
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto border border-border/30">
            <table className="w-full text-xs">
              <thead className="bg-black/30 sticky top-0">
                <tr className="text-left text-muted-foreground">
                  <th className="px-2 py-1.5">状态</th>
                  <th className="px-2 py-1.5">代码</th>
                  <th className="px-2 py-1.5">名称</th>
                  <th className="px-2 py-1.5">链路</th>
                  <th className="px-2 py-1.5">权重</th>
                  <th className="px-2 py-1.5">备注</th>
                </tr>
              </thead>
              <tbody>
                {csvRows.slice(0, 100).map((row, idx) => (
                  <tr key={`${row.symbol}-${idx}`} className="border-t border-border/20">
                    <td className="px-2 py-1.5">
                      <span className={row.valid ? "text-fang-green" : "text-fang-red"}>
                        {row.valid ? "有效" : "无效"}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 font-data">{row.symbol}</td>
                    <td className="px-2 py-1.5">{row.name}</td>
                    <td className="px-2 py-1.5">{row.chainPosition}</td>
                    <td className="px-2 py-1.5">{row.weight}</td>
                    <td className="px-2 py-1.5 text-muted-foreground">{row.error ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {csvRows.length > 100 && (
            <div className="text-[11px] text-muted-foreground mt-2">
              仅预览前 100 行，导入时会处理全部有效行。
            </div>
          )}
        </div>
      )}

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
                isWatched={watchlist.includes(company.symbol)}
                onToggleWatch={toggleWatch}
                onRemoveCompany={removeCompany}
                onEditCompany={editCompany}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
