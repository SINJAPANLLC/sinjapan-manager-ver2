import { useQuery } from "@tanstack/react-query";
import { KpiCard } from "@/components/kpi-card";
import {
  Building2,
  DollarSign,
  CheckSquare,
  TrendingUp,
  Activity,
  AlertCircle,
  Plus,
  Receipt,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: businesses, isLoading: businessesLoading } = useQuery<any[]>({
    queryKey: ["/api/businesses"],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: aiEvents, isLoading: aiEventsLoading } = useQuery<any[]>({
    queryKey: ["/api/ai/events/recent"],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
  });

  if (businessesLoading || tasksLoading || aiEventsLoading || transactionsLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const totalRevenue = businesses?.reduce((sum: number, b: any) => sum + parseFloat(b.revenue || 0), 0) || 0;
  const totalProfit = businesses?.reduce((sum: number, b: any) => sum + parseFloat(b.profit || 0), 0) || 0;
  const activeTasks = tasks?.filter((t: any) => t.status !== "completed").length || 0;
  const activeBusinesses = businesses?.filter((b: any) => b.status === "active").length || 0;

  const recentAiActions = aiEvents?.slice(0, 5) || [];

  // Get recent activities (tasks and transactions) - sort all items before slicing
  const allActivities = [
    ...(tasks?.map((t: any) => ({ ...t, type: "task", time: t.createdAt })) || []),
    ...(transactions?.map((t: any) => ({ ...t, type: "transaction", time: t.createdAt || t.transactionDate })) || []),
  ];

  const recentActivities = allActivities
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CEOダッシュボード</h1>
          <p className="text-muted-foreground mt-1">
            事業全体の概況とAI活動サマリー
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" data-testid="quick-action-new-task">
            <Link href="/tasks">
              <Plus className="h-4 w-4 mr-2" />
              新規タスク
            </Link>
          </Button>
          <Button asChild variant="outline" data-testid="quick-action-new-business">
            <Link href="/businesses">
              <Building2 className="h-4 w-4 mr-2" />
              事業追加
            </Link>
          </Button>
          <Button asChild data-testid="quick-action-new-transaction">
            <Link href="/finance">
              <Receipt className="h-4 w-4 mr-2" />
              取引追加
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="総売上"
          value={`¥${(totalRevenue / 1000000).toFixed(1)}M`}
          changeRate={8.2}
          icon={DollarSign}
          trend="up"
        />
        <KpiCard
          title="純利益"
          value={`¥${(totalProfit / 1000000).toFixed(1)}M`}
          changeRate={12.5}
          icon={TrendingUp}
          trend="up"
        />
        <KpiCard
          title="稼働事業"
          value={activeBusinesses}
          unit="部門"
          changeRate={0}
          icon={Building2}
          trend="neutral"
        />
        <KpiCard
          title="アクティブタスク"
          value={activeTasks}
          unit="件"
          changeRate={-5.3}
          icon={CheckSquare}
          trend="down"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-recent-activities">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              最近の活動
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  まだ活動履歴がありません
                </p>
              ) : (
                recentActivities.map((activity: any, idx) => (
                  <div
                    key={`${activity.type}-${activity.id}-${idx}`}
                    className="flex items-start gap-3 p-3 rounded-md border border-border hover-elevate"
                    data-testid={`activity-${activity.type}-${idx}`}
                  >
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                      activity.type === "task" ? "bg-blue-500/20" : "bg-green-500/20"
                    }`}>
                      {activity.type === "task" ? (
                        <CheckSquare className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Receipt className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {activity.type === "task" ? activity.title : activity.description || activity.category}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.time).toLocaleString("ja-JP")}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {activity.type === "task" ? "タスク" : "取引"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              AI活動ログ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAiActions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  まだAI活動の履歴がありません
                </p>
              ) : (
                recentAiActions.map((event: any) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-md border border-border hover-elevate"
                    data-testid={`ai-event-${event.id}`}
                  >
                    <Badge
                      variant="secondary"
                      className={
                        event.agentType === "SIGMA"
                          ? "bg-blue-500/20 text-blue-300"
                          : event.agentType === "MIZUKI"
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-green-500/20 text-green-300"
                      }
                    >
                      {event.agentType}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{event.actionType}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(event.createdAt).toLocaleString("ja-JP")}
                      </p>
                    </div>
                    <Badge variant={event.status === "success" ? "default" : "destructive"}>
                      {event.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              今日の注意事項
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">契約更新期限が近づいています</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    3件の契約が今月末に期限切れとなります
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-md bg-blue-500/10 border border-blue-500/20">
                <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">新規タスクが自動生成されました</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    MIZUKI が5件の営業タスクを作成しました
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
