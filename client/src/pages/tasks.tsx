import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, CheckCircle2, Circle, Clock, Edit, Trash2, CalendarIcon, User as UserIcon, Building2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema, type Task, type User, type Business } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const TASK_CATEGORIES = [
  { value: "sales", label: "営業", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { value: "org", label: "組織", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  { value: "risk", label: "リスク", color: "bg-red-500/20 text-red-300 border-red-500/30" },
  { value: "expand", label: "拡張", color: "bg-green-500/20 text-green-300 border-green-500/30" },
];

const formSchema = insertTaskSchema.extend({
  dueDate: z.date().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  businessId: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Tasks() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiContext, setAiContext] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "sales",
      priority: "medium",
      status: "pending",
      assignedTo: null,
      businessId: null,
      dueDate: null,
      aiGenerated: false,
    },
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: businesses } = useQuery<Business[]>({
    queryKey: ["/api/businesses"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest("POST", "/api/tasks", {
        ...data,
        dueDate: data.dueDate || undefined,
        assignedTo: data.assignedTo || undefined,
        businessId: data.businessId || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setOpen(false);
      form.reset();
      toast({
        title: "タスクを作成しました",
        description: "新しいタスクが正常に追加されました。",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "タスクの作成に失敗しました。",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormValues }) => {
      return await apiRequest("PATCH", `/api/tasks/${id}`, {
        ...data,
        dueDate: data.dueDate || undefined,
        assignedTo: data.assignedTo || undefined,
        businessId: data.businessId || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setOpen(false);
      setEditingTask(null);
      form.reset();
      toast({
        title: "タスクを更新しました",
        description: "タスクが正常に更新されました。",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "タスクの更新に失敗しました。",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "タスクを削除しました",
        description: "タスクが正常に削除されました。",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "タスクの削除に失敗しました。",
        variant: "destructive",
      });
    },
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/tasks/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const aiGenerateMutation = useMutation({
    mutationFn: async (context: string) => {
      const response = await apiRequest("/api/ai/generate/tasks", {
        method: "POST",
        body: JSON.stringify({ context }),
      });
      return await response.json();
    },
    onSuccess: (data: { tasks: Array<any> }) => {
      if (data.tasks && data.tasks.length > 0) {
        data.tasks.forEach((aiTask) => {
          createMutation.mutate({
            title: aiTask.title,
            description: aiTask.description,
            category: aiTask.quadrant,
            priority: aiTask.priority,
            status: "pending",
            assignedTo: null,
            businessId: null,
            dueDate: null,
            aiGenerated: true,
          });
        });
        setAiDialogOpen(false);
        setAiContext("");
        toast({
          title: "AIタスクを生成しました",
          description: `${data.tasks.length}個のタスクを追加しました。`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "AIタスク生成に失敗しました。",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    form.reset({
      title: task.title,
      description: task.description || "",
      category: task.category,
      priority: task.priority || "medium",
      status: task.status || "pending",
      assignedTo: task.assignedTo || null,
      businessId: task.businessId || null,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      aiGenerated: task.aiGenerated || false,
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("このタスクを削除してもよろしいですか？")) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleComplete = (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    toggleCompleteMutation.mutate({ id: task.id, status: newStatus });
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setEditingTask(null);
      form.reset();
    }
  };

  if (tasksLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  const getUserName = (userId: string | null) => {
    if (!userId) return "未割当";
    const user = users?.find((u) => u.id === userId);
    if (!user) return "不明";
    return user.firstName || user.lastName
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
      : user.email?.split("@")[0] || "ユーザー";
  };

  const getBusinessName = (businessId: string | null) => {
    if (!businessId) return null;
    const business = businesses?.find((b) => b.id === businessId);
    return business?.nameJa || business?.name || null;
  };

  const filteredTasks = tasks?.filter((task) => {
    if (activeTab !== "all" && task.category !== activeTab) return false;
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    return true;
  }) || [];

  const tasksByCategory = TASK_CATEGORIES.map((cat) => ({
    ...cat,
    tasks: filteredTasks.filter((t) => t.category === cat.value),
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">タスク管理</h1>
          <p className="text-muted-foreground mt-1">
            4象限分類システム - 営業・組織・リスク・拡張
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-ai-generate-tasks">
                <Sparkles className="h-4 w-4 mr-2" />
                AI生成
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>AIタスク生成</DialogTitle>
                <DialogDescription>
                  コンテキストを入力してタスクを自動生成します
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">コンテキスト</label>
                  <Textarea
                    value={aiContext}
                    onChange={(e) => setAiContext(e.target.value)}
                    placeholder="例：新規事業立ち上げのためのタスク、月次財務レポートの作成、顧客満足度向上施策など"
                    className="mt-2"
                    rows={4}
                    data-testid="input-ai-context"
                  />
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => aiGenerateMutation.mutate(aiContext)}
                    disabled={!aiContext.trim() || aiGenerateMutation.isPending}
                    data-testid="button-generate-ai-tasks"
                  >
                    {aiGenerateMutation.isPending ? "生成中..." : "タスクを生成"}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-task">
                <Plus className="h-4 w-4 mr-2" />
                新規タスク
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTask ? "タスクを編集" : "新規タスク作成"}</DialogTitle>
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
                        <Input
                          {...field}
                          placeholder="タスクのタイトル"
                          data-testid="input-task-title"
                        />
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
                      <FormLabel>説明</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          placeholder="タスクの詳細"
                          rows={3}
                          data-testid="input-task-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>カテゴリ *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-task-category">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TASK_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
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
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>優先度 *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "medium"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-task-priority">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">低</SelectItem>
                            <SelectItem value="medium">中</SelectItem>
                            <SelectItem value="high">高</SelectItem>
                            <SelectItem value="urgent">緊急</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>担当者</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-task-assignee">
                              <SelectValue placeholder="担当者を選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">未割当</SelectItem>
                            {users?.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName || user.lastName
                                  ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                                  : user.email?.split("@")[0] || "ユーザー"}
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
                    name="businessId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>事業部門</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-task-business">
                              <SelectValue placeholder="事業部門を選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">未設定</SelectItem>
                            {businesses?.map((business) => (
                              <SelectItem key={business.id} value={business.id}>
                                {business.nameJa || business.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>期限</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="button-select-due-date"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "PPP", { locale: ja })
                              ) : (
                                <span>期限を選択</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {editingTask && (
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ステータス</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "pending"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-task-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">未着手</SelectItem>
                            <SelectItem value="in_progress">進行中</SelectItem>
                            <SelectItem value="completed">完了</SelectItem>
                            <SelectItem value="cancelled">キャンセル</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <DialogFooter>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-task"
                  >
                    {editingTask ? "更新" : "作成"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48" data-testid="filter-status">
            <SelectValue placeholder="ステータスでフィルタ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全てのステータス</SelectItem>
            <SelectItem value="pending">未着手</SelectItem>
            <SelectItem value="in_progress">進行中</SelectItem>
            <SelectItem value="completed">完了</SelectItem>
            <SelectItem value="cancelled">キャンセル</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">全て ({filteredTasks.length})</TabsTrigger>
          {TASK_CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.label} ({tasksByCategory.find((tc) => tc.value === cat.value)?.tasks.length || 0})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tasksByCategory.map((category) => (
              <Card key={category.value} data-testid={`task-category-${category.value}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{category.label}</span>
                    <Badge className={category.color}>{category.tasks.length}件</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.tasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        タスクがありません
                      </p>
                    ) : (
                      category.tasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          getUserName={getUserName}
                          getBusinessName={getBusinessName}
                          onToggleComplete={handleToggleComplete}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {TASK_CATEGORIES.map((cat) => (
          <TabsContent key={cat.value} value={cat.value} className="mt-6">
            <div className="space-y-3">
              {tasksByCategory
                .find((tc) => tc.value === cat.value)
                ?.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    getUserName={getUserName}
                    getBusinessName={getBusinessName}
                    onToggleComplete={handleToggleComplete}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              {tasksByCategory.find((tc) => tc.value === cat.value)?.tasks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  タスクがありません
                </p>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function TaskCard({
  task,
  getUserName,
  getBusinessName,
  onToggleComplete,
  onEdit,
  onDelete,
}: {
  task: Task;
  getUserName: (userId: string | null) => string;
  getBusinessName: (businessId: string | null) => string | null;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const businessName = getBusinessName(task.businessId);
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";

  return (
    <div
      className="p-3 rounded-md border border-border hover-elevate group"
      data-testid={`task-${task.id}`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggleComplete(task)}
          className="flex-shrink-0 mt-0.5 hover:scale-110 transition-transform"
          data-testid={`button-toggle-${task.id}`}
        >
          {task.status === "completed" ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : task.status === "in_progress" ? (
            <Clock className="h-5 w-5 text-yellow-500" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium",
              task.status === "completed" && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge
              variant="secondary"
              className={cn(
                "text-xs h-5",
                task.priority === "urgent" && "bg-red-500/20 text-red-300",
                task.priority === "high" && "bg-orange-500/20 text-orange-300",
                task.priority === "medium" && "bg-blue-500/20 text-blue-300",
                task.priority === "low" && "bg-gray-500/20 text-gray-300"
              )}
            >
              {task.priority === "urgent" && "緊急"}
              {task.priority === "high" && "高"}
              {task.priority === "medium" && "中"}
              {task.priority === "low" && "低"}
            </Badge>
            {task.assignedTo && (
              <Badge variant="secondary" className="text-xs h-5 flex items-center gap-1">
                <UserIcon className="h-3 w-3" />
                {getUserName(task.assignedTo)}
              </Badge>
            )}
            {businessName && (
              <Badge variant="secondary" className="text-xs h-5 flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {businessName}
              </Badge>
            )}
            {task.dueDate && (
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs h-5 flex items-center gap-1",
                  isOverdue && "bg-red-500/20 text-red-300"
                )}
              >
                <CalendarIcon className="h-3 w-3" />
                {format(new Date(task.dueDate), "M/d", { locale: ja })}
              </Badge>
            )}
            {task.aiGenerated && (
              <Badge variant="secondary" className="text-xs h-5 bg-purple-500/20 text-purple-300">
                AI生成
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(task)}
            className="h-8 w-8"
            data-testid={`button-edit-${task.id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(task.id)}
            className="h-8 w-8"
            data-testid={`button-delete-${task.id}`}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}
