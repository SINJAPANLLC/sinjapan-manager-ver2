import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Building2, TrendingUp, DollarSign, Plus, Edit, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

export default function Businesses() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    nameJa: "",
    description: "",
    status: "active",
  });

  const { data: businesses, isLoading } = useQuery<any[]>({
    queryKey: ["/api/businesses"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/businesses", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      setOpen(false);
      resetForm();
      toast({
        title: "事業部門を作成しました",
        description: "新しい事業部門が正常に追加されました。",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest(`/api/businesses/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      setOpen(false);
      setEditingBusiness(null);
      resetForm();
      toast({
        title: "事業部門を更新しました",
        description: "事業部門が正常に更新されました。",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/businesses/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      toast({
        title: "事業部門を削除しました",
        description: "事業部門が正常に削除されました。",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBusiness) {
      updateMutation.mutate({ id: editingBusiness.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (business: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingBusiness(business);
    setFormData({
      name: business.name,
      nameJa: business.nameJa,
      description: business.description || "",
      status: business.status,
    });
    setOpen(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("この事業部門を削除してもよろしいですか？")) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      nameJa: "",
      description: "",
      status: "active",
    });
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setEditingBusiness(null);
      resetForm();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(11)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">事業部門管理</h1>
          <p className="text-muted-foreground mt-1">
            事業部門の統合管理ダッシュボード
          </p>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-business">
              <Plus className="mr-2 h-4 w-4" />
              新規事業部門
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingBusiness ? "事業部門を編集" : "新規事業部門を作成"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nameJa">事業部門名（日本語） *</Label>
                <Input
                  id="nameJa"
                  value={formData.nameJa}
                  onChange={(e) => setFormData({ ...formData, nameJa: e.target.value })}
                  placeholder="例: 不動産事業部"
                  required
                  data-testid="input-name-ja"
                />
              </div>

              <div>
                <Label htmlFor="name">事業部門名（英語） *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例: Real Estate Division"
                  required
                  data-testid="input-name"
                />
              </div>

              <div>
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="事業部門の概要を入力"
                  rows={3}
                  data-testid="textarea-description"
                />
              </div>

              <div>
                <Label htmlFor="status">ステータス</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">稼働中</SelectItem>
                    <SelectItem value="inactive">休止中</SelectItem>
                    <SelectItem value="planning">計画中</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                  {editingBusiness ? "更新" : "作成"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(!businesses || businesses.length === 0) ? (
          <div className="col-span-full text-center py-16">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">まだ事業部門が登録されていません</p>
          </div>
        ) : (
          businesses.map((business: any) => (
            <div key={business.id} className="relative group">
              <Link href={`/business/${business.id}`}>
                <Card
                  className="hover-elevate cursor-pointer transition-all"
                  data-testid={`business-card-${business.id}`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
                    <CardTitle className="text-base font-semibold">
                      {business.nameJa}
                    </CardTitle>
                    <Badge
                      variant={business.status === "active" ? "default" : "secondary"}
                      className={cn(
                        business.status === "active" && "bg-green-500/20 text-green-300 border-green-500/30",
                        business.status === "inactive" && "bg-gray-500/20 text-gray-300 border-gray-500/30"
                      )}
                    >
                      {business.status === "active" && "稼働中"}
                      {business.status === "inactive" && "休止中"}
                      {business.status === "planning" && "計画中"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {business.description || "説明なし"}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          <span className="text-xs">売上</span>
                        </div>
                        <p className="text-sm font-semibold font-mono">
                          ¥{(parseFloat(business.revenue || 0) / 1000000).toFixed(1)}M
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <TrendingUp className="h-3 w-3" />
                          <span className="text-xs">利益</span>
                        </div>
                        <p className={cn(
                          "text-sm font-semibold font-mono",
                          parseFloat(business.profit || 0) > 0 ? "text-green-500" : "text-red-500"
                        )}>
                          ¥{(parseFloat(business.profit || 0) / 1000000).toFixed(1)}M
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleEdit(business, e)}
                  className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                  data-testid={`button-edit-business-${business.id}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleDelete(business.id, e)}
                  className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                  data-testid={`button-delete-business-${business.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
