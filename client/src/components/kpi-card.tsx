import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  changeRate?: number;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
}

export function KpiCard({ title, value, unit, changeRate, icon: Icon, trend }: KpiCardProps) {
  const getTrendIcon = () => {
    if (trend === "up") return TrendingUp;
    if (trend === "down") return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (trend === "up") return "text-green-500";
    if (trend === "down") return "text-red-500";
    return "text-gray-500";
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card className="hover-elevate" data-testid={`kpi-card-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold font-mono" data-testid={`kpi-value-${title.toLowerCase().replace(/\s+/g, "-")}`}>
            {value}
          </p>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        {changeRate !== undefined && (
          <div className={cn("flex items-center gap-1 mt-2", getTrendColor())}>
            <TrendIcon className="h-3 w-3" />
            <span className="text-xs font-medium">
              {changeRate > 0 && "+"}
              {changeRate}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">前月比</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
