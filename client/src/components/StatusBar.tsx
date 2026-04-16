import { useCompanies, useIndicators, ANCHORS, useIngestionStatus, useSystemReadiness } from "@/lib/api";
import { Shield, Radio, Crosshair, Bot } from "lucide-react";
import { useState, useEffect } from "react";

export default function StatusBar() {
  const { companies } = useCompanies();
  const { indicators } = useIndicators();
  const { ingestionStatus } = useIngestionStatus();
  const { readiness } = useSystemReadiness();

  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("zh-CN", { hour12: false }));
      setDateStr(now.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const triggeredCount = indicators.filter(i => i.last_status === "triggered").length;
  const normalCount = indicators.filter(i => i.last_status === "normal").length;

  return (
    <div className="relative w-full border-b border-border/50 bg-[#060A13]/80 backdrop-blur-sm">
      {/* Scan line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="scan-line absolute top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-fang-cyan/5 to-transparent" />
      </div>

      <div className="flex items-center justify-between px-6 py-3">
        {/* Left: Logo & brand */}
        <div className="flex items-center gap-3">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663458331224/U8J3eREmMRzMXnKNYzdCxC/fangclaw-logo-28UEHooQz5sfXduixNnzDr.webp"
            alt="FangClaw"
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="font-data text-lg font-bold tracking-wider text-fang-cyan">
              FANGCLAW
            </h1>
            <p className="text-xs text-muted-foreground tracking-widest uppercase">
              可解释动态投研看板
            </p>
          </div>
        </div>

        {/* Center: System status indicators */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-fang-green" />
            <span className="font-data text-base font-bold text-fang-green">{normalCount}</span>
            <span className="text-xs text-muted-foreground">正常</span>
          </div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-fang-amber" />
            <span className="font-data text-base font-bold text-fang-amber">{triggeredCount}</span>
            <span className="text-xs text-muted-foreground">触发</span>
          </div>
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-fang-cyan" />
            <span className="font-data text-base font-bold text-foreground">{companies.length}</span>
            <span className="text-xs text-muted-foreground">标的</span>
          </div>
          <div className="flex items-center gap-2">
            <Bot className={`w-4 h-4 ${ingestionStatus?.running ? "text-fang-cyan" : "text-muted-foreground"}`} />
            <span className="font-data text-base font-bold text-fang-cyan">{ingestionStatus?.appliedCount ?? 0}</span>
            <span className="text-xs text-muted-foreground">自动落地</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`font-data text-[10px] px-2 py-1 border ${
                readiness?.mode === "realtime"
                  ? "bg-fang-green/10 text-fang-green border-fang-green/30"
                  : "bg-fang-amber/10 text-fang-amber border-fang-amber/30"
              }`}
            >
              {readiness?.mode === "realtime" ? "实时模式" : "演示模式"}
            </span>
          </div>
          <div className="h-5 w-px bg-border/50" />
          <div className="flex items-center gap-2">
            {ANCHORS.map(a => (
              <span key={a.ticker} className="font-data text-xs px-2 py-1 bg-fang-cyan/10 text-fang-cyan border border-fang-cyan/20">
                {a.name}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Time */}
        <div className="text-right">
          <div className="font-data text-lg font-bold text-foreground tracking-wider">{timeStr}</div>
          <div className="font-data text-xs text-muted-foreground">{dateStr}</div>
          {ingestionStatus?.lastRunAt && (
            <div className="font-data text-[10px] text-fang-cyan/80 mt-1">
              巡检 {new Date(ingestionStatus.lastRunAt).toLocaleTimeString("zh-CN", { hour12: false })}
            </div>
          )}
          {readiness && readiness.missing.length > 0 && (
            <div className="font-data text-[10px] text-fang-amber/90 mt-1 max-w-[320px] truncate" title={`缺失项: ${readiness.missing.join(" | ")}`}>
              演示模式缺失项：{readiness.missing.length} 项
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
