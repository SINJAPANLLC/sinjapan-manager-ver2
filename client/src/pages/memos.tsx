import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertMemoSchema, type Memo } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Pin,
  Archive,
  Edit,
  Trash2,
  Tag,
} from "lucide-react";

const memoFormSchema = insertMemoSchema.extend({
  tags: z.array(z.string()).optional(),
});

type MemoFormData = z.infer<typeof memoFormSchema>;

export default function Memos() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: memos = [], isLoading } = useQuery<Memo[]>({
    queryKey: ["/api/memos"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: MemoFormData) =>
      apiRequest("/api/memos", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memos"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "成功",
        description: "メモを作成しました",
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

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<MemoFormData>;
    }) =>
      apiRequest(`/api/memos/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memos"] });
      setEditingMemo(null);
      toast({
        title: "成功",
        description: "メモを更新しました",
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest(`/api/memos/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memos"] });
      toast({
        title: "成功",
        description: "メモを削除しました",
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

  const form = useForm<MemoFormData>({
    resolver: zodResolver(memoFormSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "",
      tags: [],
      isPinned: false,
      isArchived: false,
      color: "",
    },
  });

  const editForm = useForm<MemoFormData>({
    resolver: zodResolver(memoFormSchema),
    defaultValues: editingMemo
      ? {
          title: editingMemo.title || "",
          content: editingMemo.content,
          category: editingMemo.category || "",
          tags: editingMemo.tags || [],
          isPinned: editingMemo.isPinned,
          isArchived: editingMemo.isArchived,
          color: editingMemo.color || "",
        }
      : {
          title: "",
          content: "",
          category: "",
          tags: [],
          isPinned: false,
          isArchived: false,
          color: "",
        },
  });

  const onCreateSubmit = (data: MemoFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: MemoFormData) => {
    if (editingMemo) {
      updateMutation.mutate({ id: editingMemo.id, data });
    }
  };

  const handlePin = (memo: Memo) => {
    updateMutation.mutate({
      id: memo.id,
      data: { isPinned: !memo.isPinned },
    });
  };

  const handleArchive = (memo: Memo) => {
    updateMutation.mutate({
      id: memo.id,
      data: { isArchived: !memo.isArchived },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("このメモを削除してもよろしいですか？")) {
      deleteMutation.mutate(id);
    }
  };

  const categories = Array.from(
    new Set(memos.map((m) => m.category).filter(Boolean))
  );

  const filteredMemos = memos.filter((memo) => {
    const matchesSearch =
      !searchQuery ||
      memo.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memo.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || memo.category === selectedCategory;
    return matchesSearch && matchesCategory && !memo.isArchived;
  });

  const pinnedMemos = filteredMemos.filter((m) => m.isPinned);
  const unpinnedMemos = filteredMemos.filter((m) => !m.isPinned);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              メモ
            </h1>
            <p className="text-muted-foreground mt-2">
              アイデアやタスクを記録・管理
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-memo">
                <Plus className="w-4 h-4 mr-2" />
                新規メモ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>新規メモ作成</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onCreateSubmit)}
                  className="space-y-4"
                  data-testid="form-create-memo"
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>タイトル</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="メモのタイトル"
                            {...field}
                            data-testid="input-memo-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>内容</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="メモの内容"
                            rows={6}
                            {...field}
                            data-testid="input-memo-content"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>カテゴリ</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="カテゴリ名"
                            {...field}
                            data-testid="input-memo-category"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      data-testid="button-cancel-memo"
                    >
                      キャンセル
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      data-testid="button-submit-memo"
                    >
                      {createMutation.isPending ? "作成中..." : "作成"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="メモを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-memos"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              data-testid="button-filter-all"
            >
              全て
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category || null)}
                data-testid={`button-filter-${category}`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {pinnedMemos.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Pin className="w-5 h-5" />
              ピン留めメモ
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pinnedMemos.map((memo) => (
                <MemoCard
                  key={memo.id}
                  memo={memo}
                  onPin={handlePin}
                  onArchive={handleArchive}
                  onEdit={setEditingMemo}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          {pinnedMemos.length > 0 && (
            <h2 className="text-xl font-semibold mb-4">その他のメモ</h2>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unpinnedMemos.map((memo) => (
              <MemoCard
                key={memo.id}
                memo={memo}
                onPin={handlePin}
                onArchive={handleArchive}
                onEdit={setEditingMemo}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>

        {filteredMemos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">メモがありません</p>
          </div>
        )}
      </div>

      {editingMemo && (
        <Dialog
          open={!!editingMemo}
          onOpenChange={(open) => !open && setEditingMemo(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>メモ編集</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(onEditSubmit)}
                className="space-y-4"
                data-testid="form-edit-memo"
              >
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>タイトル</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="メモのタイトル"
                          {...field}
                          data-testid="input-edit-memo-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>内容</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="メモの内容"
                          rows={6}
                          {...field}
                          data-testid="input-edit-memo-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>カテゴリ</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="カテゴリ名"
                          {...field}
                          data-testid="input-edit-memo-category"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingMemo(null)}
                    data-testid="button-cancel-edit-memo"
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    data-testid="button-submit-edit-memo"
                  >
                    {updateMutation.isPending ? "更新中..." : "更新"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function MemoCard({
  memo,
  onPin,
  onArchive,
  onEdit,
  onDelete,
}: {
  memo: Memo;
  onPin: (memo: Memo) => void;
  onArchive: (memo: Memo) => void;
  onEdit: (memo: Memo) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card
      className="hover-elevate active-elevate-2 cursor-pointer"
      data-testid={`card-memo-${memo.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {memo.title && (
              <CardTitle className="text-lg mb-2" data-testid="text-memo-title">
                {memo.title}
              </CardTitle>
            )}
            {memo.category && (
              <Badge variant="secondary" data-testid="badge-memo-category">
                <Tag className="w-3 h-3 mr-1" />
                {memo.category}
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onPin(memo)}
              className={memo.isPinned ? "text-primary" : ""}
              data-testid="button-pin-memo"
            >
              <Pin className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p
          className="text-sm text-muted-foreground line-clamp-3 mb-4"
          data-testid="text-memo-content"
        >
          {memo.content}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(memo)}
            data-testid="button-edit-memo"
          >
            <Edit className="w-3 h-3 mr-1" />
            編集
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onArchive(memo)}
            data-testid="button-archive-memo"
          >
            <Archive className="w-3 h-3 mr-1" />
            {memo.isArchived ? "復元" : "アーカイブ"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(memo.id)}
            data-testid="button-delete-memo"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            削除
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
