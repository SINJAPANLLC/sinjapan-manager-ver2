import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Upload, FileText, Image, Music, Video, File as FileIcon, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UploadResult } from "@uppy/core";

type FileType = "document" | "image" | "audio" | "video" | "other";

interface UploadedFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: FileType;
  visibility: "public" | "private";
  uploadedAt: string;
}

export default function FileStorage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<"all" | FileType>("all");

  // Fetch uploaded files (mock data for now)
  const { data: files = [], isLoading } = useQuery<UploadedFile[]>({
    queryKey: ["/api/files"],
    queryFn: async () => {
      // TODO: Implement actual file list endpoint
      return [];
    },
  });

  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest("/api/objects/upload", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const data = await response.json();
      return {
        method: "PUT" as const,
        url: data.uploadURL,
      };
    } catch (error: any) {
      toast({
        title: "エラー",
        description: "アップロードURLの取得に失敗しました",
        variant: "destructive",
      });
      throw error;
    }
  };

  const confirmUploadMutation = useMutation({
    mutationFn: async ({ fileURL, visibility }: { fileURL: string; visibility: "public" | "private" }) => {
      const response = await apiRequest("/api/objects/confirm", {
        method: "PUT",
        body: JSON.stringify({ fileURL, visibility }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "成功",
        description: "ファイルがアップロードされました",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "ファイルの保存に失敗しました",
        variant: "destructive",
      });
    },
  });

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      confirmUploadMutation.mutate({
        fileURL: uploadedFile.uploadURL || "",
        visibility: "private",
      });
    }
  };

  const getFileIcon = (type: FileType) => {
    switch (type) {
      case "document":
        return <FileText className="w-5 h-5" />;
      case "image":
        return <Image className="w-5 h-5" />;
      case "audio":
        return <Music className="w-5 h-5" />;
      case "video":
        return <Video className="w-5 h-5" />;
      default:
        return <FileIcon className="w-5 h-5" />;
    }
  };

  const filteredFiles = selectedTab === "all" 
    ? files 
    : files.filter(f => f.type === selectedTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-screen-2xl">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent" data-testid="text-page-title">
                ファイルストレージ
              </h1>
              <p className="text-muted-foreground mt-1">
                ファイルのアップロードと管理
              </p>
            </div>
            <ObjectUploader
              maxNumberOfFiles={5}
              maxFileSize={52428800} // 50MB
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleUploadComplete}
            >
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>ファイルをアップロード</span>
              </div>
            </ObjectUploader>
          </div>

          {/* Storage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総ファイル数</CardTitle>
                <FileIcon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-files">{files.length}</div>
                <p className="text-xs text-muted-foreground">すべてのファイル</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ドキュメント</CardTitle>
                <FileText className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-document-count">
                  {files.filter(f => f.type === "document").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">画像</CardTitle>
                <Image className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-image-count">
                  {files.filter(f => f.type === "image").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">メディア</CardTitle>
                <Video className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-media-count">
                  {files.filter(f => f.type === "audio" || f.type === "video").length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* File List */}
          <Card>
            <CardHeader>
              <CardTitle>ファイル一覧</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
                <TabsList>
                  <TabsTrigger value="all" data-testid="tab-all">すべて</TabsTrigger>
                  <TabsTrigger value="document" data-testid="tab-documents">ドキュメント</TabsTrigger>
                  <TabsTrigger value="image" data-testid="tab-images">画像</TabsTrigger>
                  <TabsTrigger value="audio" data-testid="tab-audio">音声</TabsTrigger>
                  <TabsTrigger value="video" data-testid="tab-video">動画</TabsTrigger>
                  <TabsTrigger value="other" data-testid="tab-other">その他</TabsTrigger>
                </TabsList>

                <TabsContent value={selectedTab} className="mt-4">
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">読み込み中...</div>
                  ) : filteredFiles.length === 0 ? (
                    <div className="text-center py-12" data-testid="text-no-files">
                      <FileIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">ファイルがありません</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        右上のボタンからファイルをアップロードできます
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredFiles.map((file) => (
                        <Card key={file.id} className="hover-elevate" data-testid={`card-file-${file.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                {getFileIcon(file.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium truncate" data-testid={`text-file-name-${file.id}`}>
                                  {file.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {(file.size / 1024).toFixed(2)} KB
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(file.uploadedAt).toLocaleDateString("ja-JP")}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1"
                                data-testid={`button-download-${file.id}`}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                ダウンロード
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                data-testid={`button-delete-${file.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
