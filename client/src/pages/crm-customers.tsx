import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCustomerSchema, type Customer, type InsertCustomer } from "@shared/schema";
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
import { Plus, Building2, Mail, Phone, Globe, Edit, Trash2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CRMCustomers() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/crm/customers"],
  });

  const form = useForm<InsertCustomer>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      name: "",
      industry: "",
      website: "",
      phone: "",
      email: "",
      address: "",
      status: "active",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCustomer) => {
      return await apiRequest("/api/crm/customers", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/customers"] });
      toast({ title: "顧客を作成しました" });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "エラー", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertCustomer> }) => {
      return await apiRequest(`/api/crm/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/customers"] });
      toast({ title: "顧客情報を更新しました" });
      setDialogOpen(false);
      setEditingCustomer(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "エラー", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/crm/customers/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/customers"] });
      toast({ title: "顧客を削除しました" });
    },
    onError: (error: Error) => {
      toast({ title: "エラー", description: error.message, variant: "destructive" });
    },
  });

  const aiAnalysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/ai/generate/crm-analysis", {
        method: "POST",
        body: JSON.stringify({ customers: customers || [] }),
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      setAiAnalysis(data.analysis);
      setAiDialogOpen(true);
      toast({
        title: "AI分析が完了しました",
        description: "顧客データの分析結果を表示しています。",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "AI分析に失敗しました。",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: InsertCustomer) {
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  function handleEdit(customer: Customer) {
    setEditingCustomer(customer);
    form.reset({
      name: customer.name,
      nameKana: customer.nameKana || "",
      type: customer.type || "corporation",
      industry: customer.industry || "",
      website: customer.website || "",
      phone: customer.phone || "",
      email: customer.email || "",
      postalCode: customer.postalCode || "",
      address: customer.address || "",
      status: customer.status || "active",
      rating: customer.rating || "",
      source: customer.source || "",
      notes: customer.notes || "",
    });
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    if (confirm("この顧客を削除してもよろしいですか？")) {
      deleteMutation.mutate(id);
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: "default",
      inactive: "secondary",
      prospective: "outline",
    };
    const labels: Record<string, string> = {
      active: "アクティブ",
      inactive: "非アクティブ",
      prospective: "見込み",
    };
    return <Badge variant={variants[status] as any}>{labels[status] || status}</Badge>;
  };

  if (isLoading) {
    return <div className="p-6">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-screen-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">顧客管理</h1>
            <p className="text-muted-foreground">顧客企業の情報を管理します</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => aiAnalysisMutation.mutate()}
              disabled={!customers?.length || aiAnalysisMutation.isPending}
              data-testid="button-ai-analysis"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {aiAnalysisMutation.isPending ? "分析中..." : "AI分析"}
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingCustomer(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-customer">
                <Plus className="mr-2 h-4 w-4" />
                新規顧客
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCustomer ? "顧客情報編集" : "新規顧客登録"}</DialogTitle>
                <DialogDescription>
                  顧客企業の基本情報を入力してください
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
                          <FormLabel>企業名 *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nameKana"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>企業名（カナ）</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} data-testid="input-name-kana" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>企業形態</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "corporation"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="corporation">法人</SelectItem>
                              <SelectItem value="individual">個人</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>業種</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} data-testid="input-industry" />
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
                          <Select onValueChange={field.onChange} value={field.value || "active"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-status">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">アクティブ</SelectItem>
                              <SelectItem value="inactive">非アクティブ</SelectItem>
                              <SelectItem value="prospective">見込み</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>評価</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-rating">
                                <SelectValue placeholder="選択してください" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="A">A（重要）</SelectItem>
                              <SelectItem value="B">B（通常）</SelectItem>
                              <SelectItem value="C">C（低優先）</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>メール</FormLabel>
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
                      name="website"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>ウェブサイト</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} data-testid="input-website" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>郵便番号</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} data-testid="input-postal-code" />
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
                            <Input {...field} value={field.value || ""} placeholder="例：紹介、Web、展示会" data-testid="input-source" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>住所</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ""} data-testid="textarea-address" />
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
                      {createMutation.isPending || updateMutation.isPending ? "処理中..." : editingCustomer ? "更新" : "作成"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {aiAnalysis && (
          <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>AI顧客分析レポート</DialogTitle>
                <DialogDescription>
                  Gemini AIによる顧客データの分析結果
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-semibold mb-2">分析結果</h3>
                  <div className="whitespace-pre-wrap bg-muted p-4 rounded-md">
                    {aiAnalysis.insights || aiAnalysis}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers?.map((customer) => (
            <Card key={customer.id} className="hover-elevate" data-testid={`card-customer-${customer.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {customer.name}
                    </CardTitle>
                    {customer.nameKana && (
                      <CardDescription>{customer.nameKana}</CardDescription>
                    )}
                  </div>
                  {getStatusBadge(customer.status || "active")}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {customer.industry && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">業種：</span>
                    <span className="ml-2">{customer.industry}</span>
                  </div>
                )}
                {customer.rating && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">評価：</span>
                    <Badge variant="outline" className="ml-2">{customer.rating}</Badge>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={customer.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                      {customer.website}
                    </a>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(customer)}
                    data-testid={`button-edit-${customer.id}`}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    編集
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(customer.id)}
                    data-testid={`button-delete-${customer.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    削除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {customers?.length === 0 && (
          <Card className="mt-6">
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">顧客データがありません</p>
              <p className="text-muted-foreground mb-4">新規顧客を登録して顧客管理を始めましょう</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
