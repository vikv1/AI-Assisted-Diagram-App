import React, { useState, useRef, useEffect } from "react";

import OpenAI from "openai";
import { parseMermaidToExcalidraw } from "@excalidraw/mermaid-to-excalidraw";
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";

import { useUIAppState } from "../context/ui-appState";

import { Button } from "./Button";
import { useDevice, useApp } from "./App";

import "./AIChatWindow.scss";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const AIChatWindow: React.FC<AIChatWindowProps> = ({
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const app = useApp();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const insertMermaidToEditor = async (mermaidCode: string) => {
    try {
      const { elements: skeletonElements, files } =
        await parseMermaidToExcalidraw(mermaidCode);
      const elements = convertToExcalidrawElements(skeletonElements, {
        regenerateIds: true,
      });

      // insert into editor
      app.addElementsFromPasteOrLibrary({
        elements,
        files,
        position: "center",
        fitToContent: true,
      });
    } catch (error) {
      console.error("Error converting mermaid to Excalidraw:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) {
      return;
    }

    const newMessage: Message = {
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a helpful AI assistant for Excalidraw, a whiteboard tool. Your task is to generate diagrams for the user in mermaid format and only return the mermaid code, no other text. Do not format the mermaid code with backticks.",
          },
          ...messages,
          newMessage,
        ],
        model: "gpt-4.1-nano",
      });

      const mermaidCode =
        completion.choices[0].message.content ||
        "Sorry, I couldn't generate a response.";

      const aiResponse: Message = {
        role: "assistant",
        content: mermaidCode,
      };
      setMessages((prev) => [...prev, aiResponse]);

      // insert
      await insertMermaidToEditor(mermaidCode);
    } catch (error) {
      console.error("Error calling OpenAI:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error while processing your request.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
    <div className="ai-chat-window">
      <div className="ai-chat-header">
        <h3>
          Vibe Diagrammer
          <span style={{ color: "red", fontSize: "14px" }}>v1</span>
        </h3>
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
            <div
              className="ai-chat-message-content"
              onClick={() => {
                if (message.role === "assistant") {
                  insertMermaidToEditor(message.content);
                }
              }}
              style={{
                cursor: message.role === "assistant" ? "pointer" : "default",
              }}
            >
              {message.role === "assistant" ? (
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {message.content}
                </pre>
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="ai-chat-message assistant">
            <div className="ai-chat-message-content">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="ai-chat-input-container">
        <textarea
          className="ai-chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the diagram you want to create..."
          rows={1}
          disabled={isLoading}
        />
        <Button
          className="ai-chat-send"
          onClick={handleSend}
          title="Send message"
          onSelect={() => {}}
          disabled={isLoading}
        >
          {">"}
        </Button>
      </div>
    </div>
  );
};
