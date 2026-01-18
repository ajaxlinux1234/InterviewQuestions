/**
 * 消息输入框组件
 */

import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { useImStore } from "../stores/imStore";
import { socketService } from "../services/socketService";
import { uploadImage, uploadVideo } from "../services/imApi";

interface MessageInputProps {
  conversationId: number;
}

export function MessageInput({ conversationId }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { addMessage } = useImStore();

  // 自动调整输入框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // 处理输入
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // 发送正在输入状态
    socketService.typing(conversationId);

    // 清除之前的定时器
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 3 秒后发送停止输入状态
    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTyping(conversationId);
    }, 3000);
  };

  // 处理发送
  const handleSend = () => {
    if (!content.trim()) {
      return;
    }

    const tempId = `temp_${Date.now()}`;
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    // 创建临时消息
    const tempMessage = {
      id: 0,
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.username,
      senderAvatar: currentUser.email,
      type: "text" as const,
      content: content.trim(),
      status: "sending" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tempId,
    };

    // 添加到消息列表
    addMessage(tempMessage);

    // 通过 WebSocket 发送
    socketService.sendMessage({
      conversationId,
      type: "text",
      content: content.trim(),
      tempId,
    });

    // 清空输入框
    setContent("");

    // 发送停止输入状态
    socketService.stopTyping(conversationId);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("只支持图片和视频文件");
      return;
    }

    // 检查文件大小
    const maxSize = isImage ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`文件大小不能超过 ${isImage ? "5MB" : "50MB"}`);
      return;
    }

    setIsUploading(true);

    try {
      // 上传文件
      const uploadFn = isImage ? uploadImage : uploadVideo;
      const result: any = await uploadFn(file);

      if (result.success && result.data) {
        const tempId = `temp_${Date.now()}`;
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

        // 创建临时消息
        const tempMessage = {
          id: 0,
          conversationId,
          senderId: currentUser.id,
          senderName: currentUser.username,
          senderAvatar: currentUser.email,
          type: isImage ? ("image" as const) : ("video" as const),
          mediaUrl: result.data.url,
          mediaSize: result.data.size,
          status: "sending" as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tempId,
        };

        // 添加到消息列表
        addMessage(tempMessage);

        // 通过 WebSocket 发送
        socketService.sendMessage({
          conversationId,
          type: isImage ? "image" : "video",
          mediaUrl: result.data.url,
          mediaSize: result.data.size,
          tempId,
        });

        toast.success("文件上传成功");
      }
    } catch (error: any) {
      console.error("文件上传失败:", error);
      toast.error(error.response?.data?.message || "文件上传失败");
    } finally {
      setIsUploading(false);
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-3 md:p-4">
      <div className="flex items-end space-x-2">
        {/* 工具栏 */}
        <div className="flex items-center space-x-1 md:space-x-2">
          {/* 文件上传按钮 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
            title="上传图片或视频"
          >
            {isUploading ? (
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* 输入框 */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={(e) => e.stopPropagation()}
          placeholder="输入消息..."
          className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 md:px-4 md:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-24 md:max-h-32 text-sm md:text-base"
          rows={1}
        />

        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={!content.trim()}
          className="px-4 py-2 md:px-6 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation text-sm md:text-base"
        >
          发送
        </button>
      </div>

      <div className="mt-2 text-xs text-gray-500 hidden md:block">
        提示：Enter 发送，Shift+Enter 换行
      </div>
    </div>
  );
}
