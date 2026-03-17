import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toggleLike } from "../../features/posts/postsSlice";
import Avatar from "../ui/Avatar";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import CommentSection from "../comments/CommentSection";

export default function PostCard({ post }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [showComments, setShowComments] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar name={post.author?.username || "U"} size="md" online />
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {post.author?.username}
            </p>
            <p className="text-xs text-gray-400">{timeAgo}</p>
          </div>
        </div>
        <button className="p-1.5 rounded-xl hover:bg-gray-100 transition">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      {post.content && (
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          {post.content}
        </p>
      )}
      {post.media && (
        <img
          src={`http://localhost:8000${post.media}`}
          alt=""
          className="w-full rounded-xl object-cover max-h-80 mb-3"
        />
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <div className="flex gap-1">
          <button
            onClick={() => dispatch(toggleLike(post.id))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition
              ${post.is_liked ? "text-red-500 bg-red-50" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <Heart
              className={`w-4 h-4 ${post.is_liked ? "fill-red-500" : ""}`}
            />
            {post.likes_count || 0}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition
              ${showComments ? "text-green-600 bg-green-50" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <MessageCircle className="w-4 h-4" />
            {post.comments_count || 0}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-500 hover:bg-gray-50 transition">
            <Share2 className="w-4 h-4" />
            Partager
          </button>
        </div>
        <button className="p-1.5 rounded-xl hover:bg-gray-50 transition">
          <Bookmark className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Comments */}
      {showComments && <CommentSection postId={post.id} />}
    </div>
  );
}
