import { Link } from "wouter";
import { AlertTriangle, ArrowRight, Bell, Brain, Link2, Loader2, Radar, ShieldAlert, Target } from "lucide-react";
import { useAnomalies, useChangeLogs, useCompanies, useRecentEvidence } from "@/lib/api";

function MetricCard({
  title,
  value,
  hint,
  color,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint: string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className="border border-border/30 bg-card/30 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{title}</span>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="font-data text-2xl font-bold" style={{ color }}>
        {value}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    </div>
  );
}

export default function WarRoomOverview() {
  const { companies, isLoading: companiesLoading } = useCompanies();
  const { anomalies, isLoading: anomaliesLoading } = useAnomalies();
  const { logs, isLoading: logsLoading } = useChangeLogs(20);
  const { evidenceList, isLoading: evidenceLoading } = useRecentEvidence();

  const loading = companiesLoading || anomaliesLoading || logsLoading || evidenceLoading;
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 text-fang-cyan animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">加载战情总览...</span>
      </div>
    );
  }

  const highRiskCount = anomalies.filter(a => a.severity === "high").length;
  const mediumRiskCount = anomalies.filter(a => a.severity === "medium").length;
  const topWatch = companies
    .slice()
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);
  const latestAnalysisLogs = logs.filter(l => l.action === "analysis").slice(0, 5);
  const latestEvidence = evidenceList.slice(0, 4);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard
          title="关注池总数"
          value={String(companies.length)}
          hint="当前纳入监控的公司数量"
          color="#00D4AA"
          icon={Target}
        />
        <MetricCard
          title="高风险警报"
          value={String(highRiskCount)}
          hint={`中风险 ${mediumRiskCount} 条`}
          color={highRiskCount > 0 ? "#EF4444" : "#3B82F6"}
          icon={ShieldAlert}
        />
        <MetricCard
          title="最新证据链"
          value={String(evidenceList.length)}
          hint="可追溯分析记录"
          color="#3B82F6"
          icon={Link2}
        />
        <MetricCard
          title="今日盯盘状态"
          value={highRiskCount > 0 ? "警戒" : "正常"}
          hint="基于异常信号与证据链"
          color={highRiskCount > 0 ? "#F59E0B" : "#00D4AA"}
          icon={Radar}
        />
      </div>

      <section className="border border-border/30 bg-[#0A0F1A] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-fang-cyan" />
          <h3 className="text-sm font-semibold text-foreground">快捷操作</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Link href="/?tab=pool&filter=%E5%85%B3%E6%B3%A8" className="px-3 py-2 border border-border/30 text-xs text-muted-foreground hover:text-fang-cyan hover:border-fang-cyan/30 transition-colors">
            打开关注池
          </Link>
          <Link href="/?tab=risk" className="px-3 py-2 border border-border/30 text-xs text-muted-foreground hover:text-fang-cyan hover:border-fang-cyan/30 transition-colors">
            打开风控面板
          </Link>
          <Link href="/reports" className="px-3 py-2 border border-border/30 text-xs text-muted-foreground hover:text-fang-cyan hover:border-fang-cyan/30 transition-colors">
            每日摘要
          </Link>
          <Link href="/?tab=evidence" className="px-3 py-2 border border-border/30 text-xs text-muted-foreground hover:text-fang-cyan hover:border-fang-cyan/30 transition-colors">
            打开证据链
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="border border-border/30 bg-[#0A0F1A]">
          <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-fang-cyan" />
              <h3 className="text-sm font-semibold text-foreground">重点关注标的</h3>
            </div>
            <Link href="/" className="text-xs text-muted-foreground hover:text-fang-cyan">目标池</Link>
          </div>
          <div className="p-3 space-y-2">
            {topWatch.map(c => (
              <div key={c.symbol} className="flex items-center justify-between px-3 py-2 border border-border/20 bg-card/20">
                <div>
                  <Link href={`/company/${c.symbol}`} className="text-sm font-semibold text-foreground hover:text-fang-cyan">
                    {c.name}
                  </Link>
                  <p className="text-xs text-muted-foreground font-data">{c.symbol} · {c.chain_position}</p>
                </div>
                <span className="font-data text-sm font-bold text-fang-cyan">W{c.weight}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-border/30 bg-[#0A0F1A]">
          <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-fang-amber" />
              <h3 className="text-sm font-semibold text-foreground">高优先级风险</h3>
            </div>
            <Link href="/" className="text-xs text-muted-foreground hover:text-fang-cyan">风控面板</Link>
          </div>
          <div className="p-3 space-y-2">
            {anomalies.slice(0, 5).map((a, idx) => (
              <div key={`${a.type}-${idx}`} className="px-3 py-2 border border-border/20 bg-card/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] px-1.5 py-0.5 border font-data ${
                    a.severity === "high" ? "text-fang-red border-fang-red/30 bg-fang-red/10" :
                    a.severity === "medium" ? "text-fang-amber border-fang-amber/30 bg-fang-amber/10" :
                    "text-muted-foreground border-border/50"
                  }`}>
                    {a.severity.toUpperCase()}
                  </span>
                  {a.symbol ? (
                    <Link href={`/company/${a.symbol}`} className="text-xs text-fang-cyan hover:underline font-data">
                      {a.symbol}
                    </Link>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">{a.detail}</p>
              </div>
            ))}
            {anomalies.length === 0 ? (
              <p className="text-xs text-muted-foreground/70 px-1 py-2">当前无异常信号。</p>
            ) : null}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="border border-border/30 bg-[#0A0F1A]">
          <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-fang-cyan" />
              <h3 className="text-sm font-semibold text-foreground">最新分析结果</h3>
            </div>
            <Bell className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="p-3 space-y-2">
            {latestAnalysisLogs.map(log => (
              <div key={log.id} className="px-3 py-2 border border-border/20 bg-card/20">
                <p className="text-xs text-foreground/85">{log.message ?? log.reason ?? "—"}</p>
                {log.evidence_id ? (
                  <Link href={`/evidence/${log.evidence_id}`} className="inline-flex items-center gap-1 mt-1 text-xs text-fang-cyan hover:underline">
                    查看证据链 <ArrowRight className="w-3 h-3" />
                  </Link>
                ) : null}
              </div>
            ))}
            {latestAnalysisLogs.length === 0 ? <p className="text-xs text-muted-foreground/70 px-1 py-2">暂无分析记录。</p> : null}
          </div>
        </section>

        <section className="border border-border/30 bg-[#0A0F1A]">
          <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-fang-cyan" />
              <h3 className="text-sm font-semibold text-foreground">证据链快照</h3>
            </div>
            <Link href="/" className="text-xs text-muted-foreground hover:text-fang-cyan">证据链</Link>
          </div>
          <div className="p-3 space-y-2">
            {latestEvidence.map(ev => (
              <div key={ev.evidenceId} className="px-3 py-2 border border-border/20 bg-card/20">
                <p className="text-xs text-foreground/85 line-clamp-2">{ev.sourceMessage}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground font-data">{new Date(ev.createdAt).toLocaleString("zh-CN", { hour12: false })}</span>
                  <Link href={`/evidence/${ev.evidenceId}`} className="text-xs text-fang-cyan hover:underline font-data">
                    {ev.evidenceId}
                  </Link>
                </div>
              </div>
            ))}
            {latestEvidence.length === 0 ? <p className="text-xs text-muted-foreground/70 px-1 py-2">暂无证据链记录。</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
