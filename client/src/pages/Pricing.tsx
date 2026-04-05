import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Zap, Crown, Building2, ArrowRight } from "lucide-react";
import { Link } from "wouter";

type Tier = "free" | "pro" | "enterprise";

interface PlanFeature {
  name: string;
  nameEn: string;
  free: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
}

const FEATURES: PlanFeature[] = [
  { name: "目标池公司数量", nameEn: "Target Pool Size", free: "5 家", pro: "20 家", enterprise: "不限" },
  { name: "六维因子分析", nameEn: "6-Dimension Factor Analysis", free: true, pro: true, enterprise: true },
  { name: "AI 因果推理引擎", nameEn: "AI Causal Reasoning", free: "3 次/天", pro: "不限", enterprise: "不限" },
  { name: "因子发现模式", nameEn: "Factor Discovery Mode", free: false, pro: true, enterprise: true },
  { name: "异常信号推送", nameEn: "Anomaly Alert Push", free: false, pro: "邮件", enterprise: "全渠道" },
  { name: "每日摘要报告", nameEn: "Daily Summary Report", free: false, pro: true, enterprise: true },
  { name: "因子热力矩阵", nameEn: "Factor Heatmap Matrix", free: false, pro: true, enterprise: true },
  { name: "因子回测模拟", nameEn: "Factor Backtest", free: false, pro: true, enterprise: true },
  { name: "拥挤度实时监控", nameEn: "Crowding Monitor", free: false, pro: true, enterprise: true },
  { name: "分析结果分享", nameEn: "Analysis Sharing", free: false, pro: true, enterprise: true },
  { name: "API 接口访问", nameEn: "API Access", free: false, pro: false, enterprise: true },
  { name: "专属客户经理", nameEn: "Dedicated Account Manager", free: false, pro: false, enterprise: true },
  { name: "定制因子模板", nameEn: "Custom Factor Templates", free: false, pro: false, enterprise: true },
];

const PLANS = [
  {
    tier: "free" as Tier,
    name: "体验版",
    nameEn: "Free Trial",
    price: "¥0",
    priceEn: "Free",
    period: "7天试用",
    periodEn: "7-day trial",
    icon: Zap,
    color: "text-muted-foreground",
    borderColor: "border-border/30",
    bgColor: "bg-[#0A1628]/40",
    cta: "开始试用",
    ctaEn: "Start Trial",
    ctaLink: "/trial",
  },
  {
    tier: "pro" as Tier,
    name: "专业版",
    nameEn: "Professional",
    price: "¥299",
    priceEn: "$42",
    period: "/月",
    periodEn: "/month",
    icon: Crown,
    color: "text-fang-cyan",
    borderColor: "border-fang-cyan/40",
    bgColor: "bg-fang-cyan/5",
    cta: "立即订阅",
    ctaEn: "Subscribe Now",
    ctaLink: "/subscriptions",
    popular: true,
  },
  {
    tier: "enterprise" as Tier,
    name: "企业版",
    nameEn: "Enterprise",
    price: "定制",
    priceEn: "Custom",
    period: "",
    periodEn: "",
    icon: Building2,
    color: "text-fang-amber",
    borderColor: "border-fang-amber/40",
    bgColor: "bg-fang-amber/5",
    cta: "联系我们",
    ctaEn: "Contact Us",
    ctaLink: "/trial",
  },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm text-foreground">{value}</span>;
  }
  return value ? (
    <Check className="w-4 h-4 text-fang-green mx-auto" />
  ) : (
    <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
  );
}

export default function Pricing() {
  const [billingCycle] = useState<"monthly" | "annual">("monthly");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <div className="border-b border-border/30 bg-[#060A13]/80 px-6 py-12 text-center">
        <Badge className="bg-fang-cyan/10 text-fang-cyan border-fang-cyan/30 mb-4">
          PRICING
        </Badge>
        <h1 className="text-3xl font-bold mb-2">选择适合您的方案</h1>
        <p className="text-muted-foreground">Choose the plan that fits your investment research needs</p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {PLANS.map(plan => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.tier}
                className={`relative rounded-xl border ${plan.borderColor} ${plan.bgColor} p-6 flex flex-col`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-fang-cyan text-black font-bold text-xs px-3">
                      最受欢迎 POPULAR
                    </Badge>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <Icon className={`w-5 h-5 ${plan.color}`} />
                  <div>
                    <h3 className={`text-lg font-bold ${plan.color}`}>{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.nameEn}</p>
                  </div>
                </div>
                <div className="mb-6">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                  {plan.priceEn !== plan.price && (
                    <p className="text-xs text-muted-foreground mt-1">≈ {plan.priceEn}{plan.periodEn}</p>
                  )}
                </div>
                <Link href={plan.ctaLink}>
                  <Button
                    className={`w-full ${plan.popular ? "bg-fang-cyan text-black hover:bg-fang-cyan/80" : ""}`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
                <p className="text-[10px] text-muted-foreground text-center mt-2">{plan.ctaEn}</p>
              </div>
            );
          })}
        </div>

        {/* Feature comparison table */}
        <div className="rounded-xl border border-border/30 overflow-hidden">
          <div className="bg-[#0A1628]/80 px-6 py-3 border-b border-border/30">
            <h2 className="text-sm font-bold">功能对比 Feature Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="text-left px-6 py-3 text-xs text-muted-foreground font-medium w-1/3">
                    功能 Feature
                  </th>
                  {PLANS.map(plan => (
                    <th key={plan.tier} className={`px-4 py-3 text-xs font-medium text-center ${plan.color}`}>
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feat, i) => (
                  <tr key={i} className="border-b border-border/10 hover:bg-[#0A1628]/30">
                    <td className="px-6 py-2.5">
                      <span className="text-sm">{feat.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">{feat.nameEn}</span>
                    </td>
                    <td className="px-4 py-2.5 text-center"><FeatureCell value={feat.free} /></td>
                    <td className="px-4 py-2.5 text-center"><FeatureCell value={feat.pro} /></td>
                    <td className="px-4 py-2.5 text-center"><FeatureCell value={feat.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            有任何问题？请联系我们：<span className="text-fang-cyan">support@stockclaw.com</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Questions? Contact us at support@stockclaw.com
          </p>
        </div>
      </div>
    </div>
  );
}
