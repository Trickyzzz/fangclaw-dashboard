import { useEffect, useRef } from "react";
import { useCompanies, useCompanyStats, useIndicators, CATEGORY_COLORS, CHAIN_COLORS, THEME_INFO, ANCHORS, useSecRecentFilings, useCninfoRecentAnnouncements, useIngestionStatus } from "@/lib/api";
import { Target, Layers, BarChart3, Radar, Globe, Anchor, Loader2, Flame, FileText, ExternalLink, Bot } from "lucide-react";

function StatCard({ icon: Icon, label, value, sublabel, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sublabel?: string;
  color: string;
}) {
  return (
    <div className="px-4 py-3.5 border border-border/30 bg-card/30">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="font-data text-2xl font-bold" style={{ color }}>{value}</div>
      {sublabel && <div className="text-xs text-muted-foreground mt-1">{sublabel}</div>}
    </div>
  );
}

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-sm text-muted-foreground w-14 text-right">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, backgroundColor: color }} />
      </div>
      <span className="font-data text-sm w-5 text-right font-semibold" style={{ color }}>{value}</span>
    </div>
  );
}

/**
 * P2: 目标池热力图 - 使用 Chart.js 气泡图
 * X轴: 产业链位置（上游/中游/下游）
 * Y轴: 权重
 * 气泡大小: 权重值
 * 颜色: 产业链位置
 */
function HeatmapBubble({ companies }: { companies: { symbol: string; name: string; weight: number; chain_position: string }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current || companies.length === 0) return;

    const loadChart = async () => {
      const { Chart, BubbleController, LinearScale, PointElement, Tooltip, Legend } = await import("chart.js");
      Chart.register(BubbleController, LinearScale, PointElement, Tooltip, Legend);

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      const chainMap: Record<string, number> = { "上游": 1, "中游": 2, "下游": 3 };
      const colorMap: Record<string, string> = {
        "上游": "#00D4AA",
        "中游": "#3B82F6",
        "下游": "#F59E0B",
      };

      // Group by chain position
      const datasets = Object.entries(chainMap).map(([chain, xBase]) => {
        const group = companies.filter(c => c.chain_position === chain);
        return {
          label: chain,
          data: group.map((c, i) => ({
            x: xBase + (Math.random() - 0.5) * 0.4, // slight jitter
            y: c.weight + (Math.random() - 0.5) * 0.3,
            r: Math.max(4, c.weight * 1.5),
            name: c.name,
            symbol: c.symbol,
            weight: c.weight,
          })),
          backgroundColor: colorMap[chain] + "60",
          borderColor: colorMap[chain],
          borderWidth: 1.5,
        };
      });

      chartRef.current = new Chart(canvasRef.current!, {
        type: "bubble",
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: "top",
              labels: {
                color: "#9CA3AF",
                font: { size: 10, family: "'JetBrains Mono', monospace" },
                boxWidth: 8,
                padding: 8,
              },
            },
            tooltip: {
              backgroundColor: "#0A0F1A",
              borderColor: "#00D4AA40",
              borderWidth: 1,
              titleFont: { size: 12 },
              bodyFont: { size: 11, family: "'JetBrains Mono', monospace" },
              callbacks: {
                title: (items: any[]) => {
                  const raw = items[0]?.raw as any;
                  return raw?.name ?? "";
                },
                label: (item: any) => {
                  const raw = item.raw as any;
                  return `${raw.symbol} | W${raw.weight}`;
                },
              },
            },
          },
          scales: {
            x: {
              min: 0.3,
              max: 3.7,
              ticks: {
                color: "#6B7280",
                font: { size: 10, family: "'JetBrains Mono', monospace" },
                callback: (value: any) => {
                  const labels: Record<number, string> = { 1: "上游", 2: "中游", 3: "下游" };
                  return labels[Math.round(value)] ?? "";
                },
                stepSize: 1,
              },
              grid: { color: "#1F2937" },
            },
            y: {
              min: 3,
              max: 11,
              ticks: {
                color: "#6B7280",
                font: { size: 10, family: "'JetBrains Mono', monospace" },
                stepSize: 1,
                callback: (value: any) => `W${value}`,
              },
              grid: { color: "#1F2937" },
            },
          },
        },
      });
    };

    loadChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [companies]);

  return (
    <div style={{ height: "220px" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default function StatsPanel() {
  const statsQuery = useCompanyStats();
  const { indicators } = useIndicators();
  const { companies } = useCompanies();
  const { filings, isLoading: filingsLoading } = useSecRecentFilings(5);
  const { announcements, isLoading: announcementsLoading } = useCninfoRecentAnnouncements(5);
  const { ingestionStatus } = useIngestionStatus();

  const stats = statsQuery.data;

  if (!stats || statsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 text-fang-cyan animate-spin" />
      </div>
    );
  }

  // Calculate indicator category distribution
  const indicatorsByCategory: Record<string, number> = {};
  indicators.forEach(i => {
    indicatorsByCategory[i.category] = (indicatorsByCategory[i.category] || 0) + 1;
  });

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Theme info */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <Radar className="w-4 h-4 text-fang-cyan" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">任务简报</span>
        </div>
        <h3 className="text-base font-bold text-fang-cyan mb-1">{THEME_INFO.theme}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{THEME_INFO.description}</p>
        <div className="flex items-center gap-2 mt-2.5">
          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
          {THEME_INFO.geo_scope.map(g => (
            <span key={g} className="text-xs px-2 py-0.5 bg-fang-cyan/8 text-fang-cyan/70 border border-fang-cyan/15">
              {g}
            </span>
          ))}
        </div>
      </div>

      {/* Anchors */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-2.5">
          <Anchor className="w-4 h-4 text-fang-amber" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">锚定公司</span>
        </div>
        <div className="space-y-2.5">
          {ANCHORS.map(a => (
            <div key={a.ticker} className="flex items-start gap-2.5">
              <span className="font-data text-xs text-fang-amber bg-fang-amber/10 px-2 py-0.5 border border-fang-amber/20 flex-shrink-0">
                {a.ticker}
              </span>
              <div>
                <span className="text-sm font-semibold text-foreground">{a.name}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{a.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="p-4 grid grid-cols-2 gap-2.5 border-b border-border/50">
        <StatCard icon={Target} label="标的数" value={stats.total} sublabel="跟踪公司" color="#00D4AA" />
        <StatCard icon={BarChart3} label="平均权重" value={stats.avgWeight} sublabel="满分 10" color="#3B82F6" />
      </div>

      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-4 h-4 text-fang-cyan" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">自动巡检状态</span>
          <span className="text-[10px] text-muted-foreground font-data ml-auto">
            {ingestionStatus?.running ? "RUNNING" : "IDLE"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard icon={FileText} label="扫描" value={ingestionStatus?.scannedCount ?? 0} color="#00D4AA" />
          <StatCard icon={Layers} label="去重" value={ingestionStatus?.dedupedCount ?? 0} color="#64748B" />
          <StatCard icon={Radar} label="观察" value={ingestionStatus?.observedCount ?? 0} color="#F59E0B" />
          <StatCard icon={Target} label="落地" value={ingestionStatus?.appliedCount ?? 0} color="#3B82F6" />
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          {ingestionStatus?.lastRunAt
            ? `最近巡检：${new Date(ingestionStatus.lastRunAt).toLocaleString("zh-CN", { hour12: false })}`
            : "最近巡检：尚未完成首轮扫描"}
        </div>
        {ingestionStatus?.lastError && (
          <div className="mt-2 text-xs text-fang-amber">
            最近错误：{ingestionStatus.lastError}
          </div>
        )}
      </div>

      {/* SEC filings feed */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-fang-cyan" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">最新监管披露</span>
          <span className="text-[10px] text-muted-foreground font-data ml-auto">SEC EDGAR</span>
        </div>
        {filingsLoading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 text-fang-cyan animate-spin" />
            正在拉取官方披露...
          </div>
        ) : filings.length === 0 ? (
          <p className="text-sm text-muted-foreground/60 italic py-4">暂无最新披露</p>
        ) : (
          <div className="space-y-2.5">
            {filings.map(filing => (
              <a
                key={`${filing.symbol}-${filing.accessionNumber}`}
                href={filing.url}
                target="_blank"
                rel="noreferrer"
                className="block border border-border/30 bg-card/20 p-3 hover:bg-fang-cyan/5 hover:border-fang-cyan/20 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-data text-xs px-2 py-0.5 bg-fang-cyan/10 text-fang-cyan border border-fang-cyan/20">
                    {filing.symbol}
                  </span>
                  <span className="font-data text-xs text-fang-amber">{filing.formType}</span>
                  <span className="ml-auto font-data text-[11px] text-muted-foreground">{filing.filedAt}</span>
                </div>
                <p className="text-sm font-semibold text-foreground line-clamp-2">{filing.description}</p>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="truncate">{filing.companyName}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* CNINFO announcements feed */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-fang-amber" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">最新 A 股公告</span>
          <span className="text-[10px] text-muted-foreground font-data ml-auto">CNINFO</span>
        </div>
        {announcementsLoading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 text-fang-amber animate-spin" />
            正在拉取 A 股公告...
          </div>
        ) : announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground/60 italic py-4">暂无最新 A 股公告</p>
        ) : (
          <div className="space-y-2.5">
            {announcements.map(item => (
              <a
                key={item.announcementId}
                href={item.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="block border border-border/30 bg-card/20 p-3 hover:bg-fang-amber/5 hover:border-fang-amber/20 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-data text-xs px-2 py-0.5 bg-fang-amber/10 text-fang-amber border border-fang-amber/20">
                    {item.symbol}
                  </span>
                  <span className="truncate text-sm font-semibold text-foreground">{item.companyName}</span>
                  <span className="ml-auto font-data text-[11px] text-muted-foreground">{item.publishedAt}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{item.title}</p>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="truncate">巨潮资讯原文</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* P2: 目标池热力图 */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-4 h-4 text-fang-red" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">目标池热力图</span>
          <span className="text-[10px] text-muted-foreground font-data ml-auto">HEATMAP</span>
        </div>
        {companies.length > 0 ? (
          <HeatmapBubble companies={companies} />
        ) : (
          <p className="text-sm text-muted-foreground/50 italic py-4">暂无数据</p>
        )}
      </div>

      {/* Chain distribution */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-fang-cyan" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">产业链分布</span>
        </div>
        <div className="space-y-2.5">
          <MiniBar label="上游" value={stats.upstream} max={stats.total} color={CHAIN_COLORS["上游"]} />
          <MiniBar label="中游" value={stats.midstream} max={stats.total} color={CHAIN_COLORS["中游"]} />
          <MiniBar label="下游" value={stats.downstream} max={stats.total} color={CHAIN_COLORS["下游"]} />
        </div>
      </div>

      {/* Indicator categories */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-fang-cyan" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">指标分类</span>
        </div>
        <div className="space-y-2.5">
          {Object.entries(indicatorsByCategory).map(([cat, count]) => (
            <MiniBar key={cat} label={cat.split("/")[0]} value={count} max={5} color={CATEGORY_COLORS[cat] || "#6B7280"} />
          ))}
        </div>
      </div>
    </div>
  );
}
