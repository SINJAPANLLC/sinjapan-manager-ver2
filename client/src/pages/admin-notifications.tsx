import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertNotificationSchema, type User } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Plus, Send, AlertTriangle } from "lucide-react";

export default function AdminNotifications() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  if (user && user.role !== "CEO" && user.role !== "Manager") {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-screen-2xl">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                アクセス拒否
              </CardTitle>
              <CardDescription>
                このページは管理者（CEOまたはマネージャー）のみアクセスできます。
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: user?.role === "CEO" || user?.role === "Manager",
  });

  const form = useForm({
    resolver: zodResolver(insertNotificationSchema.extend({
      toUserId: z.string().min(1, "受信者を選択してください"),
      title: z.string().min(1, "タイトルを入力してください"),
      message: z.string().min(1, "メッセージを入力してください"),
    })),
    defaultValues: {
      toUserId: "",
      title: "",
      message: "",
      type: "info",
      category: "general",
      priority: "normal",
      linkUrl: "",
      linkText: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/notifications", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "通知を送信しました" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "通知の送信に失敗しました", variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-screen-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="h-8 w-8 text-primary" />
              通知管理（管理者）
            </h1>
            <p className="text-muted-foreground mt-1">従業員への通知送信</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-notification">
            <Plus className="h-4 w-4 mr-2" />
            通知作成
          </Button>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>通知機能について</CardTitle>
            <CardDescription>従業員に重要な情報を通知できます</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>給与支払い通知、契約更新のお知らせ、システムメンテナンス情報などを送信できます</li>
              <li>優先度を設定して、重要な通知を目立たせることができます</li>
              <li>リンクを設定すると、従業員が詳細ページにアクセスできます</li>
            </ul>
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>通知を作成</DialogTitle>
              <DialogDescription>従業員に送信する通知を作成します</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="toUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>受信者 *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-recipient">
                            <SelectValue placeholder="受信者を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>タイトル *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="給与支払いのお知らせ" data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>メッセージ *</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="今月の給与が振り込まれました..." rows={5} data-testid="textarea-message" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>種別</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="info">情報</SelectItem>
                            <SelectItem value="warning">警告</SelectItem>
                            <SelectItem value="urgent">緊急</SelectItem>
                            <SelectItem value="system">システム</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>優先度</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-priority">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">低</SelectItem>
                            <SelectItem value="normal">通常</SelectItem>
                            <SelectItem value="high">高</SelectItem>
                            <SelectItem value="urgent">緊急</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>カテゴリー</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="salary">給与</SelectItem>
                          <SelectItem value="workflow">ワークフロー</SelectItem>
                          <SelectItem value="general">一般</SelectItem>
                          <SelectItem value="system">システム</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="linkUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>リンクURL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="/employee-salaries" data-testid="input-link-url" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="linkText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>リンクテキスト</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="給与明細を確認" data-testid="input-link-text" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                    <Send className="h-4 w-4 mr-2" />
                    {createMutation.isPending ? "送信中..." : "送信"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      form.reset();
                    }}
                    data-testid="button-cancel"
                  >
                    キャンセル
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
