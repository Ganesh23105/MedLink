import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Send,
  X,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Circle,
  Check,
  CheckCheck,
  AlertCircle,
  Loader2,
  Bot,
  User
} from 'lucide-react';

const ChatModal = ({
  doctor,
  isOpen,
  onClose,
  messages = [],
  onSendMessage,
  onTyping,
  onMarkAsRead,
  isConnected,
  currentUser,
  typingUsers = [],
  error = null,
  onClearError
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isUserTyping, setIsUserTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (!isOpen || !onMarkAsRead) return;
    const unread = messages.some(m => !m.isRead && m.senderId !== currentUser?._id);
    if (unread) {
      const timer = setTimeout(onMarkAsRead, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages, onMarkAsRead, currentUser]);

  const adjustTextareaHeight = () => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
  };

  const handleTyping = (value) => {
    setNewMessage(value);
    adjustTextareaHeight();
    if (!isUserTyping && value.trim()) {
      setIsUserTyping(true);
      onTyping?.(doctor._id, true);
    }
    clearTimeout(typingTimeoutRef.current);
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsUserTyping(false);
        onTyping?.(doctor._id, false);
      }, 1000);
    } else {
      setIsUserTyping(false);
      onTyping?.(doctor._id, false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !isConnected) return;
    const text = newMessage.trim();
    setNewMessage('');
    setIsUserTyping(false);
    onTyping?.(doctor._id, false);
    clearTimeout(typingTimeoutRef.current);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    try {
      await onSendMessage(doctor._id, text);
    } catch (err) {
      console.error('Send failed:', err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isOwnMessage = (msg) => msg.senderId?.toString() === currentUser?._id?.toString();
  const formatTime = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (t) => {
    const d = new Date(t);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString();
  };

  const getMessageStatusIcon = (msg) => {
    if (!isOwnMessage(msg)) return null;
    if (msg.status === 'sending') return <Loader2 size={12} className="animate-spin" />;
    if (msg.isRead) return <CheckCheck size={12} className="text-primary-500" />;
    return <Check size={12} className="text-gray-400" />;
  };

  const typingIndicator = typingUsers.find(u => u.userId === doctor._id);
  const groupedMessages = messages.reduce((acc, msg) => {
    const date = formatDate(msg.createdAt || msg.timestamp);
    acc[date] = acc[date] || [];
    acc[date].push(msg);
    return acc;
  }, {});

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full h-[80vh] bg-white rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 bg-white border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden border-2 border-white shadow-lg">
                {doctor.image ? (
                  <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl bg-primary-50 text-primary-500 font-black">
                    {doctor.name?.charAt(0)}
                  </div>
                )}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full shadow-sm ${isConnected ? 'bg-success-500' : 'bg-gray-300'}`}></div>
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">{doctor.name}</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500">
                {typingIndicator ? 'Typing…' : isConnected ? 'Neural Network Online' : 'Offline'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-3 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"><Phone size={20} /></button>
            <button className="p-3 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"><Video size={20} /></button>
            <div className="w-px h-8 bg-gray-100 mx-2"></div>
            <button onClick={onClose} className="p-3 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded-xl transition-all"><X size={24} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-grow overflow-y-auto p-8 space-y-8 bg-gray-50/30">
          {Object.keys(groupedMessages).length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                <MessageCircle size={40} className="text-gray-400" />
              </div>
              <p className="text-sm font-black uppercase tracking-widest text-gray-500">Start a secure conversation</p>
            </div>
          ) : (
            Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date} className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="flex-grow h-px bg-gray-100"></div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">{date}</span>
                  <div className="flex-grow h-px bg-gray-100"></div>
                </div>
                {msgs.map((msg, i) => {
                  const own = isOwnMessage(msg);
                  return (
                    <div key={msg._id || i} className={`flex ${own ? 'justify-end' : 'justify-start'} items-end gap-3`}>
                      {!own && (
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
                          <Bot size={16} className="text-primary-600" />
                        </div>
                      )}
                      <div className={`max-w-[70%] space-y-2`}>
                        <div className={`p-5 rounded-[2rem] text-sm font-bold shadow-sm ${
                          own 
                            ? 'bg-primary-600 text-white rounded-br-none shadow-primary-100' 
                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                        }`}>
                          <p className="leading-relaxed">{msg.message}</p>
                        </div>
                        <div className={`flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest ${own ? 'justify-end' : 'justify-start'}`}>
                          <span>{formatTime(msg.createdAt || msg.timestamp)}</span>
                          {own && getMessageStatusIcon(msg)}
                        </div>
                      </div>
                      {own && (
                        <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                          <User size={16} className="text-primary-600" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-8 bg-white border-t border-gray-100">
          {error && (
            <div className="mb-4 p-4 bg-danger-50 text-danger-600 text-xs font-black rounded-2xl border border-danger-100 flex items-center justify-between animate-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
              <button onClick={onClearError}><X size={14} /></button>
            </div>
          )}

          <div className="flex items-end gap-4">
            <div className="flex-grow relative group">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isConnected ? 'Type your message here...' : 'Reconnecting to neural network...'}
                rows={1}
                disabled={!isConnected}
                className="w-full pl-6 pr-16 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] text-sm font-bold focus:bg-white focus:ring-8 focus:ring-primary-50/50 focus:border-primary-100 transition-all outline-none resize-none shadow-inner"
              />
              <div className="absolute right-4 bottom-3 flex items-center gap-2">
                <button className="p-2 text-gray-300 hover:text-primary-500 transition-colors"><Smile size={20} /></button>
                <button className="p-2 text-gray-300 hover:text-primary-500 transition-colors"><Paperclip size={20} /></button>
              </div>
            </div>
            <button 
              onClick={sendMessage} 
              disabled={!isConnected || !newMessage.trim()}
              className="w-16 h-16 bg-primary-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-primary-100 hover:bg-primary-700 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all"
            >
              <Send size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
