import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast as sonnerToast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Sparkles, Shield, Clock, Zap, CheckCircle2, ArrowRight, Activity } from "lucide-react";

const BENEFITS = [
  { icon: Activity, title: "六维因子分析", titleEn: "6-Dimension Factor Analysis", desc: "技术/基本面/资金/政策/情绪/产业链" },
  { icon: Zap, title: "AI 因果推理引擎", titleEn: "AI Causal Reasoning Engine", desc: "输入一条消息，自动分析影响链" },
  { icon: Shield, title: "风控拥挤度监控", titleEn: "Risk Crowding Monitor", desc: "实时检测持仓集中度风险" },
  { icon: Clock, title: "7 天完整体验", titleEn: "7-Day Full Access", desc: "所有专业版功能免费使用" },
];

export default function Trial() {
  const [contact, setContact] = useState("");
  const [contactType, setContactType] = useState<string>("email");
  const [submitted, setSubmitted] = useState(false);
  const [trialInfo, setTrialInfo] = useState<{ expiresAt: string | Date } | null>(null);

  const registerMut = trpc.trials.register.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        sonnerToast.success(data.message);
        setSubmitted(true);
        setTrialInfo(data.trial as { expiresAt: string | Date });
      } else {
        sonnerToast.info(data.message);
        if (data.trial) {
          setSubmitted(true);
          setTrialInfo(data.trial as { expiresAt: string | Date });
        }
      }
    },
    onError: () => {
      sonnerToast.error("申请失败，请稍后重试");
    },
  });

  const handleSubmit = () => {
    if (!contact.trim()) {
      sonnerToast.error("请输入联系方式");
      return;
    }
    if (contactType === "email" && !contact.includes("@")) {
      sonnerToast.error("请输入有效的邮箱地址");
      return;
    }
    registerMut.mutate({
      contact,
      contactType: contactType as "email" | "wechat",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <div className="border-b border-border/30 bg-[#060A13]/80 px-6 py-16 text-center">
        <Badge className="bg-fang-green/10 text-fang-green border-fang-green/30 mb-4">
          FREE TRIAL
        </Badge>
        <h1 className="text-3xl font-bold mb-3">
          <Sparkles className="w-7 h-7 inline-block text-fang-amber mr-2 -mt-1" />
          免费体验 StockClaw 投研引擎
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          7 天完整功能体验，无需绑定支付方式。发现 AI 驱动的六维因子分析如何改变您的投资决策流程。
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          7-day full access trial. No credit card required. Experience AI-powered 6-dimension factor analysis.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {BENEFITS.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-[#0A1628]/60 border border-border/20">
                <Icon className="w-5 h-5 text-fang-cyan mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{b.title}</p>
                  <p className="text-[10px] text-muted-foreground">{b.titleEn}</p>
                  <p className="text-xs text-muted-foreground mt-1">{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Registration form */}
        {!submitted ? (
          <Card className="bg-[#0A1628] border-fang-cyan/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-fang-amber" />
                申请免费试用 / Apply for Free Trial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">联系方式类型</label>
                  <Select value={contactType} onValueChange={setContactType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">邮箱 Email</SelectItem>
                      <SelectItem value="wechat">微信 WeChat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {contactType === "email" ? "邮箱地址 Email Address" : "微信号 WeChat ID"}
                  </label>
                  <Input
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                    placeholder={contactType === "email" ? "your@email.com" : "your_wechat_id"}
                    className="bg-background/50"
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  />
                </div>
              </div>
              <Button
                className="w-full bg-fang-cyan text-black hover:bg-fang-cyan/80"
                onClick={handleSubmit}
                disabled={registerMut.isPending}
              >
                {registerMut.isPending ? "申请中..." : "立即开始 7 天免费试用"}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                Start your 7-day free trial now. No payment required.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#0A1628] border-fang-green/30">
            <CardContent className="py-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-fang-green mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">试用已激活！</h2>
              <p className="text-muted-foreground mb-1">Trial Activated Successfully</p>
              {trialInfo && (
                <p className="text-sm text-muted-foreground">
                  有效期至 / Valid until: <span className="text-fang-cyan font-mono">
                    {new Date(trialInfo.expiresAt).toLocaleDateString("zh-CN")}
                  </span>
                </p>
              )}
              <div className="flex gap-3 justify-center mt-6">
                <Button variant="outline" asChild>
                  <a href="/">进入看板 Dashboard</a>
                </Button>
                <Button className="bg-fang-cyan text-black" asChild>
                  <a href="/pricing">查看付费方案 Pricing</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
