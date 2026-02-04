import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  Bot,
  User,
  AlertCircle,
  Loader2
} from 'lucide-react';

const MediChainChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm MedLink AI, your AI-powered medical assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const API_BASE_URL = 'http://localhost:8000';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const addMessage = (text, sender, audioUrl = null) => {
    const newMessage = {
      id: Date.now(),
      text,
      sender,
      timestamp: new Date().toISOString(),
      audioUrl
    };

    setMessages(prev => [...prev, newMessage]);

    if (sender === 'bot' && audioUrl) {
      setTimeout(() => playAudio(audioUrl), 500);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    addMessage(userMessage, 'user');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          user_id: `user-${Date.now()}`,
          language: 'en'
        })
      });

      if (!response.ok) throw new Error('Server error');

      const data = await response.json();
      addMessage(data.text_response, 'bot', data.audio_file_path);
    } catch (err) {
      console.error(err);
      addMessage(
        'Sorry, I encountered an error. Please try again.',
        'bot'
      );
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = e =>
        audioChunksRef.current.push(e.data);

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await sendVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch {
      addMessage('Microphone access denied.', 'bot');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendVoiceMessage = async (audioBlob) => {
    setIsLoading(true);
    setIsTyping(true);
    addMessage('Voice message sent', 'user');

    try {
      const formData = new FormData();
      formData.append('file', audioBlob);

      const response = await fetch(`${API_BASE_URL}/voice-input`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error();

      const data = await response.json();

      if (data.transcribed_text) {
        addMessage(`Transcribed: "${data.transcribed_text}"`, 'user');
      }

      addMessage(data.text_response, 'bot', data.audio_file_path);
    } catch {
      addMessage('Voice processing failed.', 'bot');
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const playAudio = async (filename) => {
    try {
      const audio = new Audio(`${API_BASE_URL}/audio/${filename}`);
      await audio.play();
    } catch (err) {
      console.error(err);
    }
  };

  const isEmergencyMessage = (text) => {
    const keywords = [
      'emergency',
      'urgent',
      'severe',
      'critical',
      'chest pain',
      'difficulty breathing',
      'stroke',
      'heart attack'
    ];
    return keywords.some(k => text.toLowerCase().includes(k));
  };

  return (
    <div className="fixed bottom-8 right-8 z-[9999] font-sans">
      {/* Floating Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-primary-700 hover:scale-110 transition-all duration-300 group"
        >
          <MessageCircle size={32} className="group-hover:rotate-12 transition-transform" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-danger-500 border-2 border-white rounded-full"></div>
        </button>
      )}

      {/* Chat Popup */}
      {isOpen && (
        <div className="w-[400px] h-[600px] bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
          {/* Header */}
          <div className="p-6 bg-primary-600 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <Bot size={28} />
              </div>
              <div>
                <h3 className="font-black text-lg tracking-tight">MedLink AI</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Online Assistant</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-gray-50/50">
            {messages.map(msg => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} items-end gap-3`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
                    <Bot size={16} className="text-primary-600" />
                  </div>
                )}
                
                <div className={`max-w-[80%] space-y-2`}>
                  <div className={`p-4 rounded-2xl text-sm font-medium shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-primary-600 text-white rounded-br-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                  }`}>
                    {isEmergencyMessage(msg.text) && msg.sender === 'bot' && (
                      <div className="flex items-center gap-2 mb-2 p-2 bg-danger-50 text-danger-600 rounded-lg border border-danger-100">
                        <AlertCircle size={14} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Medical Alert</span>
                      </div>
                    )}
                    <p className="leading-relaxed">{msg.text}</p>
                    
                    {msg.audioUrl && (
                      <button 
                        onClick={() => playAudio(msg.audioUrl)}
                        className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-primary-50 text-primary-600 px-3 py-2 rounded-lg hover:bg-primary-100 transition-colors"
                      >
                        <Volume2 size={12} /> Play Response
                      </button>
                    )}
                  </div>
                  <p className={`text-[8px] font-black text-gray-400 uppercase tracking-widest ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 bg-primary-100 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                    <User size={16} className="text-primary-600" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100">
                  <Bot size={16} className="text-primary-600" />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-gray-100 shadow-sm flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-gray-100 space-y-4">
            <div className="flex items-end gap-3">
              <div className="flex-grow relative">
                <textarea
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  placeholder="Describe your symptoms..."
                  className="w-full bg-gray-50 border border-transparent rounded-2xl px-4 py-3 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-primary-50 focus:border-primary-100 transition-all outline-none resize-none max-h-32"
                  rows={1}
                />
              </div>
              
              <button 
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-3 rounded-xl transition-all ${
                  isRecording 
                    ? 'bg-danger-500 text-white animate-pulse' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600 transition-all shadow-lg shadow-primary-100"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-2 bg-warning-50 rounded-lg border border-warning-100">
              <AlertCircle size={12} className="text-warning-600 shrink-0" />
              <p className="text-[9px] font-bold text-warning-700 leading-tight">
                Informational purposes only. Consult healthcare professionals for medical advice.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediChainChatbot;
