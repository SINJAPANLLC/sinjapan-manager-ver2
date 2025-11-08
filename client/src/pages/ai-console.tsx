import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Sparkles, Zap, Send, User, Bot, Image as ImageIcon, FileText, Download, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ChatHistory, AiGeneratedContent } from "@shared/schema";

export default function AiConsole() {
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState<string>("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageSize, setImageSize] = useState("1024x1024");
  const [documentType, setDocumentType] = useState("report");
  const [documentPrompt, setDocumentPrompt] = useState("");
  const [documentContext, setDocumentContext] = useState("");
  const [localMessages, setLocalMessages] = useState<Array<{ role: string; content: string }>>([]);
  const { toast } = useToast();

  // Load chat history from API
  const { data: chatHistory = [], isLoading: historyLoading } = useQuery<ChatHistory[]>({
    queryKey: ["/api/ai/chat/history", sessionId],
    enabled: !!sessionId,
  });

  // Combine server history and local messages
  const displayMessages = sessionId && chatHistory.length > 0 ? chatHistory : localMessages;

  const { data: aiEvents, isLoading: eventsLoading } = useQuery<any[]>({
    queryKey: ["/api/ai/events"],
  });

  const { data: memories, isLoading: memoriesLoading } = useQuery<any[]>({
    queryKey: ["/api/ai/memory"],
  });

  const { data: generatedImages = [], isLoading: imagesLoading } = useQuery<AiGeneratedContent[]>({
    queryKey: ["/api/ai/generated-content", "image"],
    queryFn: async () => {
      try {
        const result = await apiRequest("/api/ai/generated-content?type=image");
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error("Error fetching images:", error);
        return [];
      }
    },
  });

  const { data: generatedDocuments = [], isLoading: docsLoading } = useQuery<AiGeneratedContent[]>({
    queryKey: ["/api/ai/generated-content", "document"],
    queryFn: async () => {
      try {
        const result = await apiRequest("/api/ai/generated-content?type=document");
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error("Error fetching documents:", error);
        return [];
      }
    },
  });

  // Enhanced chat with persistent history
  const chatMutation = useMutation({
    mutationFn: async (data: { msg: string; userMessage: { role: string; content: string } }) => {
      const response = await apiRequest("/api/ai/chat/enhanced", {
        method: "POST",
        body: JSON.stringify({
          message: data.msg,
          sessionId: sessionId || undefined
        }),
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      const newSessionId = data.sessionId;
      
      // Add AI response to local state
      if (data.response) {
        setLocalMessages(prev => [...prev, { role: "assistant", content: data.response }]);
      }
      
      if (newSessionId && !sessionId) {
        setSessionId(newSessionId);
      }
      setMessage("");
      // Invalidate the exact query key with sessionId
      if (newSessionId) {
        queryClient.invalidateQueries({ queryKey: ["/api/ai/chat/history", newSessionId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/ai/chat/history"] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/ai/memory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/events"] });
    },
    onError: (error: any) => {
      // Remove the user message if there was an error
      setLocalMessages(prev => prev.slice(0, -1));
      toast({
        title: "エラー",
        description: error.message || "メッセージの送信に失敗しました",
        variant: "destructive",
      });
    },
  });

  // Image generation mutation
  const imageMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/ai/generate/image", {
        method: "POST",
        body: JSON.stringify({
          prompt: imagePrompt,
          size: imageSize,
        }),
      });
      return await response.json();
    },
    onSuccess: () => {
      setImagePrompt("");
      queryClient.invalidateQueries({ queryKey: ["/api/ai/generated-content", "image"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/events"] });
      toast({
        title: "成功",
        description: "画像を生成しました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "画像生成に失敗しました",
        variant: "destructive",
      });
    },
  });

  // Document generation mutation
  const documentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/ai/generate/document", {
        method: "POST",
        body: JSON.stringify({
          type: documentType,
          prompt: documentPrompt,
          context: documentContext || undefined,
        }),
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      setDocumentPrompt("");
      setDocumentContext("");
      queryClient.invalidateQueries({ queryKey: ["/api/ai/generated-content", "document"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/events"] });
      toast({
        title: "成功",
        description: "文書を生成しました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "文書生成に失敗しました",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const userMessage = { role: "user", content: message };
    // Add user message immediately to local state
    setLocalMessages(prev => [...prev, userMessage]);
    
    chatMutation.mutate({ msg: message, userMessage });
  };

  const handleGenerateImage = () => {
    if (!imagePrompt.trim()) {
      toast({
        title: "エラー",
        description: "画像の説明を入力してください",
        variant: "destructive",
      });
      return;
    }
    imageMutation.mutate();
  };

  const handleGenerateDocument = () => {
    if (!documentPrompt.trim()) {
      toast({
        title: "エラー",
        description: "文書の内容を入力してください",
        variant: "destructive",
      });
      return;
    }
    documentMutation.mutate();
  };

  const downloadDocument = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (eventsLoading || memoriesLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AIコンソール</h1>
        <p className="text-muted-foreground mt-1">
          3層AIエージェント統合システム - チャット・画像生成・文書生成
        </p>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="chat" data-testid="tab-chat">
            <Bot className="h-4 w-4 mr-2" />
            AIチャット
          </TabsTrigger>
          <TabsTrigger value="image" data-testid="tab-image">
            <ImageIcon className="h-4 w-4 mr-2" />
            画像生成
          </TabsTrigger>
          <TabsTrigger value="document" data-testid="tab-document">
            <FileText className="h-4 w-4 mr-2" />
            文書生成
          </TabsTrigger>
          <TabsTrigger value="memory" data-testid="tab-memory">
            <Brain className="h-4 w-4 mr-2" />
            AI記憶
          </TabsTrigger>
          <TabsTrigger value="events" data-testid="tab-events">
            <Sparkles className="h-4 w-4 mr-2" />
            動作ログ
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <Card data-testid="card-ai-chat">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                強化AIチャット
              </CardTitle>
              <CardDescription>
                会話履歴を記憶し、文脈を理解して回答するAIエージェント
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-[500px] border border-border rounded-md p-4">
                <div className="space-y-4">
                  {displayMessages.length === 0 ? (
                    <div className="text-center py-16">
                      <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">AIエージェントに質問してください</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        SIGMA、MIZUKI、NEURALが協力して回答します
                      </p>
                    </div>
                  ) : (
                    displayMessages.map((msg, idx) => (
                      <div
                        key={msg.id || idx}
                        className={cn(
                          "flex gap-3",
                          msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                        data-testid={`chat-message-${idx}`}
                      >
                        {msg.role === "assistant" && (
                          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[80%] p-3 rounded-lg",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        {msg.role === "user" && (
                          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  {chatMutation.isPending && (
                    <div className="flex gap-3 justify-start">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" />
                      </div>
                      <div className="max-w-[80%] p-3 rounded-lg bg-muted">
                        <p className="text-sm text-muted-foreground">考え中...</p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  placeholder="メッセージを入力..."
                  data-testid="input-ai-chat"
                  disabled={chatMutation.isPending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={chatMutation.isPending}
                  data-testid="button-send-message"
                >
                  {chatMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Image Generation Tab */}
        <TabsContent value="image" className="space-y-4">
          <Card data-testid="card-image-generator">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                AI画像生成（DALL-E 3）
              </CardTitle>
              <CardDescription>
                テキストから高品質な画像を生成
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">画像の説明</label>
                  <Textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="例: 未来的なオフィスビル、青空、モダンなデザイン"
                    rows={3}
                    data-testid="input-image-prompt"
                    disabled={imageMutation.isPending}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">画像サイズ</label>
                  <Select value={imageSize} onValueChange={setImageSize} disabled={imageMutation.isPending}>
                    <SelectTrigger data-testid="select-image-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1024x1024">正方形 (1024x1024)</SelectItem>
                      <SelectItem value="1792x1024">横長 (1792x1024)</SelectItem>
                      <SelectItem value="1024x1792">縦長 (1024x1792)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleGenerateImage} 
                  disabled={imageMutation.isPending}
                  className="w-full"
                  data-testid="button-generate-image"
                >
                  {imageMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      画像を生成
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-generated-images">
            <CardHeader>
              <CardTitle>生成した画像</CardTitle>
            </CardHeader>
            <CardContent>
              {imagesLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-64" />
                  <Skeleton className="h-64" />
                </div>
              ) : !generatedImages || generatedImages.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  まだ画像を生成していません
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedImages.slice(0, 10).map((img) => (
                    <div key={img.id} className="space-y-2" data-testid={`generated-image-${img.id}`}>
                      <img 
                        src={img.result || ""} 
                        alt={img.prompt} 
                        className="w-full h-auto rounded-md border border-border"
                      />
                      <p className="text-sm text-muted-foreground line-clamp-2">{img.prompt}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(img.createdAt!).toLocaleString("ja-JP")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Document Generation Tab */}
        <TabsContent value="document" className="space-y-4">
          <Card data-testid="card-document-generator">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                AI文書生成（NEURAL）
              </CardTitle>
              <CardDescription>
                レポート、メール、提案書を自動生成
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">文書タイプ</label>
                  <Select value={documentType} onValueChange={setDocumentType} disabled={documentMutation.isPending}>
                    <SelectTrigger data-testid="select-document-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="report">ビジネスレポート</SelectItem>
                      <SelectItem value="email">ビジネスメール</SelectItem>
                      <SelectItem value="proposal">提案書</SelectItem>
                      <SelectItem value="summary">要約</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">文書の内容</label>
                  <Textarea
                    value={documentPrompt}
                    onChange={(e) => setDocumentPrompt(e.target.value)}
                    placeholder="例: 新規事業の提案。AI技術を活用した業務効率化サービス。"
                    rows={3}
                    data-testid="input-document-prompt"
                    disabled={documentMutation.isPending}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">背景情報（オプション）</label>
                  <Textarea
                    value={documentContext}
                    onChange={(e) => setDocumentContext(e.target.value)}
                    placeholder="追加の背景情報や詳細..."
                    rows={2}
                    data-testid="input-document-context"
                    disabled={documentMutation.isPending}
                  />
                </div>
                <Button 
                  onClick={handleGenerateDocument} 
                  disabled={documentMutation.isPending}
                  className="w-full"
                  data-testid="button-generate-document"
                >
                  {documentMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      文書を生成
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-generated-documents">
            <CardHeader>
              <CardTitle>生成した文書</CardTitle>
            </CardHeader>
            <CardContent>
              {docsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </div>
              ) : !generatedDocuments || generatedDocuments.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  まだ文書を生成していません
                </p>
              ) : (
                <div className="space-y-4">
                  {generatedDocuments.slice(0, 10).map((doc) => (
                    <div 
                      key={doc.id} 
                      className="p-4 border border-border rounded-md hover-elevate"
                      data-testid={`generated-document-${doc.id}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Badge variant="secondary" className="mb-2">
                            {doc.metadata?.type === "report" && "レポート"}
                            {doc.metadata?.type === "email" && "メール"}
                            {doc.metadata?.type === "proposal" && "提案書"}
                            {doc.metadata?.type === "summary" && "要約"}
                          </Badge>
                          <p className="text-sm font-medium">{doc.prompt}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadDocument(
                            doc.result || "",
                            `document_${doc.id}.txt`
                          )}
                          data-testid={`button-download-${doc.id}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                        {doc.result}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(doc.createdAt!).toLocaleString("ja-JP")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Memory Tab */}
        <TabsContent value="memory">
          <Card data-testid="card-ai-memory">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI長期記憶
              </CardTitle>
              <CardDescription>
                会話から学習し、蓄積された知識
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {(!memories || memories.length === 0) ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      まだ記憶がありません
                    </p>
                  ) : (
                    memories.slice(0, 50).map((mem: any) => (
                      <div
                        key={mem.id}
                        className="p-3 rounded-md border border-border hover-elevate"
                        data-testid={`memory-${mem.id}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {mem.type === "fact" && "事実"}
                            {mem.type === "insight" && "洞察"}
                            {mem.type === "decision" && "判断"}
                            {mem.type === "pattern" && "パターン"}
                            {mem.type === "conversation" && "会話"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            重要度: {mem.importance}/10
                          </span>
                        </div>
                        <p className="text-sm">{mem.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(mem.createdAt).toLocaleString("ja-JP")}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events">
          <Card data-testid="card-ai-events">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI動作ログ
              </CardTitle>
              <CardDescription>
                3層AIシステムの実行履歴
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {(!aiEvents || aiEvents.length === 0) ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      まだAI動作ログがありません
                    </p>
                  ) : (
                    aiEvents.slice(0, 50).map((event: any) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-3 rounded-md border border-border hover-elevate"
                        data-testid={`ai-event-${event.id}`}
                      >
                        <div className={cn(
                          "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                          event.agentType === "SIGMA" && "bg-blue-500/20",
                          event.agentType === "MIZUKI" && "bg-purple-500/20",
                          event.agentType === "NEURAL" && "bg-green-500/20"
                        )}>
                          {event.agentType === "SIGMA" && <Brain className="h-4 w-4 text-blue-500" />}
                          {event.agentType === "MIZUKI" && <Sparkles className="h-4 w-4 text-purple-500" />}
                          {event.agentType === "NEURAL" && <Zap className="h-4 w-4 text-green-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs",
                                event.agentType === "SIGMA" && "bg-blue-500/20 text-blue-300",
                                event.agentType === "MIZUKI" && "bg-purple-500/20 text-purple-300",
                                event.agentType === "NEURAL" && "bg-green-500/20 text-green-300"
                              )}
                            >
                              {event.agentType}
                            </Badge>
                            <Badge variant={event.status === "success" ? "default" : "destructive"} className="text-xs">
                              {event.status}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium mt-2">{event.actionType}</p>
                          {event.executionTime && (
                            <p className="text-xs text-muted-foreground mt-1">
                              実行時間: {event.executionTime}ms
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.createdAt).toLocaleString("ja-JP")}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
