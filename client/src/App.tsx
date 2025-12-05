import { useState, useEffect } from "react";

function App() {
  const [health, setHealth] = useState<string>("Checking...");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setHealth(data.message))
      .catch(() => setHealth("Backend not connected"));
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>SIN-JAPAN Manager Ver2</h1>
      <p>開発環境が起動しました</p>
      <p>サーバーステータス: {health}</p>
      <div style={{ marginTop: "2rem", padding: "1rem", background: "#f0f0f0", borderRadius: "8px" }}>
        <h2>⚠️ 注意</h2>
        <p>このリポジトリには実際のアプリケーションコードが含まれていません。</p>
        <p>デプロイ設定ファイルのみが存在するため、最小限の動作確認用アプリを作成しました。</p>
        <p style={{ marginTop: "1rem" }}>
          完全なアプリケーションを実行するには、実際のソースコードが必要です。
        </p>
      </div>
    </div>
  );
}

export default App;
