/**
 * 会话列表组件
 */

import { Conversation } from "../stores/imStore";

interface ConversationListProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onSelect: (conversation: Conversation) => void;
}

export function ConversationList({
  conversations,
  currentConversation,
  onSelect,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm md:text-base">
        暂无会话
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map((conversation) => {
        const isActive = currentConversation?.id === conversation.id;

        return (
          <div
            key={conversation.id}
            onClick={() => onSelect(conversation)}
            className={`p-3 md:p-4 cursor-pointer transition-colors active:bg-gray-100 touch-manipulation ${
              isActive ? "bg-blue-50 border-blue-600" : "hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start space-x-3">
              {/* 头像 */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-base md:text-lg">
                  {conversation.name?.[0]?.toUpperCase() || "C"}
                </div>
                {conversation.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {conversation.unreadCount > 99
                      ? "99+"
                      : conversation.unreadCount}
                  </div>
                )}
              </div>

              {/* 会话信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-gray-900 truncate text-sm md:text-base">
                    {conversation.name || "未命名会话"}
                  </h3>
                  {conversation.lastMessage && (
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatTime(conversation.lastMessage.createdAt)}
                    </span>
                  )}
                </div>

                {conversation.lastMessage && (
                  <div className="flex items-center text-xs md:text-sm text-gray-600">
                    <span className="truncate">
                      {conversation.lastMessage.type === "text"
                        ? conversation.lastMessage.content
                        : conversation.lastMessage.type === "image"
                        ? "[图片]"
                        : conversation.lastMessage.type === "video"
                        ? "[视频]"
                        : "[消息]"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 格式化时间
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 小于 1 分钟
  if (diff < 60 * 1000) {
    return "刚刚";
  }

  // 小于 1 小时
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`;
  }

  // 今天
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "昨天";
  }

  // 本周
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    return days[date.getDay()];
  }

  // 更早
  return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}
