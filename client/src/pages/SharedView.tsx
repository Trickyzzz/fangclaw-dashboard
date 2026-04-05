import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, Share2, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function SharedView() {
  const [, params] = useRoute("/share/:token");
  const token = params?.token ?? "";

  const { data, isLoading, error } = trpc.share.view.useQuery(
    { token },
    { enabled: !!token }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-fang-cyan" />
      </div>
    );
  }

  if (error || !data?.found || !data.evidence) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center">
        <div>
          <AlertTriangle className="w-12 h-12 text-fang-amber mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">分享链接无效或已过期</h1>
          <p className="text-muted-foreground text-sm">This share link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const ev = data.evidence;
  const analysis = ev.analysis as {
    entities?: string[];
    impactAssessment?: string;
    confidence?: number;
    reasoning?: string;
  } | null;

  const impacts = (ev.impacts ?? []) as Array<{
    symbol: string;
    name: string;
    oldWeight: number;
    newWeight: number;
    direction: string;
    reason: string;
  }>;

  const directionIcon = (d: string) => {
    if (d === "up") return <TrendingUp className="w-3.5 h-3.5 text-fang-green" />;
    if (d === "down") return <TrendingDown className="w-3.5 h-3.5 text-fang-red" />;
    return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/30 bg-[#060A13]/80 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Share2 className="w-5 h-5 text-fang-cyan" />
            <div>
              <h1 className="text-lg font-bold">StockClaw 分析分享</h1>
              <p className="text-xs text-muted-foreground">Shared Analysis View</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Eye className="w-3.5 h-3.5" />
            <span>{data.viewCount ?? 0} 次查看</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
        {/* Evidence info */}
        <Card className="bg-[#0A1628]/60 border-border/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                证据链 {ev.evidenceId}
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono">
                {new Date(ev.sourceTimestamp as number).toLocaleDateString("zh-CN")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Source message */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">原始消息 Source Message</p>
              <p className="text-sm bg-background/30 p-3 rounded-lg border border-border/10">
                {ev.sourceMessage}
              </p>
            </div>

            {/* Impact assessment */}
            {analysis?.impactAssessment && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">影响评估 Impact Assessment</p>
                <p className="text-sm">{analysis.impactAssessment}</p>
              </div>
            )}

            {/* Confidence */}
            {analysis?.confidence !== undefined && (
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">置信度 Confidence:</p>
                <Badge className={
                  analysis.confidence >= 75 ? "bg-fang-green/20 text-fang-green" :
                  analysis.confidence >= 45 ? "bg-fang-amber/20 text-fang-amber" :
                  "bg-fang-red/20 text-fang-red"
                }>
                  {analysis.confidence}%
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Impacts */}
        {impacts.length > 0 && (
          <Card className="bg-[#0A1628]/60 border-border/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                影响公司 Impacted Companies ({impacts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {impacts.map((imp, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-background/20 border border-border/10">
                    <div className="flex items-center gap-3">
                      {directionIcon(imp.direction)}
                      <div>
                        <span className="text-sm font-medium">{imp.name}</span>
                        <span className="text-xs text-muted-foreground ml-2 font-mono">{imp.symbol}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {imp.oldWeight} → {imp.newWeight}
                      </span>
                      <Badge variant="outline" className={`text-[10px] ${
                        imp.direction === "up" ? "text-fang-green border-fang-green/30" :
                        imp.direction === "down" ? "text-fang-red border-fang-red/30" :
                        ""
                      }`}>
                        {imp.direction === "up" ? "+" : ""}{imp.newWeight - imp.oldWeight}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reasoning */}
        {analysis?.reasoning && (
          <Card className="bg-[#0A1628]/60 border-border/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">推理过程 Reasoning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysis.reasoning}</p>
            </CardContent>
          </Card>
        )}

        {/* Disclaimer */}
        {data.disclaimer && (
          <div className="text-[10px] text-muted-foreground/60 text-center px-4 py-3 border-t border-border/10">
            {data.disclaimer}
          </div>
        )}

        {/* CTA */}
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">
            想要获取更多分析？试用 StockClaw 投研引擎 | 乐石智能
          </p>
          <a href="/trial"
            className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-fang-cyan text-black font-medium text-sm hover:bg-fang-cyan/80 transition-colors">
            免费试用 7 天 <span className="text-xs opacity-70">Free 7-Day Trial</span>
          </a>
        </div>
      </div>
    </div>
  );
}
