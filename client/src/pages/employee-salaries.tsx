import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type EmployeeSalary } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DollarSign, TrendingUp, Calendar, FileText } from "lucide-react";

export default function EmployeeSalaries() {
  const [activeTab, setActiveTab] = useState("list");
  
  const { data: salaries = [], isLoading } = useQuery<EmployeeSalary[]>({
    queryKey: ["/api/employee/salaries"],
  });

  const latestSalary = salaries[0];

  // 年度の給与合計を計算
  const currentYear = new Date().getFullYear();
  const yearlyTotal = salaries
    .filter(s => new Date(s.paymentDate).getFullYear() === currentYear)
    .reduce((sum, s) => sum + parseFloat(s.netPay.toString()), 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-screen-2xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-primary" />
            給与・報酬情報
          </h1>
          <p className="text-muted-foreground mt-1">給与明細と年収情報</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card data-testid="card-latest-salary">
            <CardHeader>
              <CardTitle className="text-base">今月の手取り</CardTitle>
            </CardHeader>
            <CardContent>
              {latestSalary ? (
                <p className="text-2xl font-bold">
                  ¥{parseInt(latestSalary.netPay.toString()).toLocaleString()}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">データなし</p>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-yearly-total">
            <CardHeader>
              <CardTitle className="text-base">{currentYear}年度累計</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                ¥{Math.floor(yearlyTotal).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-payment-count">
            <CardHeader>
              <CardTitle className="text-base">支給回数</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{salaries.length}回</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list" data-testid="tab-list">
              給与一覧
            </TabsTrigger>
            <TabsTrigger value="detail" data-testid="tab-detail">
              最新明細
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <SalaryListTab salaries={salaries} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="detail" className="space-y-4">
            <SalaryDetailTab salary={latestSalary} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Salary List Tab
function SalaryListTab({ salaries, isLoading }: any) {
  if (isLoading) {
    return <Card><CardContent className="p-6">読み込み中...</CardContent></Card>;
  }

  if (salaries.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          給与データがありません
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-4">
        {salaries.map((salary: EmployeeSalary) => (
          <Card key={salary.id} data-testid={`card-salary-${salary.id}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {new Date(salary.paymentDate).toLocaleDateString("ja-JP")}
                  </CardTitle>
                  <CardDescription>
                    {new Date(salary.periodStart).toLocaleDateString("ja-JP")} ~ {new Date(salary.periodEnd).toLocaleDateString("ja-JP")}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    ¥{parseInt(salary.netPay.toString()).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">手取り</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">総支給額</p>
                  <p className="font-medium">¥{parseInt(salary.grossPay.toString()).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">控除合計</p>
                  <p className="font-medium text-destructive">¥{parseInt(salary.totalDeductions.toString()).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}

// Salary Detail Tab
function SalaryDetailTab({ salary }: any) {
  if (!salary) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          給与データがありません
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card data-testid="card-salary-detail">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            給与明細
          </CardTitle>
          <CardDescription>
            支払日: {new Date(salary.paymentDate).toLocaleDateString("ja-JP")} | 
            対象期間: {new Date(salary.periodStart).toLocaleDateString("ja-JP")} ~ {new Date(salary.periodEnd).toLocaleDateString("ja-JP")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 支給 */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              支給
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>基本給</span>
                <span className="font-medium">¥{parseInt(salary.baseSalary.toString()).toLocaleString()}</span>
              </div>
              {parseFloat(salary.allowances.toString()) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>手当</span>
                  <span className="font-medium">¥{parseInt(salary.allowances.toString()).toLocaleString()}</span>
                </div>
              )}
              {parseFloat(salary.overtimePay.toString()) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>残業代</span>
                  <span className="font-medium">¥{parseInt(salary.overtimePay.toString()).toLocaleString()}</span>
                </div>
              )}
              {parseFloat(salary.bonus.toString()) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>賞与</span>
                  <span className="font-medium">¥{parseInt(salary.bonus.toString()).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                <span>総支給額</span>
                <span className="text-primary">¥{parseInt(salary.grossPay.toString()).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 控除 */}
          <div>
            <h3 className="font-semibold mb-3">控除</h3>
            <div className="space-y-2">
              {parseFloat(salary.incomeTax.toString()) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>所得税</span>
                  <span className="font-medium text-destructive">¥{parseInt(salary.incomeTax.toString()).toLocaleString()}</span>
                </div>
              )}
              {parseFloat(salary.residentTax.toString()) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>住民税</span>
                  <span className="font-medium text-destructive">¥{parseInt(salary.residentTax.toString()).toLocaleString()}</span>
                </div>
              )}
              {parseFloat(salary.healthInsurance.toString()) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>健康保険</span>
                  <span className="font-medium text-destructive">¥{parseInt(salary.healthInsurance.toString()).toLocaleString()}</span>
                </div>
              )}
              {parseFloat(salary.pensionInsurance.toString()) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>厚生年金</span>
                  <span className="font-medium text-destructive">¥{parseInt(salary.pensionInsurance.toString()).toLocaleString()}</span>
                </div>
              )}
              {parseFloat(salary.employmentInsurance.toString()) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>雇用保険</span>
                  <span className="font-medium text-destructive">¥{parseInt(salary.employmentInsurance.toString()).toLocaleString()}</span>
                </div>
              )}
              {parseFloat(salary.otherDeductions.toString()) > 0 && (
                <div className="flex justify-between text-sm">
                  <span>その他控除</span>
                  <span className="font-medium text-destructive">¥{parseInt(salary.otherDeductions.toString()).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                <span>控除合計</span>
                <span className="text-destructive">¥{parseInt(salary.totalDeductions.toString()).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 差引支給額 */}
          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">差引支給額（手取り）</span>
              <span className="text-3xl font-bold text-primary">
                ¥{parseInt(salary.netPay.toString()).toLocaleString()}
              </span>
            </div>
          </div>

          {salary.notes && (
            <div>
              <h3 className="font-semibold mb-2">備考</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{salary.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
