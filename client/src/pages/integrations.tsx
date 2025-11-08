import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Settings,
  Smartphone,
  Phone,
  Mail,
  Database,
  FileSpreadsheet,
  Bot,
  MessageSquare,
  Send,
  Twitter,
  Video,
  Palette,
  FileSignature,
  Building2,
  Square,
  CreditCard,
  Zap,
  Plus,
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ServiceCredential } from "@shared/schema";

const INTEGRATION_TEMPLATES = [
  { name: "Stripe", type: "payment", icon: CreditCard, description: "決済処理とサブスクリプション管理" },
  { name: "Square", type: "payment", icon: Square, description: "決済処理と売上管理" },
  { name: "Google Sheets", type: "data", icon: FileSpreadsheet, description: "スプレッドシート連携とデータ同期" },
  { name: "Gmail", type: "email", icon: Mail, description: "メール送受信と自動返信" },
  { name: "LINE", type: "communication", icon: MessageSquare, description: "メッセージ送受信とWebhook" },
  { name: "LINE Official", type: "communication", icon: MessageSquare, description: "公式アカウント・ブロードキャスト" },
  { name: "Slack", type: "communication", icon: Send, description: "通知とチャンネル管理" },
  { name: "ChatWork", type: "communication", icon: MessageSquare, description: "メッセージ送信とタスク管理" },
  { name: "X (Twitter)", type: "social", icon: Twitter, description: "投稿とフォロワー管理" },
  { name: "TikTok", type: "social", icon: Video, description: "動画投稿とアナリティクス" },
  { name: "Zoom", type: "meeting", icon: Video, description: "ミーティング作成と参加者管理" },
  { name: "Canva", type: "design", icon: Palette, description: "デザイン作成とテンプレート管理" },
  { name: "CloudSign", type: "signature", icon: FileSignature, description: "電子署名と契約書管理" },
  { name: "Bank Integration", type: "finance", icon: Building2, description: "残高照会と取引履歴" },
  { name: "Phone Integration", type: "communication", icon: Phone, description: "通話記録とSMS送信" },
  { name: "iPhone Sync", type: "data", icon: Smartphone, description: "連絡先・カレンダー同期" },
  { name: "ChatGPT", type: "ai", icon: Bot, description: "AI会話とコンテンツ生成" },
  { name: "Data Connector", type: "data", icon: Database, description: "汎用データ連携" },
];

export default function Integrations() {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const { data: credentials = [], isLoading } = useQuery<ServiceCredential[]>({
    queryKey: ["/api/settings/services"],
  });

  const createServiceMutation = useMutation({
    mutationFn: async (template: typeof INTEGRATION_TEMPLATES[0]) =>
      apiRequest("/api/settings/services", {
        method: "POST",
        body: JSON.stringify({
          serviceName: template.name,
          serviceType: template.type,
          status: "inactive",
          isConnected: false,
          notes: template.description,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/services"] });
      toast({
        title: "成功",
        description: "サービスを追加しました",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (serviceName: string) => {
    const service = credentials.find((c) => c.serviceName === serviceName);
    if (!service) {
      return (
        <Badge variant="outline">
          <AlertCircle className="h-3 w-3 mr-1" />
          未設定
        </Badge>
      );
    }
    if (service.isConnected) {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          接続中
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <XCircle className="h-3 w-3 mr-1" />
        未接続
        </Badge>
    );
  };

  const handleQuickAdd = (template: typeof INTEGRATION_TEMPLATES[0]) => {
    const existing = credentials.find((c) => c.serviceName === template.name);
    if (existing) {
      toast({
        title: "既に登録済み",
        description: "このサービスは既に登録されています",
        variant: "destructive",
      });
      return;
    }
    createServiceMutation.mutate(template);
  };

  const filteredTemplates = selectedType
    ? INTEGRATION_TEMPLATES.filter((t) => t.type === selectedType)
    : INTEGRATION_TEMPLATES;

  const types = Array.from(new Set(INTEGRATION_TEMPLATES.map((t) => t.type)));

  if (isLoading) {
    return (
      <div className="container max-w-screen-2xl mx-auto p-6 space-y-6">
        <Skeleton className="h-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-screen-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            外部サービス連携
          </h1>
          <p className="text-muted-foreground mt-2">
            18種類の外部サービスと連携して、ビジネスを加速
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{credentials.length}</CardTitle>
              <CardDescription>登録済みサービス</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {credentials.filter((c) => c.isConnected).length}
              </CardTitle>
              <CardDescription>接続中</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {INTEGRATION_TEMPLATES.length}
              </CardTitle>
              <CardDescription>利用可能な連携</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-medium">設定</CardTitle>
                <CardDescription>詳細設定</CardDescription>
              </div>
              <Link href="/system-settings">
                <Button size="sm" variant="outline" data-testid="button-settings">
                  <Settings className="h-4 w-4 mr-2" />
                  設定画面
                </Button>
              </Link>
            </CardHeader>
          </Card>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={selectedType === null ? "default" : "outline"}
            onClick={() => setSelectedType(null)}
            data-testid="button-filter-all"
          >
            全て
          </Button>
          {types.map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? "default" : "outline"}
              onClick={() => setSelectedType(type)}
              data-testid={`button-filter-${type}`}
            >
              {type}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const Icon = template.icon;
            const isAdded = credentials.some((c) => c.serviceName === template.name);
            
            return (
              <Card
                key={template.name}
                className="hover-elevate active-elevate-2"
                data-testid={`card-integration-${template.name}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant="outline" className="mt-1">
                          {template.type}
                        </Badge>
                      </div>
                    </div>
                    {getStatusBadge(template.name)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {template.description}
                  </p>
                  {!isAdded ? (
                    <Button
                      className="w-full"
                      onClick={() => handleQuickAdd(template)}
                      disabled={createServiceMutation.isPending}
                      data-testid={`button-add-${template.name}`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      追加
                    </Button>
                  ) : (
                    <Link href="/system-settings">
                      <Button variant="outline" className="w-full" data-testid={`button-configure-${template.name}`}>
                        <Settings className="h-4 w-4 mr-2" />
                        設定
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
