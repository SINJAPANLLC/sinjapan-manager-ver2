import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Globe, Mail, Phone, User, Calendar, DollarSign, Users, FileText } from "lucide-react";
import { insertCompanySettingsSchema, type InsertCompanySettings, type CompanySettings } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function CompanyProfile() {
  const { toast } = useToast();

  // 会社設定取得
  const { data: settings, isLoading } = useQuery<CompanySettings | null>({
    queryKey: ["/api/settings/company"],
  });

  // フォーム設定
  const form = useForm<InsertCompanySettings>({
    resolver: zodResolver(insertCompanySettingsSchema),
    defaultValues: {
      companyName: "",
      companyNameEn: "",
      companyNameKana: "",
      legalName: "",
      registrationNumber: "",
      fiscalYearEnd: "",
      postalCode: "",
      address: "",
      addressEn: "",
      phoneNumber: "",
      faxNumber: "",
      email: "",
      website: "",
      ceoName: "",
      ceoNameEn: "",
      capital: "0",
      employees: 0,
      businessDescription: "",
      businessDescriptionEn: "",
      logoUrl: "",
      primaryColor: "#00A676",
    },
  });

  // 会社設定が取得されたらフォームをリセット
  useEffect(() => {
    if (settings && !form.formState.isDirty) {
      form.reset(settings);
    }
  }, [settings, form]);

  // 保存処理
  const saveMutation = useMutation({
    mutationFn: async (data: InsertCompanySettings) => {
      if (settings?.id) {
        return await apiRequest(`/api/settings/company/${settings.id}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
      } else {
        return await apiRequest("/api/settings/company", {
          method: "POST",
          body: JSON.stringify(data),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/company"] });
      toast({
        title: "保存しました",
        description: "会社情報を更新しました",
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

  const onSubmit = (data: InsertCompanySettings) => {
    saveMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="container max-w-screen-2xl mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="container max-w-screen-2xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">会社概要</h1>
        <p className="text-muted-foreground">
          会社の基本情報を管理します
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 基本情報 */}
          <Card data-testid="card-basic-info">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>基本情報</CardTitle>
              </div>
              <CardDescription>会社の基本的な情報を入力してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>会社名 *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="SIN JAPAN LLC" data-testid="input-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyNameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>会社名（英語）</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="SIN JAPAN LLC" data-testid="input-company-name-en" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyNameKana"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>会社名（カナ）</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="シン ジャパン" data-testid="input-company-name-kana" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="legalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>正式名称</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="合同会社SIN JAPAN" data-testid="input-legal-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>法人番号</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="1234567890123" data-testid="input-registration-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fiscalYearEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>決算月</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="03-31" data-testid="input-fiscal-year-end" />
                      </FormControl>
                      <FormDescription>MM-DD形式で入力（例：03-31）</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* 連絡先情報 */}
          <Card data-testid="card-contact-info">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <CardTitle>連絡先情報</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>郵便番号</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="123-4567" data-testid="input-postal-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>電話番号</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="03-1234-5678" data-testid="input-phone-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>住所</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} placeholder="東京都..." data-testid="input-address" rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="addressEn"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>住所（英語）</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} placeholder="Tokyo, Japan..." data-testid="input-address-en" rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="faxNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FAX番号</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="03-1234-5679" data-testid="input-fax-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>メールアドレス</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} type="email" placeholder="info@sinjapan.com" data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>ウェブサイト</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} type="url" placeholder="https://sinjapan.com" data-testid="input-website" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* 代表者・企業情報 */}
          <Card data-testid="card-executive-info">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>代表者・企業情報</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ceoName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>代表者名</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="山田 太郎" data-testid="input-ceo-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ceoNameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>代表者名（英語）</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="Taro Yamada" data-testid="input-ceo-name-en" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capital"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>資本金</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} type="number" placeholder="10000000" data-testid="input-capital" />
                      </FormControl>
                      <FormDescription>円</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>従業員数</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || 0} type="number" placeholder="50" data-testid="input-employees" onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                      </FormControl>
                      <FormDescription>人</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessDescription"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>事業内容</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} placeholder="AI開発、システム開発、コンサルティング..." data-testid="input-business-description" rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessDescriptionEn"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>事業内容（英語）</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} placeholder="AI Development, System Development, Consulting..." data-testid="input-business-description-en" rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* ブランディング */}
          <Card data-testid="card-branding">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <CardTitle>ブランディング</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ロゴURL</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} type="url" placeholder="https://..." data-testid="input-logo-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>プライマリーカラー</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input {...field} value={field.value || ""} placeholder="#00A676" data-testid="input-primary-color" />
                          <input
                            type="color"
                            value={field.value || "#00A676"}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="h-10 w-20 rounded-md border cursor-pointer"
                            data-testid="input-primary-color-picker"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={saveMutation.isPending}
              data-testid="button-reset"
            >
              リセット
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              data-testid="button-save"
            >
              {saveMutation.isPending ? "保存中..." : "保存"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
