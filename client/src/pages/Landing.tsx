import { Link } from "wouter";
import { Shield, Zap, Eye, TrendingUp, BarChart3, Brain, ArrowRight, CheckCircle } from "lucide-react";

const VALUE_PROPS = [
  {
    icon: Brain,
    title: "AI 因果推理引擎",
    desc: "基于 Agent Swarm 蜂群智能，自动解析市场消息，生成六维因子分析和情景推演",
    metric: "6 维度 × 30+ 公司",
  },
  {
    icon: Eye,
    title: "非显而易见关联发现",
    desc: "主动扫描目标池，发现跨维度交叉信号，识别市场忽略的隐性关联",
    metric: "交叉因子覆盖率 >40%",
  },
  {
    icon: Zap,
    title: "异常信号实时推送",
    desc: "权重异动、多重触发、拥挤度预警，第一时间推送到您的终端",
    metric: "秒级响应",
  },
  {
    icon: Shield,
    title: "反对论点 + 经济学检验",
    desc: "每个分析结论同时生成反对论点，避免确认偏误，提供多角度决策支持",
    metric: "双向论证",
  },
];

const CASE_RESULTS = [
  {
    event: "某芯片公司获得大基金增持",
    result: "系统在 3 秒内识别出 5 家关联公司的权重调整建议，覆盖设备/材料/封测全链条",
    factors: ["资金行为", "事件驱动", "基本面"],
  },
  {
    event: "北向资金连续 5 日净流出",
    result: "自动触发拥挤度预警，标记 8 只高权重股的风险等级变化",
    factors: ["资金行为", "技术面", "情绪面"],
  },
  {
    event: "行业政策突发利好",
    result: "因子发现引擎主动扫描，发现 3 个非显而易见的受益标的",
    factors: ["事件驱动", "替代数据", "基本面"],
  },
];

const TIERS = [
  { name: "体验版", price: "免费", features: ["基础因果分析", "目标池查看", "7 天试用"], cta: "免费试用", href: "/trial" },
  { name: "专业版", price: "¥299/月", features: ["全部分析功能", "异常信号推送", "每日摘要", "因子发现引擎"], cta: "立即升级", href: "/pricing", highlight: true },
  { name: "企业版", price: "定制", features: ["API 接入", "私有化部署", "专属客户经理", "自定义因子模板"], cta: "联系我们", href: "/pricing" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-fang-cyan/5 via-transparent to-fang-amber/5" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-fang-cyan/30 bg-fang-cyan/5 text-fang-cyan text-xs font-data mb-6">
            <Zap className="w-3 h-3" />
            Agent Swarm 蜂群智能驱动
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            <span className="text-fang-cyan">StockClaw</span> 智能投研系统
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
            不是告诉你"发生了什么"，而是告诉你<strong className="text-foreground">"这意味着什么"</strong>
          </p>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-8">
            六维因子分析 × 因果推理引擎 × 非显而易见关联发现 —— 让每一条市场消息都变成可执行的投研洞察
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/trial">
              <span className="inline-flex items-center gap-2 px-6 py-3 bg-fang-cyan text-black font-semibold rounded-lg hover:bg-fang-cyan/90 transition-colors cursor-pointer">
                免费试用 7 天
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link href="/">
              <span className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground rounded-lg hover:bg-accent transition-colors cursor-pointer">
                进入看板
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-2">核心能力</h2>
        <p className="text-sm text-muted-foreground text-center mb-10">从信息噪音中提取因果信号，构建可解释的投研决策链</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {VALUE_PROPS.map((v, i) => {
            const Icon = v.icon;
            return (
              <div key={i} className="p-6 border border-border/30 rounded-lg bg-card/30 hover:border-fang-cyan/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-fang-cyan/10">
                    <Icon className="w-5 h-5 text-fang-cyan" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{v.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{v.desc}</p>
                    <span className="text-xs font-data text-fang-cyan">{v.metric}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Case Results */}
      <section className="border-y border-border/30 bg-card/20">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-center mb-2">实战案例</h2>
          <p className="text-sm text-muted-foreground text-center mb-10">真实场景下的分析效果展示</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CASE_RESULTS.map((c, i) => (
              <div key={i} className="p-5 border border-border/30 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-fang-amber" />
                  <span className="text-xs font-data text-fang-amber">案例 {i + 1}</span>
                </div>
                <p className="text-sm font-medium mb-2">"{c.event}"</p>
                <p className="text-xs text-muted-foreground mb-3">{c.result}</p>
                <div className="flex flex-wrap gap-1">
                  {c.factors.map((f, j) => (
                    <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-fang-cyan/10 text-fang-cyan">{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-2">选择方案</h2>
        <p className="text-sm text-muted-foreground text-center mb-10">从免费体验到企业级部署，灵活匹配您的需求</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((t, i) => (
            <div key={i} className={`p-6 border rounded-lg ${t.highlight ? "border-fang-cyan bg-fang-cyan/5" : "border-border/30"}`}>
              <h3 className="font-semibold mb-1">{t.name}</h3>
              <p className="text-2xl font-bold mb-4">{t.price}</p>
              <ul className="space-y-2 mb-6">
                {t.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-3.5 h-3.5 text-fang-green flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={t.href}>
                <span className={`block text-center py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                  t.highlight
                    ? "bg-fang-cyan text-black hover:bg-fang-cyan/90"
                    : "border border-border hover:bg-accent"
                }`}>
                  {t.cta}
                </span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/30 bg-card/20">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <TrendingUp className="w-8 h-8 text-fang-cyan mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">开始您的智能投研之旅</h2>
          <p className="text-sm text-muted-foreground mb-6">7 天免费试用，无需绑定支付方式</p>
          <Link href="/trial">
            <span className="inline-flex items-center gap-2 px-8 py-3 bg-fang-cyan text-black font-semibold rounded-lg hover:bg-fang-cyan/90 transition-colors cursor-pointer">
              立即体验
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground font-data">
            STOCKCLAW v3.3 | 乐石智能 · Powered by Agent Swarm
          </span>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/"><span className="hover:text-foreground cursor-pointer">看板</span></Link>
            <Link href="/pricing"><span className="hover:text-foreground cursor-pointer">定价</span></Link>
            <Link href="/reports"><span className="hover:text-foreground cursor-pointer">每日摘要</span></Link>
            <Link href="/subscriptions"><span className="hover:text-foreground cursor-pointer">订阅管理</span></Link>
          </div>
          <span className="text-[10px] text-muted-foreground">
            本系统仅供投资研究参考，不构成投资建议
          </span>
        </div>
      </footer>
    </div>
  );
}
