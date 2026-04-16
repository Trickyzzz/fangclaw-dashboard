import { useChangeLogs, type ChangeLogEntry } from "@/lib/api";
import { ArrowUpCircle, PlusCircle, Settings, Clock, Loader2, Brain, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useMemo, useState } from "react";

function ActionIcon({ action }: { action: string }) {
  switch (action) {
    case "init":
      return <Settings className="w-4 h-4 text-fang-cyan" />;
    case "add":
    case "pool_add":
      return <PlusCircle className="w-4 h-4 text-fang-green" />;
    case "weight":
      return <ArrowUpCircle className="w-4 h-4 text-fang-amber" />;
    case "analysis":
    case "discovery":
      return <Brain className="w-4 h-4 text-fang-cyan" />;
    case "pool_remove":
    case "pool_edit":
    case "pool_bulk_import":
      return <Settings className="w-4 h-4 text-fang-amber" />;
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
}

function actionLabel(action: string) {
  switch (action) {
    case "init": return "初始化";
    case "add":
    case "pool_add": return "新增";
    case "pool_edit": return "编辑";
    case "pool_remove": return "移除";
    case "pool_bulk_import": return "批量导入";
    case "weight": return "调仓";
    case "analysis": return "分析";
    case "discovery": return "发现";
    default: return action;
  }
}

function LogEntry({ entry }: { entry: ChangeLogEntry }) {
  const time = new Date(entry.timestamp);
  const timeStr = time.toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="flex gap-3 px-5 py-3 border-b border-border/20 hover:bg-fang-cyan/3 transition-colors">
      <div className="flex flex-col items-center pt-0.5">
        <ActionIcon action={entry.action} />
        <div className="w-px flex-1 bg-border/30 mt-1" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-data text-xs text-muted-foreground">{timeStr}</span>
          <span className={`text-xs px-2 py-0.5 border font-data uppercase ${
            entry.action === "init" ? "border-fang-cyan/30 text-fang-cyan" :
            entry.action === "add" || entry.action === "pool_add" ? "border-fang-green/30 text-fang-green" :
            entry.action === "analysis" || entry.action === "discovery" ? "border-fang-cyan/30 text-fang-cyan" :
            "border-fang-amber/30 text-fang-amber"
          }`}>
            {actionLabel(entry.action)}
          </span>
          {entry.symbol && (
            <span className="font-data text-sm text-foreground/70">{entry.symbol}</span>
          )}
          {entry.name && (
            <span className="text-sm font-semibold text-foreground">{entry.name}</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {entry.message || entry.reason || "—"}
        </p>
        {entry.evidence_id && (
          <Link
            href={`/evidence/${entry.evidence_id}`}
            className="inline-flex items-center gap-1 mt-1.5 font-data text-xs px-2 py-0.5 bg-fang-cyan/8 text-fang-cyan border border-fang-cyan/20 hover:bg-fang-cyan/15 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3 h-3" />
            查看证据链: {entry.evidence_id}
          </Link>
        )}
      </div>
      {entry.new_weight !== undefined && entry.new_weight !== null && (
        <div className="flex-shrink-0 text-right">
          <span className="font-data text-base font-bold text-fang-cyan">W{entry.new_weight}</span>
        </div>
      )}
    </div>
  );
}

export default function ChangeLog() {
  const { logs, isLoading } = useChangeLogs(50);
  const [showAutoPatrol, setShowAutoPatrol] = useState(false);

  const visibleLogs = useMemo(() => {
    if (showAutoPatrol) return logs;
    return logs.filter(log => !String(log.message || "").startsWith("自动巡检记录候选证据链"));
  }, [logs, showAutoPatrol]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 text-fang-cyan animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">加载证据链数据...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-bold text-foreground">证据链</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAutoPatrol(v => !v)}
            className={`text-xs px-2 py-0.5 border transition-colors ${
              showAutoPatrol
                ? "border-fang-amber/40 text-fang-amber bg-fang-amber/10"
                : "border-border/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            自动巡检
          </button>
          <span className="font-data text-sm text-muted-foreground">
            {visibleLogs.length}/{logs.length}
          </span>
        </div>
      </div>

      <div className="px-5 py-2 border-b border-border/20 bg-fang-cyan/5 text-[11px] text-muted-foreground">
        演示建议: 优先查看 <span className="text-fang-cyan">ANALYSIS</span> 与 <span className="text-fang-amber">WEIGHT</span> 事件
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto">
        {visibleLogs.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-base text-muted-foreground">
            暂无变更记录
          </div>
        ) : (
          visibleLogs.map((entry) => (
            <LogEntry key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
}
