import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast as sonnerToast } from "sonner";
import { trpc } from "@/lib/trpc";
import { FileText, RefreshCw, Calendar, ChevronLeft, ChevronRight, Loader2, TrendingUp, TrendingDown, AlertTriangle, BarChart3 } from "lucide-react";

export default function DailyReport() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  const { data: report, isLoading, refetch } = trpc.reports.getDaily.useQuery({ date: selectedDate });
  const { data: recentReports } = trpc.reports.recent.useQuery({ limit: 7 });
  const generateMut = trpc.reports.generateDaily.useMutation({
    onSuccess: (data) => {
      if (data) {
        sonnerToast.success("每日摘要已生成 / Daily report generated");
        refetch();
      } else {
        sonnerToast.info("暂无数据可生成摘要");
      }
    },
    onError: () => {
      sonnerToast.error("生成失败，请稍后重试");
    },
  });

  const navigateDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const content = report?.content as {
    marketOverview?: string;
    topMovers?: Array<{ symbol: string; name: string; change: number; reason: string }>;
    riskAlerts?: string[];
    factorInsights?: string[];
    outlook?: string;
  } | null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/30 bg-[#060A13]/80 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-fang-cyan" />
            <div>
              <h1 className="text-lg font-bold">每日投研摘要</h1>
              <p className="text-xs text-muted-foreground">Daily Research Digest</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => generateMut.mutate()}
            disabled={generateMut.isPending}
            className="bg-fang-cyan text-black hover:bg-fang-cyan/80"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${generateMut.isPending ? "animate-spin" : ""}`} />
            {generateMut.isPending ? "生成中..." : "生成今日摘要"}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 space-y-6">
            {/* Date navigator */}
            <div className="flex items-center justify-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigateDate(-1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-fang-cyan" />
                <span className="font-mono text-sm">{selectedDate}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => navigateDate(1)}
                disabled={selectedDate >= new Date().toISOString().slice(0, 10)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-fang-cyan" />
              </div>
            ) : !report ? (
              <Card className="bg-[#0A1628]/60 border-border/20">
                <CardContent className="py-12 text-center">
                  <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                  <p className="text-sm text-muted-foreground">该日期暂无摘要</p>
                  <p className="text-xs text-muted-foreground mt-1">No report available for this date</p>
                  {selectedDate === new Date().toISOString().slice(0, 10) && (
                    <Button
                      size="sm"
                      className="mt-4 bg-fang-cyan text-black"
                      onClick={() => generateMut.mutate()}
                      disabled={generateMut.isPending}
                    >
                      立即生成 Generate Now
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Market overview */}
                {content?.marketOverview && (
                  <Card className="bg-[#0A1628]/60 border-border/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-fang-cyan" />
                        市场概览 Market Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{content.marketOverview}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Top movers */}
                {content?.topMovers && content.topMovers.length > 0 && (
                  <Card className="bg-[#0A1628]/60 border-border/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-fang-green" />
                        重点变动 Top Movers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {content.topMovers.map((m, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded bg-background/20">
                            <div className="flex items-center gap-2">
                              {m.change > 0 ? (
                                <TrendingUp className="w-3.5 h-3.5 text-fang-green" />
                              ) : (
                                <TrendingDown className="w-3.5 h-3.5 text-fang-red" />
                              )}
                              <span className="text-sm">{m.name}</span>
                              <span className="text-xs text-muted-foreground font-mono">{m.symbol}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-[10px] ${
                                m.change > 0 ? "text-fang-green" : "text-fang-red"
                              }`}>
                                {m.change > 0 ? "+" : ""}{m.change}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Risk alerts */}
                {content?.riskAlerts && content.riskAlerts.length > 0 && (
                  <Card className="bg-[#0A1628]/60 border-fang-amber/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-fang-amber" />
                        风险提示 Risk Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {content.riskAlerts.map((alert, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-fang-amber mt-1">•</span>
                            {alert}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Outlook */}
                {content?.outlook && (
                  <Card className="bg-[#0A1628]/60 border-border/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">展望 Outlook</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{content.outlook}</p>
                    </CardContent>
                  </Card>
                )}

                {/* AI Summary */}
                {report.content?.aiSummary && (
                  <Card className="bg-[#0A1628]/60 border-border/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">摘要 Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{report.content.aiSummary}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Sidebar: recent reports */}
          <div className="hidden lg:block w-56 flex-shrink-0">
            <h3 className="text-xs text-muted-foreground font-medium mb-3">最近报告 Recent</h3>
            <div className="space-y-1">
              {recentReports?.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedDate(r.reportDate as string)}
                  className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${
                    r.reportDate === selectedDate
                      ? "bg-fang-cyan/10 text-fang-cyan"
                      : "text-muted-foreground hover:text-foreground hover:bg-[#0A1628]/40"
                  }`}
                >
                  <span className="font-mono">{r.reportDate as string}</span>
                </button>
              ))}
              {(!recentReports || recentReports.length === 0) && (
                <p className="text-[10px] text-muted-foreground px-3">暂无历史报告</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
