import React, { useState, useRef, useEffect } from 'react';
import { Message, User } from '../types';
import { Send, AlertTriangle } from 'lucide-react';


interface ChatBoxProps {
  messages: Message[];
  currentUser: User;
  onSendMessage: (text: string) => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ messages, currentUser, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    setErrorMsg(null);

    onSendMessage(inputText);
    setInputText('');
    setIsSending(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/50 backdrop-blur rounded-xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-white/5">
        <h3 className="font-semibold text-white">Room Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 scrollbar-hide">
        {messages.filter(Boolean).map((msg) => {
          const isMe = msg.userId === currentUser.id;
          if (msg.isSystem) {
             return (
                 <div key={msg.id} className="text-center my-1 animate-float-in">
                     <span className="text-[10px] text-gray-400 bg-gray-800/80 px-2.5 py-1 rounded-full">{msg.text}</span>
                 </div>
             )
          }
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-float-in`}>
              <div className="flex items-end gap-2 max-w-[90%] md:max-w-[85%]">
                {!isMe && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-indigo-500/10">
                    {msg.username[0]}
                  </div>
                )}
                <div
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-2xl text-[13px] md:text-sm ${
                    isMe
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-500/10'
                      : 'bg-gray-800 text-gray-100 rounded-bl-none border border-white/5'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
              <span className="text-[9px] md:text-[10px] text-gray-500 mt-1 px-1">
                 {msg.username} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 md:p-3 bg-gray-800/40 border-t border-white/5">
        {errorMsg && (
            <div className="flex items-center gap-2 text-red-400 text-[10px] mb-2 px-2 animate-bounce">
                <AlertTriangle size={10} />
                {errorMsg}
            </div>
        )}
        <form onSubmit={handleSend} className="relative flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Write a message..."
            className="w-full bg-gray-950 border border-white/10 text-white rounded-2xl py-2 pl-4 pr-10 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-gray-600 text-[13px] md:text-sm"
          />
          <button
            type="submit"
            title="Send message"
            disabled={isSending || !inputText.trim()}
            className={`absolute right-1 p-1.5 rounded-xl ${
              inputText.trim() ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20' : 'bg-gray-800 text-gray-600'
            } transition-all`}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;