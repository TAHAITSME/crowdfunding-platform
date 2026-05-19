import { useEffect, useMemo, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Send,
  Smile,
  Trash2,
  Copy,
  EyeOff,
  Flag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import {
  addComment,
  deleteComment,
  fetchComments,
  hideComment,
  toggleCommentReaction,
  updateComment,
} from "../../features/comments/commentsSlice";
import Avatar from "../ui/Avatar";

function resizeTextarea(element) {
  if (!element) return;
  element.style.height = "0px";
  element.style.height = `${Math.min(element.scrollHeight, 120)}px`;
}

function CommentComposer({
  value,
  onChange,
  onSubmit,
  placeholder,
  currentUserName,
  currentUserAvatar,
  loading,
  autoFocus = false,
  compact = false,
  onCancel,
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    resizeTextarea(textareaRef.current);
  }, [value]);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (!showEmojiPicker) return undefined;
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const handleEmojiSelect = (emojiData) => {
    const textarea = textareaRef.current;
    const emoji = emojiData.emoji;

    if (!textarea) {
      onChange(`${value}${emoji}`);
      return;
    }

    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const nextValue = `${value.slice(0, start)}${emoji}${value.slice(end)}`;

    onChange(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + emoji.length;
      textarea.setSelectionRange(cursor, cursor);
      resizeTextarea(textarea);
    });
  };

  return (
    <div className={`flex items-end gap-3 rounded-2xl border border-gray-200 bg-white ${compact ? "px-3 py-2.5" : "px-3 py-3"} shadow-sm shadow-gray-100`}>
      <div className="shrink-0">
        <Avatar src={currentUserAvatar} name={currentUserName} size="sm" />
      </div>

      <div className="relative min-w-0 flex-1" ref={emojiPickerRef}>
        <div className="flex items-end gap-2 rounded-2xl bg-gray-50 px-3 py-2 ring-1 ring-transparent transition focus-within:bg-white focus-within:ring-emerald-100">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSubmit();
              }
            }}
            placeholder={placeholder}
            className="max-h-[120px] min-h-[24px] flex-1 resize-none bg-transparent py-1 text-sm leading-6 text-gray-700 outline-none placeholder:text-gray-400"
          />

          <button
            type="button"
            onClick={() => setShowEmojiPicker((open) => !open)}
            className="mb-0.5 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-emerald-500"
            aria-label="Ajouter un emoji"
          >
            <Smile className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || !value.trim()}
            className="mb-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-200 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-200"
            aria-label="Envoyer"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        {onCancel && (
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-semibold text-gray-400 transition hover:text-gray-600"
            >
              Annuler
            </button>
          </div>
        )}

        {showEmojiPicker && (
          <div className="absolute bottom-[calc(100%+12px)] right-0 z-20 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <EmojiPicker
              onEmojiClick={handleEmojiSelect}
              autoFocusSearch={false}
              lazyLoadEmojis
              skinTonesDisabled
              width={320}
              height={360}
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CommentMenu({
  isCommentOwner,
  isPostOwner,
  onEdit,
  onDelete,
  onHide,
  onCopy,
  onReport,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const closeAndRun = (callback) => {
    callback?.();
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-2xl">
          {isCommentOwner && (
            <>
              <MenuItem icon={Pencil} label="Modifier" onClick={() => closeAndRun(onEdit)} />
              <MenuItem icon={Trash2} label="Supprimer" danger onClick={() => closeAndRun(onDelete)} />
            </>
          )}

          {!isCommentOwner && isPostOwner && (
            <>
              <MenuItem icon={EyeOff} label="Masquer le commentaire" danger onClick={() => closeAndRun(onHide)} />
              <MenuItem icon={Flag} label="Signaler" danger onClick={() => closeAndRun(onReport)} />
            </>
          )}

          {!isCommentOwner && !isPostOwner && (
            <MenuItem icon={Flag} label="Signaler" danger onClick={() => closeAndRun(onReport)} />
          )}

          <MenuItem icon={Copy} label="Copier le texte" onClick={() => closeAndRun(onCopy)} />
          <MenuItem label="Annuler" onClick={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, danger = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
        danger ? "text-red-500 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      <span>{label}</span>
    </button>
  );
}

function CommentItem({
  comment,
  postId,
  postOwnerId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  depth = 0,
}) {
  const dispatch = useDispatch();
  const [replyValue, setReplyValue] = useState("");
  const [editingValue, setEditingValue] = useState(comment.content);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const replies = Array.isArray(comment.replies) ? comment.replies : [];
  const isCommentOwner = String(currentUserId) === String(comment.author_id);
  const isPostOwner = String(currentUserId) === String(postOwnerId);
  const authorName = comment.author_full_name || comment.author_username || "Utilisateur";
  const isReply = depth > 0;

  const submitReply = async () => {
    if (!replyValue.trim() || submitting) return;
    setSubmitting(true);
    try {
      await dispatch(addComment({ postId, content: replyValue, parent: comment.id })).unwrap();
      setReplyValue("");
      setShowReplyForm(false);
      setShowReplies(true);
    } catch {
      toast.error("Erreur lors de l'envoi de la reponse");
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async () => {
    if (!editingValue.trim() || submitting) return;
    setSubmitting(true);
    try {
      await dispatch(updateComment({ postId, commentId: comment.id, content: editingValue })).unwrap();
      setEditing(false);
      toast.success("Commentaire modifie");
    } catch {
      toast.error("Erreur lors de la modification");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer ce commentaire ?")) return;
    try {
      await dispatch(deleteComment({ postId, commentId: comment.id })).unwrap();
      toast.success("Commentaire supprime");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleHide = async () => {
    if (!confirm("Masquer ce commentaire ?")) return;
    try {
      await dispatch(hideComment({ postId, commentId: comment.id })).unwrap();
      toast.success("Commentaire masque");
    } catch {
      toast.error("Erreur lors du masquage");
    }
  };

  const handleReact = async () => {
    try {
      await dispatch(toggleCommentReaction({ postId, commentId: comment.id })).unwrap();
    } catch {
      toast.error("Erreur lors de la reaction");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(comment.content || "");
      toast.success("Texte copie");
    } catch {
      toast.error("Impossible de copier le texte");
    }
  };

  const handleReport = () => {
    toast.success("Commentaire signale");
  };

  return (
    <div className={`${isReply ? "ml-6 border-l border-gray-100 pl-4 sm:ml-8 sm:pl-5" : ""}`}>
      <div className="group flex items-start gap-3">
        <div className="pt-0.5">
          <Avatar src={comment.author_avatar} name={authorName} size="sm" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm shadow-gray-100/60">
            <div className="mb-1.5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{authorName}</p>
                <p className="text-[11px] font-medium text-gray-400">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </p>
              </div>

              <CommentMenu
                isCommentOwner={isCommentOwner}
                isPostOwner={isPostOwner}
                onEdit={() => setEditing(true)}
                onDelete={handleDelete}
                onHide={handleHide}
                onCopy={handleCopy}
                onReport={handleReport}
              />
            </div>

            {editing ? (
              <div className="mt-2">
                <CommentComposer
                  value={editingValue}
                  onChange={setEditingValue}
                  onSubmit={submitEdit}
                  placeholder="Modifier votre commentaire..."
                  currentUserName={currentUserName}
                  currentUserAvatar={currentUserAvatar}
                  loading={submitting}
                  compact
                  autoFocus
                  onCancel={() => {
                    setEditing(false);
                    setEditingValue(comment.content);
                  }}
                />
              </div>
            ) : (
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                {comment.content}
              </p>
            )}

            {!editing && (
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold">
                <button
                  type="button"
                  onClick={handleReact}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 transition ${
                    comment.is_reacted
                      ? "bg-rose-50 text-rose-500"
                      : "text-gray-400 hover:bg-gray-50 hover:text-rose-500"
                  }`}
                >
                  <Heart
                    className={`h-3.5 w-3.5 transition ${comment.is_reacted ? "fill-current scale-110" : ""}`}
                  />
                  {comment.reactions_count || 0}
                </button>

                {!isReply && (
                  <button
                    type="button"
                    onClick={() => setShowReplyForm((value) => !value)}
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-gray-400 transition hover:bg-gray-50 hover:text-emerald-600"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Repondre
                  </button>
                )}

                {replies.length > 0 && !isReply && (
                  <button
                    type="button"
                    onClick={() => setShowReplies((value) => !value)}
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
                  >
                    {showReplies ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {showReplies ? "Masquer les reponses" : `Voir les reponses (${replies.length})`}
                  </button>
                )}
              </div>
            )}
          </div>

          {showReplyForm && !isReply && (
            <div className="mt-3">
              <CommentComposer
                value={replyValue}
                onChange={setReplyValue}
                onSubmit={submitReply}
                placeholder={`Repondre a ${authorName}...`}
                currentUserName={currentUserName}
                currentUserAvatar={currentUserAvatar}
                loading={submitting}
                compact
                autoFocus
                onCancel={() => {
                  setShowReplyForm(false);
                  setReplyValue("");
                }}
              />
            </div>
          )}

          {showReplies && replies.length > 0 && !isReply && (
            <div className="mt-3 space-y-3">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  postOwnerId={postOwnerId}
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  currentUserAvatar={currentUserAvatar}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentSection({ postId, postOwnerId }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const profile = useSelector((state) => state.profile.data);
  const comments = useSelector((state) => state.comments.byPost[postId] || []);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchComments(postId));
  }, [dispatch, postId]);

  const currentUserName = useMemo(
    () => profile?.full_name || user?.full_name || user?.username || "Utilisateur",
    [profile?.full_name, user?.full_name, user?.username]
  );
  const currentUserAvatar = profile?.avatar || null;

  const handleSubmit = async () => {
    if (!value.trim() || loading) return;
    setLoading(true);
    try {
      await dispatch(addComment({ postId, content: value })).unwrap();
      setValue("");
    } catch {
      toast.error("Erreur lors de l'envoi du commentaire");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-gray-100 mt-2 px-4 pb-4 pt-3">
      <div className="mb-4 space-y-3 max-h-[32rem] overflow-y-auto pr-1">
        {comments.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center">
            <p className="text-sm font-semibold text-gray-500">
              Aucun commentaire pour le moment
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Lancez la discussion avec le premier commentaire.
            </p>
          </div>
        )}

        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            postOwnerId={postOwnerId}
            currentUserId={user?.id}
            currentUserName={currentUserName}
            currentUserAvatar={currentUserAvatar}
          />
        ))}
      </div>

      <CommentComposer
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        placeholder="Ecrire un commentaire..."
        currentUserName={currentUserName}
        currentUserAvatar={currentUserAvatar}
        loading={loading}
      />
    </div>
  );
}
