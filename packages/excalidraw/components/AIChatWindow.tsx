import React, { useState, useRef, useEffect } from "react";

import { t } from "../i18n";

import { useUIAppState } from "../context/ui-appState";

import { Island } from "./Island";
import { Button } from "./Button";
import { FixedSideContainer } from "./FixedSideContainer";
import { useDevice } from "./App";
import { SendIcon } from "./icons";

import "./AIChatWindow.scss";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatWindow: React.FC<AIChatWindowProps> = ({
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const appState = useUIAppState();
  const device = useDevice();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) {
      return;
    }

    const newMessage: Message = {
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    // TODO: Add actual AI response logic here
    setTimeout(() => {
      const aiResponse: Message = {
        role: "assistant",
        content: "This is a placeholder response. AI integration coming soon!",
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <FixedSideContainer side="right">
      <Island className="ai-chat-window">
        <div className="ai-chat-header">
          <h3>Vibe Diagrammer v1</h3>
          <Button
            className="ai-chat-close"
            onClick={onClose}
            title="Close AI Chat"
            onSelect={() => {}}
          >
            ×
          </Button>
        </div>
        <div className="ai-chat-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`ai-chat-message ${
                message.role === "user" ? "user" : "assistant"
              }`}
            >
              <div className="ai-chat-message-content">{message.content}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="ai-chat-input-container">
          <textarea
            className="ai-chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
          />
          <Button
            className="ai-chat-send"
            onClick={handleSend}
            title="Send message"
            onSelect={() => {}}
          >
            {SendIcon}
          </Button>
        </div>
      </Island>
    </FixedSideContainer>
  );
};
