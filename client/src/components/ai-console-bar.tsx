import { useQuery } from "@tanstack/react-query";
import { Activity, Brain, Sparkles, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AiEvent } from "@shared/schema";

interface AiAgent {
  name: string;
  type: "SIGMA" | "MIZUKI" | "NEURAL";
  status: "active" | "idle" | "processing";
  icon: typeof Brain;
  description: string;
}

const AI_AGENT_CONFIG: Omit<AiAgent, "status">[] = [
  { 
    name: "SIGMA CORE", 
    type: "SIGMA", 
    icon: Brain,
    description: "戦略・ROI・リソース配分"
  },
  { 
    name: "MIZUKI MANAGER", 
    type: "MIZUKI", 
    icon: Sparkles,
    description: "日次自動化・KPI追跡"
  },
  { 
    name: "NEURAL ENGINE", 
    type: "NEURAL", 
    icon: Zap,
    description: "文書・画像生成"
  },
];

function getAgentStatus(events: AiEvent[], agentType: string): "active" | "idle" | "processing" {
  const recentEvents = events.filter(e => {
    const eventTime = new Date(e.timestamp).getTime();
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    return eventTime > fiveMinutesAgo;
  });

  const agentEvents = recentEvents.filter(e => 
    e.agentType?.toLowerCase().includes(agentType.toLowerCase())
  );

  if (agentEvents.length === 0) return "idle";

  const latestEvent = agentEvents[0];
  if (latestEvent.status === "completed") return "active";
  if (latestEvent.status === "processing") return "processing";
  
  return "active";
}

export function AiConsoleBar() {
  const { data: recentEvents = [] } = useQuery<AiEvent[]>({
    queryKey: ["/api/ai/events/recent"],
    refetchInterval: 10000,
  });

  const aiAgents: AiAgent[] = AI_AGENT_CONFIG.map(config => ({
    ...config,
    status: getAgentStatus(recentEvents, config.type),
  }));

  const lastUpdate = recentEvents.length > 0 
    ? new Date(recentEvents[0].timestamp).toLocaleTimeString("ja-JP")
    : new Date().toLocaleTimeString("ja-JP");

  return (
    <div className="h-16 bg-gradient-blue animate-gradient border-b border-white/10 px-6 flex items-center justify-between relative overflow-hidden shadow-lg">
      <div className="absolute inset-0 bg-gradient-purple opacity-30 animate-gradient-fast"></div>
      <div className="flex items-center gap-6 relative z-10">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-white animate-pulse" />
          <span className="text-sm font-semibold text-white">
            AI システム状態
          </span>
        </div>
        <div className="h-6 w-px bg-white/30" />
        <div className="flex items-center gap-4">
          {aiAgents.map((agent) => (
            <div 
              key={agent.type} 
              className="flex items-center gap-2 group cursor-pointer" 
              data-testid={`ai-agent-${agent.type.toLowerCase()}`}
              title={agent.description}
            >
              <agent.icon className="h-4 w-4 text-white group-hover:scale-110 transition-transform" />
              <span className="text-xs text-white/90 font-medium">{agent.name}</span>
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs h-5 px-2 transition-all duration-300 font-medium",
                  agent.status === "active" && "bg-green-500/30 text-green-100 border-green-400/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]",
                  agent.status === "processing" && "bg-yellow-500/30 text-yellow-100 border-yellow-400/50 shadow-[0_0_10px_rgba(234,179,8,0.3)] animate-pulse",
                  agent.status === "idle" && "bg-gray-500/30 text-gray-100 border-gray-400/50"
                )}
                data-testid={`ai-status-${agent.type.toLowerCase()}`}
              >
                {agent.status === "active" && "稼働中"}
                {agent.status === "processing" && "処理中"}
                {agent.status === "idle" && "待機"}
              </Badge>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 relative z-10">
        <span className="text-xs text-white/80">
          最終更新: {lastUpdate}
        </span>
      </div>
    </div>
  );
}
