import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLeadSchema, type Lead, type InsertLead } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, User, Mail, Phone, Building, Edit, Trash2, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CRMLeads() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/crm/leads"],
  });

  const form = useForm<InsertLead>({
    resolver: zodResolver(insertLeadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      title: "",
      source: "",
      status: "new",
      score: 0,
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertLead) => {
      return await apiRequest("/api/crm/leads", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      toast({ title: "リードを作成しました" });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "エラー", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertLead> }) => {
      return await apiRequest(`/api/crm/leads/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      toast({ title: "リード情報を更新しました" });
      setDialogOpen(false);
      setEditingLead(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "エラー", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/crm/leads/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] });
      toast({ title: "リードを削除しました" });
    },
    onError: (error: Error) => {
      toast({ title: "エラー", description: error.message, variant: "destructive" });
    },
  });

  function onSubmit(data: InsertLead) {
    if (editingLead) {
      updateMutation.mutate({ id: editingLead.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  function handleEdit(lead: Lead) {
    setEditingLead(lead);
    form.reset({
      name: lead.name,
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || "",
      title: lead.title || "",
      source: lead.source || "",
      status: lead.status || "new",
      score: lead.score || 0,
      notes: lead.notes || "",
    });
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    if (confirm("このリードを削除してもよろしいですか？")) {
      deleteMutation.mutate(id);
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      new: "default",
      contacted: "secondary",
      qualified: "default",
      unqualified: "outline",
      converted: "default",
    };
    const labels: Record<string, string> = {
      new: "新規",
      contacted: "連絡済",
      qualified: "適格",
      unqualified: "不適格",
      converted: "商談化",
    };
    return <Badge variant={variants[status] as any}>{labels[status] || status}</Badge>;
  };

  const getScoreBadge = (score: number) => {
    if (score >= 75) return <Badge>高スコア ({score})</Badge>;
    if (score >= 50) return <Badge variant="secondary">中スコア ({score})</Badge>;
    if (score > 0) return <Badge variant="outline">低スコア ({score})</Badge>;
    return null;
  };

  if (isLoading) {
    return <div className="p-6">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-screen-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">リード管理</h1>
            <p className="text-muted-foreground">見込み客を管理し、商談化を進めます</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingLead(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-lead">
                <Plus className="mr-2 h-4 w-4" />
                新規リード
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingLead ? "リード情報編集" : "新規リード登録"}</DialogTitle>
                <DialogDescription>
                  見込み客の情報を入力してください
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>氏名 *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>メールアドレス</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} value={field.value || ""} data-testid="input-email" />
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
                            <Input {...field} value={field.value || ""} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>会社名</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} data-testid="input-company" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>役職</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} data-testid="input-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>獲得経路</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} placeholder="例：Web、紹介、展示会" data-testid="input-source" />
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
                          <FormLabel>ステータス</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "new"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-status">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="new">新規</SelectItem>
                              <SelectItem value="contacted">連絡済</SelectItem>
                              <SelectItem value="qualified">適格</SelectItem>
                              <SelectItem value="unqualified">不適格</SelectItem>
                              <SelectItem value="converted">商談化</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="score"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>スコア (0-100)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value || 0}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              min="0"
                              max="100"
                              data-testid="input-score"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>メモ</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ""} data-testid="textarea-notes" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" data-testid="button-submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {createMutation.isPending || updateMutation.isPending ? "処理中..." : editingLead ? "更新" : "作成"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads?.map((lead) => (
            <Card key={lead.id} className="hover-elevate" data-testid={`card-lead-${lead.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      {lead.name}
                    </CardTitle>
                    {lead.title && lead.company && (
                      <CardDescription>
                        {lead.title} at {lead.company}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {getStatusBadge(lead.status || "new")}
                    {lead.score !== null && lead.score !== undefined && getScoreBadge(lead.score)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {lead.company && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.company}</span>
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{lead.phone}</span>
                  </div>
                )}
                {lead.source && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">経路：</span>
                    <span>{lead.source}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(lead)}
                    data-testid={`button-edit-${lead.id}`}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    編集
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(lead.id)}
                    data-testid={`button-delete-${lead.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    削除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {leads?.length === 0 && (
          <Card className="mt-6">
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">リードデータがありません</p>
              <p className="text-muted-foreground mb-4">新規リードを登録して営業活動を始めましょう</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
