import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: "succeeded" | "pending" | "failed" | "canceled";
  description: string;
  createdAt: string;
}

export default function Payments() {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  // Fetch payment history
  const { data: paymentsData, isLoading } = useQuery<{ payments: Payment[]; hasMore: boolean }>({
    queryKey: ["/api/payments"],
  });

  const payments = paymentsData?.payments || [];

  // Create payment intent mutation
  const createPaymentMutation = useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description: string }) => {
      const response = await apiRequest("/api/payments/create-intent", {
        method: "POST",
        body: JSON.stringify({ amount, currency: "jpy", description }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({
        title: "成功",
        description: "支払いを作成しました",
      });
      setAmount("");
      setDescription("");
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "支払いの作成に失敗しました",
        variant: "destructive",
      });
    },
  });

  const handleCreatePayment = () => {
    const amountValue = parseInt(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "エラー",
        description: "有効な金額を入力してください",
        variant: "destructive",
      });
      return;
    }

    createPaymentMutation.mutate({
      amount: amountValue,
      description: description || "支払い",
    });
  };

  const getStatusIcon = (status: Payment["status"]) => {
    switch (status) {
      case "succeeded":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "canceled":
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: Payment["status"]) => {
    const variants: Record<Payment["status"], "default" | "secondary" | "destructive" | "outline"> = {
      succeeded: "default",
      pending: "secondary",
      failed: "destructive",
      canceled: "outline",
    };
    const labels: Record<Payment["status"], string> = {
      succeeded: "成功",
      pending: "保留中",
      failed: "失敗",
      canceled: "キャンセル",
    };
    return (
      <Badge variant={variants[status]} data-testid={`badge-status-${status}`}>
        {labels[status]}
      </Badge>
    );
  };

  const totalAmount = payments.reduce((sum, p) => {
    if (p.status === "succeeded") {
      return sum + p.amount;
    }
    return sum;
  }, 0);

  const successfulPayments = payments.filter(p => p.status === "succeeded").length;
  const pendingPayments = payments.filter(p => p.status === "pending").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-screen-2xl">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent" data-testid="text-page-title">
              決済管理
            </h1>
            <p className="text-muted-foreground mt-1">
              Stripe決済の管理と履歴確認
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総支払額</CardTitle>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-amount">
                  ¥{totalAmount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">成功した支払い</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">成功</CardTitle>
                <CheckCircle className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-successful-count">{successfulPayments}</div>
                <p className="text-xs text-muted-foreground">支払い完了</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">保留中</CardTitle>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-pending-count">{pendingPayments}</div>
                <p className="text-xs text-muted-foreground">処理待ち</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総件数</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-payments">{payments.length}</div>
                <p className="text-xs text-muted-foreground">すべての支払い</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Payment */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>新規支払い作成</CardTitle>
                <CardDescription>
                  Stripe決済を作成します
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">金額（円）</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="1000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    data-testid="input-amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">説明</Label>
                  <Input
                    id="description"
                    placeholder="支払いの説明"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    data-testid="input-description"
                  />
                </div>
                <Button 
                  onClick={handleCreatePayment}
                  disabled={createPaymentMutation.isPending}
                  className="w-full"
                  data-testid="button-create-payment"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {createPaymentMutation.isPending ? "作成中..." : "支払いを作成"}
                </Button>
                
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Stripe決済機能は準備完了です。実際の決済処理には環境変数の設定が必要です。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>支払い履歴</CardTitle>
                <CardDescription>
                  すべての決済トランザクション
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all" data-testid="tab-all">すべて</TabsTrigger>
                    <TabsTrigger value="succeeded" data-testid="tab-succeeded">成功</TabsTrigger>
                    <TabsTrigger value="pending" data-testid="tab-pending">保留中</TabsTrigger>
                    <TabsTrigger value="failed" data-testid="tab-failed">失敗</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="mt-4">
                    {isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">読み込み中...</div>
                    ) : payments.length === 0 ? (
                      <div className="text-center py-12" data-testid="text-no-payments">
                        <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">支払い履歴がありません</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {payments.map((payment) => (
                          <div 
                            key={payment.id} 
                            className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                            data-testid={`payment-item-${payment.id}`}
                          >
                            <div className="flex items-center gap-3">
                              {getStatusIcon(payment.status)}
                              <div>
                                <p className="font-medium" data-testid={`text-payment-description-${payment.id}`}>
                                  {payment.description}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(payment.createdAt).toLocaleString("ja-JP")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {getStatusBadge(payment.status)}
                              <p className="font-semibold" data-testid={`text-payment-amount-${payment.id}`}>
                                ¥{payment.amount.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {["succeeded", "pending", "failed"].map((status) => (
                    <TabsContent key={status} value={status} className="mt-4">
                      <div className="space-y-3">
                        {payments
                          .filter((p) => p.status === status)
                          .map((payment) => (
                            <div 
                              key={payment.id} 
                              className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                              data-testid={`payment-item-${payment.id}`}
                            >
                              <div className="flex items-center gap-3">
                                {getStatusIcon(payment.status)}
                                <div>
                                  <p className="font-medium">{payment.description}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(payment.createdAt).toLocaleString("ja-JP")}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                {getStatusBadge(payment.status)}
                                <p className="font-semibold">
                                  ¥{payment.amount.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        {payments.filter((p) => p.status === status).length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            該当する支払いがありません
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
