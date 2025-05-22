import React, { useState, useRef, useEffect } from "react";

import OpenAI from "openai";
import { parseMermaidToExcalidraw } from "@excalidraw/mermaid-to-excalidraw";
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";

import { Button } from "./Button";
import { useApp } from "./App";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const app = useApp();
  const mermaidMap = useRef<Map<string, string>>(new Map());

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
              "You are a helpful AI assistant for Excalidraw, a whiteboard tool. Your task is to generate diagrams for the user in mermaid format and only return the mermaid code and header, no other text. Do not format the mermaid code with backticks. The exact format is 'Here is your diagram for {summary of user query}: {mermaid code}'. Make sure that the 'Here is your diagram part' is gramatically correct with the rest of the text. Also make sure each header is unique.",
          },
          ...messages,
          newMessage,
        ],
        model: "gpt-4.1-nano",
      });

      const responseContent = completion.choices[0].message.content || "";
      const colonIndex = responseContent.indexOf(":");
      const mermaidHeader = `${responseContent.substring(0, colonIndex)}!`;
      const mermaidCode = responseContent.substring(colonIndex + 1).trim();

      // Store the mapping
      mermaidMap.current.set(mermaidHeader, mermaidCode);

      const aiResponse: Message = {
        role: "assistant",
        content: mermaidHeader,
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

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    adjustTextareaHeight();
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
                  const mermaidCode = mermaidMap.current.get(message.content);
                  if (mermaidCode) {
                    insertMermaidToEditor(mermaidCode);
                  }
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
          ref={textareaRef}
          className="ai-chat-input"
          value={input}
          onChange={handleInputChange}
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
