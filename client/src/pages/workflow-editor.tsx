import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Save,
  Play,
  ArrowLeft,
  Plus,
  Settings,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Workflow, WorkflowStep, WorkflowConnection } from "@shared/schema";

const NODE_TYPES = [
  { value: "start", label: "開始", icon: Play, color: "#10b981" },
  { value: "end", label: "終了", icon: CheckCircle2, color: "#ef4444" },
  { value: "task", label: "タスク", icon: FileText, color: "#3b82f6" },
  { value: "approval", label: "承認", icon: CheckCircle2, color: "#f59e0b" },
  { value: "automation", label: "自動化", icon: Zap, color: "#8b5cf6" },
  { value: "condition", label: "分岐", icon: Settings, color: "#6366f1" },
];

export default function WorkflowEditor() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, editParams] = useRoute("/workflows/:id/edit");
  const [, viewParams] = useRoute("/workflows/:id/view");
  const workflowId = editParams?.id || viewParams?.id || "";
  const isStaffOrAgency = user?.role === "Staff" || user?.role === "Agency";

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isNodeDialogOpen, setIsNodeDialogOpen] = useState(false);
  const [isAddNodeDialogOpen, setIsAddNodeDialogOpen] = useState(false);
  const [newNodeType, setNewNodeType] = useState("task");

  const { data: workflow, isLoading: workflowLoading } = useQuery<Workflow>({
    queryKey: ["/api/workflows", workflowId],
    enabled: !!workflowId,
  });

  const { data: steps = [], isLoading: stepsLoading } = useQuery<WorkflowStep[]>({
    queryKey: ["/api/workflows", workflowId, "steps"],
    enabled: !!workflowId,
  });

  const { data: connections = [], isLoading: connectionsLoading } = useQuery<WorkflowConnection[]>({
    queryKey: ["/api/workflows", workflowId, "connections"],
    enabled: !!workflowId,
  });

  const createStepMutation = useMutation({
    mutationFn: async (stepData: any) =>
      apiRequest(`/api/workflows/${workflowId}/steps`, {
        method: "POST",
        body: JSON.stringify(stepData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows", workflowId, "steps"] });
      toast({
        title: "成功",
        description: "ステップを追加しました",
      });
      setIsAddNodeDialogOpen(false);
    },
  });

  const updateStepMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/workflow-steps/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows", workflowId, "steps"] });
      toast({
        title: "成功",
        description: "ステップを更新しました",
      });
    },
  });

  const createConnectionMutation = useMutation({
    mutationFn: async (connectionData: any) =>
      apiRequest(`/api/workflows/${workflowId}/connections`, {
        method: "POST",
        body: JSON.stringify(connectionData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows", workflowId, "connections"] });
    },
  });

  useEffect(() => {
    if (steps.length > 0) {
      const flowNodes: Node[] = steps.map((step) => {
        const position = step.position as { x: number; y: number } || { x: 100, y: 100 };
        const nodeType = NODE_TYPES.find((t) => t.value === step.type);
        
        return {
          id: step.id,
          type: "default",
          position,
          data: {
            label: (
              <div className="px-4 py-2">
                <div className="font-medium">{step.name}</div>
                {step.type && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {nodeType?.label || step.type}
                  </div>
                )}
              </div>
            ),
            step,
          },
          style: {
            background: nodeType?.color || "#3b82f6",
            color: "white",
            border: "2px solid white",
            borderRadius: "8px",
          },
        };
      });
      setNodes(flowNodes);
    }
  }, [steps, setNodes]);

  useEffect(() => {
    if (connections.length > 0) {
      const flowEdges: Edge[] = connections.map((conn) => ({
        id: conn.id,
        source: conn.sourceStepId,
        target: conn.targetStepId,
        label: conn.label || "",
        animated: true,
        style: { stroke: "#3b82f6", strokeWidth: 2 },
      }));
      setEdges(flowEdges);
    }
  }, [connections, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
      
      if (params.source && params.target) {
        createConnectionMutation.mutate({
          sourceStepId: params.source,
          targetStepId: params.target,
        });
      }
    },
    [setEdges, createConnectionMutation]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setIsNodeDialogOpen(true);
  }, []);

  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      updateStepMutation.mutate({
        id: node.id,
        data: {
          position: { x: node.position.x, y: node.position.y },
        },
      });
    },
    [updateStepMutation]
  );

  const handleAddNode = () => {
    const newStep = {
      name: `新しいステップ`,
      type: newNodeType,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      order: steps.length,
    };

    createStepMutation.mutate(newStep);
  };

  const handleUpdateNode = () => {
    if (!selectedNode) return;

    const step = selectedNode.data.step as WorkflowStep;
    updateStepMutation.mutate({
      id: selectedNode.id,
      data: {
        name: step.name,
        description: step.description,
        manualContent: step.manualContent,
        assigneeRole: step.assigneeRole,
        estimatedDuration: step.estimatedDuration,
        rewardAmount: step.rewardAmount,
      },
    });
    setIsNodeDialogOpen(false);
  };

  if (workflowLoading || stepsLoading || connectionsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-lg">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setLocation("/workflows")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{workflow?.name}</h1>
              <p className="text-sm text-muted-foreground">{workflow?.description}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsAddNodeDialogOpen(true)}
              data-testid="button-add-node"
            >
              <Plus className="h-4 w-4 mr-2" />
              ステップ追加
            </Button>
            <Button variant="outline" data-testid="button-save">
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDragStop={onNodeDragStop}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>

      <Dialog open={isNodeDialogOpen} onOpenChange={setIsNodeDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-edit-node">
          <DialogHeader>
            <DialogTitle>ステップ編集</DialogTitle>
            <DialogDescription>
              ステップの詳細設定とマニュアルを編集できます
            </DialogDescription>
          </DialogHeader>
          {selectedNode && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>ステップ名</Label>
                <Input
                  value={selectedNode.data.step.name}
                  onChange={(e) =>
                    setSelectedNode({
                      ...selectedNode,
                      data: {
                        ...selectedNode.data,
                        step: { ...selectedNode.data.step, name: e.target.value },
                      },
                    })
                  }
                  data-testid="input-step-name"
                />
              </div>
              <div className="space-y-2">
                <Label>説明</Label>
                <Textarea
                  value={selectedNode.data.step.description || ""}
                  onChange={(e) =>
                    setSelectedNode({
                      ...selectedNode,
                      data: {
                        ...selectedNode.data,
                        step: { ...selectedNode.data.step, description: e.target.value },
                      },
                    })
                  }
                  data-testid="input-step-description"
                />
              </div>
              <div className="space-y-2">
                <Label>マニュアル・手順書</Label>
                <Textarea
                  value={selectedNode.data.step.manualContent || ""}
                  onChange={(e) =>
                    setSelectedNode({
                      ...selectedNode,
                      data: {
                        ...selectedNode.data,
                        step: { ...selectedNode.data.step, manualContent: e.target.value },
                      },
                    })
                  }
                  rows={6}
                  placeholder="このステップの詳細な手順を記載してください..."
                  data-testid="input-step-manual"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>担当者役割</Label>
                  <Select
                    value={selectedNode.data.step.assigneeRole || ""}
                    onValueChange={(value) =>
                      setSelectedNode({
                        ...selectedNode,
                        data: {
                          ...selectedNode.data,
                          step: { ...selectedNode.data.step, assigneeRole: value },
                        },
                      })
                    }
                  >
                    <SelectTrigger data-testid="select-step-role">
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CEO">CEO</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                      <SelectItem value="Agency">Agency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>予想所要時間（分）</Label>
                  <Input
                    type="number"
                    value={selectedNode.data.step.estimatedDuration || ""}
                    onChange={(e) =>
                      setSelectedNode({
                        ...selectedNode,
                        data: {
                          ...selectedNode.data,
                          step: {
                            ...selectedNode.data.step,
                            estimatedDuration: parseInt(e.target.value) || 0,
                          },
                        },
                      })
                    }
                    data-testid="input-step-duration"
                  />
                </div>
              </div>
              {(selectedNode.data.step.rewardAmount || !isStaffOrAgency) && (
                <div className="space-y-2">
                  <Label>報酬金額（円）</Label>
                  {selectedNode.data.step.rewardAmount && isStaffOrAgency ? (
                    <div className="px-3 py-2 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-step-reward">
                        ¥{Number(selectedNode.data.step.rewardAmount).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        このステップの報酬金額
                      </p>
                    </div>
                  ) : (
                    <>
                      <Input
                        type="number"
                        value={selectedNode.data.step.rewardAmount || ""}
                        onChange={(e) =>
                          setSelectedNode({
                            ...selectedNode,
                            data: {
                              ...selectedNode.data,
                              step: {
                                ...selectedNode.data.step,
                                rewardAmount: e.target.value || null,
                              },
                            },
                          })
                        }
                        placeholder="報酬金額を入力してください"
                        data-testid="input-step-reward"
                      />
                      <p className="text-xs text-muted-foreground">
                        スタッフや代理店が閲覧できる報酬金額を設定します
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNodeDialogOpen(false)}
              data-testid="button-cancel"
            >
              キャンセル
            </Button>
            <Button onClick={handleUpdateNode} data-testid="button-update">
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddNodeDialogOpen} onOpenChange={setIsAddNodeDialogOpen}>
        <DialogContent data-testid="dialog-add-node">
          <DialogHeader>
            <DialogTitle>ステップ追加</DialogTitle>
            <DialogDescription>
              追加するステップのタイプを選択してください
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              {NODE_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <Card
                    key={type.value}
                    className={`cursor-pointer hover-elevate ${
                      newNodeType === type.value ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setNewNodeType(type.value)}
                    data-testid={`card-node-type-${type.value}`}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div
                          className="p-2 rounded"
                          style={{ backgroundColor: type.color + "20" }}
                        >
                          <Icon className="h-5 w-5" style={{ color: type.color }} />
                        </div>
                        <CardTitle className="text-sm">{type.label}</CardTitle>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddNodeDialogOpen(false)}
              data-testid="button-cancel-add"
            >
              キャンセル
            </Button>
            <Button onClick={handleAddNode} data-testid="button-confirm-add">
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
