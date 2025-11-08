import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDealSchema, type Deal, type Customer, type InsertDeal } from "@shared/schema";
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
import { Plus, DollarSign, Calendar, TrendingUp, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function CRMDeals() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  const { data: deals, isLoading: dealsLoading } = useQuery<Deal[]>({
    queryKey: ["/api/crm/deals"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/crm/customers"],
  });

  const form = useForm<InsertDeal>({
    resolver: zodResolver(insertDealSchema),
    defaultValues: {
      customerId: "",
      name: "",
      amount: "0",
      probability: 50,
      stage: "prospecting",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertDeal) => {
      return await apiRequest("/api/crm/deals", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/deals"] });
      toast({ title: "商談を作成しました" });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "エラー", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertDeal> }) => {
      return await apiRequest(`/api/crm/deals/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/deals"] });
      toast({ title: "商談情報を更新しました" });
      setDialogOpen(false);
      setEditingDeal(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "エラー", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/crm/deals/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crm/deals"] });
      toast({ title: "商談を削除しました" });
    },
    onError: (error: Error) => {
      toast({ title: "エラー", description: error.message, variant: "destructive" });
    },
  });

  function onSubmit(data: InsertDeal) {
    if (editingDeal) {
      updateMutation.mutate({ id: editingDeal.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  function handleEdit(deal: Deal) {
    setEditingDeal(deal);
    form.reset({
      customerId: deal.customerId,
      name: deal.name,
      amount: deal.amount?.toString() || "0",
      probability: deal.probability || 50,
      stage: deal.stage || "prospecting",
      expectedCloseDate: deal.expectedCloseDate ? format(new Date(deal.expectedCloseDate), "yyyy-MM-dd") as any : undefined,
      notes: deal.notes || "",
    });
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    if (confirm("この商談を削除してもよろしいですか？")) {
      deleteMutation.mutate(id);
    }
  }

  const getStageBadge = (stage: string) => {
    const variants: Record<string, string> = {
      prospecting: "outline",
      qualification: "secondary",
      proposal: "default",
      negotiation: "default",
      "closed-won": "default",
      "closed-lost": "destructive",
    };
    const labels: Record<string, string> = {
      prospecting: "見込み",
      qualification: "適格性確認",
      proposal: "提案",
      negotiation: "交渉",
      "closed-won": "受注",
      "closed-lost": "失注",
    };
    return <Badge variant={variants[stage] as any}>{labels[stage] || stage}</Badge>;
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return `¥${num.toLocaleString()}`;
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers?.find(c => c.id === customerId);
    return customer?.name || "不明";
  };

  if (dealsLoading) {
    return <div className="p-6">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-screen-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">商談管理</h1>
            <p className="text-muted-foreground">営業案件の進捗を管理します</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingDeal(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-deal">
                <Plus className="mr-2 h-4 w-4" />
                新規商談
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingDeal ? "商談情報編集" : "新規商談登録"}</DialogTitle>
                <DialogDescription>
                  商談の詳細情報を入力してください
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>顧客 *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-customer">
                                <SelectValue placeholder="顧客を選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {customers?.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customer.name}
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
                        <FormItem className="col-span-2">
                          <FormLabel>商談名 *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>金額 *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              data-testid="input-amount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="probability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>確度 (0-100%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value || 50}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              min="0"
                              max="100"
                              data-testid="input-probability"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="stage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ステージ</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "prospecting"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-stage">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="prospecting">見込み</SelectItem>
                              <SelectItem value="qualification">適格性確認</SelectItem>
                              <SelectItem value="proposal">提案</SelectItem>
                              <SelectItem value="negotiation">交渉</SelectItem>
                              <SelectItem value="closed-won">受注</SelectItem>
                              <SelectItem value="closed-lost">失注</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="expectedCloseDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>成約予定日</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field}
                              value={field.value ? (typeof field.value === 'string' ? field.value : format(field.value, 'yyyy-MM-dd')) : ''}
                              data-testid="input-expected-close-date"
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
                      {createMutation.isPending || updateMutation.isPending ? "処理中..." : editingDeal ? "更新" : "作成"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals?.map((deal) => (
            <Card key={deal.id} className="hover-elevate" data-testid={`card-deal-${deal.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      {deal.name}
                    </CardTitle>
                    <CardDescription>{getCustomerName(deal.customerId)}</CardDescription>
                  </div>
                  {getStageBadge(deal.stage || "prospecting")}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <DollarSign className="h-5 w-5 text-primary" />
                    {formatCurrency(deal.amount || 0)}
                  </div>
                  <Badge variant="outline">{deal.probability || 0}% 確度</Badge>
                </div>
                {deal.expectedCloseDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>成約予定: {format(new Date(deal.expectedCloseDate), "yyyy/MM/dd")}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(deal)}
                    data-testid={`button-edit-${deal.id}`}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    編集
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(deal.id)}
                    data-testid={`button-delete-${deal.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    削除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {deals?.length === 0 && (
          <Card className="mt-6">
            <CardContent className="py-12 text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">商談データがありません</p>
              <p className="text-muted-foreground mb-4">新規商談を登録して営業活動を進めましょう</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
