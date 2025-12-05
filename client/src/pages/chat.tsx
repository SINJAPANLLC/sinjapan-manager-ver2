import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Send, User, Search } from 'lucide-react';
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
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      <div className="w-80 bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800 mb-3">チャット</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="ユーザーを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelectedUser(u)}
              className={cn(
                'w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left',
                selectedUser?.id === u.id && 'bg-blue-50'
              )}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                {u.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{u.name}</p>
                <p className="text-xs text-gray-500">{getRoleLabel(u.role)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-medium">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-sm text-blue-100">{getRoleLabel(selectedUser.role)}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg) => {
                const isMine = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[70%] px-4 py-3 rounded-2xl',
                        isMine
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md'
                          : 'bg-white text-gray-800 shadow rounded-bl-md'
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p
                        className={cn(
                          'text-xs mt-1',
                          isMine ? 'text-blue-100' : 'text-gray-400'
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

            <form onSubmit={sendMessage} className="p-4 border-t bg-white">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="メッセージを入力..."
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <User size={48} className="mx-auto mb-4 opacity-50" />
              <p>ユーザーを選択してチャットを開始</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
