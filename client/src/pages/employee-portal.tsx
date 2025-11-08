import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  insertEmployeeProfileSchema,
  insertEmployeeBankAccountSchema,
  type EmployeeProfile,
  type EmployeeBankAccount,
  type Notification as NotificationType,
} from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  Building2,
  Wallet,
  Bell,
  Edit,
  Plus,
  Check,
  Calendar,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Trash2,
} from "lucide-react";

export default function EmployeePortal() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Queries
  const { data: profile, isLoading: profileLoading } = useQuery<EmployeeProfile>({
    queryKey: ["/api/employee/profile"],
  });

  const { data: bankAccounts = [], isLoading: accountsLoading } = useQuery<EmployeeBankAccount[]>({
    queryKey: ["/api/employee/bank-accounts"],
  });

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<NotificationType[]>({
    queryKey: ["/api/notifications"],
  });

  const { data: unreadNotifications = [] } = useQuery<NotificationType[]>({
    queryKey: ["/api/notifications/unread"],
  });

  const unreadCount = unreadNotifications.length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-screen-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <User className="h-8 w-8 text-primary" />
              従業員ポータル
            </h1>
            <p className="text-muted-foreground mt-1">プロフィール・口座・通知の管理</p>
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-lg px-4 py-2">
              {unreadCount}件の未読通知
            </Badge>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">
              ダッシュボード
            </TabsTrigger>
            <TabsTrigger value="profile" data-testid="tab-profile">
              プロフィール
            </TabsTrigger>
            <TabsTrigger value="bank" data-testid="tab-bank">
              口座情報
            </TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications">
              通知
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <DashboardTab
              profile={profile}
              bankAccounts={bankAccounts}
              unreadCount={unreadCount}
            />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <ProfileTab profile={profile} profileLoading={profileLoading} />
          </TabsContent>

          <TabsContent value="bank" className="space-y-4">
            <BankAccountsTab accounts={bankAccounts} accountsLoading={accountsLoading} />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <NotificationsTab notifications={notifications} notificationsLoading={notificationsLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Dashboard Tab
function DashboardTab({ profile, bankAccounts, unreadCount }: any) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card data-testid="card-profile-summary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            プロフィール
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile ? (
            <div className="space-y-2 text-sm">
              <p><strong>社員番号:</strong> {profile.employeeNumber || "未設定"}</p>
              <p><strong>役職:</strong> {profile.position || "未設定"}</p>
              <p><strong>部署:</strong> {profile.department || "未設定"}</p>
              <p><strong>雇用形態:</strong> {getEmploymentTypeLabel(profile.employmentType)}</p>
              {profile.hireDate && (
                <p><strong>入社日:</strong> {new Date(profile.hireDate).toLocaleDateString("ja-JP")}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">プロフィールが未登録です</p>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-bank-summary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            口座情報
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bankAccounts.length > 0 ? (
            <p className="text-sm">
              登録済み口座数: <strong>{bankAccounts.length}</strong>件
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">口座情報が未登録です</p>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-notifications-summary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unreadCount > 0 ? (
            <p className="text-sm">
              未読通知: <strong className="text-destructive">{unreadCount}</strong>件
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">未読通知はありません</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Profile Tab
function ProfileTab({ profile, profileLoading }: any) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertEmployeeProfileSchema.partial().extend({
      phoneNumber: z.string().optional(),
      address: z.string().optional(),
      emergencyContactName: z.string().optional(),
      emergencyContactPhone: z.string().optional(),
      employeeNumber: z.string().optional(),
      position: z.string().optional(),
      department: z.string().optional(),
    })),
    defaultValues: {
      phoneNumber: "",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      employeeNumber: "",
      position: "",
      department: "",
      employmentType: "full-time",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        phoneNumber: profile.phoneNumber || "",
        address: profile.address || "",
        emergencyContactName: profile.emergencyContactName || "",
        emergencyContactPhone: profile.emergencyContactPhone || "",
        employeeNumber: profile.employeeNumber || "",
        position: profile.position || "",
        department: profile.department || "",
        employmentType: profile.employmentType || "full-time",
      });
    }
  }, [profile]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/employee/profile", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile"] });
      toast({ title: "プロフィールを作成しました" });
      setIsCreating(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "プロフィールの作成に失敗しました", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/employee/profile/${profile.id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile"] });
      toast({ title: "プロフィールを更新しました" });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: "プロフィールの更新に失敗しました", variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => {
    if (profile) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (profileLoading) {
    return <Card><CardContent className="p-6">読み込み中...</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>プロフィール情報</CardTitle>
              <CardDescription>個人情報と雇用情報</CardDescription>
            </div>
            {profile && !isEditing && (
              <Button onClick={() => setIsEditing(true)} data-testid="button-edit-profile">
                <Edit className="h-4 w-4 mr-2" />
                編集
              </Button>
            )}
            {!profile && !isCreating && (
              <Button onClick={() => setIsCreating(true)} data-testid="button-create-profile">
                <Plus className="h-4 w-4 mr-2" />
                登録
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {(isEditing || isCreating || !profile) ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="employeeNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>社員番号</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="EMP001" data-testid="input-employee-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>役職</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="エンジニア" data-testid="input-position" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>部署</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="開発部" data-testid="input-department" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="employmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>雇用形態</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-employment-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="full-time">正社員</SelectItem>
                            <SelectItem value="part-time">パート</SelectItem>
                            <SelectItem value="contract">契約社員</SelectItem>
                            <SelectItem value="intern">インターン</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>電話番号</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="090-1234-5678" data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>住所</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="東京都渋谷区..." data-testid="textarea-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emergencyContactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>緊急連絡先（氏名）</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="山田太郎" data-testid="input-emergency-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emergencyContactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>緊急連絡先（電話）</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="090-1234-5678" data-testid="input-emergency-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                    {createMutation.isPending || updateMutation.isPending ? "保存中..." : "保存"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setIsCreating(false);
                      form.reset();
                    }}
                    data-testid="button-cancel"
                  >
                    キャンセル
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">社員番号</p>
                  <p className="text-sm" data-testid="text-employee-number">{profile.employeeNumber || "未設定"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">役職</p>
                  <p className="text-sm" data-testid="text-position">{profile.position || "未設定"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">部署</p>
                  <p className="text-sm" data-testid="text-department">{profile.department || "未設定"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">雇用形態</p>
                  <p className="text-sm" data-testid="text-employment-type">{getEmploymentTypeLabel(profile.employmentType)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">電話番号</p>
                <p className="text-sm" data-testid="text-phone">{profile.phoneNumber || "未設定"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">住所</p>
                <p className="text-sm" data-testid="text-address">{profile.address || "未設定"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">緊急連絡先（氏名）</p>
                  <p className="text-sm" data-testid="text-emergency-name">{profile.emergencyContactName || "未設定"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">緊急連絡先（電話）</p>
                  <p className="text-sm" data-testid="text-emergency-phone">{profile.emergencyContactPhone || "未設定"}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Bank Accounts Tab
function BankAccountsTab({ accounts, accountsLoading }: any) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<EmployeeBankAccount | null>(null);

  const form = useForm({
    resolver: zodResolver(insertEmployeeBankAccountSchema.extend({
      bankName: z.string().min(1, "銀行名を入力してください"),
      accountNumber: z.string().min(1, "口座番号を入力してください"),
      accountHolderName: z.string().min(1, "口座名義を入力してください"),
    })),
    defaultValues: {
      bankName: "",
      branchName: "",
      branchCode: "",
      accountType: "ordinary",
      accountNumber: "",
      accountHolderName: "",
      isPrimary: true,
      notes: "",
    },
  });

  useEffect(() => {
    if (editingAccount) {
      form.reset({
        bankName: editingAccount.bankName,
        branchName: editingAccount.branchName || "",
        branchCode: editingAccount.branchCode || "",
        accountType: editingAccount.accountType || "ordinary",
        accountNumber: editingAccount.accountNumber,
        accountHolderName: editingAccount.accountHolderName,
        isPrimary: editingAccount.isPrimary,
        notes: editingAccount.notes || "",
      });
    }
  }, [editingAccount]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/employee/bank-accounts", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/bank-accounts"] });
      toast({ title: "口座情報を登録しました" });
      setIsDialogOpen(false);
      setEditingAccount(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "口座情報の登録に失敗しました", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => apiRequest(`/api/employee/bank-accounts/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/bank-accounts"] });
      toast({ title: "口座情報を更新しました" });
      setIsDialogOpen(false);
      setEditingAccount(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "口座情報の更新に失敗しました", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/employee/bank-accounts/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/bank-accounts"] });
      toast({ title: "口座情報を削除しました" });
    },
    onError: () => {
      toast({ title: "口座情報の削除に失敗しました", variant: "destructive" });
    },
  });

  const handleCreate = () => {
    setEditingAccount(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const handleEdit = (account: EmployeeBankAccount) => {
    setEditingAccount(account);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("この口座情報を削除してもよろしいですか？")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: any) => {
    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (accountsLoading) {
    return <Card><CardContent className="p-6">読み込み中...</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleCreate} data-testid="button-add-bank-account">
          <Plus className="h-4 w-4 mr-2" />
          口座追加
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            口座情報が登録されていません
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {accounts.map((account: EmployeeBankAccount) => (
            <Card key={account.id} data-testid={`card-bank-account-${account.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {account.bankName}
                    {account.isPrimary && <Badge variant="default">メイン</Badge>}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(account)}
                      data-testid={`button-edit-bank-${account.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(account.id)}
                      data-testid={`button-delete-bank-${account.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">支店名</p>
                  <p className="text-sm">{account.branchName || "未設定"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">口座種別</p>
                  <p className="text-sm">{getAccountTypeLabel(account.accountType)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">口座番号</p>
                  <p className="text-sm font-mono">****{account.accountNumber.slice(-4)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">口座名義</p>
                  <p className="text-sm">{account.accountHolderName}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "口座情報を編集" : "口座情報を登録"}</DialogTitle>
            <DialogDescription>給与振込先の口座情報を登録してください</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>銀行名 *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="三菱UFJ銀行" data-testid="input-bank-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="branchName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>支店名</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="渋谷支店" data-testid="input-branch-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="branchCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>支店コード</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="001" data-testid="input-branch-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>口座種別</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-account-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ordinary">普通</SelectItem>
                          <SelectItem value="current">当座</SelectItem>
                          <SelectItem value="savings">貯蓄</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>口座番号 *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="1234567" data-testid="input-account-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="accountHolderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>口座名義 *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ヤマダ タロウ" data-testid="input-account-holder" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>備考</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="その他メモ" data-testid="textarea-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                  {createMutation.isPending || updateMutation.isPending ? "保存中..." : "保存"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingAccount(null);
                    form.reset();
                  }}
                  data-testid="button-cancel"
                >
                  キャンセル
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Notifications Tab
function NotificationsTab({ notifications, notificationsLoading }: any) {
  const { toast } = useToast();

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/notifications/${id}/read`, "PATCH"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/notifications/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
      toast({ title: "通知を削除しました" });
    },
  });

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    if (confirm("この通知を削除してもよろしいですか？")) {
      deleteMutation.mutate(id);
    }
  };

  if (notificationsLoading) {
    return <Card><CardContent className="p-6">読み込み中...</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            通知はありません
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {notifications.map((notification: NotificationType) => (
              <Card key={notification.id} className={!notification.isRead ? "border-primary" : ""} data-testid={`card-notification-${notification.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{notification.title}</CardTitle>
                        {!notification.isRead && <Badge variant="destructive">未読</Badge>}
                        {notification.priority === "urgent" && <Badge variant="destructive">緊急</Badge>}
                        {notification.priority === "high" && <Badge variant="default">重要</Badge>}
                      </div>
                      <CardDescription className="mt-1">
                        {new Date(notification.createdAt).toLocaleString("ja-JP")}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMarkAsRead(notification.id)}
                          data-testid={`button-mark-read-${notification.id}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(notification.id)}
                        data-testid={`button-delete-notification-${notification.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{notification.message}</p>
                  {notification.linkUrl && (
                    <a
                      href={notification.linkUrl}
                      className="text-sm text-primary hover:underline mt-2 inline-block"
                      data-testid={`link-notification-${notification.id}`}
                    >
                      {notification.linkText || "詳細を見る"} →
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

// Helper functions
function getEmploymentTypeLabel(type: string | undefined) {
  const labels: Record<string, string> = {
    "full-time": "正社員",
    "part-time": "パート",
    "contract": "契約社員",
    "intern": "インターン",
  };
  return labels[type || ""] || "未設定";
}

function getAccountTypeLabel(type: string | undefined) {
  const labels: Record<string, string> = {
    "ordinary": "普通",
    "current": "当座",
    "savings": "貯蓄",
  };
  return labels[type || ""] || "未設定";
}
