import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FileText, Plus, Download, Sparkles, Copy, Trash2, Clock } from "lucide-react";
import { format } from "date-fns";

type DocumentTemplate = {
  id: string;
  name: string;
  description: string;
  icon: typeof FileText;
};

type GeneratedDocument = {
  id: string;
  template: string;
  title: string;
  content: string;
  createdAt: string;
};

const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "business-proposal",
    name: "事業提案書",
    description: "新規事業やプロジェクトの提案書を生成",
    icon: FileText,
  },
  {
    id: "meeting-minutes",
    name: "議事録",
    description: "会議の議事録を整理して生成",
    icon: FileText,
  },
  {
    id: "contract-draft",
    name: "契約書草案",
    description: "基本的な契約書の草案を生成",
    icon: FileText,
  },
  {
    id: "financial-report",
    name: "財務レポート",
    description: "財務状況のサマリーレポートを生成",
    icon: FileText,
  },
  {
    id: "project-plan",
    name: "プロジェクト計画書",
    description: "プロジェクトの計画書を生成",
    icon: FileText,
  },
  {
    id: "email-template",
    name: "メール文",
    description: "ビジネスメールの文章を生成",
    icon: FileText,
  },
];

export default function Document() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    context: "",
    additionalInfo: "",
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { template: string; title: string; context: string; additionalInfo: string }) => {
      const response = await apiRequest("POST", "/api/ai/generate-document", data) as unknown;
      return response as { content: string };
    },
    onSuccess: (data) => {
      const newDocument: GeneratedDocument = {
        id: Date.now().toString(),
        template: selectedTemplate,
        title: formData.title,
        content: data.content || "文書が生成されました。",
        createdAt: new Date().toISOString(),
      };
      setGeneratedDocuments([newDocument, ...generatedDocuments]);
      setOpen(false);
      resetForm();
      toast({
        title: "文書を生成しました",
        description: "AI が文書を生成しました。",
      });
    },
    onError: () => {
      toast({
        title: "エラーが発生しました",
        description: "文書の生成に失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate({
      template: selectedTemplate,
      title: formData.title,
      context: formData.context,
      additionalInfo: formData.additionalInfo,
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      context: "",
      additionalInfo: "",
    });
    setSelectedTemplate("");
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleCopyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "コピーしました",
      description: "文書をクリップボードにコピーしました。",
    });
  };

  const handleDownload = (document: GeneratedDocument) => {
    const blob = new Blob([document.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${document.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = (id: string) => {
    setGeneratedDocuments(generatedDocuments.filter((doc) => doc.id !== id));
    toast({
      title: "文書を削除しました",
      description: "文書が削除されました。",
    });
  };

  const getTemplateName = (templateId: string) => {
    return DOCUMENT_TEMPLATES.find((t) => t.id === templateId)?.name || templateId;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">文書生成</h1>
          <p className="text-muted-foreground mt-1">AI を使って各種文書を自動生成</p>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button data-testid="button-generate-document">
              <Sparkles className="mr-2 h-4 w-4" />
              新規生成
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>AI 文書生成</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="template">テンプレート *</Label>
                <Select
                  value={selectedTemplate}
                  onValueChange={(value) => setSelectedTemplate(value)}
                  required
                >
                  <SelectTrigger data-testid="select-template">
                    <SelectValue placeholder="テンプレートを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TEMPLATES.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplate && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {DOCUMENT_TEMPLATES.find((t) => t.id === selectedTemplate)?.description}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="title">文書タイトル *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="例: 2025年度 新規プロジェクト提案書"
                  required
                  data-testid="input-title"
                />
              </div>

              <div>
                <Label htmlFor="context">生成に必要な情報 *</Label>
                <Textarea
                  id="context"
                  value={formData.context}
                  onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                  placeholder="文書生成に必要な情報を入力してください（プロジェクト概要、目的、背景など）"
                  rows={5}
                  required
                  data-testid="textarea-context"
                />
              </div>

              <div>
                <Label htmlFor="additionalInfo">追加情報（任意）</Label>
                <Textarea
                  id="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                  placeholder="特記事項、トーン、スタイルなど"
                  rows={3}
                  data-testid="textarea-additional-info"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={generateMutation.isPending} data-testid="button-submit">
                  {generateMutation.isPending ? "生成中..." : "生成"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DOCUMENT_TEMPLATES.map((template) => (
          <Card
            key={template.id}
            className="hover-elevate hover:shadow-lg transition-all duration-300 cursor-pointer group"
            onClick={() => {
              setSelectedTemplate(template.id);
              setOpen(true);
            }}
            data-testid={`template-card-${template.id}`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-lg bg-gradient-blue animate-gradient flex items-center justify-center">
                  <template.icon className="h-6 w-6 text-white" />
                </div>
                <Badge variant="secondary">テンプレート</Badge>
              </div>
              <CardTitle className="mt-4 group-hover:gradient-text transition-all">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {generatedDocuments.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">生成履歴</h2>
            <Badge variant="secondary">{generatedDocuments.length}件</Badge>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {generatedDocuments.map((document) => (
              <Card key={document.id} data-testid={`document-${document.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl">{document.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Badge variant="outline">{getTemplateName(document.template)}</Badge>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(document.createdAt), "yyyy/MM/dd HH:mm")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyToClipboard(document.content)}
                        data-testid={`button-copy-${document.id}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(document)}
                        data-testid={`button-download-${document.id}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(document.id)}
                        data-testid={`button-delete-${document.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm font-mono">{document.content}</pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {generatedDocuments.length === 0 && (
        <Card>
          <CardContent className="text-center py-16">
            <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">まだ文書が生成されていません</p>
            <p className="text-sm text-muted-foreground mt-1">上のテンプレートから文書を生成してください</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
