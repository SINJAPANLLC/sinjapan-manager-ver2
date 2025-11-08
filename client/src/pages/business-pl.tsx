import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, TrendingUp, TrendingDown, Calendar } from "lucide-react";

interface PLLineItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  amount: string;
  category: string | null;
}

interface PLSection {
  title: string;
  items: PLLineItem[];
  total: string;
}

interface BusinessPL {
  businessId: string | null;
  businessName: string;
  period: {
    start: string;
    end: string;
  };
  revenue: PLSection;
  costOfSales: PLSection;
  grossProfit: string;
  operatingExpenses: PLSection;
  operatingIncome: string;
  nonOperatingRevenue: PLSection;
  nonOperatingExpenses: PLSection;
  ordinaryIncome: string;
  netIncome: string;
}

export default function BusinessPL() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [businessId, setBusinessId] = useState<string>("all");
  const [year, setYear] = useState<number>(currentYear);
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  const [value, setValue] = useState<number>(currentMonth);

  // 事業部門一覧取得
  const { data: businesses } = useQuery<any[]>({
    queryKey: ["/api/businesses"],
  });

  // P/L取得
  const { data: pl, isLoading } = useQuery<BusinessPL>({
    queryKey: ["/api/finance/pl", businessId, year, period, value],
    queryFn: async () => {
      const params = new URLSearchParams({
        year: year.toString(),
        period,
        value: value.toString(),
      });
      if (businessId !== "all") {
        params.append("businessId", businessId);
      }
      const response = await fetch(`/api/finance/pl?${params}`);
      return response.json();
    },
  });

  // Excelエクスポート
  const handleExport = async () => {
    try {
      const response = await fetch("/api/finance/pl/export", {
        method: "POST",
        body: JSON.stringify({
          businessId: businessId === "all" ? null : businessId,
          year,
          period,
          value,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PL_${pl?.businessName}_${year}${period}${value}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  // 金額フォーマット
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(num);
  };

  // 期間選択オプション生成
  const getPeriodOptions = () => {
    if (period === "month") {
      return Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1}月` }));
    } else if (period === "quarter") {
      return [
        { value: 1, label: "Q1" },
        { value: 2, label: "Q2" },
        { value: 3, label: "Q3" },
        { value: 4, label: "Q4" },
      ];
    } else {
      return [{ value: 1, label: "通年" }];
    }
  };

  return (
    <div className="container max-w-screen-2xl mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">損益計算書（P/L）</h1>
          <p className="text-muted-foreground">事業部門別の詳細な損益状況</p>
        </div>
        <Button onClick={handleExport} data-testid="button-export-excel" disabled={isLoading}>
          <Download className="mr-2 h-4 w-4" />
          Excelエクスポート
        </Button>
      </div>

      {/* フィルター */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            表示設定
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 事業部門選択 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">事業部門</label>
              <Select value={businessId} onValueChange={setBusinessId}>
                <SelectTrigger data-testid="select-business">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全社</SelectItem>
                  {businesses?.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nameJa || b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 年選択 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">年度</label>
              <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                <SelectTrigger data-testid="select-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}年
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 期間タイプ選択 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">期間タイプ</label>
              <Select value={period} onValueChange={(v: any) => { setPeriod(v); setValue(1); }}>
                <SelectTrigger data-testid="select-period-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">月次</SelectItem>
                  <SelectItem value="quarter">四半期</SelectItem>
                  <SelectItem value="year">年次</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 期間値選択 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">期間</label>
              <Select value={value.toString()} onValueChange={(v) => setValue(parseInt(v))}>
                <SelectTrigger data-testid="select-period-value">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getPeriodOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* P/L表示 */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      ) : pl ? (
        <div className="space-y-4">
          {/* サマリーカード */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>売上高</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(pl.revenue.total)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>売上総利益</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(pl.grossProfit)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>営業利益</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {formatCurrency(pl.operatingIncome)}
                  {parseFloat(pl.operatingIncome) >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>当期純利益</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {formatCurrency(pl.netIncome)}
                  {parseFloat(pl.netIncome) >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* 詳細P/L */}
          <Card>
            <CardHeader>
              <CardTitle>{pl.businessName} - 損益計算書</CardTitle>
              <CardDescription>
                {new Date(pl.period.start).toLocaleDateString("ja-JP")} 〜{" "}
                {new Date(pl.period.end).toLocaleDateString("ja-JP")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">勘定科目コード</TableHead>
                    <TableHead>勘定科目名</TableHead>
                    <TableHead className="text-right w-40">金額</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* 売上高 */}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={2}>売上高</TableCell>
                    <TableCell className="text-right"></TableCell>
                  </TableRow>
                  {pl.revenue.items.map((item) => (
                    <TableRow key={item.accountId}>
                      <TableCell className="pl-6">{item.accountCode}</TableCell>
                      <TableCell className="pl-6">{item.accountName}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold">
                    <TableCell colSpan={2} className="pl-6">売上高 計</TableCell>
                    <TableCell className="text-right">{formatCurrency(pl.revenue.total)}</TableCell>
                  </TableRow>

                  {/* 売上原価 */}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={2}>売上原価</TableCell>
                    <TableCell className="text-right"></TableCell>
                  </TableRow>
                  {pl.costOfSales.items.map((item) => (
                    <TableRow key={item.accountId}>
                      <TableCell className="pl-6">{item.accountCode}</TableCell>
                      <TableCell className="pl-6">{item.accountName}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold">
                    <TableCell colSpan={2} className="pl-6">売上原価 計</TableCell>
                    <TableCell className="text-right">{formatCurrency(pl.costOfSales.total)}</TableCell>
                  </TableRow>

                  {/* 売上総利益 */}
                  <TableRow className="bg-yellow-50 dark:bg-yellow-950/20 font-bold text-lg">
                    <TableCell colSpan={2}>売上総利益</TableCell>
                    <TableCell className="text-right">{formatCurrency(pl.grossProfit)}</TableCell>
                  </TableRow>

                  {/* 販管費 */}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={2}>販売費及び一般管理費</TableCell>
                    <TableCell className="text-right"></TableCell>
                  </TableRow>
                  {pl.operatingExpenses.items.map((item) => (
                    <TableRow key={item.accountId}>
                      <TableCell className="pl-6">{item.accountCode}</TableCell>
                      <TableCell className="pl-6">{item.accountName}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold">
                    <TableCell colSpan={2} className="pl-6">販売費及び一般管理費 計</TableCell>
                    <TableCell className="text-right">{formatCurrency(pl.operatingExpenses.total)}</TableCell>
                  </TableRow>

                  {/* 営業利益 */}
                  <TableRow className="bg-yellow-50 dark:bg-yellow-950/20 font-bold text-lg">
                    <TableCell colSpan={2}>営業利益</TableCell>
                    <TableCell className="text-right">{formatCurrency(pl.operatingIncome)}</TableCell>
                  </TableRow>

                  {/* 営業外損益 */}
                  {pl.nonOperatingRevenue.items.length > 0 && (
                    <>
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={2}>営業外収益</TableCell>
                        <TableCell className="text-right"></TableCell>
                      </TableRow>
                      {pl.nonOperatingRevenue.items.map((item) => (
                        <TableRow key={item.accountId}>
                          <TableCell className="pl-6">{item.accountCode}</TableCell>
                          <TableCell className="pl-6">{item.accountName}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}

                  {pl.nonOperatingExpenses.items.length > 0 && (
                    <>
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={2}>営業外費用</TableCell>
                        <TableCell className="text-right"></TableCell>
                      </TableRow>
                      {pl.nonOperatingExpenses.items.map((item) => (
                        <TableRow key={item.accountId}>
                          <TableCell className="pl-6">{item.accountCode}</TableCell>
                          <TableCell className="pl-6">{item.accountName}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}

                  {/* 経常利益 */}
                  <TableRow className="bg-yellow-50 dark:bg-yellow-950/20 font-bold text-lg">
                    <TableCell colSpan={2}>経常利益</TableCell>
                    <TableCell className="text-right">{formatCurrency(pl.ordinaryIncome)}</TableCell>
                  </TableRow>

                  {/* 当期純利益 */}
                  <TableRow className="bg-green-50 dark:bg-green-950/20 font-bold text-xl">
                    <TableCell colSpan={2}>当期純利益</TableCell>
                    <TableCell className="text-right">{formatCurrency(pl.netIncome)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
