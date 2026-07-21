import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Loader2, Send, Paperclip, X, FileText, MessageSquare, Film, Info, Zap } from 'lucide-react';
import { format } from 'date-fns';

interface Attachment {
  url: string;
  filename: string;
  type: string;
}

interface ClaimMessage {
  id: number;
  claimId: number;
  senderId: number;
  senderRole: string;
  senderName: string;
  message: string;
  attachments: Attachment[] | null;
  createdAt: string;
}

interface ClaimUpdatesProps {
  claimId: number;
  currentRole: 'admin' | 'detailer';
  currentUserId: number;
}

function AttachmentPreview({ att }: { att: Attachment }) {
  const isImage = att.type.startsWith('image/');
  const isVideo = att.type.startsWith('video/');
  const isPdf = att.type === 'application/pdf';

  if (isImage) {
    return (
      <a href={att.url} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={att.url}
          alt={att.filename}
          className="max-h-40 rounded border object-contain bg-gray-50"
        />
        <p className="text-xs text-gray-500 mt-1 truncate max-w-[150px]">{att.filename}</p>
      </a>
    );
  }
  if (isVideo) {
    return (
      <div>
        <video src={att.url} controls className="max-h-40 rounded border" />
        <p className="text-xs text-gray-500 mt-1 truncate max-w-[180px]">{att.filename}</p>
      </div>
    );
  }
  return (
    <a
      href={att.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 rounded border bg-gray-50 hover:bg-gray-100 text-sm text-gray-700 max-w-[200px]"
    >
      {isPdf ? <FileText className="h-4 w-4 text-red-500 flex-shrink-0" /> : <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />}
      <span className="truncate">{att.filename}</span>
    </a>
  );
}

function FilePreviewChip({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const preview = isImage ? URL.createObjectURL(file) : null;

  return (
    <div className="relative flex-shrink-0 group">
      {isImage && preview ? (
        <img src={preview} alt={file.name} className="h-14 w-14 rounded border object-cover" />
      ) : (
        <div className="h-14 w-14 rounded border bg-gray-100 flex flex-col items-center justify-center text-xs text-gray-500 gap-1">
          {isVideo ? <Film className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
          <span className="truncate px-1" style={{ maxWidth: 52 }}>{file.name.split('.').pop()?.toUpperCase()}</span>
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-2.5 w-2.5" />
      </button>
      <p className="text-[10px] text-gray-400 truncate mt-0.5" style={{ maxWidth: 56 }}>{file.name}</p>
    </div>
  );
}

function MessageRow({ msg, currentUserId }: { msg: ClaimMessage; currentUserId: number }) {
  const isMe = msg.senderId === currentUserId;
  const atts = Array.isArray(msg.attachments) ? msg.attachments : [];

  // System status-update banner (grey, compact)
  if (msg.senderRole === 'system') {
    return (
      <div className="px-4 py-2 bg-gray-50">
        <div className="flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500 italic">{msg.message}</span>
          <span className="text-[10px] text-gray-400 ml-auto whitespace-nowrap">
            {format(new Date(msg.createdAt), 'dd MMM yyyy, h:mm a')}
          </span>
        </div>
      </div>
    );
  }

  // ERPNext comment (indigo/purple)
  if (msg.senderRole === 'erpnext') {
    return (
      <div className="px-4 py-3 bg-indigo-50">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="flex items-center gap-1 text-xs font-semibold text-indigo-700">
            <Zap className="h-3 w-3" />
            {msg.senderName}
          </span>
          <Badge variant="outline" className="text-[9px] px-1 py-0 border-indigo-300 text-indigo-600">ERPNext</Badge>
          <span className="text-[10px] text-gray-400 ml-auto">
            {format(new Date(msg.createdAt), 'dd MMM yyyy, h:mm a')}
          </span>
        </div>
        <p className="text-sm text-indigo-900 whitespace-pre-line leading-relaxed">{msg.message}</p>
        {atts.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-2">
            {atts.map((att, i) => <AttachmentPreview key={i} att={att} />)}
          </div>
        )}
      </div>
    );
  }

  // Admin message (blue) or detailer message (white)
  const isAdmin = msg.senderRole === 'admin';
  return (
    <div className={`px-4 py-3 ${isAdmin ? 'bg-blue-50' : 'bg-white'}`}>
      <div className="flex items-baseline gap-2 mb-1">
        <span className={`text-xs font-semibold ${isAdmin ? 'text-blue-700' : 'text-gray-700'}`}>
          {isAdmin ? '🛡 P91 Team' : msg.senderName}
          {isMe && <span className="font-normal text-gray-400 ml-1">(you)</span>}
        </span>
        <span className="text-[10px] text-gray-400 ml-auto">
          {format(new Date(msg.createdAt), 'dd MMM yyyy, h:mm a')}
        </span>
      </div>
      <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{msg.message}</p>
      {atts.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-2">
          {atts.map((att, i) => <AttachmentPreview key={i} att={att} />)}
        </div>
      )}
    </div>
  );
}

export function ClaimUpdates({ claimId, currentRole, currentUserId }: ClaimUpdatesProps) {
  const [messageText, setMessageText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery<ClaimMessage[]>({
    queryKey: ['/api/erp/claims', claimId, 'messages'],
    queryFn: async () => {
      const res = await fetch(`/api/erp/claims/${claimId}/messages`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load messages');
      return res.json();
    },
    enabled: !!claimId,
    refetchInterval: 30000,
  });

  const hasAdminMessage = messages.some(m => ['admin', 'erpnext', 'system'].includes(m.senderRole));
  const canReply = currentRole === 'admin' || hasAdminMessage;

  const sendMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('message', messageText.trim());
      selectedFiles.forEach(f => formData.append('files', f));
      const res = await fetch(`/api/erp/claims/${claimId}/messages`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send message');
      }
      return res.json();
    },
    onSuccess: () => {
      setMessageText('');
      setSelectedFiles([]);
      queryClient.invalidateQueries({ queryKey: ['/api/erp/claims', claimId, 'messages'] });
      toast({ title: 'Message sent' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to send', description: err.message, variant: 'destructive' });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files].slice(0, 5));
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (!messageText.trim()) return;
    sendMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (currentRole === 'detailer' && !hasAdminMessage) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-gray-500" />
        <span className="font-semibold text-sm text-gray-700">Updates</span>
        {messages.length > 0 && (
          <Badge variant="secondary" className="text-xs">{messages.length}</Badge>
        )}
      </div>

      <div className="divide-y max-h-72 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-400">
            {currentRole === 'admin' ? 'No messages yet. Start the conversation.' : 'No updates yet.'}
          </div>
        ) : (
          messages.map(msg => (
            <MessageRow key={msg.id} msg={msg} currentUserId={currentUserId} />
          ))
        )}
      </div>

      {canReply && (
        <div className="px-4 py-3 bg-gray-50 border-t space-y-2">
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {selectedFiles.map((f, i) => (
                <FilePreviewChip key={i} file={f} onRemove={() => removeFile(i)} />
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              placeholder="Write an update or reply..."
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              rows={2}
              className="flex-1 resize-none text-sm"
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="flex flex-col gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="px-2"
                onClick={() => fileInputRef.current?.click()}
                title="Attach file"
                disabled={selectedFiles.length >= 5}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                className="px-2 bg-blue-600 hover:bg-blue-700"
                onClick={handleSend}
                disabled={!messageText.trim() || sendMutation.isPending}
                title="Send (Ctrl+Enter)"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-gray-400">Attach up to 5 files (images, videos, PDFs, documents). Press Ctrl+Enter to send.</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/mp4,video/quicktime,video/webm,application/pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  );
}
