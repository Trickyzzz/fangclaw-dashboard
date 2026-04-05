import { useCompanies, useIndicators } from "@/lib/api";
import { trpc } from "@/lib/trpc";
import { Fragment } from "react";
import {
  ShieldAlert, AlertTriangle, TrendingDown, Brain,
  Eye, Loader2, ArrowDownRight, ArrowUpRight, Activity, Zap
} from "lucide-react";

/**
 * 风控面板 - 对应 PPT 中的"控制层"
 * P1 升级：增加关键变量监控表格（参考 AION Key Variables）
 */

function RiskCard({
  icon: Icon,
  title,
  level,
  description,
  color,
}: {
  icon: React.ElementType;
  title: string;
  level: "高" | "中" | "低";
  description: string;
  color: string;
}) {
  const levelColor = level === "高" ? "#EF4444" : level === "中" ? "#F59E0B" : "#00D4AA";
  return (
    <div className="border border-border/30 bg-card/30 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <Icon className="w-5 h-5" style={{ color }} />
          <span className="text-base font-semibold text-foreground">{title}</span>
        </div>
        <span
          className="text-sm font-data font-bold px-2.5 py-1 border"
          style={{ color: levelColor, borderColor: levelColor + "40", backgroundColor: levelColor + "15" }}
        >
          {level}风险
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function BehaviorAlert({ title, description, action }: {
  title: string;
  description: string;
  action: string;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 bg-fang-amber/5 border border-fang-amber/20">
      <Brain className="w-5 h-5 text-fang-amber flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        <p className="text-sm text-fang-amber mt-1.5 font-medium">干预建议: {action}</p>
      </div>
    </div>
  );
}

function SignalBadge({ signal }: { signal: string }) {
  const config = {
    Bullish: { color: "#00D4AA", bg: "#00D4AA15", border: "#00D4AA40", icon: ArrowUpRight, label: "Bullish" },
    Bearish: { color: "#EF4444", bg: "#EF444415", border: "#EF444440", icon: ArrowDownRight, label: "Bearish" },
    Neutral: { color: "#6B7280", bg: "#6B728015", border: "#6B728040", icon: Activity, label: "Neutral" },
  }[signal] ?? { color: "#6B7280", bg: "#6B728015", border: "#6B728040", icon: Activity, label: signal };

  const Icon = config.icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-data font-bold px-2 py-0.5 border"
      style={{ color: config.color, backgroundColor: config.bg, borderColor: config.border }}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export default function RiskPanel() {
  const { companies, isLoading: companiesLoading } = useCompanies();
  const { indicators, isLoading: indicatorsLoading } = useIndicators();
  const keyVarsQuery = trpc.keyVariables.list.useQuery();
  const keyVars = keyVarsQuery.data ?? [];

  // v3.1: 实时拥挤度接口
  const crowdingQuery = trpc.risk.crowding.useQuery();
  const crowding = crowdingQuery.data ?? { overall: 0, breakdown: {} as Record<string, number> };

  if (companiesLoading || indicatorsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-fang-cyan animate-spin" />
        <span className="ml-2 text-base text-muted-foreground">加载风控数据...</span>
      </div>
    );
  }

  // 计算风控指标
  const highWeightCount = companies.filter(c => c.weight >= 9).length;
  const triggeredIndicators = indicators.filter(i => i.last_status === "triggered");
  // 使用实时拥挤度接口数据
  const concentrationRatio = crowding.overall.toFixed(1);

  // 权重分布
  const w10 = companies.filter(c => c.weight === 10).length;
  const w9 = companies.filter(c => c.weight === 9).length;
  const w8 = companies.filter(c => c.weight === 8).length;
  const w7 = companies.filter(c => c.weight === 7).length;
  const wLow = companies.filter(c => c.weight < 7).length;

  // 上下游分布
  const upstream = companies.filter(c => c.chain_position === "上游").length;
  const midstream = companies.filter(c => c.chain_position === "中游").length;
  const downstream = companies.filter(c => c.chain_position === "下游").length;

  // 按类别分组关键变量
  const varCategories = Array.from(new Set(keyVars.map(v => v.category)));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-fang-red" />
          <h2 className="text-lg font-bold text-foreground">风控面板</h2>
          <span className="text-xs text-muted-foreground font-data">RISK CONTROL</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          控制层（Control）：因子拥挤度 + 关键变量监控 + 行为金融干预
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 风险指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <RiskCard
            icon={TrendingDown}
            title="因子拥挤度"
            level={crowding.overall > 60 ? "高" : crowding.overall > 35 ? "中" : "低"}
            description={`综合拥挤度 ${concentrationRatio}%（权重集中 ${(crowding.breakdown as Record<string, number>).weightCrowding?.toFixed?.(0) ?? '-'}% / 指标触发 ${(crowding.breakdown as Record<string, number>).indicatorCrowding?.toFixed?.(0) ?? '-'}% / 方向一致 ${(crowding.breakdown as Record<string, number>).directionCrowding?.toFixed?.(0) ?? '-'}%）。超过 60% 时需警惕因子反转风险。`}
            color="#EF4444"
          />
          <RiskCard
            icon={AlertTriangle}
            title="指标触发预警"
            level={triggeredIndicators.length >= 5 ? "高" : triggeredIndicators.length >= 2 ? "中" : "低"}
            description={`当前 ${triggeredIndicators.length}/${indicators.length} 个指标处于触发状态。触发指标越多，市场波动风险越大。`}
            color="#F59E0B"
          />
          <RiskCard
            icon={Eye}
            title="产业链集中度"
            level={upstream > companies.length * 0.5 ? "中" : "低"}
            description={`上游 ${upstream} 家 / 中游 ${midstream} 家 / 下游 ${downstream} 家。产业链过度集中于单一环节会增加系统性风险。`}
            color="#3B82F6"
          />
          <RiskCard
            icon={ShieldAlert}
            title="权重分布健康度"
            level={w10 > 5 ? "高" : w10 > 3 ? "中" : "低"}
            description={`W10: ${w10}家 / W9: ${w9}家 / W8: ${w8}家 / W7: ${w7}家 / W<7: ${wLow}家。头部过度集中意味着分散度不足。`}
            color="#A855F7"
          />
        </div>

        {/* P1: 关键变量监控表格 */}
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-4.5 h-4.5 text-fang-cyan" />
            关键变量监控
            <span className="text-[10px] text-muted-foreground font-data tracking-wider">KEY VARIABLES</span>
            <span className="text-xs text-muted-foreground ml-auto font-data">
              {keyVars.length} 个变量
            </span>
          </h3>

          {keyVarsQuery.isLoading ? (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className="w-4 h-4 text-fang-cyan animate-spin" />
              <span className="text-sm text-muted-foreground">加载关键变量...</span>
            </div>
          ) : keyVars.length === 0 ? (
            <p className="text-sm text-muted-foreground/50 italic py-4">暂无关键变量数据</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2.5 px-3 text-xs text-muted-foreground font-data uppercase tracking-wider">变量</th>
                    <th className="text-left py-2.5 px-3 text-xs text-muted-foreground font-data uppercase tracking-wider">当前值/状态</th>
                    <th className="text-left py-2.5 px-3 text-xs text-muted-foreground font-data uppercase tracking-wider">触发条件</th>
                    <th className="text-center py-2.5 px-3 text-xs text-muted-foreground font-data uppercase tracking-wider">信号</th>
                    <th className="text-left py-2.5 px-3 text-xs text-muted-foreground font-data uppercase tracking-wider">影响说明</th>
                  </tr>
                </thead>
                <tbody>
                  {varCategories.map(cat => (
                    <Fragment key={`cat-${cat}`}>
                      {/* Category header row */}
                      <tr className="bg-[#0A0F1A]/60">
                        <td colSpan={5} className="px-3 py-1.5 text-xs font-data text-fang-cyan/80 uppercase tracking-wider">
                          {cat}
                        </td>
                      </tr>
                      {keyVars.filter(v => v.category === cat).map(v => (
                        <tr key={v.id} className="border-b border-border/20 hover:bg-fang-cyan/3">
                          <td className="px-3 py-2.5">
                            <div className="font-semibold text-foreground text-sm">{v.name}</div>
                            {v.nameEn && <div className="text-[10px] text-muted-foreground font-data">{v.nameEn}</div>}
                          </td>
                          <td className="px-3 py-2.5 text-sm text-muted-foreground max-w-[200px]">
                            {v.currentValue}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-muted-foreground/70 max-w-[180px]">
                            {v.triggerCondition}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <SignalBadge signal={v.signal} />
                          </td>
                          <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[250px] leading-relaxed">
                            {v.impactNote}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 行为金融干预提示 */}
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <Brain className="w-4.5 h-4.5 text-fang-amber" />
            行为金融干预
            <span className="text-[10px] text-muted-foreground font-data tracking-wider">BEHAVIORAL FINANCE</span>
          </h3>
          <div className="space-y-2.5">
            <BehaviorAlert
              title="FOMO（错失恐惧）检测"
              description="当多只高权重股票同时上涨时，交易者容易产生追涨冲动。系统会在检测到连续加仓行为时触发冷静期。"
              action="强制等待 15 分钟冷静期，并展示历史追涨胜率数据"
            />
            <BehaviorAlert
              title="损失厌恶干预"
              description="交易者倾向于过早卖出盈利股票、过晚止损亏损股票。系统会根据因子评分自动提示止损/止盈点位。"
              action="当亏损超过预设阈值时强制弹出复核清单"
            />
            <BehaviorAlert
              title="过度交易监控"
              description="频繁交易是散户亏损的核心原因之一。系统会统计每日交易频次并在异常时发出预警。"
              action="每日交易超过 5 次时触发预警，要求填写交易理由"
            />
          </div>
        </div>

        {/* 触发中的指标列表 */}
        {triggeredIndicators.length > 0 && (
          <div>
            <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-fang-red" />
              当前触发的风险指标
            </h3>
            <div className="space-y-2">
              {triggeredIndicators.map(ind => (
                <div key={ind.id} className="flex items-center gap-3 px-4 py-3 bg-fang-red/5 border border-fang-red/20">
                  <ArrowDownRight className="w-4 h-4 text-fang-red flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-foreground">
                      #{ind.id} {ind.name}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">({ind.category})</span>
                  </div>
                  <span className="text-xs font-data text-fang-red px-2 py-0.5 border border-fang-red/30 bg-fang-red/10">
                    TRIGGERED
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 高权重公司列表 */}
        {highWeightCount > 0 && (
          <div>
            <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <ArrowUpRight className="w-4.5 h-4.5 text-fang-green" />
              高权重关注标的（W9-10）
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {companies.filter(c => c.weight >= 9).map(c => (
                <div key={c.symbol} className="flex items-center justify-between px-4 py-2.5 bg-card/30 border border-border/30">
                  <div className="flex items-center gap-2.5">
                    <span className="font-data text-sm text-muted-foreground">{c.symbol}</span>
                    <span className="text-sm font-semibold text-foreground">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{c.chain_position}</span>
                    <span className="font-data text-sm font-bold text-fang-green">W{c.weight}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
