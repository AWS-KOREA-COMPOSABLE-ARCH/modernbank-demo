"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { v4 as uuidv4 } from "uuid";

interface Source {
  text: string;
  s3Location?: { uri?: string };
}

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  agent?: string;
  partial?: boolean;
  metadata?: {
    sources?: Source[];
  };
}

const BotMessage = ({ text, metadata, t }: Pick<ChatMessage, 'text' | 'metadata'> & { t: (key: string) => string }) => (
  <>
    <div className="whitespace-pre-wrap mb-2 leading-relaxed">{text}</div>
    {metadata?.sources && metadata.sources.length > 0 && (
      <div className="mt-4 pt-3 border-t border-gray-100">
        <h4 className="text-sm font-semibold text-gray-600 mb-2">📎 {t('chat.referenceDocs')}</h4>
        <div className="space-y-2">
          {metadata.sources.map((source, idx) => (
            <div
              key={idx}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <p className="text-gray-700">{source.text}</p>
              {source.s3Location?.uri && (
                <p className="text-xs text-blue-600 mt-1 truncate">
                  {t('chat.source')}: <a href={source.s3Location.uri} target="_blank" rel="noopener noreferrer">{source.s3Location.uri}</a>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    )}
  </>
);

const UserMessage = ({ text }: { text: string }) => (
  <div className="whitespace-pre-wrap leading-relaxed">{text}</div>
);

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://43.202.88.44:5000";

export default function ChatWindow({ closeChat }: { closeChat: () => void }) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleStreamingMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "text") {
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          // 마지막 메시지가 봇의 메시지이고 아직 완성되지 않았다면 내용 추가
          if (lastMessage?.sender === "bot" && lastMessage?.partial) {
            const updatedMessages = [...prev.slice(0, -1)];
            updatedMessages.push({
              ...lastMessage,
              text: lastMessage.text + data.content,
            });
            return updatedMessages;
          } else {
            // 새 메시지 시작
            return [...prev, {
              id: uuidv4(),
              sender: "bot",
              text: data.content,
              partial: true
            }];
          }
        });
      }
    } catch  {
      // JSON 파싱 실패 시 일반 텍스트로 처리
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.sender === "bot" && lastMessage?.partial) {
          const updatedMessages = [...prev.slice(0, -1)];
          updatedMessages.push({
            ...lastMessage,
            text: lastMessage.text + event.data,
          });
          return updatedMessages;
        } else {
          return [...prev, {
            id: uuidv4(),
            sender: "bot",
            text: event.data,
            partial: true
          }];
        }
      });
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };

    ws.onmessage = handleStreamingMessage;

    ws.onclose = () => {
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
    };

    ws.onerror = () => {
      console.error("WebSocket error");
      ws.close();
    };
  }, [handleStreamingMessage]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || !wsRef.current) return;

    const messagePayload: ChatMessage = {
      id: uuidv4(),
      sender: "user" as const,
      text: inputValue,
    };

    setMessages(prev => [...prev, messagePayload]);
    wsRef.current.send(JSON.stringify(messagePayload));
    setInputValue('');
  };

  const chatWindow = (
    <div
      className="fixed bottom-20 right-4 w-full md:w-[600px] bg-white shadow-2xl rounded-xl border border-gray-200 flex flex-col"
      style={{ height: "60vh" }}
    >
      {/* Header */}
      <div className="flex justify-between items-center bg-gradient-to-r from-[#0B1F3A] to-[#1C2D45] text-white px-5 py-4 rounded-t-xl">
        <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          {t('chat.title')}
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full mr-1 ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            ></span>
            {isConnected ? t('chat.connected') : t('chat.offline')}
          </span>
        </h3>

        <button
          onClick={closeChat}
          className="text-white hover:text-gray-300 transition-colors p-1 rounded-md"
          aria-label={t('chat.closeChat')}
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 px-5 py-4 overflow-y-auto space-y-4 bg-[#F7F9FC]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className="max-w-[70%]">
              {msg.sender === "bot" ? (
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm text-sm text-gray-800">
                  <BotMessage text={msg.text} metadata={msg.metadata} t={t} />
                </div>
              ) : (
                <div className="bg-gradient-to-r from-[#1C4E80] to-[#0B1F3A] text-white px-5 py-3 rounded-xl shadow-md text-sm">
                  <UserMessage text={msg.text} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-5 py-3 border-t border-gray-200 bg-white">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder={t('chat.placeholder')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#1C4E80] transition"
          />
          <button
            onClick={handleSendMessage}
            className="p-2 bg-gradient-to-r from-[#1C4E80] to-[#0B1F3A] text-white rounded-full hover:opacity-90 transition shadow-md"
            aria-label={t('chat.sendMessage')}
          >
            <PaperAirplaneIcon className="w-5 h-5 transform rotate-45" />
          </button>
        </div>
      </div>
    </div>
  );

  // Portal을 사용하여 렌더링
  return mounted ? createPortal(chatWindow, document.body) : null;
}
