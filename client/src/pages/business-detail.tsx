import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, DollarSign, FileText, TrendingUp, Calendar, Edit, Trash2, Plus,
  Clock, Users, Briefcase, MessageSquare
} from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  insertShiftSchema, insertQuoteSchema, insertProjectSchema, insertMeetingSchema,
  type Shift, type Quote, type Project, type Meeting 
} from "@shared/schema";
import { z } from "zod";

export default function BusinessDetail() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams();
  const businessId = params.id;
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    nameJa: "",
    description: "",
    status: "active",
  });

  const { data: business, isLoading: businessLoading } = useQuery<any>({
    queryKey: ["/api/businesses", businessId],
  });

  const { data: contracts, isLoading: contractsLoading } = useQuery<any[]>({
    queryKey: ["/api/contracts", { businessId }],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<any[]>({
    queryKey: ["/api/transactions", { businessId }],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", `/api/businesses/${businessId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses", businessId] });
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      setOpen(false);
      toast({
        title: "事業部門を更新しました",
        description: "事業部門が正常に更新されました。",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/businesses/${businessId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      toast({
        title: "事業部門を削除しました",
        description: "事業部門が正常に削除されました。",
      });
      setLocation("/businesses");
    },
  });

  const handleEdit = () => {
    if (business) {
      setFormData({
        name: business.name,
        nameJa: business.nameJa,
        description: business.description || "",
        status: business.status,
      });
      setOpen(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (confirm("この事業部門を削除してもよろしいですか？\n関連する契約や取引も削除されます。")) {
      deleteMutation.mutate();
    }
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open && business) {
      setFormData({
        name: business.name,
        nameJa: business.nameJa,
        description: business.description || "",
        status: business.status,
      });
    }
  };

  if (businessLoading || contractsLoading || transactionsLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">事業部門が見つかりません</p>
        <Button asChild className="mt-4">
          <Link href="/businesses">戻る</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Button variant="ghost" asChild className="mb-4" data-testid="button-back">
          <Link href="/businesses">
            <ArrowLeft className="h-4 w-4 mr-2" />
            事業部門一覧へ戻る
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{business.nameJa}</h1>
            <p className="text-muted-foreground mt-1">{business.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={business.status === "active" ? "default" : "secondary"}
              className={cn(
                "text-sm px-4 py-1",
                business.status === "active" && "bg-green-500/20 text-green-300 border-green-500/30"
              )}
              data-testid="badge-business-status"
            >
              {business.status === "active" && "稼働中"}
              {business.status === "inactive" && "休止中"}
              {business.status === "planning" && "計画中"}
            </Badge>
            <Dialog open={open} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleEdit} data-testid="button-edit-business">
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>事業部門を編集</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nameJa">事業部門名（日本語） *</Label>
                    <Input
                      id="nameJa"
                      value={formData.nameJa}
                      onChange={(e) => setFormData({ ...formData, nameJa: e.target.value })}
                      required
                      data-testid="input-business-name-ja"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">事業部門名（英語） *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      data-testid="input-business-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">説明</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      data-testid="input-business-description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">ステータス</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger data-testid="select-business-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">稼働中</SelectItem>
                        <SelectItem value="inactive">休止中</SelectItem>
                        <SelectItem value="planning">計画中</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                      キャンセル
                    </Button>
                    <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-business">
                      更新
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              size="icon"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-business"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
        {business.description && (
          <p className="text-muted-foreground mt-4">{business.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
            <p className="text-sm font-medium text-muted-foreground">売上</p>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">
              ¥{(parseFloat(business.revenue || 0) / 1000000).toFixed(1)}M
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
            <p className="text-sm font-medium text-muted-foreground">費用</p>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">
              ¥{(parseFloat(business.expenses || 0) / 1000000).toFixed(1)}M
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
            <p className="text-sm font-medium text-muted-foreground">利益</p>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className={cn(
              "text-2xl font-bold font-mono",
              parseFloat(business.profit || 0) > 0 ? "text-green-500" : "text-red-500"
            )}>
              ¥{(parseFloat(business.profit || 0) / 1000000).toFixed(1)}M
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="contracts" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="contracts" data-testid="tab-contracts">
            <FileText className="h-4 w-4 mr-2" />
            契約
          </TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-transactions">
            <Calendar className="h-4 w-4 mr-2" />
            取引
          </TabsTrigger>
          <TabsTrigger value="shifts" data-testid="tab-shifts">
            <Clock className="h-4 w-4 mr-2" />
            シフト
          </TabsTrigger>
          <TabsTrigger value="quotes" data-testid="tab-quotes">
            <FileText className="h-4 w-4 mr-2" />
            見積書
          </TabsTrigger>
          <TabsTrigger value="projects" data-testid="tab-projects">
            <Briefcase className="h-4 w-4 mr-2" />
            案件
          </TabsTrigger>
          <TabsTrigger value="meetings" data-testid="tab-meetings">
            <MessageSquare className="h-4 w-4 mr-2" />
            面談
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          <ContractsTab businessId={businessId!} contracts={contracts} />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <TransactionsTab businessId={businessId!} transactions={transactions} />
        </TabsContent>

        <TabsContent value="shifts" className="space-y-4">
          <ShiftsTab businessId={businessId!} />
        </TabsContent>

        <TabsContent value="quotes" className="space-y-4">
          <QuotesTab businessId={businessId!} />
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <ProjectsTab businessId={businessId!} />
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4">
          <MeetingsTab businessId={businessId!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ContractsTab({ businessId, contracts }: { businessId: string; contracts: any[] | undefined }) {
  return (
    <Card data-testid="card-contracts">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          契約情報
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {(!contracts || contracts.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              契約情報がありません
            </p>
          ) : (
            contracts.map((contract: any) => (
              <div
                key={contract.id}
                className="p-3 rounded-md border border-border hover-elevate"
                data-testid={`contract-${contract.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">{contract.title}</p>
                  <Badge
                    variant={contract.status === "active" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {contract.status === "active" && "有効"}
                    {contract.status === "expired" && "期限切れ"}
                    {contract.status === "renewed" && "更新済"}
                    {contract.status === "cancelled" && "キャンセル"}
                  </Badge>
                </div>
                {contract.clientName && (
                  <p className="text-xs text-muted-foreground">
                    クライアント: {contract.clientName}
                  </p>
                )}
                <p className="text-sm font-mono mt-2">
                  ¥{(parseFloat(contract.amount || 0) / 1000000).toFixed(1)}M
                </p>
                {contract.endDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    期限: {new Date(contract.endDate).toLocaleDateString("ja-JP")}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionsTab({ businessId, transactions }: { businessId: string; transactions: any[] | undefined }) {
  return (
    <Card data-testid="card-transactions">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          最近の取引
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {(!transactions || transactions.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              取引履歴がありません
            </p>
          ) : (
            transactions.slice(0, 10).map((transaction: any) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-md border border-border hover-elevate"
                data-testid={`transaction-${transaction.id}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {transaction.description || transaction.category}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(transaction.transactionDate).toLocaleDateString("ja-JP")}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className={cn(
                    "text-sm font-semibold font-mono",
                    transaction.type === "revenue" ? "text-green-500" : "text-red-500"
                  )}>
                    {transaction.type === "revenue" ? "+" : "-"}
                    ¥{(parseFloat(transaction.amount || 0) / 1000).toFixed(0)}K
                  </p>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {transaction.type === "revenue" ? "収入" : "支出"}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ShiftsTab({ businessId }: { businessId: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data: shifts, isLoading } = useQuery<Shift[]>({
    queryKey: ["/api/shifts", { businessId }],
  });

  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const form = useForm<z.infer<typeof insertShiftSchema>>({
    resolver: zodResolver(insertShiftSchema),
    defaultValues: {
      businessId,
      userId: "",
      startTime: new Date(),
      endTime: new Date(),
      role: "",
      notes: "",
    },
  });

  useEffect(() => {
    form.reset({
      businessId,
      userId: "",
      startTime: new Date(),
      endTime: new Date(),
      role: "",
      notes: "",
    });
  }, [open, businessId]);

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertShiftSchema>) => {
      return await apiRequest("POST", "/api/shifts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts", { businessId }] });
      setOpen(false);
      toast({
        title: "シフトを作成しました",
        description: "シフトが正常に作成されました。",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/shifts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts", { businessId }] });
      toast({
        title: "シフトを削除しました",
        description: "シフトが正常に削除されました。",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof insertShiftSchema>) => {
    createMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 gap-1">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          シフト管理
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-shift">
              <Plus className="h-4 w-4 mr-2" />
              シフト追加
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>新規シフト</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>担当者 *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-shift-user">
                            <SelectValue placeholder="担当者を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users?.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name || user.email}
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
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>役割</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="例: マネージャー" data-testid="input-shift-role" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>開始時刻 *</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                            data-testid="input-shift-start"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>終了時刻 *</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                            data-testid="input-shift-end"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>備考</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="input-shift-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    キャンセル
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-shift">
                    作成
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : !shifts || shifts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              シフトがありません
            </p>
          ) : (
            shifts.map((shift) => {
              const user = users?.find(u => u.id === shift.userId);
              return (
                <div
                  key={shift.id}
                  className="p-4 rounded-md border border-border hover-elevate"
                  data-testid={`shift-${shift.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-semibold">{user?.name || user?.email || "不明"}</p>
                        {shift.role && (
                          <Badge variant="secondary" className="text-xs">{shift.role}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {new Date(shift.startTime).toLocaleString("ja-JP")} ～ {new Date(shift.endTime).toLocaleString("ja-JP")}
                        </span>
                      </div>
                      {shift.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{shift.notes}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("このシフトを削除してもよろしいですか？")) {
                          deleteMutation.mutate(shift.id);
                        }
                      }}
                      data-testid={`button-delete-shift-${shift.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function QuotesTab({ businessId }: { businessId: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data: quotes, isLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes", { businessId }],
  });

  const form = useForm<z.infer<typeof insertQuoteSchema>>({
    resolver: zodResolver(insertQuoteSchema),
    defaultValues: {
      businessId,
      clientName: "",
      projectName: "",
      amount: "0",
      validUntil: new Date(),
      status: "draft",
      items: [],
      notes: "",
    },
  });

  useEffect(() => {
    form.reset({
      businessId,
      clientName: "",
      projectName: "",
      amount: "0",
      validUntil: new Date(),
      status: "draft",
      items: [],
      notes: "",
    });
  }, [open, businessId]);

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertQuoteSchema>) => {
      return await apiRequest("POST", "/api/quotes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes", { businessId }] });
      setOpen(false);
      toast({
        title: "見積書を作成しました",
        description: "見積書が正常に作成されました。",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/quotes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes", { businessId }] });
      toast({
        title: "見積書を削除しました",
        description: "見積書が正常に削除されました。",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof insertQuoteSchema>) => {
    createMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 gap-1">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          見積書管理
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-quote">
              <Plus className="h-4 w-4 mr-2" />
              見積書追加
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>新規見積書</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>顧客名 *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="例: 株式会社ABC" data-testid="input-quote-client" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>案件名 *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="例: Webサイト制作" data-testid="input-quote-project" />
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
                        <Input {...field} type="number" placeholder="1000000" data-testid="input-quote-amount" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>有効期限 *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                          data-testid="input-quote-valid"
                        />
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-quote-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">下書き</SelectItem>
                          <SelectItem value="sent">送信済</SelectItem>
                          <SelectItem value="accepted">承認済</SelectItem>
                          <SelectItem value="rejected">却下</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>備考</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="input-quote-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    キャンセル
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-quote">
                    作成
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : !quotes || quotes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              見積書がありません
            </p>
          ) : (
            quotes.map((quote) => (
              <div
                key={quote.id}
                className="p-4 rounded-md border border-border hover-elevate"
                data-testid={`quote-${quote.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-semibold">{quote.projectName}</p>
                      <Badge
                        variant={quote.status === "accepted" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {quote.status === "draft" && "下書き"}
                        {quote.status === "sent" && "送信済"}
                        {quote.status === "accepted" && "承認済"}
                        {quote.status === "rejected" && "却下"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">顧客: {quote.clientName}</p>
                    <p className="text-sm font-mono font-semibold">
                      ¥{(parseFloat(quote.amount) / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      有効期限: {new Date(quote.validUntil).toLocaleDateString("ja-JP")}
                    </p>
                    {quote.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{quote.notes}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("この見積書を削除してもよろしいですか？")) {
                        deleteMutation.mutate(quote.id);
                      }
                    }}
                    data-testid={`button-delete-quote-${quote.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectsTab({ businessId }: { businessId: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", { businessId }],
  });

  const form = useForm<z.infer<typeof insertProjectSchema>>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      businessId,
      name: "",
      clientName: "",
      description: "",
      status: "planning",
      budget: "",
      startDate: new Date(),
      endDate: null,
    },
  });

  useEffect(() => {
    form.reset({
      businessId,
      name: "",
      clientName: "",
      description: "",
      status: "planning",
      budget: "",
      startDate: new Date(),
      endDate: null,
    });
  }, [open, businessId]);

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertProjectSchema>) => {
      return await apiRequest("POST", "/api/projects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", { businessId }] });
      setOpen(false);
      toast({
        title: "案件を作成しました",
        description: "案件が正常に作成されました。",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", { businessId }] });
      toast({
        title: "案件を削除しました",
        description: "案件が正常に削除されました。",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof insertProjectSchema>) => {
    createMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 gap-1">
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          案件管理
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-project">
              <Plus className="h-4 w-4 mr-2" />
              案件追加
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>新規案件</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>案件名 *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="例: ECサイト開発" data-testid="input-project-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>顧客名 *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="例: 株式会社XYZ" data-testid="input-project-client" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>詳細</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="input-project-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>予算</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="5000000" data-testid="input-project-budget" />
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-project-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="planning">計画中</SelectItem>
                          <SelectItem value="active">進行中</SelectItem>
                          <SelectItem value="on-hold">保留</SelectItem>
                          <SelectItem value="completed">完了</SelectItem>
                          <SelectItem value="cancelled">キャンセル</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>開始日 *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                            data-testid="input-project-start"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>終了日</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                            data-testid="input-project-end"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    キャンセル
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-project">
                    作成
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : !projects || projects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              案件がありません
            </p>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="p-4 rounded-md border border-border hover-elevate"
                data-testid={`project-${project.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-semibold">{project.name}</p>
                      <Badge
                        variant={project.status === "active" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {project.status === "planning" && "計画中"}
                        {project.status === "active" && "進行中"}
                        {project.status === "on-hold" && "保留"}
                        {project.status === "completed" && "完了"}
                        {project.status === "cancelled" && "キャンセル"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">顧客: {project.clientName}</p>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
                    )}
                    {project.budget && (
                      <p className="text-sm font-mono font-semibold">
                        予算: ¥{(parseFloat(project.budget) / 1000000).toFixed(1)}M
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(project.startDate).toLocaleDateString("ja-JP")}
                      {project.endDate && ` ～ ${new Date(project.endDate).toLocaleDateString("ja-JP")}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("この案件を削除してもよろしいですか？")) {
                        deleteMutation.mutate(project.id);
                      }
                    }}
                    data-testid={`button-delete-project-${project.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MeetingsTab({ businessId }: { businessId: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data: meetings, isLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings", { businessId }],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects", { businessId }],
  });

  const form = useForm<z.infer<typeof insertMeetingSchema>>({
    resolver: zodResolver(insertMeetingSchema),
    defaultValues: {
      businessId,
      projectId: null,
      title: "",
      description: "",
      startTime: new Date(),
      endTime: new Date(),
      location: "",
      attendees: [],
      notes: "",
    },
  });

  useEffect(() => {
    form.reset({
      businessId,
      projectId: null,
      title: "",
      description: "",
      startTime: new Date(),
      endTime: new Date(),
      location: "",
      attendees: [],
      notes: "",
    });
  }, [open, businessId]);

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertMeetingSchema>) => {
      return await apiRequest("POST", "/api/meetings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", { businessId }] });
      setOpen(false);
      toast({
        title: "面談を作成しました",
        description: "面談が正常に作成されました。",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/meetings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", { businessId }] });
      toast({
        title: "面談を削除しました",
        description: "面談が正常に削除されました。",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof insertMeetingSchema>) => {
    createMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 gap-1">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          面談管理
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-meeting">
              <Plus className="h-4 w-4 mr-2" />
              面談追加
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>新規面談</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>タイトル *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="例: プロジェクトキックオフ" data-testid="input-meeting-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>関連案件</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value || null)} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-meeting-project">
                            <SelectValue placeholder="案件を選択（任意）" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">なし</SelectItem>
                          {projects?.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>詳細</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="input-meeting-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>場所</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="例: 会議室A" data-testid="input-meeting-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>開始時刻 *</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                            data-testid="input-meeting-start"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>終了時刻 *</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                            data-testid="input-meeting-end"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>議事録</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="input-meeting-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    キャンセル
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-meeting">
                    作成
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : !meetings || meetings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              面談がありません
            </p>
          ) : (
            meetings.map((meeting) => {
              const project = projects?.find(p => p.id === meeting.projectId);
              return (
                <div
                  key={meeting.id}
                  className="p-4 rounded-md border border-border hover-elevate"
                  data-testid={`meeting-${meeting.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-semibold">{meeting.title}</p>
                        {project && (
                          <Badge variant="secondary" className="text-xs">{project.name}</Badge>
                        )}
                      </div>
                      {meeting.description && (
                        <p className="text-sm text-muted-foreground mb-2">{meeting.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {new Date(meeting.startTime).toLocaleString("ja-JP")} ～ {new Date(meeting.endTime).toLocaleString("ja-JP")}
                        </span>
                        {meeting.location && <span>📍 {meeting.location}</span>}
                      </div>
                      {meeting.notes && (
                        <p className="text-sm text-muted-foreground mt-2 p-2 rounded bg-muted">
                          議事録: {meeting.notes}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("この面談を削除してもよろしいですか？")) {
                          deleteMutation.mutate(meeting.id);
                        }
                      }}
                      data-testid={`button-delete-meeting-${meeting.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
