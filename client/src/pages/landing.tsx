import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Shield, Users, Building2, UserCircle } from "lucide-react";

type UserRole = "CEO" | "Manager" | "Staff" | "Agency" | "Client";

interface RoleCardData {
  title: string;
  description: string;
  icon: typeof Shield;
  role: UserRole;
  testId: string;
}

const roleCards: RoleCardData[] = [
  {
    title: "管理者",
    description: "CEO・マネージャー向け",
    icon: Shield,
    role: "CEO",
    testId: "card-role-admin",
  },
  {
    title: "スタッフ",
    description: "社員向けログイン",
    icon: Users,
    role: "Staff",
    testId: "card-role-staff",
  },
  {
    title: "代理店",
    description: "パートナー企業向け",
    icon: Building2,
    role: "Agency",
    testId: "card-role-agency",
  },
  {
    title: "クライアント",
    description: "お客様向けログイン",
    icon: UserCircle,
    role: "Client",
    testId: "card-role-client",
  },
];

export default function Landing() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ログインに失敗しました");
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "ログインエラー",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setEmail("");
    setPassword("");
  };

  const handleBack = () => {
    setSelectedRole(null);
    setEmail("");
    setPassword("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-blue animate-gradient opacity-10 pointer-events-none"></div>
      
      <header className="border-b border-border px-8 py-4 relative z-10 glass-effect">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold gradient-text">SIN JAPAN MANAGER</h1>
            <p className="text-xs text-muted-foreground">AI駆動型社内管理システム</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-8 py-16 relative z-10">
        {!selectedRole ? (
          <div className="max-w-4xl mx-auto w-full space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">ログイン</h2>
              <p className="text-muted-foreground">ご利用の種別を選択してください</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {roleCards.map((roleCard) => {
                const Icon = roleCard.icon;
                return (
                  <Card
                    key={roleCard.role}
                    className="glass-effect border-2 cursor-pointer hover-elevate active-elevate-2 transition-all"
                    onClick={() => handleRoleSelect(roleCard.role)}
                    data-testid={roleCard.testId}
                  >
                    <CardHeader className="text-center space-y-4 pb-6">
                      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{roleCard.title}</CardTitle>
                        <CardDescription className="text-base mt-2">
                          {roleCard.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto w-full space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">
                {roleCards.find((r) => r.role === selectedRole)?.title}ログイン
              </h2>
              <p className="text-sm text-muted-foreground">
                {roleCards.find((r) => r.role === selectedRole)?.description}
              </p>
            </div>

            <Card className="glass-effect border-2">
              <CardContent className="pt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">メールアドレス</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      data-testid="input-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">パスワード</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      data-testid="input-password"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={handleBack}
                      data-testid="button-back"
                    >
                      戻る
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isLoading}
                      data-testid="button-login"
                    >
                      {isLoading ? "ログイン中..." : "ログイン"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <p className="text-sm text-center text-muted-foreground">
              アカウントをお持ちでない場合は、管理者にお問い合わせください
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-border px-8 py-6">
        <div className="max-w-screen-2xl mx-auto text-center text-sm text-muted-foreground">
          © 2025 SIN JAPAN LLC. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
