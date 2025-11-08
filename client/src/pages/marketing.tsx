import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, TrendingUp, Target, Calendar, BarChart3, Sparkles, Link2, Trash2, Send } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { Campaign, SocialPost, Business, InsertCampaign, InsertSocialPost, SocialConnection, InsertSocialConnection } from "@shared/schema";
import { insertCampaignSchema, insertSocialPostSchema, insertSocialConnectionSchema } from "@shared/schema";

export default function Marketing() {
  const { toast } = useToast();
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("campaigns");
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiContext, setAiContext] = useState("");

  // Fetch data
  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: socialPosts = [], isLoading: postsLoading } = useQuery<SocialPost[]>({
    queryKey: ["/api/social-posts"],
  });

  const { data: businesses = [] } = useQuery<Business[]>({
    queryKey: ["/api/businesses"],
  });

  const { data: socialConnections = [], isLoading: connectionsLoading } = useQuery<SocialConnection[]>({
    queryKey: ["/api/social-connections"],
  });

  // Campaign form - extend shared schema with frontend-specific validation
  const campaignFormSchema = insertCampaignSchema.extend({
    name: z.string().min(1, "キャンペーン名は必須です"),
    type: z.string().min(1, "タイプは必須です"),
  });

  const campaignForm = useForm<z.infer<typeof campaignFormSchema>>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      status: "draft",
      type: "social",
      businessId: undefined,
      description: undefined,
      startDate: undefined,
      endDate: undefined,
      budget: undefined,
      targetAudience: undefined,
      goals: undefined,
      metrics: undefined,
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: z.infer<typeof campaignFormSchema>) => {
      const payload: any = {
        ...data,
        businessId: data.businessId || undefined,
        description: data.description || undefined,
        startDate: data.startDate ? new Date(data.startDate as any) : undefined,
        endDate: data.endDate ? new Date(data.endDate as any) : undefined,
        budget: data.budget ? Number(data.budget) : undefined,
        targetAudience: data.targetAudience || undefined,
        goals: data.goals || undefined,
        metrics: data.metrics || undefined,
      };
      return await apiRequest("/api/campaigns", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "キャンペーンを作成しました",
        description: "新しいキャンペーンが正常に作成されました。",
      });
      setCampaignDialogOpen(false);
      campaignForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "キャンペーンの作成に失敗しました",
        variant: "destructive",
      });
    },
  });

  // Social Post form - extend shared schema with frontend-specific validation
  const postFormSchema = insertSocialPostSchema.extend({
    platform: z.string().min(1, "プラットフォームは必須です"),
    content: z.string().min(1, "投稿内容は必須です"),
  });

  const postForm = useForm<z.infer<typeof postFormSchema>>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      status: "draft",
      platform: "twitter",
      mediaUrls: [],
      campaignId: undefined,
      businessId: undefined,
      scheduledAt: undefined,
      publishedAt: undefined,
      externalId: undefined,
      metrics: undefined,
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: z.infer<typeof postFormSchema>) => {
      const payload: any = {
        ...data,
        campaignId: data.campaignId || undefined,
        businessId: data.businessId || undefined,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt as any) : undefined,
        mediaUrls: data.mediaUrls || [],
      };
      return await apiRequest("/api/social-posts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-posts"] });
      toast({
        title: "投稿を作成しました",
        description: "新しいSNS投稿が正常に作成されました。",
      });
      setPostDialogOpen(false);
      postForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "投稿の作成に失敗しました",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: "下書き", variant: "secondary" as const },
      active: { label: "実施中", variant: "default" as const },
      paused: { label: "一時停止", variant: "outline" as const },
      completed: { label: "完了", variant: "secondary" as const },
      scheduled: { label: "予約済み", variant: "outline" as const },
      published: { label: "公開済み", variant: "default" as const },
      failed: { label: "失敗", variant: "destructive" as const },
    };
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPlatformBadge = (platform: string) => {
    const platformMap = {
      twitter: { label: "X（旧Twitter）", color: "bg-blue-500" },
      instagram: { label: "Instagram", color: "bg-pink-500" },
      facebook: { label: "Facebook", color: "bg-blue-600" },
      linkedin: { label: "LinkedIn", color: "bg-blue-700" },
    };
    const config = platformMap[platform as keyof typeof platformMap] || { label: platform, color: "bg-gray-500" };
    return (
      <Badge className={`${config.color} text-white border-0`}>
        {config.label}
      </Badge>
    );
  };

  const onSubmitCampaign = (data: z.infer<typeof campaignFormSchema>) => {
    createCampaignMutation.mutate(data);
  };

  const onSubmitPost = (data: z.infer<typeof postFormSchema>) => {
    createPostMutation.mutate(data);
  };

  // Social Connection form
  const connectionFormSchema = insertSocialConnectionSchema.extend({
    platform: z.string().min(1, "プラットフォームは必須です"),
    accessToken: z.string().min(1, "アクセストークンは必須です"),
  });

  const connectionForm = useForm<z.infer<typeof connectionFormSchema>>({
    resolver: zodResolver(connectionFormSchema),
    defaultValues: {
      platform: "twitter",
      isActive: true,
      accessToken: "",
      refreshToken: undefined,
      tokenExpiresAt: undefined,
      platformUserId: undefined,
      platformUsername: undefined,
      profileData: undefined,
      lastUsed: undefined,
    },
  });

  const createConnectionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof connectionFormSchema>) => {
      return await apiRequest("/api/social-connections", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-connections"] });
      toast({
        title: "SNS接続を追加しました",
        description: "SNS連携が正常に設定されました",
      });
      connectionForm.reset();
      setConnectionDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "SNS接続の追加に失敗しました",
        variant: "destructive",
      });
    },
  });

  const deleteConnectionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/social-connections/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-connections"] });
      toast({
        title: "SNS接続を削除しました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "SNS接続の削除に失敗しました",
        variant: "destructive",
      });
    },
  });

  const publishPostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return await apiRequest(`/api/social-posts/${postId}/publish`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-posts"] });
      toast({
        title: "投稿を公開しました",
        description: "SNSに投稿が公開されました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "投稿の公開に失敗しました",
        variant: "destructive",
      });
    },
  });

  const aiGenerateMutation = useMutation({
    mutationFn: async (context: string) => {
      const response = await apiRequest("/api/ai/generate/social-post", {
        method: "POST",
        body: JSON.stringify({ context }),
      });
      return await response.json();
    },
    onSuccess: (data: { post: any }) => {
      if (data.post) {
        postForm.setValue("content", data.post.content);
        postForm.setValue("platform", data.post.platform);
        if (data.post.hashtags) {
          const currentContent = postForm.getValues("content");
          postForm.setValue("content", currentContent + "\n\n" + data.post.hashtags.join(" "));
        }
        setAiDialogOpen(false);
        setAiContext("");
        setPostDialogOpen(true);
        toast({
          title: "AI投稿を生成しました",
          description: "内容を確認して投稿を作成してください。",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "AI投稿生成に失敗しました。",
        variant: "destructive",
      });
    },
  });

  const onSubmitConnection = (data: z.infer<typeof connectionFormSchema>) => {
    createConnectionMutation.mutate(data);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-blue-600 to-cyan-500 bg-clip-text text-transparent">
            マーケティング管理
          </h1>
          <p className="text-muted-foreground mt-2">
            キャンペーン、SNS投稿、アナリティクスを一元管理
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総キャンペーン数</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground">
              実施中: {campaigns.filter(c => c.status === "active").length}
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総投稿数</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{socialPosts.length}</div>
            <p className="text-xs text-muted-foreground">
              公開済み: {socialPosts.filter(p => p.status === "published").length}
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">予約投稿</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {socialPosts.filter(p => p.status === "scheduled").length}
            </div>
            <p className="text-xs text-muted-foreground">今後の予定</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">エンゲージメント</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">分析中</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">
            <Target className="h-4 w-4 mr-2" />
            キャンペーン
          </TabsTrigger>
          <TabsTrigger value="posts" data-testid="tab-posts">
            <Sparkles className="h-4 w-4 mr-2" />
            SNS投稿
          </TabsTrigger>
          <TabsTrigger value="connections" data-testid="tab-connections">
            <Link2 className="h-4 w-4 mr-2" />
            SNS連携設定
          </TabsTrigger>
          <TabsTrigger value="calendar" data-testid="tab-calendar">
            <Calendar className="h-4 w-4 mr-2" />
            カレンダー
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            アナリティクス
          </TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">キャンペーン一覧</h2>
            <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-campaign">
                  <Plus className="h-4 w-4 mr-2" />
                  新規キャンペーン
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>新規キャンペーン作成</DialogTitle>
                  <DialogDescription>
                    新しいマーケティングキャンペーンを作成します
                  </DialogDescription>
                </DialogHeader>
                <Form {...campaignForm}>
                  <form
                    onSubmit={campaignForm.handleSubmit((data) =>
                      createCampaignMutation.mutate(data)
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={campaignForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>キャンペーン名</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="春の新商品プロモーション"
                              data-testid="input-campaign-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={campaignForm.control}
                      name="businessId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>事業部門（オプション）</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger data-testid="select-campaign-business">
                                <SelectValue placeholder="事業部門を選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {businesses.map((business) => (
                                <SelectItem key={business.id} value={business.id}>
                                  {business.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={campaignForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>タイプ</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-campaign-type">
                                <SelectValue placeholder="タイプを選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="email">メールマーケティング</SelectItem>
                              <SelectItem value="social">SNSキャンペーン</SelectItem>
                              <SelectItem value="content">コンテンツマーケティング</SelectItem>
                              <SelectItem value="paid_ads">有料広告</SelectItem>
                              <SelectItem value="event">イベント</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={campaignForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>説明（オプション）</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value || ""}
                              placeholder="キャンペーンの詳細を入力"
                              data-testid="textarea-campaign-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={campaignForm.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>開始日（オプション）</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ? String(field.value) : ""}
                                type="date"
                                data-testid="input-campaign-start-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={campaignForm.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>終了日（オプション）</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ? String(field.value) : ""}
                                type="date"
                                data-testid="input-campaign-end-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={campaignForm.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>予算（円）（オプション）</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              type="number"
                              placeholder="100000"
                              data-testid="input-campaign-budget"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={campaignForm.control}
                      name="targetAudience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ターゲットオーディエンス（オプション）</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value || ""}
                              placeholder="20-30代の女性、都市部在住"
                              data-testid="textarea-campaign-target"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createCampaignMutation.isPending}
                      data-testid="button-submit-campaign"
                    >
                      {createCampaignMutation.isPending ? "作成中..." : "キャンペーンを作成"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {campaignsLoading ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : campaigns.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  まだキャンペーンがありません。新規作成してください。
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="hover-elevate" data-testid={`card-campaign-${campaign.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      {getStatusBadge(campaign.status || "draft")}
                    </div>
                    <CardDescription>
                      {campaign.type === "email" && "メールマーケティング"}
                      {campaign.type === "social" && "SNSキャンペーン"}
                      {campaign.type === "content" && "コンテンツマーケティング"}
                      {campaign.type === "paid_ads" && "有料広告"}
                      {campaign.type === "event" && "イベント"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {campaign.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {campaign.description}
                      </p>
                    )}
                    <div className="space-y-2 text-sm">
                      {campaign.startDate && campaign.endDate && (
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          {format(new Date(campaign.startDate), "yyyy/MM/dd", { locale: ja })} -
                          {format(new Date(campaign.endDate), "yyyy/MM/dd", { locale: ja })}
                        </div>
                      )}
                      {campaign.budget && (
                        <div className="flex items-center text-muted-foreground">
                          <span className="font-semibold">予算:</span>
                          <span className="ml-2">¥{campaign.budget.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Social Posts Tab */}
        <TabsContent value="posts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">SNS投稿一覧</h2>
            <div className="flex gap-2">
              <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-ai-generate-post">
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI生成
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>AI投稿生成</DialogTitle>
                    <DialogDescription>
                      コンテキストを入力してSNS投稿を生成します
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">コンテキスト</label>
                      <Textarea
                        value={aiContext}
                        onChange={(e) => setAiContext(e.target.value)}
                        placeholder="例：新商品のプロモーション、イベント告知、キャンペーン情報など"
                        className="mt-2"
                        rows={4}
                        data-testid="input-ai-context"
                      />
                    </div>
                    <Button
                      onClick={() => aiGenerateMutation.mutate(aiContext)}
                      disabled={!aiContext.trim() || aiGenerateMutation.isPending}
                      className="w-full"
                      data-testid="button-generate-ai-post"
                    >
                      {aiGenerateMutation.isPending ? "生成中..." : "投稿を生成"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-post">
                  <Plus className="h-4 w-4 mr-2" />
                  新規投稿
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>新規SNS投稿作成</DialogTitle>
                  <DialogDescription>
                    新しいSNS投稿を作成します
                  </DialogDescription>
                </DialogHeader>
                <Form {...postForm}>
                  <form
                    onSubmit={postForm.handleSubmit((data) =>
                      createPostMutation.mutate(data)
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={postForm.control}
                      name="platform"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>プラットフォーム</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-post-platform">
                                <SelectValue placeholder="プラットフォームを選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="twitter">X (Twitter)</SelectItem>
                              <SelectItem value="instagram">Instagram</SelectItem>
                              <SelectItem value="facebook">Facebook</SelectItem>
                              <SelectItem value="linkedin">LinkedIn</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={postForm.control}
                      name="campaignId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>キャンペーン（オプション）</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger data-testid="select-post-campaign">
                                <SelectValue placeholder="キャンペーンを選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {campaigns.map((campaign) => (
                                <SelectItem key={campaign.id} value={campaign.id}>
                                  {campaign.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={postForm.control}
                      name="businessId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>事業部門（オプション）</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger data-testid="select-post-business">
                                <SelectValue placeholder="事業部門を選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {businesses.map((business) => (
                                <SelectItem key={business.id} value={business.id}>
                                  {business.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={postForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>投稿内容</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="投稿内容を入力..."
                              rows={6}
                              data-testid="textarea-post-content"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={postForm.control}
                      name="scheduledAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>投稿日時（オプション）</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ? String(field.value) : ""}
                              type="datetime-local"
                              data-testid="input-post-scheduled-at"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createPostMutation.isPending}
                      data-testid="button-submit-post"
                    >
                      {createPostMutation.isPending ? "作成中..." : "投稿を作成"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          </div>

          {postsLoading ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : socialPosts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  まだSNS投稿がありません。新規作成してください。
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {socialPosts.map((post) => (
                <Card key={post.id} className="hover-elevate" data-testid={`card-post-${post.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                      {getPlatformBadge(post.platform)}
                      {getStatusBadge(post.status || "draft")}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4 line-clamp-4 whitespace-pre-wrap">
                      {post.content}
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      {post.scheduledAt && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {format(new Date(post.scheduledAt), "yyyy/MM/dd HH:mm", { locale: ja })}
                        </div>
                      )}
                      {post.publishedAt && (
                        <div className="text-xs">
                          公開: {format(new Date(post.publishedAt), "yyyy/MM/dd HH:mm", { locale: ja })}
                        </div>
                      )}
                      {post.externalId && (
                        <div className="text-xs">
                          投稿ID: {post.externalId}
                        </div>
                      )}
                    </div>
                    {(post.status === "draft" || post.status === "scheduled") && (
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={() => publishPostMutation.mutate(post.id)}
                        disabled={publishPostMutation.isPending}
                        data-testid={`button-publish-post-${post.id}`}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {publishPostMutation.isPending ? "公開中..." : "SNSに公開"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* SNS Connections Tab */}
        <TabsContent value="connections" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">SNS連携設定</h2>
            <Dialog open={connectionDialogOpen} onOpenChange={setConnectionDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-connection">
                  <Plus className="h-4 w-4 mr-2" />
                  新規接続を追加
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>SNS接続を追加</DialogTitle>
                  <DialogDescription>
                    SNSプラットフォームのAPIトークンを入力して連携を設定します
                  </DialogDescription>
                </DialogHeader>
                <Form {...connectionForm}>
                  <form onSubmit={connectionForm.handleSubmit(onSubmitConnection)} className="space-y-4">
                    <FormField
                      control={connectionForm.control}
                      name="platform"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>プラットフォーム</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-connection-platform">
                                <SelectValue placeholder="プラットフォームを選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="twitter">X（旧Twitter）</SelectItem>
                              <SelectItem value="instagram">Instagram</SelectItem>
                              <SelectItem value="facebook">Facebook</SelectItem>
                              <SelectItem value="linkedin">LinkedIn</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={connectionForm.control}
                      name="accessToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>アクセストークン</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="APIアクセストークンを入力"
                              data-testid="textarea-connection-token"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={connectionForm.control}
                      name="refreshToken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>リフレッシュトークン（オプション）</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value || ""}
                              placeholder="リフレッシュトークンを入力"
                              data-testid="textarea-connection-refresh-token"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={connectionForm.control}
                      name="platformUsername"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ユーザー名（オプション）</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="@username"
                              data-testid="input-connection-username"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createConnectionMutation.isPending}
                      data-testid="button-submit-connection"
                    >
                      {createConnectionMutation.isPending ? "追加中..." : "接続を追加"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {connectionsLoading ? (
            <div className="text-center p-8">読み込み中...</div>
          ) : socialConnections.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <Link2 className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">SNS連携が設定されていません</h3>
                <p className="text-muted-foreground text-center mb-4">
                  SNSプラットフォームと連携して、投稿を自動公開できます
                </p>
                <Button onClick={() => setConnectionDialogOpen(true)} data-testid="button-add-first-connection">
                  <Plus className="h-4 w-4 mr-2" />
                  最初の接続を追加
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {socialConnections.map((connection) => (
                <Card key={connection.id} className="hover-elevate" data-testid={`card-connection-${connection.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {getPlatformBadge(connection.platform)}
                          {connection.isActive ? (
                            <Badge variant="default">有効</Badge>
                          ) : (
                            <Badge variant="secondary">無効</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {connection.platformUsername && `@${connection.platformUsername}`}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteConnectionMutation.mutate(connection.id)}
                        disabled={deleteConnectionMutation.isPending}
                        data-testid={`button-delete-connection-${connection.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">アクセストークン:</span>
                        <span className="font-mono">***</span>
                      </div>
                      {connection.lastUsed && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">最終使用:</span>
                          <span>{format(new Date(connection.lastUsed), "yyyy/MM/dd HH:mm", { locale: ja })}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">作成日:</span>
                        <span>{format(new Date(connection.createdAt), "yyyy/MM/dd", { locale: ja })}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>コンテンツカレンダー</CardTitle>
              <CardDescription>
                予定されているSNS投稿をカレンダー形式で表示
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                カレンダービューは今後実装予定です
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>マーケティングアナリティクス</CardTitle>
              <CardDescription>
                キャンペーンとSNS投稿のパフォーマンスを分析
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                アナリティクス機能は今後実装予定です
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
