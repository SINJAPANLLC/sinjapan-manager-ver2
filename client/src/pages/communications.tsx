import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Mail, Send, Inbox, Archive, Plus, Reply } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCommunicationSchema } from "@shared/schema";
import { cn } from "@/lib/utils";

const messageFormSchema = insertCommunicationSchema.extend({
  recipient: z.string().email("有効なメールアドレスを入力してください"),
  subject: z.string().min(1, "件名を入力してください"),
  body: z.string().min(1, "本文を入力してください"),
});

export default function Communications() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof messageFormSchema>>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      type: "email",
      direction: "outbound",
      sender: "system@sinjapan.com",
      recipient: "",
      subject: "",
      body: "",
      status: "read",
    },
  });

  const { data: communications, isLoading } = useQuery<any[]>({
    queryKey: ["/api/communications"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof messageFormSchema>) => {
      return await apiRequest("POST", "/api/communications", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications"] });
      setOpen(false);
      form.reset();
      toast({
        title: "メッセージを送信しました",
        description: "メッセージが正常に送信されました。",
      });
    },
    onError: (error: any) => {
      toast({
        title: "送信に失敗しました",
        description: error.message || "メッセージの送信中にエラーが発生しました。",
        variant: "destructive",
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PATCH", `/api/communications/${id}`, { status: "archived" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications"] });
      toast({
        title: "アーカイブしました",
        description: "メッセージをアーカイブしました。",
      });
    },
    onError: (error: any) => {
      toast({
        title: "アーカイブに失敗しました",
        description: error.message || "メッセージのアーカイブ中にエラーが発生しました。",
        variant: "destructive",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PATCH", `/api/communications/${id}`, { status: "read" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications"] });
    },
    onError: (error: any) => {
      toast({
        title: "既読化に失敗しました",
        description: error.message || "メッセージの既読化中にエラーが発生しました。",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: z.infer<typeof messageFormSchema>) => {
    createMutation.mutate(values);
  };

  const handleReply = (message: any) => {
    form.reset({
      type: "email",
      direction: "outbound",
      sender: "system@sinjapan.com",
      recipient: message.sender,
      subject: `Re: ${message.subject}`,
      body: "",
      status: "read",
    });
    setOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      form.reset();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const inboundMessages = communications?.filter((c: any) => c.direction === "inbound") || [];
  const outboundMessages = communications?.filter((c: any) => c.direction === "outbound") || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">統合コミュニケーション</h1>
          <p className="text-muted-foreground mt-1">
            Gmail連携 - メール管理
          </p>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-message">
              <Plus className="h-4 w-4 mr-2" />
              新規メッセージ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>新規メッセージ</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="recipient"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>宛先 *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="example@email.com"
                          data-testid="input-recipient"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>件名 *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="メッセージの件名"
                          data-testid="input-subject"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>本文 *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="メッセージの内容"
                          rows={8}
                          data-testid="textarea-body"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                    キャンセル
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit">
                    送信
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
            <p className="text-sm font-medium text-muted-foreground">受信</p>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{inboundMessages.length}</p>
            <p className="text-xs text-muted-foreground mt-1">新着メッセージ</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
            <p className="text-sm font-medium text-muted-foreground">送信</p>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{outboundMessages.length}</p>
            <p className="text-xs text-muted-foreground mt-1">送信済み</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
            <p className="text-sm font-medium text-muted-foreground">未読</p>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">
              {communications?.filter((c: any) => c.status === "unread").length || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">未読メッセージ</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            最近のメッセージ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(!communications || communications.length === 0) ? (
              <div className="text-center py-16">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">まだメッセージがありません</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Gmailと連携すると、ここにメッセージが表示されます
                </p>
              </div>
            ) : (
              communications.slice(0, 10).map((message: any) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-md border hover-elevate group",
                    message.status === "unread" && "bg-primary/5 border-primary/20"
                  )}
                  data-testid={`message-${message.id}`}
                  onClick={() => message.status === "unread" && markAsReadMutation.mutate(message.id)}
                >
                  <div className={cn(
                    "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
                    message.direction === "inbound" ? "bg-blue-500/20" : "bg-green-500/20"
                  )}>
                    {message.direction === "inbound" ? (
                      <Inbox className="h-5 w-5 text-blue-500" />
                    ) : (
                      <Send className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold truncate">
                        {message.direction === "inbound" ? message.sender : message.recipient}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={message.status === "unread" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {message.status === "unread" && "未読"}
                          {message.status === "read" && "既読"}
                          {message.status === "archived" && "アーカイブ"}
                        </Badge>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          {message.direction === "inbound" && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReply(message);
                              }}
                              data-testid={`button-reply-${message.id}`}
                            >
                              <Reply className="h-3 w-3" />
                            </Button>
                          )}
                          {message.status !== "archived" && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                archiveMutation.mutate(message.id);
                              }}
                              disabled={archiveMutation.isPending}
                              data-testid={`button-archive-${message.id}`}
                            >
                              <Archive className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-medium mt-1">{message.subject}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {message.body}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(message.receivedAt || message.createdAt).toLocaleString("ja-JP")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
