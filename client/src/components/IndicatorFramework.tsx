import { useState } from "react";
import { useIndicators, CATEGORY_COLORS, type Indicator } from "@/lib/api";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle, CheckCircle, ChevronRight, ChevronDown,
  Loader2, Layers, Activity, TrendingUp, DollarSign,
  Zap, Heart, Database, BookOpen
} from "lucide-react";

/**
 * 六维因子视图 - P0-A 升级：2×3 网格卡片 + 指标详情
 * 基本面 / 技术面 / 资金行为 / 事件驱动 / 情绪 / 替代数据
 */

// 六维因子定义（含 category 映射和图标）
const FACTOR_DIMENSIONS: {
  key: string;
  name: string;
  nameEn: string;
  desc: string;
  color: string;
  icon: React.ElementType;
  categories: string[];   // 映射到 DB 中的 category
  indicatorIds: number[]; // 精确映射到指标 ID
}[] = [
  {
    key: "fundamental",
    name: "基本面",
    nameEn: "Fundamental",
    desc: "Fama-French 五因子、ROE、盈利质量",
    color: "#00D4AA",
    icon: TrendingUp,
    categories: ["微观/公司"],
    indicatorIds: [9, 10, 11],
  },
  {
    key: "technical",
    name: "技术面",
    nameEn: "Technical",
    desc: "短期反转、低波动率、换手率异象",
    color: "#3B82F6",
    icon: Activity,
    categories: ["因子/量价"],
    indicatorIds: [14, 15, 16],
  },
  {
    key: "flow",
    name: "资金行为",
    nameEn: "Flow",
    desc: "北向资金、融资融券、大宗交易、龙虎榜",
    color: "#F59E0B",
    icon: DollarSign,
    categories: ["因子/量价", "微观/公司"],
    indicatorIds: [12, 13, 17],
  },
  {
    key: "catalyst",
    name: "事件驱动",
    nameEn: "Catalyst",
    desc: "业绩超预期、高管增减持、并购重组、政策脉冲",
    color: "#EF4444",
    icon: Zap,
    categories: ["事件/催化"],
    indicatorIds: [18, 19, 20],
  },
  {
    key: "sentiment",
    name: "情绪",
    nameEn: "Sentiment",
    desc: "NLP情感分析、分析师预期变化、舆情热度",
    color: "#A855F7",
    icon: Heart,
    categories: ["宏观/政策"],
    indicatorIds: [1, 2, 4],
  },
  {
    key: "alternative",
    name: "替代数据",
    nameEn: "Alternative",
    desc: "电商销量、招聘数据、专利申请、卫星图像",
    color: "#06B6D4",
    icon: Database,
    categories: ["中观/行业"],
    indicatorIds: [3, 5, 6, 7, 8],
  },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "triggered") {
    return (
      <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-fang-red/15 text-fang-red border border-fang-red/30">
        <AlertTriangle className="w-3 h-3" />
        触发
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-fang-green/10 text-fang-green border border-fang-green/20">
      <CheckCircle className="w-3 h-3" />
      正常
    </span>
  );
}

function IndicatorCard({ indicator }: { indicator: Indicator }) {
  const [expanded, setExpanded] = useState(false);
  const catColor = CATEGORY_COLORS[indicator.category] || "#6B7280";

  return (
    <div className="border border-border/30 bg-card/50 hover:bg-card/80 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-start gap-3"
      >
        <span
          className="mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: catColor }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-data text-xs text-muted-foreground">#{String(indicator.id).padStart(2, "0")}</span>
            <span className="text-sm font-semibold text-foreground">{indicator.name}</span>
            <StatusBadge status={indicator.last_status} />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1">
            {indicator.description}
          </p>
        </div>
        <ChevronRight className={`w-4 h-4 text-muted-foreground mt-1.5 flex-shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-3 pl-10 space-y-2 border-t border-border/20 pt-2.5">
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">触发阈值</span>
            <p className="text-sm text-fang-amber mt-0.5">{indicator.threshold}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">示例场景</span>
            <p className="text-sm text-foreground/70 mt-0.5 italic">"{indicator.example}"</p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">数据源</span>
            {indicator.data_sources.map(ds => (
              <span key={ds} className="text-xs px-2 py-0.5 bg-muted text-muted-foreground border border-border/50 font-data">
                {ds}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** 六维因子网格卡片 */
function FactorGridCard({
  factor,
  indicators,
  isSelected,
  onClick,
}: {
  factor: typeof FACTOR_DIMENSIONS[0];
  indicators: Indicator[];
  isSelected: boolean;
  onClick: () => void;
}) {
  const factorIndicators = indicators.filter(i => factor.indicatorIds.includes(i.id));
  const triggered = factorIndicators.filter(i => i.last_status === "triggered").length;
  const total = factorIndicators.length;
  const healthPct = total > 0 ? ((total - triggered) / total) * 100 : 100;

  const Icon = factor.icon;

  // 健康度颜色
  const healthColor = healthPct >= 80 ? "#00D4AA" : healthPct >= 50 ? "#F59E0B" : "#EF4444";
  const healthLabel = healthPct >= 80 ? "健康" : healthPct >= 50 ? "注意" : "警戒";

  return (
    <button
      onClick={onClick}
      className={`text-left p-3.5 border transition-all ${
        isSelected
          ? "border-opacity-60 bg-opacity-10"
          : "border-border/30 bg-card/30 hover:bg-card/60"
      }`}
      style={isSelected ? {
        borderColor: factor.color + "60",
        backgroundColor: factor.color + "08",
      } : {}}
    >
      {/* Top row: icon + name + health badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: factor.color }} />
          <span className="text-sm font-bold text-foreground">{factor.name}</span>
          <span className="text-[10px] text-muted-foreground font-data">{factor.nameEn}</span>
        </div>
        <span
          className="text-[10px] font-data font-bold px-1.5 py-0.5 border"
          style={{
            color: healthColor,
            borderColor: healthColor + "40",
            backgroundColor: healthColor + "15",
          }}
        >
          {healthLabel}
        </span>
      </div>

      {/* Trigger count */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">
          {triggered > 0 ? (
            <span className="text-fang-red">{triggered} 触发</span>
          ) : (
            "无触发"
          )}
          <span className="mx-1">/</span>
          {total} 指标
        </span>
        <span className="font-data text-lg font-bold" style={{ color: healthColor }}>
          {Math.round(healthPct)}
        </span>
      </div>

      {/* Health bar */}
      <div className="w-full h-1.5 bg-border/30 overflow-hidden">
        <div
          className="h-full transition-all"
          style={{
            width: `${healthPct}%`,
            backgroundColor: healthColor,
          }}
        />
      </div>

      {/* Description */}
      <p className="text-[10px] text-muted-foreground mt-2 line-clamp-1">{factor.desc}</p>
    </button>
  );
}

export default function IndicatorFramework() {
  const { indicators, isLoading } = useIndicators();
  const [selectedFactor, setSelectedFactor] = useState<string | null>(null);

  // 根据选中的因子筛选指标
  const filtered = selectedFactor
    ? indicators.filter(i => {
        const factor = FACTOR_DIMENSIONS.find(f => f.key === selectedFactor);
        return factor ? factor.indicatorIds.includes(i.id) : true;
      })
    : indicators;

  const selectedFactorDef = FACTOR_DIMENSIONS.find(f => f.key === selectedFactor);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-fang-cyan animate-spin" />
        <span className="ml-2 text-base text-muted-foreground">加载因子数据...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-fang-cyan" />
            <h2 className="text-lg font-bold text-foreground">六维因子框架</h2>
            <span className="text-xs text-muted-foreground font-data">AION FACTORS</span>
          </div>
          <span className="font-data text-sm text-muted-foreground">
            {filtered.length} / {indicators.length} 指标
          </span>
        </div>

        {/* 2×3 Factor Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {FACTOR_DIMENSIONS.map(factor => (
            <FactorGridCard
              key={factor.key}
              factor={factor}
              indicators={indicators}
              isSelected={selectedFactor === factor.key}
              onClick={() => setSelectedFactor(
                selectedFactor === factor.key ? null : factor.key
              )}
            />
          ))}
        </div>
      </div>

      {/* Filter indicator */}
      {selectedFactor && selectedFactorDef && (
        <div className="px-5 py-2.5 border-b border-border/30 flex items-center justify-between bg-card/20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedFactorDef.color }} />
            <span className="text-sm font-semibold text-foreground">
              {selectedFactorDef.name} — {selectedFactorDef.nameEn}
            </span>
            <span className="text-xs text-muted-foreground">
              {filtered.length} 个指标
            </span>
          </div>
          <button
            onClick={() => setSelectedFactor(null)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 border border-border/30"
          >
            显示全部
          </button>
        </div>
      )}

      {/* Indicator list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.map(indicator => (
          <IndicatorCard key={indicator.id} indicator={indicator} />
        ))}

        {/* P1-A: 因子模板入口 */}
        <FactorTemplatesSection />
      </div>
    </div>
  );
}

/**
 * P1-A: 十大因子模板展示
 */
function FactorTemplatesSection() {
  const [expanded, setExpanded] = useState(false);
  const templatesQuery = trpc.factorTemplates.list.useQuery();
  const templates = templatesQuery.data ?? [];

  return (
    <div className="mt-4 border-t border-border/30 pt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left mb-3"
      >
        <BookOpen className="w-4 h-4 text-fang-amber" />
        <h3 className="text-sm font-semibold text-foreground">因子模板库</h3>
        <span className="text-[10px] text-muted-foreground font-data">FACTOR TEMPLATES</span>
        <span className="font-data text-[10px] px-1.5 py-0.5 bg-fang-amber/10 text-fang-amber border border-fang-amber/20 ml-1">
          {templates.length}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground ml-auto transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="space-y-2">
          {templatesQuery.isLoading ? (
            <div className="flex items-center gap-2 py-3">
              <Loader2 className="w-4 h-4 text-fang-cyan animate-spin" />
              <span className="text-sm text-muted-foreground">加载因子模板...</span>
            </div>
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground/50 italic">暂无因子模板</p>
          ) : (
            templates.map((tpl) => (
              <FactorTemplateCard key={tpl.id} template={tpl} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function FactorTemplateCard({ template }: { template: { id: number; name: string; nameEn: string | null; category: string; description: string | null; signalDefinition: string | null; historicalWinRate: number | null } }) {
  const [open, setOpen] = useState(false);
  const winColor = (template.historicalWinRate ?? 0) >= 60 ? "#00D4AA" : (template.historicalWinRate ?? 0) >= 45 ? "#F59E0B" : "#6B7280";
  return (
    <div className="border border-border/30 bg-card/30">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 flex items-center gap-3"
      >
        <span className="font-data text-xs text-fang-amber font-bold">#{String(template.id).padStart(2, '0')}</span>
        <span className="text-sm font-semibold text-foreground">{template.name}</span>
        <span className="text-[10px] text-muted-foreground font-data">{template.nameEn}</span>
        {template.historicalWinRate != null && (
          <span className="font-data text-[10px] font-bold" style={{ color: winColor }}>
            胜率 {template.historicalWinRate}%
          </span>
        )}
        <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground border border-border/50 ml-auto">
          {template.category}
        </span>
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-3 pl-12 space-y-2 border-t border-border/20 pt-2.5">
          {template.description && (
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">描述</span>
              <p className="text-sm text-foreground/70 mt-0.5">{template.description}</p>
            </div>
          )}
          {template.signalDefinition && (
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">信号定义 / 触发条件</span>
              <p className="text-sm text-fang-amber mt-0.5">{template.signalDefinition}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
