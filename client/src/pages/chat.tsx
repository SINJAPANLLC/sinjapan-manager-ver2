import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Send, User, Search, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface ChatUser {
  id: number;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface Message {
  id: number;
  content: string;
  senderId?: number;
  receiverId?: number;
  attachmentUrl?: string;
  attachmentName?: string;
  isRead: boolean;
  createdAt: string;
}

export function ChatPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchUsers = async () => {
    const res = await fetch('/api/chat/users');
    if (res.ok) {
      setUsers(await res.json());
    }
  };

  const fetchMessages = async () => {
    if (!selectedUser) return;
    const res = await fetch(`/api/chat/messages/${selectedUser.id}`);
    if (res.ok) {
      setMessages(await res.json());
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: newMessage,
        receiverId: selectedUser.id,
      }),
    });

    setNewMessage('');
    fetchMessages();
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: '管理者',
      ceo: 'CEO',
      manager: 'マネージャー',
      staff: 'スタッフ',
      agency: '代理店',
      client: 'クライアント',
    };
    return labels[role] || role;
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-5 animate-fade-in">
      <div className="w-80 bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4">チャット</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="ユーザーを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 outline-none text-sm transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelectedUser(u)}
              className={cn(
                'w-full flex items-center gap-3 p-4 transition-all duration-200 text-left border-b border-slate-50',
                selectedUser?.id === u.id 
                  ? 'bg-gradient-to-r from-primary-50 to-white border-l-2 border-l-primary-500' 
                  : 'hover:bg-slate-50'
              )}
            >
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center text-white font-semibold transition-transform duration-200",
                selectedUser?.id === u.id 
                  ? "bg-gradient-to-br from-primary-500 to-primary-600 scale-105" 
                  : "bg-gradient-to-br from-slate-400 to-slate-500"
              )}>
                {u.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium truncate",
                  selectedUser?.id === u.id ? "text-primary-700" : "text-slate-800"
                )}>{u.name}</p>
                <p className="text-xs text-slate-500">{getRoleLabel(u.role)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-button">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{selectedUser.name}</p>
                  <p className="text-sm text-primary-600">{getRoleLabel(selectedUser.role)}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-slate-50/50 to-white">
              {messages.map((msg) => {
                const isMine = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[70%] px-4 py-3 rounded-2xl shadow-soft',
                        isMine
                          ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-br-md'
                          : 'bg-white text-slate-800 border border-slate-100 rounded-bl-md'
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p
                        className={cn(
                          'text-xs mt-1.5',
                          isMine ? 'text-primary-100' : 'text-slate-400'
                        )}
                      >
                        {format(new Date(msg.createdAt), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-5 border-t border-slate-100 bg-white">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="メッセージを入力..."
                  className="input-field"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="btn-primary px-5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center">
                <MessageCircle size={36} className="text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">ユーザーを選択してチャットを開始</p>
              <p className="text-slate-400 text-sm mt-1">左側のリストからユーザーを選んでください</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
