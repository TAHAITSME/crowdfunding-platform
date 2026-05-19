import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Flag,
  Heart,
  Info,
  Link2,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Send,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import { checkIsFollowing, toggleFollow } from "../../features/follow/followSlice";
import { deletePost, toggleLike, toggleRepost, toggleSavePost } from "../../features/posts/postsSlice";
import api from "../../services/api";
import CommentSection from "../comments/CommentSection";

function getInitials(name = "") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function extractApiError(error, fallback) {
  const payload = error?.response?.data;
  if (typeof payload === "string" && payload.trim()) return payload;
  if (payload?.error) return payload.error;
  if (payload?.detail) return payload.detail;
  if (payload?.shared_post) return Array.isArray(payload.shared_post) ? payload.shared_post[0] : payload.shared_post;
  return fallback;
}

function buildMediaList(post) {
  const items = Array.isArray(post?.media_items) ? [...post.media_items] : [];
  if (items.length > 0) return items.filter(Boolean);
  if (post?.media) return [{ id: `${post.id}-legacy`, url: post.media }];
  return [];
}

function isVideoUrl(url = "") {
  return /\.(mp4|webm|ogg|mov)$/i.test(url);
}

function isImageUrl(url = "") {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
}

const HASHTAG_PATTERN = /#[\p{L}\p{N}_-]+/gu;

function PostText({ children, className = "" }) {
  const value = children || "";
  const parts = value.split(HASHTAG_PATTERN);
  const tags = value.match(HASHTAG_PATTERN) || [];

  return (
    <p className={`whitespace-pre-wrap text-[15px] leading-7 ${className}`}>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          {part}
          {tags[index] ? (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("posts:filter-hashtag", { detail: tags[index].toLowerCase() }))}
              className="rounded-md bg-emerald-50 px-0.5 font-extrabold text-emerald-600 transition hover:bg-emerald-100 hover:text-emerald-700"
            >
              {tags[index]}
            </button>
          ) : null}
        </span>
      ))}
    </p>
  );
}

function AvatarChip({ author, size = "md" }) {
  const sizes = {
    sm: "h-9 w-9 text-sm rounded-full",
    md: "h-11 w-11 text-base rounded-2xl",
  };

  return author?.avatar ? (
    <img
      src={author.avatar}
      alt={author.full_name || author.username}
      className={`${sizes[size]} object-cover ring-1 ring-black/5`}
    />
  ) : (
    <div className={`${sizes[size]} flex items-center justify-center bg-emerald-100 font-black text-emerald-700`}>
      {getInitials(author?.full_name || author?.username || "U")}
    </div>
  );
}

function ActionSheet({ open, title, onClose, actions }) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120]">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Fermer"
      />

      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-[28px] border border-black/5 bg-white p-3 shadow-2xl sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px]">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-gray-200 sm:hidden" />
        {title && <p className="px-3 pb-2 text-center text-sm font-semibold text-gray-500">{title}</p>}

        <div className="space-y-1">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => {
                action.onClick?.();
                if (!action.keepOpen) onClose();
              }}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                action.danger
                  ? "text-red-500 hover:bg-red-50"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {action.icon ? <action.icon className="h-4 w-4 shrink-0" /> : null}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MediaGallery({ items, alt }) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef(null);

  const scrollToIndex = (nextIndex) => {
    const container = scrollRef.current;
    if (!container) return;
    const clamped = Math.max(0, Math.min(nextIndex, items.length - 1));
    const width = container.clientWidth;
    container.scrollTo({ left: width * clamped, behavior: "smooth" });
    setIndex(clamped);
  };

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    const width = container.clientWidth || 1;
    setIndex(Math.round(container.scrollLeft / width));
  };

  if (items.length === 0) return null;

  if (items.length === 1) {
    const media = items[0];
    if (isVideoUrl(media.url)) {
      return <video src={media.url} controls className="max-h-[560px] w-full bg-black object-cover" />;
    }
    if (isImageUrl(media.url)) {
      return <img src={media.url} alt={alt} className="max-h-[640px] w-full bg-gray-50 object-cover" />;
    }
    return (
      <a
        href={media.url}
        target="_blank"
        rel="noreferrer"
        className="m-5 flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700"
      >
        <span className="truncate">{media.url.split("/").pop()}</span>
        <ExternalLink className="h-4 w-4 shrink-0" />
      </a>
    );
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((media) => (
          <div key={media.id || media.url} className="w-full shrink-0 snap-center bg-black">
            <img src={media.url} alt={alt} className="max-h-[640px] w-full object-contain" />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scrollToIndex(index - 1)}
        disabled={index === 0}
        className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-lg transition hover:bg-white disabled:opacity-40 sm:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => scrollToIndex(index + 1)}
        disabled={index === items.length - 1}
        className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-lg transition hover:bg-white disabled:opacity-40 sm:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/35 px-2 py-1">
        {items.map((media, mediaIndex) => (
          <button
            key={`${media.id || media.url}-dot`}
            type="button"
            onClick={() => scrollToIndex(mediaIndex)}
            className={`h-2 w-2 rounded-full transition ${
              mediaIndex === index ? "bg-white" : "bg-white/45"
            }`}
            aria-label={`Aller au media ${mediaIndex + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function SharePostModal({ open, onClose, postId }) {
  const [friends, setFriends] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    api.get("/friends/")
      .then((res) => setFriends(Array.isArray(res.data) ? res.data : []))
      .catch(() => setFriends([]));
  }, [open]);

  if (!open) return null;

  const filteredFriends = friends.filter((item) => {
    const friend = item.friend;
    const name = `${friend?.full_name || ""} ${friend?.username || ""}`.toLowerCase();
    return name.includes(query.toLowerCase());
  });

  const toggleSelection = (friendId) => {
    setSelectedIds((current) =>
      current.includes(friendId)
        ? current.filter((id) => id !== friendId)
        : [...current, friendId]
    );
  };

  const handleShare = async () => {
    if (selectedIds.length === 0 || loading) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map(async (friendId) => {
        const conv = await api.post("/messaging/start/", { user_id: friendId });
        await api.post(`/messaging/conversations/${conv.data.id}/messages/`, {
          content: message,
          shared_post: String(postId),
        });
      }));

      toast.success("Post partage avec succes");
      setSelectedIds([]);
      setQuery("");
      setMessage("");
      onClose();
      window.dispatchEvent(new Event("messaging:refresh"));
    } catch (error) {
      toast.error(extractApiError(error, "Erreur lors du partage du post"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130]">
      <button type="button" className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-black/5 bg-white p-5 shadow-2xl">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900">Partager avec des amis</h3>
          <p className="mt-1 text-sm text-gray-400">Selectionnez une ou plusieurs personnes.</p>
        </div>

        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher un ami..."
          className="mb-3 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
        />

        <div className="max-h-64 space-y-2 overflow-y-auto">
          {filteredFriends.map((item) => {
            const friend = item.friend;
            const selected = selectedIds.includes(friend.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleSelection(friend.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                  selected
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <AvatarChip author={friend} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {friend.full_name || friend.username}
                  </p>
                  <p className="truncate text-xs text-gray-400">@{friend.username}</p>
                </div>
                {selected && <Check className="h-4 w-4 text-emerald-600" />}
              </button>
            );
          })}
        </div>

        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          placeholder="Ajouter un message (optionnel)..."
          className="mt-4 w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={loading || selectedIds.length === 0}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-200"
          >
            <Send className="h-4 w-4" />
            {loading ? "Partage..." : "Partager"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PostCard({ post }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const followState = useSelector((state) => state.follow.followingStatus);

  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const displayPost = post.original_post_data || post;
  const isOwner = String(user?.id) === String(post.author?.id);
  const isFollowed = followState[displayPost.author?.id];
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr });
  const displayMedia = useMemo(() => buildMediaList(displayPost), [displayPost]);
  const hasLocation = displayPost.location_lat && displayPost.location_lng;
  const postUrl = `${window.location.origin}/posts/${displayPost.id}`;

  useEffect(() => {
    if (!showMenu || !displayPost.author?.id || isOwner) return;
    dispatch(checkIsFollowing(displayPost.author.id));
  }, [dispatch, displayPost.author?.id, isOwner, showMenu]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      toast.success("Lien copie");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer cette publication ?")) return;
    try {
      await dispatch(deletePost(post.id)).unwrap();
      toast.success("Publication supprimee");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleToggleFollow = async () => {
    try {
      await dispatch(toggleFollow(displayPost.author.id)).unwrap();
    } catch {
      toast.error("Erreur lors du suivi");
    }
  };

  const menuActions = isOwner
    ? [
        { label: "Modifier la publication", icon: MoreHorizontal, onClick: () => toast("Edition bientot disponible"), keepOpen: false },
        { label: "Supprimer la publication", icon: Trash2, onClick: handleDelete, danger: true },
        { label: "Copier le lien", icon: Link2, onClick: handleCopyLink },
        { label: "Annuler", onClick: () => {} },
      ]
    : [
        { label: "Signaler", icon: Flag, onClick: () => toast.success("Publication signalee"), danger: true },
        {
          label: isFollowed ? "Ne plus suivre" : "Suivre",
          icon: isFollowed ? UserMinus : UserPlus,
          onClick: handleToggleFollow,
          danger: Boolean(isFollowed),
        },
        {
          label: displayPost.is_saved ? "Retirer des sauvegardes" : "Ajouter aux sauvegardes",
          icon: Bookmark,
          onClick: () => dispatch(toggleSavePost(displayPost.id)),
        },
        { label: "Partager", icon: Send, onClick: () => setShowShareModal(true) },
        { label: "Copier le lien", icon: Copy, onClick: handleCopyLink },
        {
          label: "Aller a la publication",
          icon: ExternalLink,
          onClick: () => navigate(`/posts/${displayPost.id}`),
        },
        {
          label: "A propos de ce compte",
          icon: Info,
          onClick: () => navigate(`/profile/${displayPost.author?.id}`),
        },
        { label: "Annuler", onClick: () => {} },
      ];

  return (
    <>
      <article
        id={`post-${displayPost.id}`}
        className="mb-5 overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
      >
        {post.is_repost && (
          <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/80 px-5 py-3 text-xs font-semibold text-gray-500">
            <Repeat2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>{post.author?.full_name || post.author?.username} a republie</span>
          </div>
        )}

        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="flex min-w-0 items-start gap-3">
            <Link to={`/profile/${displayPost.author?.id}`} className="shrink-0">
              <AvatarChip author={displayPost.author} />
            </Link>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/profile/${displayPost.author?.id}`}
                  className="truncate text-sm font-bold text-gray-900 transition hover:text-emerald-600"
                >
                  {displayPost.author?.full_name || displayPost.author?.username}
                </Link>
                <span className="text-xs text-gray-400">@{displayPost.author?.username}</span>
                <span className="text-xs text-gray-300">•</span>
                <span className="text-xs font-medium text-gray-400">{timeAgo}</span>
              </div>
              {displayPost.tagged_association_name && (
                <p className="mt-1 text-xs font-semibold text-emerald-600">
                  Association: {displayPost.tagged_association_name}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowMenu(true)}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        {post.is_repost && post.content && (
          <div className="px-5 pt-4">
            <PostText className="text-gray-700">{post.content}</PostText>
          </div>
        )}

        <div className={`px-5 ${post.is_repost && post.content ? "pt-4" : "pt-3"} pb-4`}>
          <PostText className="text-gray-800">{displayPost.content}</PostText>
        </div>

        {displayMedia.length > 0 && (
          <MediaGallery items={displayMedia} alt={displayPost.content || "Media de publication"} />
        )}

        {hasLocation && (
          <div className="mx-5 my-4 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="truncate text-sm font-semibold text-gray-700">
                  {displayPost.location_name || "Lieu partage"}
                </span>
              </div>
              <a
                href={`https://www.openstreetmap.org/?mlat=${displayPost.location_lat}&mlon=${displayPost.location_lng}#map=15/${displayPost.location_lat}/${displayPost.location_lng}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
              >
                Ouvrir
              </a>
            </div>
            <iframe
              title={`Carte ${displayPost.id}`}
              className="h-48 w-full"
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${displayPost.location_lng - 0.01}%2C${displayPost.location_lat - 0.01}%2C${displayPost.location_lng + 0.01}%2C${displayPost.location_lat + 0.01}&layer=mapnik&marker=${displayPost.location_lat}%2C${displayPost.location_lng}`}
            />
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
          <div className="flex flex-wrap items-center gap-1">
            <ActionButton
              active={displayPost.is_liked}
              activeClassName="bg-rose-50 text-rose-500"
              onClick={() => dispatch(toggleLike(displayPost.id))}
              icon={<Heart className={`h-4 w-4 ${displayPost.is_liked ? "fill-current scale-110" : ""}`} />}
              label={displayPost.likes_count || 0}
            />

            <ActionButton
              active={showComments}
              activeClassName="bg-emerald-50 text-emerald-600"
              onClick={() => setShowComments((value) => !value)}
              icon={<MessageCircle className="h-4 w-4" />}
              label={displayPost.comments_count || 0}
            />

            <ActionButton
              active={displayPost.is_reposted}
              activeClassName="bg-sky-50 text-sky-600"
              onClick={() => dispatch(toggleRepost(displayPost.id))}
              icon={<Repeat2 className="h-4 w-4" />}
              label={displayPost.reposts_count || 0}
            />

            <ActionButton
              onClick={() => setShowShareModal(true)}
              icon={<Send className="h-4 w-4" />}
              label="Partager"
            />
          </div>

          <button
            type="button"
            onClick={() => dispatch(toggleSavePost(displayPost.id))}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl transition ${
              displayPost.is_saved
                ? "bg-amber-50 text-amber-500"
                : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            }`}
          >
            <Bookmark className={`h-4 w-4 ${displayPost.is_saved ? "fill-current" : ""}`} />
          </button>
        </div>

        {showComments && (
          <CommentSection postId={displayPost.id} postOwnerId={displayPost.author?.id} />
        )}
      </article>

      <ActionSheet
        open={showMenu}
        title="Options de publication"
        onClose={() => setShowMenu(false)}
        actions={menuActions}
      />

      <SharePostModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        postId={displayPost.id}
      />
    </>
  );
}

function ActionButton({ icon, label, onClick, active = false, activeClassName = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition ${
        active ? activeClassName : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
