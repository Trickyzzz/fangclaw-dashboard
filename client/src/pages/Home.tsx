import { useState } from "react";
import StatusBar from "@/components/StatusBar";
import CompanyPool from "@/components/CompanyPool";
import IndicatorFramework from "@/components/IndicatorFramework";
import ChangeLog from "@/components/ChangeLog";
import StatsPanel from "@/components/StatsPanel";
import CausalAnalysis from "@/components/CausalAnalysis";
import RiskPanel from "@/components/RiskPanel";
import FactorDiscovery from "@/components/FactorDiscovery";
import FactorHeatmap from "@/components/FactorHeatmap";
import { Target, Layers, Brain, Link2, ShieldAlert, BarChart3, Radar, Grid3X3, Bell, FileText, Crown } from "lucide-react";
import { Link } from "wouter";

type TabKey = "pool" | "factors" | "engine" | "discover" | "heatmap" | "evidence" | "risk" | "overview";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "pool", label: "目标池", icon: Target },
  { key: "factors", label: "六维因子", icon: Layers },
  { key: "engine", label: "认知引擎", icon: Brain },
  { key: "discover", label: "因子发现", icon: Radar },
  { key: "heatmap", label: "因子热力", icon: Grid3X3 },
  { key: "evidence", label: "证据链", icon: Link2 },
  { key: "risk", label: "风控面板", icon: ShieldAlert },
  { key: "overview", label: "态势大屏", icon: BarChart3 },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("pool");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top status bar */}
      <StatusBar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left sidebar - Stats (desktop only) */}
        <aside className="hidden lg:flex w-80 flex-shrink-0 border-r border-border/30 bg-[#060A13]/40 flex-col overflow-hidden">
          <StatsPanel />
        </aside>

        {/* Center content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Tab navigation - larger font */}
          <div className="flex items-center border-b border-border/30 bg-[#060A13]/60 overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm whitespace-nowrap transition-colors relative ${
                    isActive
                      ? "text-fang-cyan"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-semibold">{tab.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-fang-cyan" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "pool" && <CompanyPool />}
            {activeTab === "factors" && <IndicatorFramework />}
            {activeTab === "engine" && <CausalAnalysis />}
            {activeTab === "discover" && <FactorDiscovery />}
            {activeTab === "heatmap" && <FactorHeatmap />}
            {activeTab === "evidence" && <ChangeLog />}
            {activeTab === "risk" && <RiskPanel />}
            {activeTab === "overview" && (
              <div className="lg:hidden h-full overflow-y-auto">
                <StatsPanel />
              </div>
            )}
          </div>
        </main>

        {/* Right sidebar - Change log (desktop only) */}
        <aside className="hidden xl:flex w-80 flex-shrink-0 border-l border-border/30 bg-[#060A13]/40 flex-col overflow-hidden">
          <ChangeLog />
        </aside>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border/30 bg-[#060A13]/80 px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground font-data tracking-wider">
            STOCKCLAW v3.3 | 乐石智能 · Agent Swarm 蜂群智能投研引擎
          </span>
          <span className="text-xs text-muted-foreground font-data">
            主题: AI算力/半导体链
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/reports" className="text-xs text-muted-foreground hover:text-fang-cyan transition-colors flex items-center gap-1">
            <FileText className="w-3 h-3" />每日摘要
          </Link>
          <Link href="/subscriptions" className="text-xs text-muted-foreground hover:text-fang-cyan transition-colors flex items-center gap-1">
            <Bell className="w-3 h-3" />订阅推送
          </Link>
          <Link href="/pricing" className="text-xs text-muted-foreground hover:text-fang-amber transition-colors flex items-center gap-1">
            <Crown className="w-3 h-3" />升级方案
          </Link>
          <span className="text-xs text-fang-green font-data flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-fang-green animate-pulse" />
            系统在线
          </span>
        </div>
      </div>
    </div>
  );
}
