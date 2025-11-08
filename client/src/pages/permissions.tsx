import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Lock, Eye, Edit, Plus, Trash2, Save } from "lucide-react";
import { type RolePermission } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type PermissionUpdate = {
  id: string;
  canCreate?: boolean;
  canRead?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
};

export default function Permissions() {
  const { toast } = useToast();
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, PermissionUpdate>>(new Map());

  // 全権限取得
  const { data: permissions = [], isLoading } = useQuery<RolePermission[]>({
    queryKey: ["/api/role-permissions"],
  });

  // 権限更新
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RolePermission> }) => {
      return await apiRequest(`/api/role-permissions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/role-permissions"] });
      setPendingUpdates(new Map());
      toast({
        title: "保存しました",
        description: "権限設定を更新しました",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "エラー",
        description: error.message || "保存に失敗しました",
      });
    },
  });

  // ロールごとにグループ化
  const roles = ["CEO", "Manager", "Staff", "AI", "Agency", "Client"];
  const permissionsByRole = roles.reduce((acc, role) => {
    acc[role] = permissions.filter(p => p.role === role);
    return acc;
  }, {} as Record<string, RolePermission[]>);

  // 権限変更をpending更新に追加
  const handlePermissionChange = (
    id: string,
    field: "canCreate" | "canRead" | "canUpdate" | "canDelete",
    value: boolean
  ) => {
    const existing = pendingUpdates.get(id) || { id };
    existing[field] = value;
    const newUpdates = new Map(pendingUpdates);
    newUpdates.set(id, existing);
    setPendingUpdates(newUpdates);
  };

  // 全変更を保存
  const saveAllChanges = async () => {
    const updates = Array.from(pendingUpdates.values());
    for (const update of updates) {
      const { id, ...data } = update;
      await updateMutation.mutateAsync({ id, data });
    }
  };

  // リソース名を日本語に変換
  const getResourceName = (resource: string) => {
    const names: Record<string, string> = {
      users: "ユーザー管理",
      businesses: "事業部門管理",
      tasks: "タスク管理",
      finance: "財務管理",
      marketing: "マーケティング",
      workflows: "ワークフロー",
      ai: "AI機能",
      settings: "システム設定",
      permissions: "権限管理",
      recruitment: "求人・採用",
      employees: "従業員ポータル",
      crm: "CRM",
    };
    return names[resource] || resource;
  };

  const renderPermissionRow = (permission: RolePermission) => {
    const pending = pendingUpdates.get(permission.id);
    const canCreate = pending?.canCreate !== undefined ? pending.canCreate : permission.canCreate;
    const canRead = pending?.canRead !== undefined ? pending.canRead : permission.canRead;
    const canUpdate = pending?.canUpdate !== undefined ? pending.canUpdate : permission.canUpdate;
    const canDelete = pending?.canDelete !== undefined ? pending.canDelete : permission.canDelete;
    const hasChanges = pendingUpdates.has(permission.id);

    return (
      <TableRow key={permission.id} className={hasChanges ? "bg-blue-50 dark:bg-blue-950/20" : ""} data-testid={`row-permission-${permission.id}`}>
        <TableCell className="font-medium" data-testid={`text-resource-${permission.resource}`}>
          {getResourceName(permission.resource)}
          {hasChanges && <Badge variant="secondary" className="ml-2">変更あり</Badge>}
        </TableCell>
        <TableCell className="text-center" data-testid={`switch-create-${permission.id}`}>
          <Switch
            checked={canCreate}
            onCheckedChange={(value) => handlePermissionChange(permission.id, "canCreate", value)}
          />
        </TableCell>
        <TableCell className="text-center" data-testid={`switch-read-${permission.id}`}>
          <Switch
            checked={canRead}
            onCheckedChange={(value) => handlePermissionChange(permission.id, "canRead", value)}
          />
        </TableCell>
        <TableCell className="text-center" data-testid={`switch-update-${permission.id}`}>
          <Switch
            checked={canUpdate}
            onCheckedChange={(value) => handlePermissionChange(permission.id, "canUpdate", value)}
          />
        </TableCell>
        <TableCell className="text-center" data-testid={`switch-delete-${permission.id}`}>
          <Switch
            checked={canDelete}
            onCheckedChange={(value) => handlePermissionChange(permission.id, "canDelete", value)}
          />
        </TableCell>
      </TableRow>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="heading-permissions">
            <Shield className="w-8 h-8 text-primary" />
            ロール別権限管理
          </h1>
          <p className="text-muted-foreground mt-1">
            各ロールのリソースへのアクセス権限を管理します
          </p>
        </div>
        {pendingUpdates.size > 0 && (
          <Button
            onClick={saveAllChanges}
            disabled={updateMutation.isPending}
            size="lg"
            data-testid="button-save-changes"
          >
            <Save className="w-4 h-4 mr-2" />
            変更を保存 ({pendingUpdates.size})
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">総ロール数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">総権限数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">未保存の変更</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {pendingUpdates.size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">リソース種類</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
      </div>

      {/* Permissions by Role */}
      <Card>
        <CardHeader>
          <CardTitle>権限マトリックス</CardTitle>
          <CardDescription>
            各ロールのリソースへのCRUD権限を設定できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="CEO">
            <TabsList className="grid w-full grid-cols-5" data-testid="tabs-roles">
              {roles.map((role) => (
                <TabsTrigger key={role} value={role} data-testid={`tab-${role}`}>
                  {role}
                </TabsTrigger>
              ))}
            </TabsList>

            {roles.map((role) => (
              <TabsContent key={role} value={role} className="mt-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">リソース</TableHead>
                        <TableHead className="text-center w-[100px]">
                          <div className="flex flex-col items-center gap-1">
                            <Plus className="w-4 h-4" />
                            <span className="text-xs">作成</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-center w-[100px]">
                          <div className="flex flex-col items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span className="text-xs">閲覧</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-center w-[100px]">
                          <div className="flex flex-col items-center gap-1">
                            <Edit className="w-4 h-4" />
                            <span className="text-xs">更新</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-center w-[100px]">
                          <div className="flex flex-col items-center gap-1">
                            <Trash2 className="w-4 h-4" />
                            <span className="text-xs">削除</span>
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permissionsByRole[role]?.map(renderPermissionRow)}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">権限の説明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-green-600" />
              <span><strong>作成</strong>: 新規データの作成権限</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <span><strong>閲覧</strong>: データの閲覧権限</span>
            </div>
            <div className="flex items-center gap-2">
              <Edit className="w-4 h-4 text-orange-600" />
              <span><strong>更新</strong>: 既存データの更新権限</span>
            </div>
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-600" />
              <span><strong>削除</strong>: データの削除権限</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
