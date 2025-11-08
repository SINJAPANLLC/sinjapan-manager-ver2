import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertJobPostingSchema, type JobPosting, type InsertJobPosting } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Plus, Edit, Trash2, Globe, DollarSign, MapPin, Calendar, Eye } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const employmentTypeLabels: Record<string, string> = {
  "full-time": "正社員",
  "part-time": "パート・アルバイト",
  "contract": "契約社員",
  "internship": "インターン",
};

const statusLabels: Record<string, string> = {
  draft: "下書き",
  published: "公開中",
  closed: "締切",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-500",
  published: "bg-blue-500",
  closed: "bg-red-500",
};

export default function RecruitmentPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingJobPosting, setEditingJobPosting] = useState<JobPosting | null>(null);
  const [viewingJobPosting, setViewingJobPosting] = useState<JobPosting | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | "all">("all");

  // Fetch businesses
  const { data: businesses = [] } = useQuery({
    queryKey: ["/api/businesses"],
  });

  // Fetch job postings
  const { data: jobPostings = [], isLoading } = useQuery<JobPosting[]>({
    queryKey: ["/api/job-postings", selectedBusinessId !== "all" ? selectedBusinessId : undefined],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertJobPosting) => {
      return await apiRequest("POST", "/api/job-postings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-postings"] });
      setIsCreateDialogOpen(false);
      toast({ title: "求人を作成しました" });
    },
    onError: () => {
      toast({ title: "求人の作成に失敗しました", variant: "destructive" });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertJobPosting> }) => {
      return await apiRequest("PATCH", `/api/job-postings/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-postings"] });
      setEditingJobPosting(null);
      toast({ title: "求人を更新しました" });
    },
    onError: () => {
      toast({ title: "求人の更新に失敗しました", variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/job-postings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-postings"] });
      toast({ title: "求人を削除しました" });
    },
    onError: () => {
      toast({ title: "求人の削除に失敗しました", variant: "destructive" });
    },
  });

  const form = useForm<InsertJobPosting>({
    resolver: zodResolver(insertJobPostingSchema.extend({
      salaryMin: insertJobPostingSchema.shape.salaryMin.optional(),
      salaryMax: insertJobPostingSchema.shape.salaryMax.optional(),
    })),
    defaultValues: {
      businessId: "",
      title: "",
      description: "",
      requirements: "",
      location: "",
      employmentType: "full-time",
      benefits: "",
      status: "draft",
      contactEmail: "",
    },
  });

  const handleCreate = () => {
    form.reset({
      businessId: selectedBusinessId !== "all" ? selectedBusinessId : "",
      title: "",
      description: "",
      requirements: "",
      location: "",
      employmentType: "full-time",
      benefits: "",
      status: "draft",
      contactEmail: "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (jobPosting: JobPosting) => {
    form.reset({
      businessId: jobPosting.businessId,
      title: jobPosting.title,
      description: jobPosting.description,
      requirements: jobPosting.requirements || "",
      location: jobPosting.location,
      employmentType: jobPosting.employmentType,
      salaryMin: jobPosting.salaryMin || undefined,
      salaryMax: jobPosting.salaryMax || undefined,
      benefits: jobPosting.benefits || "",
      status: jobPosting.status,
      contactEmail: jobPosting.contactEmail || "",
      indeedJobKey: jobPosting.indeedJobKey || "",
      externalUrl: jobPosting.externalUrl || "",
    });
    setEditingJobPosting(jobPosting);
  };

  const onSubmit = (data: InsertJobPosting) => {
    if (editingJobPosting) {
      updateMutation.mutate({ id: editingJobPosting.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("この求人を削除してもよろしいですか？")) {
      deleteMutation.mutate(id);
    }
  };

  const handlePublish = (jobPosting: JobPosting) => {
    updateMutation.mutate({
      id: jobPosting.id,
      data: {
        status: "published",
        postedAt: new Date().toISOString(),
      },
    });
  };

  const handleClose = (jobPosting: JobPosting) => {
    updateMutation.mutate({
      id: jobPosting.id,
      data: {
        status: "closed",
        closedAt: new Date().toISOString(),
      },
    });
  };

  const filteredJobPostings = selectedBusinessId !== "all"
    ? jobPostings.filter((jp) => jp.businessId === selectedBusinessId)
    : jobPostings;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-screen-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-primary" />
              求人管理（INDEED連携）
            </h1>
            <p className="text-muted-foreground mt-1">求人情報の作成・管理・Indeed投稿準備</p>
          </div>
          <Button onClick={handleCreate} data-testid="button-create-job-posting">
            <Plus className="h-4 w-4 mr-2" />
            新規求人作成
          </Button>
        </div>

        {/* Business Filter */}
        <Card>
          <CardHeader>
            <CardTitle>事業部門フィルター</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
              <SelectTrigger className="w-64" data-testid="select-business-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全て</SelectItem>
                {businesses.map((business: any) => (
                  <SelectItem key={business.id} value={business.id}>
                    {business.nameJa}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Job Postings List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">読み込み中...</div>
        ) : filteredJobPostings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              求人情報がありません
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobPostings.map((jobPosting) => {
              const business = businesses.find((b: any) => b.id === jobPosting.businessId);
              return (
                <Card key={jobPosting.id} className="hover-elevate" data-testid={`card-job-posting-${jobPosting.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate" data-testid={`text-job-title-${jobPosting.id}`}>
                          {jobPosting.title}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {business?.nameJa || "不明"}
                        </CardDescription>
                      </div>
                      <Badge className={statusColors[jobPosting.status]} data-testid={`badge-status-${jobPosting.id}`}>
                        {statusLabels[jobPosting.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{jobPosting.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        <span>{employmentTypeLabels[jobPosting.employmentType]}</span>
                      </div>
                      {jobPosting.salaryMin && jobPosting.salaryMax && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span>¥{Number(jobPosting.salaryMin).toLocaleString()} - ¥{Number(jobPosting.salaryMax).toLocaleString()}</span>
                        </div>
                      )}
                      {jobPosting.postedAt && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>公開: {format(new Date(jobPosting.postedAt), "yyyy/MM/dd", { locale: ja })}</span>
                        </div>
                      )}
                      {jobPosting.indeedJobKey && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Globe className="h-4 w-4" />
                          <span className="text-xs truncate">Indeed: {jobPosting.indeedJobKey}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingJobPosting(jobPosting)}
                        data-testid={`button-view-${jobPosting.id}`}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        詳細
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(jobPosting)}
                        data-testid={`button-edit-${jobPosting.id}`}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        編集
                      </Button>
                      {jobPosting.status === "draft" && (
                        <Button
                          size="sm"
                          onClick={() => handlePublish(jobPosting)}
                          data-testid={`button-publish-${jobPosting.id}`}
                        >
                          公開
                        </Button>
                      )}
                      {jobPosting.status === "published" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleClose(jobPosting)}
                          data-testid={`button-close-${jobPosting.id}`}
                        >
                          締切
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(jobPosting.id)}
                        data-testid={`button-delete-${jobPosting.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || !!editingJobPosting} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setEditingJobPosting(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingJobPosting ? "求人編集" : "新規求人作成"}</DialogTitle>
            <DialogDescription>
              求人情報を入力してください。公開後はIndeedへの投稿が可能です。
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="businessId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>事業部門 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-business">
                          <SelectValue placeholder="事業部門を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {businesses.map((business: any) => (
                          <SelectItem key={business.id} value={business.id}>
                            {business.nameJa}
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
                    <FormLabel>職種名 *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="例: Webエンジニア" data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>雇用形態 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-employment-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full-time">正社員</SelectItem>
                        <SelectItem value="part-time">パート・アルバイト</SelectItem>
                        <SelectItem value="contract">契約社員</SelectItem>
                        <SelectItem value="internship">インターン</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>勤務地 *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="例: 東京都渋谷区" data-testid="input-location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="salaryMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>最低給与</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="例: 250000"
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          value={field.value || ""}
                          data-testid="input-salary-min"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salaryMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>最高給与</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="例: 400000"
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          value={field.value || ""}
                          data-testid="input-salary-max"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>職務内容 *</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={5} placeholder="業務内容を詳しく記載してください" data-testid="textarea-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>応募要件</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="必須スキル、経験年数など" data-testid="textarea-requirements" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="benefits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>福利厚生</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="保険、手当、休暇制度など" data-testid="textarea-benefits" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>応募先メールアドレス</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="example@company.com" data-testid="input-contact-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ステータス *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">下書き</SelectItem>
                        <SelectItem value="published">公開中</SelectItem>
                        <SelectItem value="closed">締切</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {editingJobPosting && (
                <>
                  <FormField
                    control={form.control}
                    name="indeedJobKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Indeed求人キー</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Indeedから取得したキー" data-testid="input-indeed-job-key" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="externalUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>外部求人URL</FormLabel>
                        <FormControl>
                          <Input {...field} type="url" placeholder="https://..." data-testid="input-external-url" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                  {createMutation.isPending || updateMutation.isPending ? "保存中..." : editingJobPosting ? "更新" : "作成"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingJobPosting(null);
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

      {/* View Dialog */}
      <Dialog open={!!viewingJobPosting} onOpenChange={(open) => !open && setViewingJobPosting(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingJobPosting?.title}</DialogTitle>
            <DialogDescription>
              {businesses.find((b: any) => b.id === viewingJobPosting?.businessId)?.nameJa || "不明"}
            </DialogDescription>
          </DialogHeader>
          {viewingJobPosting && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">基本情報</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">雇用形態:</span>
                    <span>{employmentTypeLabels[viewingJobPosting.employmentType]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">勤務地:</span>
                    <span>{viewingJobPosting.location}</span>
                  </div>
                  {viewingJobPosting.salaryMin && viewingJobPosting.salaryMax && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">給与:</span>
                      <span>¥{Number(viewingJobPosting.salaryMin).toLocaleString()} - ¥{Number(viewingJobPosting.salaryMax).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ステータス:</span>
                    <Badge className={statusColors[viewingJobPosting.status]}>
                      {statusLabels[viewingJobPosting.status]}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">職務内容</h3>
                <p className="text-sm whitespace-pre-wrap">{viewingJobPosting.description}</p>
              </div>

              {viewingJobPosting.requirements && (
                <div>
                  <h3 className="font-semibold mb-2">応募要件</h3>
                  <p className="text-sm whitespace-pre-wrap">{viewingJobPosting.requirements}</p>
                </div>
              )}

              {viewingJobPosting.benefits && (
                <div>
                  <h3 className="font-semibold mb-2">福利厚生</h3>
                  <p className="text-sm whitespace-pre-wrap">{viewingJobPosting.benefits}</p>
                </div>
              )}

              {viewingJobPosting.contactEmail && (
                <div>
                  <h3 className="font-semibold mb-2">応募先</h3>
                  <p className="text-sm">{viewingJobPosting.contactEmail}</p>
                </div>
              )}

              {viewingJobPosting.indeedJobKey && (
                <div>
                  <h3 className="font-semibold mb-2">Indeed連携</h3>
                  <p className="text-sm">求人キー: {viewingJobPosting.indeedJobKey}</p>
                </div>
              )}

              {viewingJobPosting.externalUrl && (
                <div>
                  <h3 className="font-semibold mb-2">外部URL</h3>
                  <a href={viewingJobPosting.externalUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    {viewingJobPosting.externalUrl}
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
