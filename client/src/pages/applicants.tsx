import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertApplicantSchema, type Applicant, type InsertApplicant, type JobPosting } from "@shared/schema";
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
import { Users, Plus, Edit, Trash2, Mail, Phone, Calendar, Star, Eye, FileText } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const sourceLabels: Record<string, string> = {
  indeed: "Indeed",
  website: "自社サイト",
  referral: "紹介",
  linkedin: "LinkedIn",
  other: "その他",
};

const statusLabels: Record<string, string> = {
  applied: "応募済み",
  screening: "書類選考中",
  interview: "面接中",
  offer: "内定",
  hired: "採用",
  rejected: "不採用",
};

const statusColors: Record<string, string> = {
  applied: "bg-blue-500",
  screening: "bg-yellow-500",
  interview: "bg-purple-500",
  offer: "bg-green-500",
  hired: "bg-emerald-600",
  rejected: "bg-red-500",
};

export default function ApplicantsPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingApplicant, setEditingApplicant] = useState<Applicant | null>(null);
  const [viewingApplicant, setViewingApplicant] = useState<Applicant | null>(null);
  const [selectedJobPostingId, setSelectedJobPostingId] = useState<string | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<string | "all">("all");

  // Fetch job postings
  const { data: jobPostings = [] } = useQuery<JobPosting[]>({
    queryKey: ["/api/job-postings"],
  });

  // Fetch applicants
  const { data: applicants = [], isLoading } = useQuery<Applicant[]>({
    queryKey: ["/api/applicants", selectedJobPostingId !== "all" ? selectedJobPostingId : undefined],
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertApplicant) => {
      return await apiRequest("POST", "/api/applicants", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applicants"] });
      setIsCreateDialogOpen(false);
      toast({ title: "応募者を追加しました" });
    },
    onError: () => {
      toast({ title: "応募者の追加に失敗しました", variant: "destructive" });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertApplicant> }) => {
      return await apiRequest("PATCH", `/api/applicants/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applicants"] });
      setEditingApplicant(null);
      toast({ title: "応募者情報を更新しました" });
    },
    onError: () => {
      toast({ title: "応募者情報の更新に失敗しました", variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/applicants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applicants"] });
      toast({ title: "応募者を削除しました" });
    },
    onError: () => {
      toast({ title: "応募者の削除に失敗しました", variant: "destructive" });
    },
  });

  const form = useForm<InsertApplicant>({
    resolver: zodResolver(insertApplicantSchema.extend({
      phone: insertApplicantSchema.shape.phone.optional(),
      resumeUrl: insertApplicantSchema.shape.resumeUrl.optional(),
      coverLetter: insertApplicantSchema.shape.coverLetter.optional(),
      currentStage: insertApplicantSchema.shape.currentStage.optional(),
      rating: insertApplicantSchema.shape.rating.optional(),
      interviewDate: insertApplicantSchema.shape.interviewDate.optional(),
      notes: insertApplicantSchema.shape.notes.optional(),
      assignedTo: insertApplicantSchema.shape.assignedTo.optional(),
    })),
    defaultValues: {
      jobPostingId: "",
      name: "",
      email: "",
      source: "website",
      status: "applied",
    },
  });

  const handleCreate = () => {
    form.reset({
      jobPostingId: selectedJobPostingId !== "all" ? selectedJobPostingId : "",
      name: "",
      email: "",
      phone: "",
      source: "website",
      status: "applied",
    });
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (applicant: Applicant) => {
    form.reset({
      jobPostingId: applicant.jobPostingId,
      name: applicant.name,
      email: applicant.email,
      phone: applicant.phone || "",
      resumeUrl: applicant.resumeUrl || "",
      coverLetter: applicant.coverLetter || "",
      source: applicant.source,
      status: applicant.status,
      currentStage: applicant.currentStage || "",
      rating: applicant.rating || undefined,
      notes: applicant.notes || "",
    });
    setEditingApplicant(applicant);
  };

  const onSubmit = (data: InsertApplicant) => {
    if (editingApplicant) {
      updateMutation.mutate({ id: editingApplicant.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("この応募者を削除してもよろしいですか？")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredApplicants = applicants.filter((applicant) => {
    const matchesJobPosting = selectedJobPostingId === "all" || applicant.jobPostingId === selectedJobPostingId;
    const matchesStatus = selectedStatus === "all" || applicant.status === selectedStatus;
    return matchesJobPosting && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-screen-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              応募者管理
            </h1>
            <p className="text-muted-foreground mt-1">応募者情報・選考状況・面接管理</p>
          </div>
          <Button onClick={handleCreate} data-testid="button-create-applicant">
            <Plus className="h-4 w-4 mr-2" />
            応募者追加
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>フィルター</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="w-64">
              <label className="text-sm font-medium mb-2 block">求人</label>
              <Select value={selectedJobPostingId} onValueChange={setSelectedJobPostingId}>
                <SelectTrigger data-testid="select-job-posting-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全て</SelectItem>
                  {jobPostings.map((jp) => (
                    <SelectItem key={jp.id} value={jp.id}>
                      {jp.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-64">
              <label className="text-sm font-medium mb-2 block">ステータス</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全て</SelectItem>
                  <SelectItem value="applied">応募済み</SelectItem>
                  <SelectItem value="screening">書類選考中</SelectItem>
                  <SelectItem value="interview">面接中</SelectItem>
                  <SelectItem value="offer">内定</SelectItem>
                  <SelectItem value="hired">採用</SelectItem>
                  <SelectItem value="rejected">不採用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Applicants List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">読み込み中...</div>
        ) : filteredApplicants.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              応募者がいません
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredApplicants.map((applicant) => {
              const jobPosting = jobPostings.find((jp) => jp.id === applicant.jobPostingId);
              return (
                <Card key={applicant.id} className="hover-elevate" data-testid={`card-applicant-${applicant.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate" data-testid={`text-applicant-name-${applicant.id}`}>
                          {applicant.name}
                        </CardTitle>
                        <CardDescription className="mt-1 truncate">
                          {jobPosting?.title || "不明"}
                        </CardDescription>
                      </div>
                      <Badge className={statusColors[applicant.status]} data-testid={`badge-status-${applicant.id}`}>
                        {statusLabels[applicant.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{applicant.email}</span>
                      </div>
                      {applicant.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{applicant.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{sourceLabels[applicant.source]}</span>
                      </div>
                      {applicant.appliedAt && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>応募: {format(new Date(applicant.appliedAt), "yyyy/MM/dd", { locale: ja })}</span>
                        </div>
                      )}
                      {applicant.rating && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          <span>評価: {applicant.rating}/5</span>
                        </div>
                      )}
                      {applicant.currentStage && (
                        <div className="text-xs text-muted-foreground">
                          選考段階: {applicant.currentStage}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingApplicant(applicant)}
                        data-testid={`button-view-${applicant.id}`}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        詳細
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(applicant)}
                        data-testid={`button-edit-${applicant.id}`}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        編集
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(applicant.id)}
                        data-testid={`button-delete-${applicant.id}`}
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
      <Dialog open={isCreateDialogOpen || !!editingApplicant} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setEditingApplicant(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingApplicant ? "応募者情報編集" : "応募者追加"}</DialogTitle>
            <DialogDescription>
              応募者情報と選考状況を入力してください。
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="jobPostingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>求人 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-job-posting">
                          <SelectValue placeholder="求人を選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jobPostings.map((jp) => (
                          <SelectItem key={jp.id} value={jp.id}>
                            {jp.title}
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>氏名 *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="例: 山田太郎" data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>メールアドレス *</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="example@email.com" data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>電話番号</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="090-1234-5678" data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>応募経路 *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-source">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="indeed">Indeed</SelectItem>
                          <SelectItem value="website">自社サイト</SelectItem>
                          <SelectItem value="referral">紹介</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="other">その他</SelectItem>
                        </SelectContent>
                      </Select>
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
                          <SelectItem value="applied">応募済み</SelectItem>
                          <SelectItem value="screening">書類選考中</SelectItem>
                          <SelectItem value="interview">面接中</SelectItem>
                          <SelectItem value="offer">内定</SelectItem>
                          <SelectItem value="hired">採用</SelectItem>
                          <SelectItem value="rejected">不採用</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currentStage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>選考段階</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="例: 二次面接" data-testid="input-current-stage" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>評価（1-5）</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="1"
                          max="5"
                          placeholder="1-5"
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          value={field.value || ""}
                          data-testid="input-rating"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="resumeUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>履歴書URL</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" placeholder="https://..." data-testid="input-resume-url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coverLetter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>志望動機</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} placeholder="応募者の志望動機" data-testid="textarea-cover-letter" />
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
                    <FormLabel>メモ・評価コメント</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} placeholder="面接メモ、評価コメントなど" data-testid="textarea-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                  {createMutation.isPending || updateMutation.isPending ? "保存中..." : editingApplicant ? "更新" : "追加"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingApplicant(null);
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
      <Dialog open={!!viewingApplicant} onOpenChange={(open) => !open && setViewingApplicant(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingApplicant?.name}</DialogTitle>
            <DialogDescription>
              {jobPostings.find((jp) => jp.id === viewingApplicant?.jobPostingId)?.title || "不明"}
            </DialogDescription>
          </DialogHeader>
          {viewingApplicant && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">基本情報</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">メール:</span>
                    <span>{viewingApplicant.email}</span>
                  </div>
                  {viewingApplicant.phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">電話:</span>
                      <span>{viewingApplicant.phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">応募経路:</span>
                    <span>{sourceLabels[viewingApplicant.source]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ステータス:</span>
                    <Badge className={statusColors[viewingApplicant.status]}>
                      {statusLabels[viewingApplicant.status]}
                    </Badge>
                  </div>
                  {viewingApplicant.currentStage && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">選考段階:</span>
                      <span>{viewingApplicant.currentStage}</span>
                    </div>
                  )}
                  {viewingApplicant.rating && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">評価:</span>
                      <span>{viewingApplicant.rating}/5</span>
                    </div>
                  )}
                  {viewingApplicant.appliedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">応募日:</span>
                      <span>{format(new Date(viewingApplicant.appliedAt), "yyyy/MM/dd HH:mm", { locale: ja })}</span>
                    </div>
                  )}
                  {viewingApplicant.interviewDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">面接日:</span>
                      <span>{format(new Date(viewingApplicant.interviewDate), "yyyy/MM/dd HH:mm", { locale: ja })}</span>
                    </div>
                  )}
                </div>
              </div>

              {viewingApplicant.resumeUrl && (
                <div>
                  <h3 className="font-semibold mb-2">履歴書</h3>
                  <a href={viewingApplicant.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    {viewingApplicant.resumeUrl}
                  </a>
                </div>
              )}

              {viewingApplicant.coverLetter && (
                <div>
                  <h3 className="font-semibold mb-2">志望動機</h3>
                  <p className="text-sm whitespace-pre-wrap">{viewingApplicant.coverLetter}</p>
                </div>
              )}

              {viewingApplicant.notes && (
                <div>
                  <h3 className="font-semibold mb-2">メモ・評価コメント</h3>
                  <p className="text-sm whitespace-pre-wrap">{viewingApplicant.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
