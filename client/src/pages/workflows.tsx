import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Play,
  Settings,
  Copy,
  Trash2,
  FileText,
  CheckCircle2,
  Clock,
  Users,
  Zap,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Workflow } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WORKFLOW_CATEGORIES = [
  { value: "contract", label: "契約管理", icon: FileText },
  { value: "expense", label: "経費処理", icon: FileText },
  { value: "approval", label: "承認フロー", icon: CheckCircle2 },
  { value: "project", label: "プロジェクト", icon: Users },
  { value: "marketing", label: "マーケティング", icon: Zap },
  { value: "hr", label: "人事", icon: Users },
  { value: "sales", label: "営業", icon: Zap },
  { value: "other", label: "その他", icon: Settings },
];

export default function Workflows() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    category: "other",
  });

  const { data: workflows = [], isLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newWorkflow) =>
      apiRequest("/api/workflows", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (workflow: Workflow) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "成功",
        description: "ワークフローを作成しました",
      });
      setIsDialogOpen(false);
      setNewWorkflow({ name: "", description: "", category: "other" });
      setLocation(`/workflows/${workflow.id}/edit`);
    },
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest(`/api/workflows/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "成功",
        description: "ワークフローを削除しました",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || workflow.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string | null) => {
    const cat = WORKFLOW_CATEGORIES.find((c) => c.value === category);
    return cat ? cat.icon : Settings;
  };

  const getCategoryLabel = (category: string | null) => {
    const cat = WORKFLOW_CATEGORIES.find((c) => c.value === category);
    return cat ? cat.label : "その他";
  };

  if (isLoading) {
    return (
      <div className="container max-w-screen-2xl mx-auto p-6 space-y-6">
        <Skeleton className="h-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-screen-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            ワークフロー管理
          </h1>
          <p className="text-muted-foreground mt-2">
            業務プロセスを可視化・マニュアル化・自動化
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{workflows.length}</CardTitle>
              <CardDescription>総ワークフロー数</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {workflows.filter((w) => w.isActive).length}
              </CardTitle>
              <CardDescription>アクティブ</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {workflows.filter((w) => w.isTemplate).length}
              </CardTitle>
              <CardDescription>テンプレート</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-medium">新規作成</CardTitle>
                <CardDescription>ワークフロー</CardDescription>
              </div>
              <Button
                onClick={() => setIsDialogOpen(true)}
                data-testid="button-create-workflow"
              >
                <Plus className="h-4 w-4 mr-2" />
                作成
              </Button>
            </CardHeader>
          </Card>
        </div>

        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ワークフローを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-workflow"
              />
            </div>
          </div>
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            data-testid="button-filter-all"
          >
            全て
          </Button>
          {WORKFLOW_CATEGORIES.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.value)}
              data-testid={`button-filter-${category.value}`}
            >
              {category.label}
            </Button>
          ))}
        </div>

        {filteredWorkflows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Zap className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">ワークフローがありません</p>
              <p className="text-sm text-muted-foreground mt-2">
                「作成」ボタンから新しいワークフローを作成してください
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkflows.map((workflow) => {
              const Icon = getCategoryIcon(workflow.category);
              
              return (
                <Card
                  key={workflow.id}
                  className="hover-elevate active-elevate-2"
                  data-testid={`card-workflow-${workflow.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{workflow.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {getCategoryLabel(workflow.category)}
                          </Badge>
                        </div>
                      </div>
                      {workflow.isActive && (
                        <Badge variant="default" className="bg-green-500">
                          アクティブ
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {workflow.description || "説明なし"}
                    </p>
                    <div className="flex gap-2">
                      <Link href={`/workflows/${workflow.id}/edit`}>
                        <Button variant="outline" size="sm" className="flex-1" data-testid={`button-edit-${workflow.id}`}>
                          <Settings className="h-4 w-4 mr-2" />
                          編集
                        </Button>
                      </Link>
                      <Link href={`/workflows/${workflow.id}/view`}>
                        <Button size="sm" className="flex-1" data-testid={`button-view-${workflow.id}`}>
                          <Play className="h-4 w-4 mr-2" />
                          表示
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("このワークフローを削除してもよろしいですか？")) {
                            deleteMutation.mutate(workflow.id);
                          }
                        }}
                        data-testid={`button-delete-${workflow.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent data-testid="dialog-create-workflow">
            <DialogHeader>
              <DialogTitle>新しいワークフローを作成</DialogTitle>
              <DialogDescription>
                ワークフローの基本情報を入力してください
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">名前</Label>
                <Input
                  id="name"
                  placeholder="契約承認フロー"
                  value={newWorkflow.name}
                  onChange={(e) =>
                    setNewWorkflow({ ...newWorkflow, name: e.target.value })
                  }
                  data-testid="input-workflow-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  placeholder="契約書の承認プロセスを管理します"
                  value={newWorkflow.description}
                  onChange={(e) =>
                    setNewWorkflow({ ...newWorkflow, description: e.target.value })
                  }
                  data-testid="input-workflow-description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">カテゴリ</Label>
                <Select
                  value={newWorkflow.category}
                  onValueChange={(value) =>
                    setNewWorkflow({ ...newWorkflow, category: value })
                  }
                >
                  <SelectTrigger data-testid="select-workflow-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKFLOW_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                data-testid="button-cancel"
              >
                キャンセル
              </Button>
              <Button
                onClick={() => createMutation.mutate(newWorkflow)}
                disabled={!newWorkflow.name || createMutation.isPending}
                data-testid="button-save"
              >
                作成
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
