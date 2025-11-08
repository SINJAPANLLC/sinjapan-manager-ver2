import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, CheckCircle2, XCircle, AlertCircle, Plus, RefreshCw, Trash2 } from "lucide-react";
import { insertServiceCredentialSchema, type InsertServiceCredential, type ServiceCredential } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function SystemSettings() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceCredential | null>(null);

  // サービス認証情報取得
  const { data: credentials = [], isLoading } = useQuery<ServiceCredential[]>({
    queryKey: ["/api/settings/services"],
  });

  // フォーム設定
  const form = useForm<InsertServiceCredential>({
    resolver: zodResolver(insertServiceCredentialSchema),
    defaultValues: {
      serviceName: "",
      serviceType: "ai",
      secretKeyName: "",
      status: "inactive",
      isConnected: false,
      accountId: "",
      accountEmail: "",
      config: "",
      notes: "",
    },
  });

  // サービス追加/更新
  const saveMutation = useMutation({
    mutationFn: async (data: InsertServiceCredential) => {
      if (selectedService) {
        return await apiRequest(`/api/settings/services/${selectedService.id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
      } else {
        return await apiRequest("/api/settings/services", {
          method: "POST",
          body: JSON.stringify(data),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/services"] });
      setIsDialogOpen(false);
      setSelectedService(null);
      form.reset();
      toast({
        title: "保存しました",
        description: "サービス認証情報を更新しました",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: error.message || "保存に失敗しました",
      });
    },
  });

  // サービス削除
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/settings/services/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/services"] });
      toast({
        title: "削除しました",
        description: "サービス認証情報を削除しました",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: error.message || "削除に失敗しました",
      });
    },
  });

  // 接続確認
  const checkMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/settings/services/${id}/check`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/services"] });
      toast({
        title: "接続確認完了",
        description: "接続状態を更新しました",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: error.message || "接続確認に失敗しました",
      });
    },
  });

  const onSubmit = (data: InsertServiceCredential) => {
    saveMutation.mutate(data);
  };

  const handleEdit = (service: ServiceCredential) => {
    setSelectedService(service);
    // パスワードはnullで返ってくるので、空文字列に変換
    form.reset({
      ...service,
      loginPassword: "",
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedService(null);
    form.reset({
      serviceName: "",
      serviceType: "ai",
      secretKeyName: "",
      status: "inactive",
      isConnected: false,
      accountId: "",
      accountEmail: "",
      config: "",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (service: ServiceCredential) => {
    if (service.isConnected) {
      return (
        <Badge variant="default" className="bg-green-500" data-testid={`badge-status-${service.id}`}>
          <CheckCircle2 className="h-3 w-3 mr-1" />
          接続中
        </Badge>
      );
    } else if (service.status === "error") {
      return (
        <Badge variant="destructive" data-testid={`badge-status-${service.id}`}>
          <XCircle className="h-3 w-3 mr-1" />
          エラー
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" data-testid={`badge-status-${service.id}`}>
          <AlertCircle className="h-3 w-3 mr-1" />
          未接続
        </Badge>
      );
    }
  };

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ai: "AI",
      email: "メール",
      payment: "決済",
      accounting: "会計",
      crm: "CRM",
      storage: "ストレージ",
      communication: "コミュニケーション",
      other: "その他",
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="container max-w-screen-2xl mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="container max-w-screen-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">システム設定</h1>
          <p className="text-muted-foreground">
            外部サービスの接続情報とAPIキーを管理します
          </p>
        </div>
        <Button onClick={handleAddNew} data-testid="button-add-service">
          <Plus className="h-4 w-4 mr-2" />
          サービス追加
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {credentials.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Settings className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">サービスが登録されていません</p>
              <p className="text-sm text-muted-foreground mt-2">
                「サービス追加」ボタンから外部サービスを登録してください
              </p>
            </CardContent>
          </Card>
        ) : (
          credentials.map((service) => (
            <Card key={service.id} data-testid={`card-service-${service.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{service.serviceName}</CardTitle>
                      {getStatusBadge(service)}
                      <Badge variant="outline" data-testid={`badge-type-${service.id}`}>
                        {getServiceTypeLabel(service.serviceType)}
                      </Badge>
                    </div>
                    {service.accountEmail && (
                      <CardDescription data-testid={`text-account-email-${service.id}`}>
                        {service.accountEmail}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => checkMutation.mutate(service.id)}
                      disabled={checkMutation.isPending}
                      data-testid={`button-check-${service.id}`}
                    >
                      <RefreshCw className={`h-4 w-4 ${checkMutation.isPending ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleEdit(service)}
                      data-testid={`button-edit-${service.id}`}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        if (confirm("本当に削除しますか？")) {
                          deleteMutation.mutate(service.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${service.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {service.serviceUrl && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">サービスURL</p>
                      <a 
                        href={service.serviceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-all"
                        data-testid={`link-service-url-${service.id}`}
                      >
                        {service.serviceUrl}
                      </a>
                    </div>
                  )}
                  {service.loginUsername && (
                    <div>
                      <p className="text-muted-foreground">ログインID</p>
                      <p className="font-mono" data-testid={`text-login-username-${service.id}`}>
                        {service.loginUsername}
                      </p>
                    </div>
                  )}
                  {service.loginPassword && (
                    <div>
                      <p className="text-muted-foreground">パスワード</p>
                      <p className="text-sm" data-testid={`text-login-password-${service.id}`}>
                        <Badge variant="secondary">保存済み</Badge>
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">環境変数名</p>
                    <p className="font-mono" data-testid={`text-secret-key-${service.id}`}>
                      {service.secretKeyName || "未設定"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">アカウントID</p>
                    <p className="font-mono" data-testid={`text-account-id-${service.id}`}>
                      {service.accountId || "未設定"}
                    </p>
                  </div>
                  {service.lastCheckedAt && (
                    <div>
                      <p className="text-muted-foreground">最終確認</p>
                      <p data-testid={`text-last-checked-${service.id}`}>
                        {new Date(service.lastCheckedAt).toLocaleString("ja-JP")}
                      </p>
                    </div>
                  )}
                  {service.lastSuccessAt && (
                    <div>
                      <p className="text-muted-foreground">最終成功</p>
                      <p data-testid={`text-last-success-${service.id}`}>
                        {new Date(service.lastSuccessAt).toLocaleString("ja-JP")}
                      </p>
                    </div>
                  )}
                </div>
                {service.lastError && (
                  <div className="p-3 bg-destructive/10 rounded-md">
                    <p className="text-sm text-destructive" data-testid={`text-error-${service.id}`}>
                      {service.lastError}
                    </p>
                  </div>
                )}
                {service.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">メモ</p>
                    <p className="text-sm" data-testid={`text-notes-${service.id}`}>
                      {service.notes}
                    </p>
                  </div>
                )}
                {/* 外部サービスへのログインボタン */}
                {service.serviceUrl && service.loginUsername && service.loginPassword && (
                  <div className="border-t pt-4 mt-4">
                    <Button
                      className="w-full"
                      variant="default"
                      onClick={() => {
                        window.open(service.serviceUrl, '_blank', 'noopener,noreferrer');
                        toast({
                          title: "ログイン情報",
                          description: `ログインID: ${service.loginUsername}\nパスワードは保存済みです`,
                        });
                      }}
                      data-testid={`button-login-${service.id}`}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      外部サービスにログイン
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 追加/編集ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-service-form">
          <DialogHeader>
            <DialogTitle>
              {selectedService ? "サービス編集" : "サービス追加"}
            </DialogTitle>
            <DialogDescription>
              外部サービスの接続情報を入力してください
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="serviceName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>サービス名 *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="OpenAI" data-testid="input-service-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>サービス種別 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-service-type">
                          <SelectValue placeholder="種別を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ai">AI</SelectItem>
                        <SelectItem value="email">メール</SelectItem>
                        <SelectItem value="payment">決済</SelectItem>
                        <SelectItem value="accounting">会計</SelectItem>
                        <SelectItem value="crm">CRM</SelectItem>
                        <SelectItem value="storage">ストレージ</SelectItem>
                        <SelectItem value="communication">コミュニケーション</SelectItem>
                        <SelectItem value="other">その他</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serviceUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>サービスURL</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} type="url" placeholder="https://example.com" data-testid="input-service-url" />
                    </FormControl>
                    <FormDescription>
                      外部サービスのログインページURLを入力してください
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="loginUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ログインID/ユーザー名</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="your-username" data-testid="input-login-username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="loginPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ログインパスワード</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} type="password" placeholder="••••••••" data-testid="input-login-password" />
                    </FormControl>
                    <FormDescription>
                      注意：パスワードは暗号化して保存されます
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secretKeyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>環境変数名（オプション）</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="OPENAI_API_KEY" data-testid="input-secret-key-name" />
                    </FormControl>
                    <FormDescription>
                      APIキーを環境変数で管理する場合に入力してください
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>アカウントID</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="acct_..." data-testid="input-account-id" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>アカウントメール</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} type="email" placeholder="admin@example.com" data-testid="input-account-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>メモ</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} placeholder="追加情報..." data-testid="input-notes" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={saveMutation.isPending}
                  data-testid="button-cancel"
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  data-testid="button-submit"
                >
                  {saveMutation.isPending ? "保存中..." : "保存"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
