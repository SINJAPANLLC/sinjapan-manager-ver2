import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Send, User, Search, MessageCircle, Paperclip, X, FileText, Image, Download, Mail, ExternalLink, Users, Plus, Settings, UserPlus, LogOut } from 'lucide-react';
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
  groupId?: number;
  attachmentUrl?: string;
  attachmentName?: string;
  isRead: boolean;
  createdAt: string;
}

interface ChatGroup {
  id: number;
  name: string;
  description?: string;
  avatarUrl?: string;
  memberCount: number;
  createdBy?: number;
  members?: { userId: number; role: string; user: ChatUser | null }[];
}

type ChatMode = 'dm' | 'group';

export function ChatPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [unreadBySender, setUnreadBySender] = useState<Record<number, number>>({});
  const [chatMode, setChatMode] = useState<ChatMode>('dm');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUsers();
    fetchGroups();
    fetchUnreadBySender();
  }, []);

  const fetchUnreadBySender = async () => {
    const res = await fetch('/api/chat/unread-by-sender', { credentials: 'include' });
    if (res.ok) {
      setUnreadBySender(await res.json());
    }
  };

  useEffect(() => {
    if (selectedUser && chatMode === 'dm') {
      fetchMessages();
      fetchUnreadBySender();
      const interval = setInterval(() => {
        fetchMessages();
        fetchUnreadBySender();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser, chatMode]);

  useEffect(() => {
    if (selectedGroup && chatMode === 'group') {
      fetchGroupMessages();
      const interval = setInterval(fetchGroupMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedGroup, chatMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchUsers = async () => {
    const res = await fetch('/api/chat/users');
    if (res.ok) {
      setUsers(await res.json());
    }
  };

  const fetchGroups = async () => {
    const res = await fetch('/api/chat/groups', { credentials: 'include' });
    if (res.ok) {
      setGroups(await res.json());
    }
  };

  const fetchMessages = async () => {
    if (!selectedUser) return;
    const res = await fetch(`/api/chat/messages/${selectedUser.id}`);
    if (res.ok) {
      setMessages(await res.json());
    }
  };

  const fetchGroupMessages = async () => {
    if (!selectedGroup) return;
    const res = await fetch(`/api/chat/groups/${selectedGroup.id}/messages`, { credentials: 'include' });
    if (res.ok) {
      setMessages(await res.json());
    }
  };

  const fetchGroupDetails = async (groupId: number) => {
    const res = await fetch(`/api/chat/groups/${groupId}`, { credentials: 'include' });
    if (res.ok) {
      const group = await res.json();
      setSelectedGroup(group);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || isUploading) return;

    if (chatMode === 'dm' && !selectedUser) return;
    if (chatMode === 'group' && !selectedGroup) return;

    setIsUploading(true);
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('content', newMessage);
        
        if (chatMode === 'dm' && selectedUser) {
          formData.append('receiverId', selectedUser.id.toString());
        } else if (chatMode === 'group' && selectedGroup) {
          formData.append('groupId', selectedGroup.id.toString());
        }

        await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData,
        });
        setSelectedFile(null);
      } else {
        if (chatMode === 'dm' && selectedUser) {
          await fetch('/api/chat/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: newMessage,
              receiverId: selectedUser.id,
            }),
          });
        } else if (chatMode === 'group' && selectedGroup) {
          await fetch(`/api/chat/groups/${selectedGroup.id}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              content: newMessage,
            }),
          });
        }
      }

      setNewMessage('');
      if (chatMode === 'dm') {
        fetchMessages();
      } else {
        fetchGroupMessages();
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('ファイルサイズは10MB以下にしてください');
        return;
      }
      setSelectedFile(file);
    }
  };

  const isImageFile = (filename: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = groups.filter(
    (g) => g.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    
    try {
      const res = await fetch('/api/chat/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDescription,
          memberIds: selectedMemberIds,
        }),
      });
      
      if (res.ok) {
        const group = await res.json();
        fetchGroups();
        setShowCreateGroup(false);
        setNewGroupName('');
        setNewGroupDescription('');
        setSelectedMemberIds([]);
        setSelectedGroup(group);
        setChatMode('group');
      }
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  };

  const leaveGroup = async () => {
    if (!selectedGroup || !user) return;
    
    try {
      await fetch(`/api/chat/groups/${selectedGroup.id}/members/${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setSelectedGroup(null);
      fetchGroups();
    } catch (err) {
      console.error('Failed to leave group:', err);
    }
  };

  const addMemberToGroup = async (userId: number) => {
    if (!selectedGroup) return;
    
    try {
      await fetch(`/api/chat/groups/${selectedGroup.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });
      fetchGroupDetails(selectedGroup.id);
    } catch (err) {
      console.error('Failed to add member:', err);
    }
  };

  const getSenderName = (senderId: number) => {
    if (senderId === user?.id) return 'あなた';
    const sender = users.find(u => u.id === senderId);
    return sender?.name || '不明';
  };

  const selectDmUser = (u: ChatUser) => {
    setSelectedUser(u);
    setSelectedGroup(null);
    setChatMode('dm');
  };

  const selectGroupChat = (g: ChatGroup) => {
    setSelectedGroup(g);
    setSelectedUser(null);
    setChatMode('group');
    fetchGroupDetails(g.id);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-5 animate-fade-in">
      <div className="w-full lg:w-80 bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden flex flex-col max-h-[40vh] lg:max-h-none">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-3">コミュニケーション</h2>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setChatMode('dm')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-sm transition-colors",
                chatMode === 'dm'
                  ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              <User size={18} />
              DM
            </button>
            <button
              onClick={() => setChatMode('group')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-sm transition-colors",
                chatMode === 'group'
                  ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              <Users size={18} />
              グループ
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={chatMode === 'dm' ? "ユーザーを検索..." : "グループを検索..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 outline-none text-sm transition-all"
            />
          </div>
          {chatMode === 'group' && (
            <button
              onClick={() => setShowCreateGroup(true)}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
            >
              <Plus size={18} />
              新規グループ作成
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {chatMode === 'dm' ? (
            filteredUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => selectDmUser(u)}
                className={cn(
                  'w-full flex items-center gap-3 p-4 transition-all duration-200 text-left border-b border-slate-50',
                  selectedUser?.id === u.id && chatMode === 'dm'
                    ? 'bg-gradient-to-r from-primary-50 to-white border-l-2 border-l-primary-500' 
                    : 'hover:bg-slate-50'
                )}
              >
                {u.avatarUrl ? (
                  <img 
                    src={u.avatarUrl} 
                    alt={u.name}
                    className={cn(
                      "w-11 h-11 rounded-xl object-cover transition-transform duration-200",
                      selectedUser?.id === u.id && chatMode === 'dm' && "scale-105 ring-2 ring-primary-500"
                    )}
                  />
                ) : (
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center text-white font-semibold transition-transform duration-200",
                    selectedUser?.id === u.id && chatMode === 'dm'
                      ? "bg-gradient-to-br from-primary-500 to-primary-600 scale-105" 
                      : "bg-gradient-to-br from-slate-400 to-slate-500"
                  )}>
                    {u.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium truncate",
                    selectedUser?.id === u.id && chatMode === 'dm' ? "text-primary-700" : "text-slate-800"
                  )}>{u.name}</p>
                  <p className="text-xs text-slate-500">{getRoleLabel(u.role)}</p>
                </div>
                {unreadBySender[u.id] > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadBySender[u.id]}
                  </span>
                )}
              </button>
            ))
          ) : (
            filteredGroups.map((g) => (
              <button
                key={g.id}
                onClick={() => selectGroupChat(g)}
                className={cn(
                  'w-full flex items-center gap-3 p-4 transition-all duration-200 text-left border-b border-slate-50',
                  selectedGroup?.id === g.id && chatMode === 'group'
                    ? 'bg-gradient-to-r from-primary-50 to-white border-l-2 border-l-primary-500' 
                    : 'hover:bg-slate-50'
                )}
              >
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center text-white font-semibold transition-transform duration-200",
                  selectedGroup?.id === g.id && chatMode === 'group'
                    ? "bg-gradient-to-br from-green-500 to-green-600 scale-105" 
                    : "bg-gradient-to-br from-green-400 to-green-500"
                )}>
                  <Users size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium truncate",
                    selectedGroup?.id === g.id && chatMode === 'group' ? "text-primary-700" : "text-slate-800"
                  )}>{g.name}</p>
                  <p className="text-xs text-slate-500">{g.memberCount}人のメンバー</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden flex flex-col">
        {(chatMode === 'dm' && selectedUser) || (chatMode === 'group' && selectedGroup) ? (
          <>
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-4">
                {chatMode === 'dm' && selectedUser ? (
                  <>
                    {selectedUser.avatarUrl ? (
                      <img 
                        src={selectedUser.avatarUrl} 
                        alt={selectedUser.name}
                        className="w-12 h-12 rounded-xl object-cover shadow-button"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-button">
                        {selectedUser.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-800">{selectedUser.name}</p>
                      <p className="text-sm text-primary-600">{getRoleLabel(selectedUser.role)}</p>
                    </div>
                  </>
                ) : chatMode === 'group' && selectedGroup ? (
                  <>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-button">
                      <Users size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{selectedGroup.name}</p>
                      <p className="text-sm text-slate-500">{selectedGroup.memberCount}人のメンバー</p>
                    </div>
                    <button
                      onClick={() => setShowGroupSettings(true)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Settings size={20} className="text-slate-500" />
                    </button>
                  </>
                ) : null}
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
                      {chatMode === 'group' && !isMine && msg.senderId && (
                        <p className="text-xs font-medium text-primary-600 mb-1">
                          {getSenderName(msg.senderId)}
                        </p>
                      )}
                      {msg.attachmentUrl && (
                        <div className={cn(
                          "mb-2 rounded-lg overflow-hidden",
                          isMine ? "bg-white/10" : "bg-slate-100"
                        )}>
                          {isImageFile(msg.attachmentName || '') ? (
                            <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer">
                              <img 
                                src={msg.attachmentUrl} 
                                alt={msg.attachmentName} 
                                className="max-w-full max-h-48 object-contain"
                              />
                            </a>
                          ) : (
                            <a 
                              href={msg.attachmentUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={cn(
                                "flex items-center gap-2 p-3 hover:opacity-80 transition-opacity",
                                isMine ? "text-white" : "text-slate-700"
                              )}
                            >
                              <FileText size={20} />
                              <span className="text-sm truncate flex-1">{msg.attachmentName}</span>
                              <Download size={16} />
                            </a>
                          )}
                        </div>
                      )}
                      {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
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
              {selectedFile && (
                <div className="mb-3 flex items-center gap-2 p-2 bg-slate-100 rounded-lg">
                  <FileText size={18} className="text-slate-500" />
                  <span className="text-sm text-slate-700 truncate flex-1">{selectedFile.name}</span>
                  <button 
                    type="button" 
                    onClick={() => setSelectedFile(null)}
                    className="p-1 hover:bg-slate-200 rounded"
                  >
                    <X size={16} className="text-slate-500" />
                  </button>
                </div>
              )}
              <div className="flex gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <Paperclip size={20} className="text-slate-500" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="メッセージを入力..."
                  className="input-field flex-1"
                />
                <button
                  type="submit"
                  disabled={(!newMessage.trim() && !selectedFile) || isUploading}
                  className="btn-primary px-5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
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
              <p className="text-slate-500 font-medium">
                {chatMode === 'dm' ? 'ユーザーを選択してチャットを開始' : 'グループを選択してチャットを開始'}
              </p>
              <p className="text-slate-400 text-sm mt-1">左側のリストから選んでください</p>
            </div>
          </div>
        )}
      </div>

      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">新規グループ作成</h3>
              <button onClick={() => setShowCreateGroup(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">グループ名 *</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="input-field w-full"
                  placeholder="グループ名を入力"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">説明</label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  className="input-field w-full"
                  rows={2}
                  placeholder="グループの説明（任意）"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">メンバーを追加</label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                  {users.map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMemberIds([...selectedMemberIds, u.id]);
                          } else {
                            setSelectedMemberIds(selectedMemberIds.filter(id => id !== u.id));
                          }
                        }}
                        className="w-4 h-4 text-primary-600 rounded"
                      />
                      <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                        {u.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{u.name}</p>
                        <p className="text-xs text-slate-500">{getRoleLabel(u.role)}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateGroup(false)}
                className="flex-1 py-2.5 px-4 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={createGroup}
                disabled={!newGroupName.trim()}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-colors disabled:opacity-50"
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}

      {showGroupSettings && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">グループ設定</h3>
              <button onClick={() => setShowGroupSettings(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white mb-3">
                  <Users size={32} />
                </div>
                <h4 className="text-lg font-semibold text-slate-800">{selectedGroup.name}</h4>
                {selectedGroup.description && (
                  <p className="text-sm text-slate-500 mt-1">{selectedGroup.description}</p>
                )}
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-slate-700 mb-2">メンバー ({selectedGroup.members?.length || 0}人)</h5>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                  {selectedGroup.members?.map((m) => (
                    <div key={m.userId} className="flex items-center gap-3 p-3 border-b border-slate-100 last:border-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                        {m.user?.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{m.user?.name || '不明'}</p>
                        <p className="text-xs text-slate-500">{m.role === 'admin' ? '管理者' : 'メンバー'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="text-sm font-medium text-slate-700 mb-2">メンバーを追加</h5>
                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-xl">
                  {users.filter(u => !selectedGroup.members?.some(m => m.userId === u.id)).map((u) => (
                    <button
                      key={u.id}
                      onClick={() => addMemberToGroup(u.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 text-left"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                        {u.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{u.name}</p>
                      </div>
                      <UserPlus size={16} className="text-primary-500" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowGroupSettings(false)}
                className="flex-1 py-2.5 px-4 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
              >
                閉じる
              </button>
              <button
                onClick={() => {
                  leaveGroup();
                  setShowGroupSettings(false);
                }}
                className="flex-1 py-2.5 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={18} />
                退出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
