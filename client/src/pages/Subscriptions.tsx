import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast as sonnerToast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Bell, Mail, MessageSquare, Plus, Trash2, Settings2, Zap, Clock, Calendar } from "lucide-react";

const CHANNELS = [
  { value: "email", label: "邮件 Email", labelEn: "Email", icon: Mail },
  { value: "feishu", label: "飞书 Feishu", labelEn: "Feishu Webhook", icon: MessageSquare },
  { value: "wecom", label: "企业微信 WeCom", labelEn: "WeCom Webhook", icon: MessageSquare },
] as const;

const FREQUENCIES = [
  { value: "realtime", label: "实时推送", labelEn: "Real-time", icon: Zap, desc: "异常信号立即推送" },
  { value: "daily", label: "每日摘要", labelEn: "Daily Digest", icon: Clock, desc: "每日一次汇总推送" },
  { value: "weekly", label: "每周报告", labelEn: "Weekly Report", icon: Calendar, desc: "每周一次汇总推送" },
] as const;

export default function Subscriptions() {
  const { user } = useAuth();

  const [showAdd, setShowAdd] = useState(false);
  const [newChannel, setNewChannel] = useState<string>("email");
  const [newAddress, setNewAddress] = useState("");
  const [newFrequency, setNewFrequency] = useState<string>("daily");

  const userId = (user as { id?: number } | null)?.id ?? 0;
  const { data: subs, refetch } = trpc.subscriptions.list.useQuery(
    { userId },
    { enabled: userId > 0 }
  );
  const createMut = trpc.subscriptions.create.useMutation({
    onSuccess: () => {
      sonnerToast.success("订阅创建成功 / Subscription created");
      refetch();
      setShowAdd(false);
      setNewAddress("");
    },
  });
  const updateMut = trpc.subscriptions.update.useMutation({
    onSuccess: () => {
      sonnerToast.success("订阅已更新 / Subscription updated");
      refetch();
    },
  });
  const deleteMut = trpc.subscriptions.delete.useMutation({
    onSuccess: () => {
      sonnerToast.success("订阅已删除 / Subscription deleted");
      refetch();
    },
  });
  const testMut = trpc.subscriptions.testPush.useMutation({
    onSuccess: (data) => {
      sonnerToast.success(`推送测试完成：发送 ${data.sent} 条通知，检测到 ${data.anomalies.length} 个异常信号`);
    },
  });

  const handleCreate = () => {
    if (!newAddress.trim()) {
      sonnerToast.error("请输入渠道地址");
      return;
    }
    createMut.mutate({
      userId,
      channel: newChannel as "email" | "feishu" | "wecom",
      channelAddress: newAddress,
      frequency: newFrequency as "realtime" | "daily" | "weekly",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/30 bg-[#060A13]/80 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-fang-cyan" />
            <div>
              <h1 className="text-lg font-bold">订阅推送管理</h1>
              <p className="text-xs text-muted-foreground">Subscription & Push Management</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => testMut.mutate()}
              disabled={testMut.isPending}
              className="text-fang-amber border-fang-amber/30"
            >
              <Zap className="w-3.5 h-3.5 mr-1" />
              {testMut.isPending ? "推送中..." : "测试推送"}
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAdd(!showAdd)}
              className="bg-fang-cyan text-black hover:bg-fang-cyan/80"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              新增订阅
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Add form */}
        {showAdd && (
          <Card className="bg-[#0A1628] border-fang-cyan/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-fang-cyan" />
                新增推送订阅 / New Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">推送渠道 Channel</label>
                  <Select value={newChannel} onValueChange={setNewChannel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CHANNELS.map(ch => (
                        <SelectItem key={ch.value} value={ch.value}>{ch.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">推送频率 Frequency</label>
                  <Select value={newFrequency} onValueChange={setNewFrequency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {newChannel === "email" ? "邮箱地址 Email" : "Webhook URL"}
                  </label>
                  <Input
                    value={newAddress}
                    onChange={e => setNewAddress(e.target.value)}
                    placeholder={newChannel === "email" ? "your@email.com" : "https://..."}
                    className="bg-background/50"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>取消</Button>
                <Button size="sm" onClick={handleCreate} disabled={createMut.isPending}
                  className="bg-fang-cyan text-black">
                  {createMut.isPending ? "创建中..." : "确认创建"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Frequency explanation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {FREQUENCIES.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.value} className="flex items-start gap-3 p-3 rounded-lg bg-[#0A1628]/60 border border-border/20">
                <Icon className="w-4 h-4 text-fang-cyan mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{f.label} <span className="text-muted-foreground text-xs">/ {f.labelEn}</span></p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Subscription list */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            当前订阅 Current Subscriptions ({subs?.length ?? 0})
          </h2>
          {(!subs || subs.length === 0) ? (
            <Card className="bg-[#0A1628]/60 border-border/20">
              <CardContent className="py-8 text-center">
                <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">暂无订阅，点击"新增订阅"开始接收推送</p>
                <p className="text-xs text-muted-foreground mt-1">No subscriptions yet. Click "New Subscription" to start.</p>
              </CardContent>
            </Card>
          ) : (
            subs.map(sub => {
              const ch = CHANNELS.find(c => c.value === sub.channel);
              const freq = FREQUENCIES.find(f => f.value === sub.frequency);
              const ChIcon = ch?.icon ?? Mail;
              return (
                <Card key={sub.id} className="bg-[#0A1628]/60 border-border/20">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ChIcon className="w-4 h-4 text-fang-cyan" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{ch?.label}</span>
                            <Badge variant="outline" className="text-[10px]">{freq?.label}</Badge>
                            {sub.isActive ? (
                              <Badge className="bg-fang-green/20 text-fang-green text-[10px]">启用</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">已暂停</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                            {(sub.channelAddress as string).length > 40
                              ? (sub.channelAddress as string).substring(0, 40) + "..."
                              : sub.channelAddress}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!!sub.isActive}
                          onCheckedChange={(checked) => {
                            updateMut.mutate({ id: sub.id, isActive: checked ? 1 : 0 });
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteMut.mutate({ id: sub.id })}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
