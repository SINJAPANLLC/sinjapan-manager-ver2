import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, TrendingDown, Plus, Edit, Trash2, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

export default function Finance() {
  const { toast } = useToast();
  const [period, setPeriod] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [open, setOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);
  const [formData, setFormData] = useState({
    type: "income",
    category: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    businessId: "",
  });

  const { data: plData, isLoading: plLoading } = useQuery<any>({
    queryKey: ["/api/finance/pl", period],
  });

  const { data: bsData, isLoading: bsLoading } = useQuery<any>({
    queryKey: ["/api/finance/bs", period],
  });

  const { data: cfData, isLoading: cfLoading } = useQuery<any>({
    queryKey: ["/api/finance/cf", period],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: businesses } = useQuery<any[]>({
    queryKey: ["/api/businesses"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/transactions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/pl"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/bs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/cf"] });
      setOpen(false);
      resetForm();
      toast({
        title: "取引を作成しました",
        description: "新しい取引が正常に追加されました。",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/transactions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/pl"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/bs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/cf"] });
      setOpen(false);
      setEditingTransaction(null);
      resetForm();
      toast({
        title: "取引を更新しました",
        description: "取引が正常に更新されました。",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/pl"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/bs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/finance/cf"] });
      toast({
        title: "取引を削除しました",
        description: "取引が正常に削除されました。",
      });
    },
  });

  const aiReportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/ai/generate/financial-report", {
        method: "POST",
        body: JSON.stringify({
          pl: plData,
          bs: bsData,
          cf: cfData,
          period,
        }),
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      setAiReport(data.report);
      setAiDialogOpen(true);
      toast({
        title: "AIレポートを生成しました",
        description: "財務分析レポートを表示しています。",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "AIレポート生成に失敗しました。",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      amount: parseFloat(formData.amount),
      businessId: formData.businessId ? parseInt(formData.businessId) : null,
    };
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount.toString(),
      description: transaction.description || "",
      date: transaction.date,
      businessId: transaction.businessId?.toString() || "",
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("この取引を削除してもよろしいですか？")) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      type: "income",
      category: "",
      amount: "",
      description: "",
      date: new Date().toISOString().split('T')[0],
      businessId: "",
    });
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setEditingTransaction(null);
      resetForm();
    }
  };

  if (plLoading || bsLoading || cfLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">財務管理</h1>
          <p className="text-muted-foreground mt-1">
            PL・BS・CFレポート - 自動集計
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => aiReportMutation.mutate()}
            disabled={!plData && !bsData && !cfData || aiReportMutation.isPending}
            data-testid="button-ai-report"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {aiReportMutation.isPending ? "生成中..." : "AIレポート"}
          </Button>
          <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-transaction">
              <Plus className="mr-2 h-4 w-4" />
              新規取引
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTransaction ? "取引を編集" : "新規取引を作成"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">取引タイプ *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger data-testid="select-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">収入</SelectItem>
                      <SelectItem value="expense">支出</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">カテゴリ *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="例: 売上、広告費"
                    required
                    data-testid="input-category"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">金額 (円) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="1000000"
                    required
                    data-testid="input-amount"
                  />
                </div>
                <div>
                  <Label htmlFor="date">日付 *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    data-testid="input-date"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="business">事業部門</Label>
                <Select
                  value={formData.businessId}
                  onValueChange={(value) => setFormData({ ...formData, businessId: value })}
                >
                  <SelectTrigger data-testid="select-business">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">なし</SelectItem>
                    {businesses?.map((business: any) => (
                      <SelectItem key={business.id} value={business.id.toString()}>
                        {business.nameJa}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="取引の詳細"
                  rows={3}
                  data-testid="textarea-description"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  キャンセル
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending} 
                  data-testid="button-submit"
                >
                  {editingTransaction ? "更新" : "作成"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {aiReport && (
        <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>AI財務分析レポート</DialogTitle>
              <DialogDescription>
                Gemini AIによる財務データの分析結果
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div className="whitespace-pre-wrap bg-muted p-4 rounded-md">
                {aiReport.insights || aiReport}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="monthly" data-testid="tab-monthly">月次</TabsTrigger>
          <TabsTrigger value="quarterly" data-testid="tab-quarterly">四半期</TabsTrigger>
          <TabsTrigger value="yearly" data-testid="tab-yearly">年次</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PL (Profit & Loss) */}
        <Card data-testid="card-pl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              損益計算書 (PL)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-md bg-card border border-border">
                <span className="text-sm text-muted-foreground">売上高</span>
                <span className="text-sm font-semibold font-mono">
                  ¥{plData?.revenue ? (plData.revenue / 1000000).toFixed(1) : "0.0"}M
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-card border border-border">
                <span className="text-sm text-muted-foreground">売上原価</span>
                <span className="text-sm font-semibold font-mono text-red-500">
                  -¥{plData?.cogs ? (plData.cogs / 1000000).toFixed(1) : "0.0"}M
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between p-3 rounded-md bg-card border border-border">
                <span className="text-sm font-medium">売上総利益</span>
                <span className="text-sm font-bold font-mono text-green-500">
                  ¥{plData?.grossProfit ? (plData.grossProfit / 1000000).toFixed(1) : "0.0"}M
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-card border border-border">
                <span className="text-sm text-muted-foreground">営業費用</span>
                <span className="text-sm font-semibold font-mono text-red-500">
                  -¥{plData?.opex ? (plData.opex / 1000000).toFixed(1) : "0.0"}M
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between p-3 rounded-md bg-primary/10 border border-primary/20">
                <span className="text-sm font-bold">純利益</span>
                <span className={cn(
                  "text-base font-bold font-mono",
                  (plData?.netProfit || 0) > 0 ? "text-green-500" : "text-red-500"
                )}>
                  {(plData?.netProfit || 0) > 0 ? <TrendingUp className="inline h-4 w-4 mr-1" /> : <TrendingDown className="inline h-4 w-4 mr-1" />}
                  ¥{plData?.netProfit ? (plData.netProfit / 1000000).toFixed(1) : "0.0"}M
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BS (Balance Sheet) */}
        <Card data-testid="card-bs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              貸借対照表 (BS)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">資産</p>
                <div className="flex items-center justify-between p-3 rounded-md bg-card border border-border">
                  <span className="text-sm text-muted-foreground">流動資産</span>
                  <span className="text-sm font-semibold font-mono">
                    ¥{bsData?.currentAssets ? (bsData.currentAssets / 1000000).toFixed(1) : "0.0"}M
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-card border border-border">
                  <span className="text-sm text-muted-foreground">固定資産</span>
                  <span className="text-sm font-semibold font-mono">
                    ¥{bsData?.fixedAssets ? (bsData.fixedAssets / 1000000).toFixed(1) : "0.0"}M
                  </span>
                </div>
              </div>
              <div className="h-px bg-border" />
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">負債</p>
                <div className="flex items-center justify-between p-3 rounded-md bg-card border border-border">
                  <span className="text-sm text-muted-foreground">流動負債</span>
                  <span className="text-sm font-semibold font-mono">
                    ¥{bsData?.currentLiabilities ? (bsData.currentLiabilities / 1000000).toFixed(1) : "0.0"}M
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-card border border-border">
                  <span className="text-sm text-muted-foreground">固定負債</span>
                  <span className="text-sm font-semibold font-mono">
                    ¥{bsData?.longTermLiabilities ? (bsData.longTermLiabilities / 1000000).toFixed(1) : "0.0"}M
                  </span>
                </div>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between p-3 rounded-md bg-primary/10 border border-primary/20">
                <span className="text-sm font-bold">純資産</span>
                <span className="text-base font-bold font-mono text-green-500">
                  ¥{bsData?.equity ? (bsData.equity / 1000000).toFixed(1) : "0.0"}M
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CF (Cash Flow) */}
        <Card data-testid="card-cf">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-primary" />
              キャッシュフロー (CF)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-md bg-card border border-border">
                <span className="text-sm text-muted-foreground">営業CF</span>
                <span className={cn(
                  "text-sm font-semibold font-mono",
                  (cfData?.operating || 0) > 0 ? "text-green-500" : "text-red-500"
                )}>
                  {(cfData?.operating || 0) > 0 ? "+" : ""}¥{cfData?.operating ? (cfData.operating / 1000000).toFixed(1) : "0.0"}M
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-card border border-border">
                <span className="text-sm text-muted-foreground">投資CF</span>
                <span className={cn(
                  "text-sm font-semibold font-mono",
                  (cfData?.investing || 0) > 0 ? "text-green-500" : "text-red-500"
                )}>
                  {(cfData?.investing || 0) > 0 ? "+" : ""}¥{cfData?.investing ? (cfData.investing / 1000000).toFixed(1) : "0.0"}M
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-card border border-border">
                <span className="text-sm text-muted-foreground">財務CF</span>
                <span className={cn(
                  "text-sm font-semibold font-mono",
                  (cfData?.financing || 0) > 0 ? "text-green-500" : "text-red-500"
                )}>
                  {(cfData?.financing || 0) > 0 ? "+" : ""}¥{cfData?.financing ? (cfData.financing / 1000000).toFixed(1) : "0.0"}M
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between p-3 rounded-md bg-primary/10 border border-primary/20">
                <span className="text-sm font-bold">現金増減</span>
                <span className={cn(
                  "text-base font-bold font-mono",
                  (cfData?.netChange || 0) > 0 ? "text-green-500" : "text-red-500"
                )}>
                  {(cfData?.netChange || 0) > 0 ? <TrendingUp className="inline h-4 w-4 mr-1" /> : <TrendingDown className="inline h-4 w-4 mr-1" />}
                  {(cfData?.netChange || 0) > 0 ? "+" : ""}¥{cfData?.netChange ? (cfData.netChange / 1000000).toFixed(1) : "0.0"}M
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 取引履歴テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>最近の取引</CardTitle>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <Skeleton className="h-64" />
          ) : !transactions || transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              まだ取引が登録されていません
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>タイプ</TableHead>
                  <TableHead>カテゴリ</TableHead>
                  <TableHead>事業部門</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.slice(0, 10).map((transaction: any) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(transaction.date).toLocaleDateString("ja-JP")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === "income" ? "default" : "secondary"}>
                        {transaction.type === "income" ? "収入" : "支出"}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {transaction.businessId 
                        ? businesses?.find((b: any) => b.id === transaction.businessId)?.nameJa || "-"
                        : "-"
                      }
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-mono font-semibold",
                      transaction.type === "income" ? "text-green-500" : "text-red-500"
                    )}>
                      {transaction.type === "income" ? "+" : "-"}¥{(transaction.amount / 1000000).toFixed(2)}M
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(transaction)}
                          className="h-8 w-8"
                          data-testid={`button-edit-transaction-${transaction.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(transaction.id)}
                          className="h-8 w-8"
                          data-testid={`button-delete-transaction-${transaction.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI生成レポート</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            SIGMA COREによる財務分析レポートが自動生成されます。現在のデータに基づいた戦略的提言と将来予測が含まれます。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
