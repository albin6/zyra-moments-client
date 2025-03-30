// components/chat/ChatInterface.tsx
import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useDispatch } from "react-redux";
import { addMessage, setMessages } from "@/store/slices/chatSlice";
import { useSocket } from "@/context/SocketContext";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { uploadToCloudinary } from "@/utils/upload-cloudinary/cloudinary";

interface Message {
  _id: string;
  chatRoomId: string;
  content: string;
  senderId: string;
  senderType: "Client" | "Vendor";
  read: boolean;
  createdAt: Date;
}

interface ChatInterfaceProps {
  recipientName: string;
  recipientAvatar?: string;
  messages?: Message[];
  onSendMessage?: (message: string) => void;
  onTyping?: () => void;
  className?: string;
  userType: "Client" | "Vendor";
  chatRoomId: string;
}

export function ChatInterface({
  recipientName = "John Doe",
  recipientAvatar = "/placeholder.svg?height=40&width=40",
  messages = [],
  onSendMessage,
  onTyping,
  className,
  userType = "Client",
  chatRoomId,
}: ChatInterfaceProps) {
  const dispatch = useDispatch();
  const [newMessage, setNewMessage] = useState("");
  const [isTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const socket = useSocket();

  const userId = useSelector((state: RootState) =>
    userType === "Client" ? state.client.client?.id : state.vendor.vendor?.id
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    console.log("hello", messages);
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    console.log('-----------socket - chat room id - userId-------------', socket, chatRoomId, userId)
    if (socket && chatRoomId && userId) {
      socket.emit("messageRead", { chatRoomId, userId, userType });

      socket.on("message", (message: Message) => {
        dispatch(addMessage(message));
        scrollToBottom();
      });

      socket.on("messagesUpdated", (updatedMessages: Message[]) => {
        console.log("Received messagesUpdated:", updatedMessages); // Debug log
        dispatch(setMessages({ chatRoomId, messages: updatedMessages }));
      });

      socket.on("chatUpdate", (chatRoom: any) => {
        console.log(`${userType} chat updated:`, chatRoom);
      });

      return () => {
        socket.off("message");
        socket.off("messagesUpdated");
        socket.off("chatUpdate");
      };
    }
  }, [socket, chatRoomId, userId, userType, dispatch]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage?.(newMessage);
      setNewMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = () => {
    if (newMessage.trim()) {
      onTyping?.();
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setFilePreview(previewUrl);
      setIsPreviewOpen(true);
    }
    // Reset the input so the same file can be selected again if needed
    e.target.value = "";
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setFilePreview(null);
    setIsPreviewOpen(false);
  };

  const handleSendFile = async () => {
    if (selectedFile) {
      setIsUploading(true);
      try {
        const fileUrl = await uploadToCloudinary(selectedFile);
        onSendMessage?.(fileUrl);
        handleRemoveFile();
      } catch (error) {
        console.error("Failed to upload file:", error);
        // You could add error handling UI here
      } finally {
        setIsUploading(false);
      }
    }
  };

  const isImage = selectedFile?.type.startsWith("image/");

  return (
    <Card className={cn("flex flex-col h-[600px] w-full", className)}>
      <div className="flex items-center p-4 border-b space-x-2">
        <Avatar className="w-12 h-12">
          <AvatarImage src={recipientAvatar} alt={`${recipientName}`} />
          <AvatarFallback>
            {recipientName.split(" ")[0][0].toUpperCase()}
            {recipientName.split(" ")[1][0]
              ? recipientName.split(" ")[1][0].toUpperCase()
              : ""}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium">{recipientName}</h3>
          <p className="text-sm text-muted-foreground">
            {userType === "Client" ? "Vendor" : "Client"}
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-center">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          Array.isArray(messages) &&
          messages.map((message) => (
            <div
              key={message._id}
              className={cn(
                "flex",
                message.senderType === userType
                  ? "justify-end"
                  : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg p-3",
                  message.senderType === userType
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {message.content.startsWith("https://res.cloudinary.com") ? (
                  <img 
                    src={message.content} 
                    alt="Shared image" 
                    className="max-w-full rounded mb-2"
                  />
                ) : (
                  <p className="break-words">{message.content}</p>
                )}
                <p className="text-xs mt-1 opacity-70">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        {isTyping && <p className="text-sm text-muted-foreground">Typing...</p>}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t">
        <div className="flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10 flex-shrink-0"
            type="button"
            onClick={handleFileClick}
          >
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">Attach file</span>
          </Button>
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              handleTyping();
              handleKeyDown(e);
            }}
            placeholder="Type your message..."
            className="min-h-[80px] resize-none"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="rounded-full h-10 w-10 flex-shrink-0 p-0"
            type="button"
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>

      {/* File Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Image</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={handleRemoveFile}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4">
            {isImage && filePreview ? (
              <img
                src={filePreview}
                alt="Preview"
                className="max-h-64 max-w-full rounded"
              />
            ) : (
              <div className="flex items-center justify-center h-64 w-full border rounded bg-muted">
                <p>{selectedFile?.name || "File"}</p>
              </div>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              {selectedFile?.name} ({((selectedFile?.size || 0) / 1024).toFixed(2)} KB)
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={handleRemoveFile}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendFile}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? "Uploading..." : "Send Image"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}