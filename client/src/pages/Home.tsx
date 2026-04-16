import { useEffect, useState } from "react";
import StatusBar from "@/components/StatusBar";
import CompanyPool from "@/components/CompanyPool";
import IndicatorFramework from "@/components/IndicatorFramework";
import ChangeLog from "@/components/ChangeLog";
import StatsPanel from "@/components/StatsPanel";
import CausalAnalysis from "@/components/CausalAnalysis";
import RiskPanel from "@/components/RiskPanel";
import FactorDiscovery from "@/components/FactorDiscovery";
import FactorHeatmap from "@/components/FactorHeatmap";
import WarRoomOverview from "@/components/WarRoomOverview";
import { Target, Layers, Brain, Link2, ShieldAlert, BarChart3, Radar, Grid3X3, Bell, FileText, Crown, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useSystemReadiness } from "@/lib/api";

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

const isTabKey = (value: string | null): value is TabKey => {
  return !!value && TABS.some(t => t.key === value);
};

export default function Home() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const { readiness } = useSystemReadiness();
  const isDemoMode = readiness?.mode === "demo";
  const demoTabs: TabKey[] = ["engine", "evidence", "overview"];

  const resolveTabFromQuery = (): TabKey => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    return isTabKey(tab) ? tab : "overview";
  };

  const buildLocationWithTab = (tab: TabKey) => {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  };

  const switchTab = (tab: TabKey) => {
    setActiveTab(tab);
    setLocation(buildLocationWithTab(tab), { replace: true });
  };

  useEffect(() => {
    const syncTabFromUrl = () => setActiveTab(resolveTabFromQuery());
    const handleSwitchTab = (event: Event) => {
      const tab = (event as CustomEvent<string>).detail;
      if (!isTabKey(tab)) return;
      setActiveTab(tab);
      window.history.replaceState(null, "", buildLocationWithTab(tab));
    };

    syncTabFromUrl();
    window.addEventListener("popstate", syncTabFromUrl);
    window.addEventListener("fangclaw:switch-tab", handleSwitchTab);
    return () => {
      window.removeEventListener("popstate", syncTabFromUrl);
      window.removeEventListener("fangclaw:switch-tab", handleSwitchTab);
    };
    // Sync on initial render, route changes, browser navigation, and explicit tab events.
  }, [location]);

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
              const deemphasized = isDemoMode && !demoTabs.includes(tab.key);
              return (
                <button
                  key={tab.key}
                  onClick={() => switchTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-sm whitespace-nowrap transition-colors relative ${
                    isActive
                      ? "text-fang-cyan"
                      : deemphasized
                        ? "text-muted-foreground/60 hover:text-muted-foreground"
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
          {isDemoMode && (
            <div className="px-4 py-2 border-b border-border/20 bg-fang-cyan/5 flex items-center justify-between gap-3 overflow-x-auto">
              <div className="flex items-center gap-2 text-xs text-fang-cyan whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5" />
                推荐演示路径
              </div>
              <div className="flex items-center gap-2 text-xs whitespace-nowrap">
                <button
                  onClick={() => switchTab("engine")}
                  className={`px-2 py-1 border transition-colors ${
                    activeTab === "engine"
                      ? "border-fang-cyan/60 text-fang-cyan bg-fang-cyan/10"
                      : "border-border/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  1. 认知引擎
                </button>
                <button
                  onClick={() => switchTab("evidence")}
                  className={`px-2 py-1 border transition-colors ${
                    activeTab === "evidence"
                      ? "border-fang-cyan/60 text-fang-cyan bg-fang-cyan/10"
                      : "border-border/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  2. 证据链
                </button>
                <button
                  onClick={() => switchTab("overview")}
                  className={`px-2 py-1 border transition-colors ${
                    activeTab === "overview"
                      ? "border-fang-cyan/60 text-fang-cyan bg-fang-cyan/10"
                      : "border-border/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  3. 态势大屏
                </button>
              </div>
            </div>
          )}
          {isDemoMode && (
            <div className="px-4 py-2 border-b border-border/20 bg-[#07121f]/80 flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">演示亮点:</span>
              <span className="text-[11px] px-2 py-0.5 border border-fang-cyan/30 text-fang-cyan bg-fang-cyan/10 whitespace-nowrap">
                ① 一键触发分析
              </span>
              <span className="text-[11px] px-2 py-0.5 border border-fang-green/30 text-fang-green bg-fang-green/10 whitespace-nowrap">
                ② 公司影响与调仓
              </span>
              <span className="text-[11px] px-2 py-0.5 border border-fang-amber/30 text-fang-amber bg-fang-amber/10 whitespace-nowrap">
                ③ 证据链可追溯
              </span>
            </div>
          )}

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "pool" && <CompanyPool />}
            {activeTab === "factors" && <IndicatorFramework />}
            {activeTab === "engine" && <CausalAnalysis onSwitchToOverview={() => switchTab("overview")} />}
            {activeTab === "discover" && <FactorDiscovery />}
            {activeTab === "heatmap" && <FactorHeatmap />}
            {activeTab === "evidence" && <ChangeLog />}
            {activeTab === "risk" && <RiskPanel />}
            {activeTab === "overview" && <WarRoomOverview />}
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
