import { useMemo } from "react";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, AlertTriangle, Brain, ExternalLink, Layers, Link2, Loader2, ShieldAlert, Target } from "lucide-react";
import { useAnomalies, useChangeLogs, useCompany, useRecentEvidence } from "@/lib/api";
import { trpc } from "@/lib/trpc";

export default function CompanyDetail() {
  const params = useParams<{ symbol: string }>();
  const symbol = (params.symbol ?? "").toUpperCase();
  const [, setLocation] = useLocation();

  const { company, isLoading: companyLoading, error } = useCompany(symbol);
  const latestAnalysisQuery = trpc.companies.latestAnalysis.useQuery();
  const { anomalies, isLoading: anomaliesLoading } = useAnomalies();
  const { evidenceList, isLoading: evidenceLoading } = useRecentEvidence();
  const { logs, isLoading: logsLoading } = useChangeLogs(100);
  const indicatorsQuery = trpc.indicators.list.useQuery();

  const loading = companyLoading || anomaliesLoading || evidenceLoading || logsLoading;
  const analysisMap = latestAnalysisQuery.data ?? {};
  const latest = (analysisMap as Record<string, any>)[symbol];

  const companyAnomalies = useMemo(
    () => anomalies.filter(a => a.symbol === symbol),
    [anomalies, symbol]
  );
  const relatedEvidence = useMemo(
    () => evidenceList.filter(ev => (ev.impacts ?? []).some(imp => imp.symbol === symbol)).slice(0, 8),
    [evidenceList, symbol]
  );
  const last7DaysEvidence = useMemo(() => {
    const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return relatedEvidence
      .filter(ev => new Date(ev.createdAt).getTime() >= since)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [relatedEvidence]);

  const indicatorCountMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const ev of relatedEvidence) {
      const ids = ev.analysis?.relatedIndicators ?? [];
      for (const id of ids) {
        map.set(id, (map.get(id) ?? 0) + 1);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [relatedEvidence]);
  const relatedLogs = useMemo(
    () => logs.filter(l => l.symbol === symbol || l.evidence_id && relatedEvidence.some(ev => ev.evidenceId === l.evidence_id)).slice(0, 12),
    [logs, symbol, relatedEvidence]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-fang-cyan animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">加载个股战情...</span>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-fang-amber mx-auto mb-3" />
          <p className="text-sm text-foreground">未找到标的 {symbol}</p>
          <button
            onClick={() => setLocation("/")}
            className="mt-3 px-4 py-2 text-xs border border-fang-cyan/30 text-fang-cyan hover:bg-fang-cyan/10"
          >
            返回战情室
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 bg-[#060A13]/80">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-fang-cyan transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回战情室
          </button>
          <div className="font-data text-xs text-muted-foreground">COMPANY BATTLE CARD</div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        <section className="border border-border/30 bg-[#0A0F1A] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-data text-sm text-fang-cyan">{company.symbol}</span>
                <h1 className="text-xl font-bold text-foreground">{company.name}</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{company.sector} · {company.chain_position}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {company.tags.map(tag => (
                  <span key={tag} className="text-[11px] px-2 py-0.5 border border-fang-cyan/20 text-fang-cyan/80 bg-fang-cyan/8">{tag}</span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">当前权重</p>
              <p className="font-data text-2xl font-bold text-fang-cyan">W{company.weight}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border border-border/30 bg-[#0A0F1A] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-fang-cyan" />
              <h2 className="text-sm font-semibold text-foreground">最新分析摘要</h2>
            </div>
            {latest ? (
              <div>
                <p className="text-xs text-muted-foreground mb-2">置信度 {latest.confidence}% · 触发因子 {latest.triggeredFactors}</p>
                <p className="text-sm text-foreground/85">{latest.summary}</p>
                <Link href={`/evidence/${latest.evidenceId}`} className="inline-flex items-center gap-1 mt-2 text-xs text-fang-cyan hover:underline">
                  查看证据链 <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/70">暂无最新分析记录。</p>
            )}
          </div>

          <div className="border border-border/30 bg-[#0A0F1A] p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-fang-amber" />
              <h2 className="text-sm font-semibold text-foreground">风险提示</h2>
            </div>
            {companyAnomalies.length > 0 ? (
              <div className="space-y-2">
                {companyAnomalies.map((a, i) => (
                  <div key={`${a.type}-${i}`} className="text-xs px-3 py-2 border border-fang-amber/20 bg-fang-amber/8 text-foreground/80">
                    {a.detail}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/70">当前未检测到异常风险信号。</p>
            )}
          </div>
        </section>

        <section className="border border-border/30 bg-[#0A0F1A] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-fang-cyan" />
            <h2 className="text-sm font-semibold text-foreground">关联证据链</h2>
            <span className="text-xs text-muted-foreground font-data">{relatedEvidence.length} 条</span>
          </div>
          <div className="space-y-2">
            {relatedEvidence.map(ev => (
              <div key={ev.evidenceId} className="px-3 py-2 border border-border/20 bg-card/20">
                <p className="text-xs text-foreground/80 line-clamp-2">{ev.sourceMessage}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground font-data">{new Date(ev.createdAt).toLocaleString("zh-CN", { hour12: false })}</span>
                  <Link href={`/evidence/${ev.evidenceId}`} className="text-xs text-fang-cyan hover:underline">{ev.evidenceId}</Link>
                </div>
              </div>
            ))}
            {relatedEvidence.length === 0 ? <p className="text-xs text-muted-foreground/70">暂无关联证据链。</p> : null}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border border-border/30 bg-[#0A0F1A] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-fang-cyan" />
              <h2 className="text-sm font-semibold text-foreground">因子触发概览</h2>
            </div>
            {indicatorCountMap.length > 0 ? (
              <div className="space-y-2">
                {indicatorCountMap.map(([id, count]) => {
                  const ind = (indicatorsQuery.data ?? []).find((i: any) => i.id === id);
                  return (
                    <div key={id} className="px-3 py-2 border border-border/20 bg-card/20 flex items-center justify-between">
                      <span className="text-xs text-foreground/85">#{id} {ind?.name ?? "未知指标"}</span>
                      <span className="font-data text-xs text-fang-cyan">x{count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/70">近期待触发因子数据不足。</p>
            )}
          </div>

          <div className="border border-border/30 bg-[#0A0F1A] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-fang-cyan" />
              <h2 className="text-sm font-semibold text-foreground">最近 7 日事件时间线</h2>
            </div>
            {last7DaysEvidence.length > 0 ? (
              <div className="space-y-2">
                {last7DaysEvidence.map(ev => (
                  <div key={ev.evidenceId} className="px-3 py-2 border border-border/20 bg-card/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground font-data">{new Date(ev.createdAt).toLocaleString("zh-CN", { hour12: false })}</span>
                      <Link href={`/evidence/${ev.evidenceId}`} className="text-[10px] text-fang-cyan hover:underline font-data">
                        {ev.evidenceId}
                      </Link>
                    </div>
                    <p className="text-xs text-foreground/80 line-clamp-2">{ev.sourceMessage}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/70">最近 7 日暂无关联事件。</p>
            )}
          </div>
        </section>

        <section className="border border-border/30 bg-[#0A0F1A] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-fang-cyan" />
            <h2 className="text-sm font-semibold text-foreground">变更日志</h2>
            <span className="text-xs text-muted-foreground font-data">{relatedLogs.length} 条</span>
          </div>
          <div className="space-y-1.5">
            {relatedLogs.map(log => (
              <div key={log.id} className="px-3 py-2 border border-border/20 bg-card/20 flex items-center gap-2">
                <span className="text-[10px] font-data text-muted-foreground w-14">
                  {new Date(log.timestamp).toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 border border-fang-cyan/20 text-fang-cyan font-data uppercase">{log.action}</span>
                <span className="text-xs text-foreground/80 truncate">{log.message ?? log.reason ?? "—"}</span>
                {log.evidence_id ? <Link href={`/evidence/${log.evidence_id}`} className="text-xs text-fang-cyan hover:underline ml-auto">详情</Link> : null}
              </div>
            ))}
            {relatedLogs.length === 0 ? <p className="text-xs text-muted-foreground/70">暂无日志记录。</p> : null}
          </div>
        </section>

        <section className="flex items-center gap-3 pb-4">
          <Link href="/" className="px-3 py-2 text-xs border border-border/40 text-muted-foreground hover:text-foreground">回到首页</Link>
          {latest?.evidenceId ? (
            <Link href={`/evidence/${latest.evidenceId}`} className="px-3 py-2 text-xs border border-fang-cyan/30 text-fang-cyan hover:bg-fang-cyan/10">
              打开最新证据链
            </Link>
          ) : null}
          <Link href="/" className="px-3 py-2 text-xs border border-fang-cyan/30 text-fang-cyan hover:bg-fang-cyan/10 inline-flex items-center gap-1">
            <Target className="w-3 h-3" /> 进入目标池
          </Link>
        </section>
      </div>
    </div>
  );
}
