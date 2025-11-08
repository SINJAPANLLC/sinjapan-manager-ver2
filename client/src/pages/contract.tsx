import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, FileText, Search, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

type Contract = {
  id: string;
  businessId: string;
  title: string;
  clientName: string | null;
  amount: string;
  startDate: string | null;
  endDate: string | null;
  status: "active" | "expired" | "renewed" | "cancelled";
  autoRenewal: boolean;
  notes: string | null;
  createdAt: string;
};

type Business = {
  id: string;
  name: string;
  nameJa: string;
};

export default function Contract() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    businessId: "",
    title: "",
    clientName: "",
    amount: "",
    startDate: "",
    endDate: "",
    status: "active",
    autoRenewal: false,
    notes: "",
  });

  const { data: contracts, isLoading: contractsLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  const { data: businesses, isLoading: businessesLoading } = useQuery<Business[]>({
    queryKey: ["/api/businesses"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/contracts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      setOpen(false);
      resetForm();
      toast({
        title: "契約を作成しました",
        description: "新しい契約が正常に追加されました。",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/contracts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      setOpen(false);
      setEditingContract(null);
      resetForm();
      toast({
        title: "契約を更新しました",
        description: "契約情報が正常に更新されました。",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/contracts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "契約を削除しました",
        description: "契約が正常に削除されました。",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      amount: formData.amount,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
    };

    if (editingContract) {
      updateMutation.mutate({ id: editingContract.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      businessId: contract.businessId,
      title: contract.title,
      clientName: contract.clientName || "",
      amount: contract.amount,
      startDate: contract.startDate ? format(new Date(contract.startDate), "yyyy-MM-dd") : "",
      endDate: contract.endDate ? format(new Date(contract.endDate), "yyyy-MM-dd") : "",
      status: contract.status,
      autoRenewal: contract.autoRenewal,
      notes: contract.notes || "",
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("この契約を削除してもよろしいですか？")) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      businessId: "",
      title: "",
      clientName: "",
      amount: "",
      startDate: "",
      endDate: "",
      status: "active",
      autoRenewal: false,
      notes: "",
    });
    setEditingContract(null);
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      resetForm();
    }
  };

  if (contractsLoading || businessesLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const filteredContracts = contracts?.filter((contract) => {
    const matchesSearch =
      contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "有効", variant: "default" as const },
      expired: { label: "期限切れ", variant: "secondary" as const },
      renewed: { label: "更新済", variant: "default" as const },
      cancelled: { label: "キャンセル", variant: "destructive" as const },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getBusinessName = (businessId: string) => {
    const business = businesses?.find((b) => b.id === businessId);
    return business?.nameJa || business?.name || businessId;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">契約管理</h1>
          <p className="text-muted-foreground mt-1">全ての契約情報を管理</p>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-contract">
              <Plus className="mr-2 h-4 w-4" />
              新規契約
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingContract ? "契約を編集" : "新規契約を作成"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="businessId">事業部門 *</Label>
                <Select
                  value={formData.businessId}
                  onValueChange={(value) => setFormData({ ...formData, businessId: value })}
                  required
                >
                  <SelectTrigger data-testid="select-business">
                    <SelectValue placeholder="事業部門を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses?.map((business) => (
                      <SelectItem key={business.id} value={business.id}>
                        {business.nameJa}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">契約名 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="例: 年間保守契約"
                  required
                  data-testid="input-title"
                />
              </div>

              <div>
                <Label htmlFor="clientName">クライアント名</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="例: 株式会社サンプル"
                  data-testid="input-client-name"
                />
              </div>

              <div>
                <Label htmlFor="amount">契約金額 *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="1000000"
                  required
                  data-testid="input-amount"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">開始日</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    data-testid="input-start-date"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">終了日</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    data-testid="input-end-date"
                  />
                </div>
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
                    <SelectItem value="active">有効</SelectItem>
                    <SelectItem value="expired">期限切れ</SelectItem>
                    <SelectItem value="renewed">更新済</SelectItem>
                    <SelectItem value="cancelled">キャンセル</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoRenewal"
                  checked={formData.autoRenewal}
                  onChange={(e) => setFormData({ ...formData, autoRenewal: e.target.checked })}
                  className="h-4 w-4"
                  data-testid="checkbox-auto-renewal"
                />
                <Label htmlFor="autoRenewal" className="cursor-pointer">自動更新</Label>
              </div>

              <div>
                <Label htmlFor="notes">備考</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="契約に関する追加情報を入力"
                  rows={3}
                  data-testid="textarea-notes"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                  {editingContract ? "更新" : "作成"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              契約一覧
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="契約名・クライアント名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全てのステータス</SelectItem>
                  <SelectItem value="active">有効</SelectItem>
                  <SelectItem value="expired">期限切れ</SelectItem>
                  <SelectItem value="renewed">更新済</SelectItem>
                  <SelectItem value="cancelled">キャンセル</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredContracts.length === 0 ? (
            <div className="text-center py-12" data-testid="empty-state">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">契約がありません</p>
              <p className="text-sm text-muted-foreground mt-1">新規契約ボタンから契約を作成してください</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>契約名</TableHead>
                    <TableHead>クライアント</TableHead>
                    <TableHead>事業部門</TableHead>
                    <TableHead>金額</TableHead>
                    <TableHead>期間</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>自動更新</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract) => (
                    <TableRow key={contract.id} data-testid={`contract-row-${contract.id}`}>
                      <TableCell className="font-medium">{contract.title}</TableCell>
                      <TableCell>{contract.clientName || "-"}</TableCell>
                      <TableCell className="text-sm">{getBusinessName(contract.businessId)}</TableCell>
                      <TableCell>¥{parseFloat(contract.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-sm">
                        {contract.startDate && contract.endDate ? (
                          <>
                            {format(new Date(contract.startDate), "yyyy/MM/dd")}
                            <br />〜 {format(new Date(contract.endDate), "yyyy/MM/dd")}
                          </>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(contract.status)}</TableCell>
                      <TableCell>
                        {contract.autoRenewal ? (
                          <Badge variant="secondary">有効</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(contract)}
                            data-testid={`button-edit-${contract.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(contract.id)}
                            data-testid={`button-delete-${contract.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
