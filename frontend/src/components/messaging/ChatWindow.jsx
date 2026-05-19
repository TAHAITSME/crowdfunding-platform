import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronDown,
  MapPin,
  Mic,
  MoreVertical,
  Pause,
  Paperclip,
  Phone,
  Play,
  Send,
  Smile,
  Square,
  Video,
  Volume2,
  X,
} from "lucide-react";

import api from "../../services/api";
import CallOverlay from "./CallOverlay";
import { resolveMediaUrl } from "../../utils/backend";

const MESSAGE_POLL_INTERVAL = 3000;
const CALL_POLL_INTERVAL = 1500;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const RTC_CONFIGURATION = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/webm",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
];

const PALETTES = [
  "from-emerald-400 to-teal-500",
  "from-sky-400 to-blue-500",
  "from-violet-400 to-purple-500",
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
  "from-cyan-400 to-sky-500",
];
const AUDIO_WAVE_BARS = [8, 15, 11, 19, 12, 18, 9, 16, 13, 21, 10, 17, 12, 20, 11, 15, 9, 18, 12, 16, 10, 19];

function getAvatarPalette(name = "") {
  return PALETTES[(name.charCodeAt(0) || 0) % PALETTES.length];
}

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

function formatMsgTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLabel(dateStr) {
  const day = new Date(dateStr);
  const now = new Date();
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diff = nowStart - dayStart;

  if (diff === 0) return "Aujourd'hui";
  if (diff === 86_400_000) return "Hier";

  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function groupMessagesByDate(messages) {
  const groups = {};
  messages.forEach((msg) => {
    const key = new Date(msg.created_at).toDateString();
    if (!groups[key]) groups[key] = { label: formatDateLabel(msg.created_at), msgs: [] };
    groups[key].msgs.push(msg);
  });
  return Object.values(groups);
}

function sharedPostImage(preview) {
  if (!preview) return null;
  if (Array.isArray(preview.media_items) && preview.media_items.length > 0) {
    return preview.media_items[0]?.url || null;
  }
  return preview.media || null;
}

function buildAbsoluteMediaUrl(url) {
  return resolveMediaUrl(url);
}

function guessMediaKind(messageType, url = "", mimeType = "") {
  if (messageType === "image" || /^image\//i.test(mimeType) || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url)) {
    return "image";
  }
  if (messageType === "video" || /^video\//i.test(mimeType) || /\.(mp4|webm|ogg|mov)$/i.test(url)) {
    return "video";
  }
  if (messageType === "audio" || /^audio\//i.test(mimeType) || /\.(mp3|wav|m4a|aac|webm)$/i.test(url)) {
    return "audio";
  }
  return "file";
}

function formatCallDuration(totalSeconds) {
  const seconds = Math.max(0, totalSeconds | 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function formatAudioTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds || 0));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function getSupportedAudioMimeType() {
  if (typeof window === "undefined" || !window.MediaRecorder) return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];
  return candidates.find((mimeType) => window.MediaRecorder.isTypeSupported?.(mimeType)) || "";
}

function extractApiError(error, fallback) {
  const payload = error?.response?.data;
  if (typeof payload === "string" && payload.trim()) return payload;
  if (payload?.error) return payload.error;
  if (payload?.detail) return payload.detail;
  if (payload?.shared_post) return Array.isArray(payload.shared_post) ? payload.shared_post[0] : payload.shared_post;
  return fallback;
}

function isTrustedLocalOrigin(hostname = "") {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function getCallCompatibilityMessage(callType) {
  if (typeof window === "undefined") {
    return "Les appels nécessitent un navigateur compatible et une connexion sécurisée HTTPS.";
  }

  if (!window.RTCPeerConnection) {
    return "Les appels ne sont pas pris en charge par ce navigateur.";
  }

  const { hostname, protocol, origin } = window.location;
  const isSecureOrigin = window.isSecureContext || (protocol === "http:" && isTrustedLocalOrigin(hostname));

  if (!isSecureOrigin) {
    const mediaLabel = callType === "video" ? "microphone et caméra" : "microphone";
    return `Les appels nécessitent un navigateur compatible et une connexion sécurisée HTTPS. L'adresse actuelle (${origin}) ne permet pas l'accès au ${mediaLabel} sur mobile.`;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return "Les appels nécessitent un navigateur compatible et une connexion sécurisée HTTPS.";
  }

  return "";
}

function getMediaAccessErrorMessage(error, callType) {
  const compatibilityMessage = getCallCompatibilityMessage(callType);
  if (compatibilityMessage) return compatibilityMessage;

  const mediaLabel = callType === "video" ? "le microphone et la caméra" : "le microphone";
  const errorName = error?.name || "";

  if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
    return `Accès refusé à ${mediaLabel}. Autorise ${mediaLabel} dans le navigateur puis réessaie.`;
  }

  if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
    return callType === "video"
      ? "Aucun microphone ou aucune caméra disponible sur cet appareil."
      : "Aucun microphone disponible sur cet appareil.";
  }

  if (errorName === "NotReadableError" || errorName === "TrackStartError") {
    return `Impossible d'utiliser ${mediaLabel}. Il est peut-être déjà utilisé par une autre application.`;
  }

  if (errorName === "SecurityError") {
    return "Les appels nécessitent un navigateur compatible et une connexion sécurisée HTTPS.";
  }

  if (errorName === "OverconstrainedError" || errorName === "ConstraintNotSatisfiedError") {
    return "Cet appareil ne prend pas en charge les contraintes audio/vidéo demandées pour cet appel.";
  }

  return `Impossible d'accéder à ${mediaLabel}. Vérifie les permissions du navigateur et réessaie.`;
}

function getOtherParticipant(conv, currentUserId) {
  return conv.participants?.find((participant) => participant.id !== currentUserId) || {};
}

function buildSenderMeta(message, isMine, currentUser) {
  if (isMine) {
    return {
      name: currentUser.fullName,
      avatar: currentUser.avatar,
    };
  }

  const sender = typeof message.sender === "object" ? message.sender : null;
  const senderName = sender
    ? `${sender.first_name || ""} ${sender.last_name || ""}`.trim() || sender.full_name || sender.username
    : "";

  return {
    name: senderName || "Utilisateur",
    avatar: buildAbsoluteMediaUrl(sender?.avatar),
  };
}

function isStandaloneAudioMessage(message) {
  return message?.message_type === "audio" && !message?.content && !message?.location;
}

function mergeMessagesWithOptimistic(serverMessages, currentMessages) {
  const optimisticMessages = currentMessages.filter((message) => message.is_optimistic);
  if (optimisticMessages.length === 0) return serverMessages;

  const merged = [...serverMessages];

  optimisticMessages.forEach((optimistic) => {
    const alreadyExists = serverMessages.some((message) => {
      const sameSender = message.sender === optimistic.sender || message.sender?.id === optimistic.sender;
      const sameText = (message.content || "") === (optimistic.content || "");
      const sameType = (message.message_type || "text") === (optimistic.message_type || "text");
      const sameFile = (message.file_name || "") === (optimistic.file_name || "");
      return sameSender && sameText && sameType && sameFile;
    });

    if (!alreadyExists) merged.push(optimistic);
  });

  return merged.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

function InlineAvatar({ name = "", src = null, size = "md" }) {
  const palette = getAvatarPalette(name);
  const sizeClass = size === "sm" ? "h-6 w-6 text-[9px]" : "h-9 w-9 text-sm";

  if (src) {
    return <img src={src} alt={name} className={`${sizeClass} shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm`} />;
  }

  return (
    <div
      className={`${sizeClass} shrink-0 rounded-full bg-gradient-to-br ${palette} text-white font-bold flex items-center justify-center ring-2 ring-white shadow-sm`}
    >
      {getInitials(name)}
    </div>
  );
}

function BubbleSkeleton({ reverse = false }) {
  return (
    <div className={`flex items-end gap-2 ${reverse ? "flex-row-reverse" : ""}`}>
      <div className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-slate-200" />
      <div className={`h-9 rounded-2xl bg-slate-200 animate-pulse ${reverse ? "w-36" : "w-48"}`} />
    </div>
  );
}

function MediaPreview({ message, isMine }) {
  const mediaUrl = buildAbsoluteMediaUrl(message.media_url || message.media);
  const mediaKind = guessMediaKind(message.message_type || "text", mediaUrl || "", message.media_type || "");

  if (!mediaUrl) return null;

  if (mediaKind === "image") {
    return (
      <a href={mediaUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl">
        <img
          src={mediaUrl}
          alt={message.file_name || "Image partagee"}
          className="max-h-72 w-full rounded-2xl object-cover transition duration-200 hover:scale-[1.01]"
        />
      </a>
    );
  }

  if (mediaKind === "video") {
    return <video src={mediaUrl} controls className="max-h-80 w-full rounded-2xl bg-black" />;
  }

  if (mediaKind === "audio") {
    return (
      <AudioMessagePlayer
        src={mediaUrl}
        isMine={isMine}
        fileName={message.file_name}
      />
    );
  }

  return (
    <a
      href={mediaUrl}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center justify-between rounded-2xl border p-3 text-xs font-semibold transition ${
        isMine
          ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
      }`}
    >
      <span className="truncate">{message.file_name || "Fichier partage"}</span>
      <span>Ouvrir</span>
    </a>
  );
}

function AudioMessagePlayer({ src, isMine, fileName = "Message vocal", compact = false }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const syncTime = () => setCurrentTime(audio.currentTime || 0);
    const syncMeta = () => setDuration(audio.duration || 0);
    const syncEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    audio.addEventListener("timeupdate", syncTime);
    audio.addEventListener("loadedmetadata", syncMeta);
    audio.addEventListener("durationchange", syncMeta);
    audio.addEventListener("ended", syncEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", syncTime);
      audio.removeEventListener("loadedmetadata", syncMeta);
      audio.removeEventListener("durationchange", syncMeta);
      audio.removeEventListener("ended", syncEnded);
    };
  }, [src]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      await audio.play();
      setIsPlaying(true);
      return;
    }

    audio.pause();
    setIsPlaying(false);
  };

  const handleSeek = (event) => {
    const audio = audioRef.current;
    if (!audio) return;
    const value = Number(event.target.value);
    audio.currentTime = value;
    setCurrentTime(value);
  };

  const progressRatio = duration > 0 ? currentTime / duration : 0;
  const activeBars = Math.round(progressRatio * AUDIO_WAVE_BARS.length);

  return (
    <div
      className={`w-full max-w-[360px] rounded-[24px] border px-3 py-2.5 ${
        isMine
          ? "border-emerald-400/40 bg-emerald-500 text-white shadow-[0_10px_24px_rgba(16,185,129,0.22)]"
          : "border-slate-200 bg-white text-slate-700 shadow-[0_8px_22px_rgba(15,23,42,0.08)]"
      } ${compact ? "max-w-none" : ""}`}
    >
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

      <div className="flex min-h-[48px] items-center gap-3">
        <button
          type="button"
          onClick={togglePlayback}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
            isMine
              ? "bg-white text-emerald-600 hover:bg-emerald-50"
              : "bg-emerald-500 text-white hover:bg-emerald-600"
          }`}
          aria-label={isPlaying ? "Pause audio" : "Lire audio"}
        >
          {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${isMine ? "bg-white/15 text-white" : "bg-emerald-100 text-emerald-600"}`}>
              <Mic className="h-3.5 w-3.5" />
            </span>
            <span className={`truncate text-[11px] font-semibold ${isMine ? "text-white/88" : "text-slate-500"}`}>
              {fileName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Volume2 className={`h-3.5 w-3.5 shrink-0 ${isMine ? "text-white/75" : "text-emerald-500"}`} />

            <div className="relative flex-1">
              <input
                type="range"
                min={0}
                max={Math.max(duration, 1)}
                step="0.1"
                value={Math.min(currentTime, duration || 0)}
                onChange={handleSeek}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none opacity-0"
                aria-label="Progression audio"
              />

              <div className="flex h-6 items-end gap-[3px]">
                {AUDIO_WAVE_BARS.map((height, index) => {
                  const isActive = index < activeBars;
                  return (
                    <span
                      key={`${height}-${index}`}
                      className={`block w-1 rounded-full transition-colors duration-150 ${
                        isMine
                          ? (isActive ? "bg-white" : "bg-white/30")
                          : (isActive ? "bg-emerald-500" : "bg-slate-200")
                      }`}
                      style={{ height: `${height}px` }}
                    />
                  );
                })}
              </div>
            </div>

            <span className={`shrink-0 text-[12px] font-semibold tabular-nums ${isMine ? "text-white/92" : "text-slate-500"}`}>
              {formatAudioTime(duration || currentTime)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LocationCard({ location, isMine }) {
  if (!location?.lat || !location?.lng) return null;

  return (
    <div
      className={`rounded-2xl border p-3 ${isMine ? "border-white/20 bg-white/10" : "border-slate-200 bg-slate-50"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin className={`h-4 w-4 ${isMine ? "text-white" : "text-emerald-500"}`} />
          <div>
            <p className={`text-xs font-semibold ${isMine ? "text-white" : "text-slate-700"}`}>Localisation partagee</p>
            <p className={`mt-1 text-[11px] ${isMine ? "text-white/80" : "text-slate-500"}`}>
              {Number(location.lat).toFixed(5)}, {Number(location.lng).toFixed(5)}
            </p>
          </div>
        </div>
        <a
          href={location.google_maps_url}
          target="_blank"
          rel="noreferrer"
          className={`text-[11px] font-semibold ${isMine ? "text-white" : "text-emerald-600"}`}
        >
          Ouvrir
        </a>
      </div>
    </div>
  );
}

function SharedPostCard({ message, preview, isMine, onOpenPost }) {
  if (message.message_type !== "shared_post") return null;

  if (!preview || preview.unavailable) {
    return (
      <div
        className={`rounded-2xl border p-3 ${isMine ? "border-white/20 bg-white/10 text-white" : "border-slate-200 bg-slate-50 text-slate-600"}`}
      >
        <p className="text-xs font-semibold">Cette publication n&apos;est plus disponible.</p>
      </div>
    );
  }

  const previewImage = sharedPostImage(preview);
  const authorName = preview.author?.full_name || preview.author?.username || "Publication";

  return (
    <button
      type="button"
      onClick={() => onOpenPost(preview.id)}
      className={`w-full overflow-hidden rounded-2xl border text-left transition duration-200 ${
        isMine
          ? "border-white/25 bg-white/10 hover:bg-white/15"
          : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
      }`}
      style={{ cursor: "pointer" }}
    >
      {previewImage ? (
        <img src={previewImage} alt="Publication partagee" className="h-32 w-full object-cover" />
      ) : null}
      <div className="p-3">
        <p className={`text-[11px] font-semibold ${isMine ? "text-white/80" : "text-slate-500"}`}>Publication partagee</p>
        <p className={`mt-1 text-xs font-bold ${isMine ? "text-white" : "text-slate-800"}`}>{authorName}</p>
        {preview.content ? (
          <p className={`mt-1 line-clamp-3 text-xs leading-relaxed ${isMine ? "text-white/90" : "text-slate-600"}`}>
            {preview.content}
          </p>
        ) : null}
      </div>
    </button>
  );
}

function MessageBubble({ msg, isMine, showAvatar, currentUser, onOpenPost }) {
  const preview = msg.shared_post_preview;
  const senderMeta = buildSenderMeta(msg, isMine, currentUser);
  const standaloneAudio = isStandaloneAudioMessage(msg);

  return (
    <div className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
      {showAvatar ? <InlineAvatar name={senderMeta.name} src={senderMeta.avatar} size="sm" /> : <div className="w-6 shrink-0" />}

      <div className="max-w-[82%] group sm:max-w-[68%]">
        {standaloneAudio ? (
          <div className={msg.is_optimistic ? "opacity-70" : ""}>
            <AudioMessagePlayer
              src={buildAbsoluteMediaUrl(msg.media_url || msg.media)}
              isMine={isMine}
              fileName={msg.file_name}
            />
          </div>
        ) : (
          <div
            className={`space-y-2 px-4 py-2.5 text-[13px] leading-relaxed break-words ${
              isMine
                ? `rounded-2xl rounded-br-sm bg-emerald-500 text-white shadow-sm shadow-emerald-200 ${msg.is_optimistic ? "opacity-70" : ""}`
                : "rounded-2xl rounded-bl-sm border border-slate-100 bg-white text-slate-700 shadow-sm"
            }`}
          >
            <SharedPostCard message={msg} preview={preview} isMine={isMine} onOpenPost={onOpenPost} />
            <MediaPreview message={msg} isMine={isMine} />
            <LocationCard location={msg.location} isMine={isMine} />
            {msg.content ? <p className="whitespace-pre-wrap">{msg.content}</p> : null}
          </div>
        )}

        <div
          className={`mt-0.5 flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 ${
            isMine ? "justify-end pr-1" : "justify-start pl-1"
          }`}
        >
          <span className="text-[10px] text-slate-400">{formatMsgTime(msg.created_at)}</span>
          {isMine && !msg.is_optimistic ? (
            msg.is_read ? <CheckCheck className="h-3 w-3 text-emerald-400" /> : <Check className="h-3 w-3 text-slate-400" />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AttachmentPreview({ attachment, onRemove }) {
  if (!attachment) return null;

  const isImage = attachment.type.startsWith("image/");
  const isVideo = attachment.type.startsWith("video/");
  const isAudio = attachment.type.startsWith("audio/");

  return (
    <div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-700">{attachment.file.name}</p>
          <p className="text-[11px] text-slate-400">
            {Math.round(attachment.file.size / 1024)} Ko
            {attachment.durationSeconds ? ` · ${formatCallDuration(attachment.durationSeconds)}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {isImage ? <img src={attachment.previewUrl} alt={attachment.file.name} className="max-h-56 w-full rounded-2xl object-cover" /> : null}
      {isVideo ? <video src={attachment.previewUrl} controls className="max-h-64 w-full rounded-2xl bg-black" /> : null}
      {isAudio ? <AudioMessagePlayer src={attachment.previewUrl} isMine={false} fileName={attachment.file.name} compact /> : null}
    </div>
  );
}

export default function ChatWindow({ conv, currentUserId, onBack }) {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { data: profile } = useSelector((state) => state.profile);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [callSession, setCallSession] = useState(null);
  const [callUi, setCallUi] = useState({
    open: false,
    callType: "voice",
    incoming: false,
    outgoing: false,
    connecting: false,
    statusText: "",
    blockedReason: "",
    processingAction: "",
    isMuted: false,
    isCameraOff: false,
  });
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const emojiRef = useRef(null);
  const pendingSelectionRef = useRef({ start: 0, end: 0 });
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingStartRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const appliedCandidatesRef = useRef(new Set());
  const lastOfferRef = useRef("");
  const lastAnswerRef = useRef("");
  const activeCallIdRef = useRef(null);
  const acceptedIncomingRef = useRef(false);
  const isUserNearBottomRef = useRef(true);
  const previousMessageMetaRef = useRef({ convId: null, count: 0, lastId: null });
  const pendingAutoScrollRef = useRef("instant");

  const other = getOtherParticipant(conv, currentUserId);
  const otherName = `${other.first_name || ""} ${other.last_name || ""}`.trim() || other.full_name || other.username || "Utilisateur";
  const otherAvatar = buildAbsoluteMediaUrl(other.avatar);
  const currentUserMeta = useMemo(() => ({
    fullName: profile?.full_name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.username || "Moi",
    avatar: buildAbsoluteMediaUrl(profile?.avatar || user?.avatar),
  }), [profile?.avatar, profile?.full_name, user?.avatar, user?.first_name, user?.last_name, user?.username]);

  const palette = getAvatarPalette(otherName);

  const stopMediaTracks = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
  }, []);

  const closePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  }, []);

  const resetCallState = useCallback((keepModal = false) => {
    closePeerConnection();
    stopMediaTracks();
    setCallSession(null);
    activeCallIdRef.current = null;
    appliedCandidatesRef.current = new Set();
    lastOfferRef.current = "";
    lastAnswerRef.current = "";
    acceptedIncomingRef.current = false;
    setCallDurationSeconds(0);
    setCallUi((current) => ({
      ...current,
      open: keepModal ? current.open : false,
      callType: "voice",
      incoming: false,
      outgoing: false,
      connecting: false,
      statusText: "",
      blockedReason: "",
      processingAction: "",
      isMuted: false,
      isCameraOff: false,
    }));
  }, [closePeerConnection, stopMediaTracks]);

  const ensureLocalMedia = useCallback(async (callType) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch (error) {
      throw new Error(getMediaAccessErrorMessage(error, callType));
    }
  }, []);

  const attachLocalTracks = useCallback((pc, stream) => {
    if (!pc || !stream) return;

    const existingTrackIds = new Set(
      pc.getSenders()
        .map((sender) => sender.track?.id)
        .filter(Boolean)
    );

    stream.getTracks().forEach((track) => {
      if (!existingTrackIds.has(track.id)) {
        pc.addTrack(track, stream);
      }
    });
  }, []);

  const createPeerConnection = useCallback(async (session, stream = localStreamRef.current) => {
    if (peerConnectionRef.current) {
      attachLocalTracks(peerConnectionRef.current, stream);
      return peerConnectionRef.current;
    }

    const pc = new RTCPeerConnection(RTC_CONFIGURATION);
    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;

    attachLocalTracks(pc, stream);

    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play?.().catch(() => {});
      }
    };

    pc.onicecandidate = async (event) => {
      if (!event.candidate || !activeCallIdRef.current) return;
      try {
        await api.post(`/messaging/calls/${activeCallIdRef.current}/signal/`, {
          candidate: event.candidate.toJSON(),
        });
      } catch {
        // signaling polling will continue; ignore transient candidate errors
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [attachLocalTracks]);

  const syncCallSession = useCallback(async (session, { silent = false } = {}) => {
    if (!session) return;
    activeCallIdRef.current = session.id;
    setCallSession(session);

    const isCaller = session.is_caller;
    const isIncoming = !isCaller && session.status === "ringing";
    const compatibilityMessage = isIncoming ? getCallCompatibilityMessage(session.call_type) : "";

    setCallUi((current) => ({
      ...current,
      open: current.open || session.status === "active" || isIncoming,
      callType: session.call_type,
      incoming: isIncoming && !current.outgoing,
      outgoing: isCaller,
      connecting: isCaller ? session.status !== "active" : false,
      blockedReason: isIncoming ? compatibilityMessage : "",
      processingAction: session.status === "active" ? "" : current.processingAction,
      statusText:
        session.status === "ringing"
          ? (isCaller ? "Appel en cours..." : compatibilityMessage || "Appel entrant")
          : "Connecte",
    }));

    if (!peerConnectionRef.current) return;

    const pc = peerConnectionRef.current;
    attachLocalTracks(pc, localStreamRef.current);

    if (session.offer_sdp && !isCaller && lastOfferRef.current !== session.offer_sdp) {
      await pc.setRemoteDescription({ type: "offer", sdp: session.offer_sdp });
      lastOfferRef.current = session.offer_sdp;

      if (acceptedIncomingRef.current && !pc.currentLocalDescription) {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        lastAnswerRef.current = answer.sdp;
        const signalResponse = await api.post(`/messaging/calls/${session.id}/signal/`, { answer_sdp: answer.sdp });
        setCallSession(signalResponse.data.call);
        setCallUi((current) => ({
          ...current,
          incoming: false,
          connecting: false,
          statusText: "Connecte",
        }));
      }
    }

    if (session.answer_sdp && isCaller && lastAnswerRef.current !== session.answer_sdp) {
      await pc.setRemoteDescription({ type: "answer", sdp: session.answer_sdp });
      lastAnswerRef.current = session.answer_sdp;
      setCallUi((current) => ({ ...current, connecting: false, statusText: "Connecte", incoming: false }));
    }

    for (const candidate of session.pending_remote_candidates || []) {
      const key = JSON.stringify(candidate);
      if (appliedCandidatesRef.current.has(key) || !candidate) continue;
      try {
        await pc.addIceCandidate(candidate);
        appliedCandidatesRef.current.add(key);
      } catch (error) {
        if (!silent) {
          // keep polling; candidate can arrive before remote description
        }
      }
    }
  }, [attachLocalTracks]);

  const loadMessages = useCallback(async (keepOptimistic = false) => {
    const response = await api.get(`/messaging/conversations/${conv.id}/messages/`);
    setMessages((prev) => (keepOptimistic ? mergeMessagesWithOptimistic(response.data, prev) : response.data));
  }, [conv.id]);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setNewMessagesCount(0);
    setShowScrollBtn(false);
    setText("");
    pendingAutoScrollRef.current = "instant";
    isUserNearBottomRef.current = true;
    previousMessageMetaRef.current = { convId: conv.id, count: 0, lastId: null };
    setAttachment((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
    resetCallState();
    loadMessages()
      .finally(() => setLoading(false));
    inputRef.current?.focus();
  }, [conv.id, loadMessages, resetCallState]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadMessages(true).catch(() => {});
    }, MESSAGE_POLL_INTERVAL);

    const handleRefresh = () => {
      loadMessages(true).catch(() => {});
    };

    window.addEventListener("messaging:refresh", handleRefresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("messaging:refresh", handleRefresh);
    };
  }, [loadMessages]);

  useEffect(() => {
    const currentLastId = messages[messages.length - 1]?.id || null;
    const previousMeta = previousMessageMetaRef.current;
    const isNewConversation = previousMeta.convId !== conv.id;
    const hasNewMessages = messages.length > previousMeta.count && currentLastId !== previousMeta.lastId;

    if ((isNewConversation || previousMeta.count === 0) && messages.length > 0) {
      scrollToBottom("instant");
      setNewMessagesCount(0);
    } else if (hasNewMessages) {
      if (pendingAutoScrollRef.current || isUserNearBottomRef.current) {
        scrollToBottom(pendingAutoScrollRef.current || "smooth");
        setNewMessagesCount(0);
      } else {
        setNewMessagesCount((count) => count + (messages.length - previousMeta.count));
        setShowScrollBtn(true);
      }
    }

    pendingAutoScrollRef.current = null;
    previousMessageMetaRef.current = {
      convId: conv.id,
      count: messages.length,
      lastId: currentLastId,
    };
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => () => {
    if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
  }, [attachment]);

  useEffect(() => {
    let cancelled = false;

    const pollCall = async () => {
      try {
        const response = await api.get(`/messaging/conversations/${conv.id}/calls/current/`);
        if (cancelled) return;
        const nextCall = response.data?.call || null;

        if (!nextCall) {
          if (activeCallIdRef.current) {
            toast("Appel termine.");
            resetCallState();
          }
          return;
        }

        if (
          callSession &&
          callSession.id === nextCall.id &&
          nextCall.status !== callSession.status &&
          ["declined", "ended", "missed"].includes(nextCall.status)
        ) {
          toast(nextCall.status === "declined" ? "Appel refuse." : "Appel termine.");
          resetCallState();
          return;
        }

        if (["declined", "ended", "missed"].includes(nextCall.status)) {
          resetCallState();
          return;
        }

        await syncCallSession(nextCall, { silent: true });
      } catch {
        // ignore polling errors to keep chat stable
      }
    };

    pollCall();
    const interval = window.setInterval(pollCall, CALL_POLL_INTERVAL);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [conv.id, callSession, resetCallState, syncCallSession]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }, [text]);

  useEffect(() => {
    if (!isRecordingAudio) return undefined;

    const syncRecording = () => {
      const startedAt = recordingStartRef.current || Date.now();
      setRecordingSeconds(Math.floor((Date.now() - startedAt) / 1000));
    };

    syncRecording();
    const interval = window.setInterval(syncRecording, 1000);
    return () => window.clearInterval(interval);
  }, [isRecordingAudio]);

  useEffect(() => {
    if (!callUi.open || !callSession?.started_at || callUi.incoming || callUi.connecting) {
      if (!callSession?.started_at || !callUi.open) setCallDurationSeconds(0);
      return undefined;
    }

    const syncDuration = () => {
      const started = new Date(callSession.started_at).getTime();
      setCallDurationSeconds(Math.floor((Date.now() - started) / 1000));
    };

    syncDuration();
    const interval = window.setInterval(syncDuration, 1000);
    return () => window.clearInterval(interval);
  }, [callSession?.started_at, callUi.connecting, callUi.incoming, callUi.open]);

  const grouped = groupMessagesByDate(messages);

  const rememberSelection = () => {
    const el = inputRef.current;
    if (!el) return;
    pendingSelectionRef.current = {
      start: el.selectionStart || 0,
      end: el.selectionEnd || 0,
    };
  };

  const insertAtCursor = (value) => {
    const el = inputRef.current;
    const { start, end } = pendingSelectionRef.current;
    const currentText = text;
    const nextText = `${currentText.slice(0, start)}${value}${currentText.slice(end)}`;
    const nextCursor = start + value.length;

    setText(nextText);

    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(nextCursor, nextCursor);
      pendingSelectionRef.current = { start: nextCursor, end: nextCursor };
    });
  };

  const handleEmojiSelect = (emojiData) => {
    insertAtCursor(emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleScroll = () => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNearBottom = distanceFromBottom < 120;
    isUserNearBottomRef.current = isNearBottom;
    setShowScrollBtn(!isNearBottom);
    if (isNearBottom) setNewMessagesCount(0);
  };

  const scrollToBottom = (behavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
    isUserNearBottomRef.current = true;
    setShowScrollBtn(false);
    setNewMessagesCount(0);
  };

  const resetAttachment = () => {
    setAttachment((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const stopRecordingStream = useCallback(() => {
    const stream = mediaRecorderRef.current?.stream;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }, []);

  useEffect(() => () => {
    stopRecordingStream();
  }, [stopRecordingStream]);

  const startAudioRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Le microphone n'est pas disponible sur cet appareil.");
      return;
    }

    if (!window.MediaRecorder) {
      toast.error("L'enregistrement audio n'est pas supporte sur ce navigateur.");
      return;
    }

    try {
      const mimeType = getSupportedAudioMimeType();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      resetAttachment();
      recordingChunksRef.current = [];
      recordingStartRef.current = Date.now();
      setRecordingSeconds(0);
      setIsRecordingAudio(true);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const parts = recordingChunksRef.current;
        const finalMimeType = recorder.mimeType || mimeType || "audio/webm";
        stopRecordingStream();
        setIsRecordingAudio(false);

        if (!parts.length) return;

        const blob = new Blob(parts, { type: finalMimeType });
        const extension = finalMimeType.includes("mp4") ? "m4a" : "webm";
        const file = new File([blob], `audio-${Date.now()}.${extension}`, { type: finalMimeType });

        setAttachment((current) => {
          if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
          return {
            file,
            type: file.type,
            previewUrl: URL.createObjectURL(file),
            durationSeconds: Math.max(1, Math.floor((Date.now() - (recordingStartRef.current || Date.now())) / 1000)),
            source: "recording",
          };
        });

        recordingChunksRef.current = [];
        recordingStartRef.current = null;
      };

      recorder.onerror = () => {
        stopRecordingStream();
        setIsRecordingAudio(false);
        recordingChunksRef.current = [];
        recordingStartRef.current = null;
        toast.error("Erreur lors de l'enregistrement audio.");
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
    } catch (error) {
      const denied = error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError";
      toast.error(denied ? "Permission microphone refusee." : "Impossible de demarrer l'enregistrement audio.");
      setIsRecordingAudio(false);
      recordingChunksRef.current = [];
      recordingStartRef.current = null;
    }
  }, [resetAttachment, stopRecordingStream]);

  const stopAudioRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current = null;
  }, []);

  const handleAttachmentSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Format non supporte. Utilisez image, video ou audio.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Le fichier depasse la limite de 20 Mo.");
      event.target.value = "";
      return;
    }

    setAttachment((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return {
        file,
        type: file.type,
        previewUrl: URL.createObjectURL(file),
      };
    });
  };

  const sendLocation = async () => {
    if (!navigator.geolocation || sending) {
      if (!navigator.geolocation) toast.error("La geolocalisation n'est pas disponible sur cet appareil.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setSending(true);
        const optimistic = {
          id: `opt-location-${Date.now()}`,
          sender: currentUserId,
          message_type: "location",
          content: "",
          created_at: new Date().toISOString(),
          is_optimistic: true,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            google_maps_url: `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`,
          },
        };

        setMessages((prev) => [...prev, optimistic]);
        pendingAutoScrollRef.current = "smooth";

        try {
          const response = await api.post(`/messaging/conversations/${conv.id}/messages/`, {
            location_lat: String(position.coords.latitude),
            location_lng: String(position.coords.longitude),
          });
          setMessages((prev) => prev.map((message) => (message.id === optimistic.id ? response.data : message)));
          window.dispatchEvent(new Event("messaging:refresh"));
        } catch (error) {
          setMessages((prev) => prev.filter((message) => message.id !== optimistic.id));
          toast.error(extractApiError(error, "Erreur lors de l'envoi de la localisation."));
        } finally {
          setSending(false);
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Permission de localisation refusee.");
          return;
        }
        toast.error("Impossible de recuperer votre localisation.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  const sendMessage = useCallback(async () => {
    const content = text.trim();
    if ((!content && !attachment) || sending) return;

    setSending(true);
    setText("");
    setShowEmojiPicker(false);

    const optimistic = {
      id: `opt-${Date.now()}`,
      sender: currentUserId,
      message_type: attachment
        ? (attachment.type.startsWith("image/") ? "image" : attachment.type.startsWith("video/") ? "video" : "audio")
        : "text",
      content,
      created_at: new Date().toISOString(),
      is_optimistic: true,
      file_name: attachment?.file?.name || "",
      media_url: attachment?.previewUrl || null,
    };

    setMessages((prev) => [...prev, optimistic]);
    pendingAutoScrollRef.current = "smooth";

    try {
      const payload = attachment?.file
        ? (() => {
            const formData = new FormData();
            if (content) formData.append("content", content);
            formData.append("media", attachment.file);
            return formData;
          })()
        : { content };

      const response = await api.post(`/messaging/conversations/${conv.id}/messages/`, payload);
      setMessages((prev) => prev.map((message) => (message.id === optimistic.id ? response.data : message)));
      resetAttachment();
      window.dispatchEvent(new Event("messaging:refresh"));
    } catch (error) {
      setMessages((prev) => prev.filter((message) => message.id !== optimistic.id));
      setText(content);
      toast.error(extractApiError(error, "Erreur lors de l'envoi du message."));
    } finally {
      setSending(false);
    }
  }, [attachment, conv.id, currentUserId, sending, text]);

  const handleKeyDown = (event) => {
    rememberSelection();
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const openSharedPost = (postId) => {
    if (!postId) return;
    navigate(`/posts/${postId}`);
  };

  const startCall = useCallback(async (callType) => {
    const compatibilityMessage = getCallCompatibilityMessage(callType);
    if (compatibilityMessage) {
      toast.error(compatibilityMessage);
      return;
    }

    try {
      setCallUi((current) => ({
        ...current,
        processingAction: "start",
        blockedReason: "",
      }));
      const stream = await ensureLocalMedia(callType);
      const response = await api.post(`/messaging/conversations/${conv.id}/calls/start/`, { call_type: callType });
      const session = response.data.call;
      activeCallIdRef.current = session.id;
      setCallSession(session);
      setCallUi({
        open: true,
        callType,
        incoming: false,
        outgoing: true,
        connecting: true,
        statusText: "Appel en cours...",
        blockedReason: "",
        processingAction: "",
        isMuted: false,
        isCameraOff: false,
      });

      const pc = await createPeerConnection(session, stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      lastOfferRef.current = offer.sdp;
      await api.post(`/messaging/calls/${session.id}/signal/`, { offer_sdp: offer.sdp });
    } catch (error) {
      resetCallState();
      toast.error(extractApiError(error, error?.message || "Impossible de demarrer l'appel."));
    }
  }, [conv.id, createPeerConnection, ensureLocalMedia, resetCallState]);

  const acceptCall = useCallback(async () => {
    if (!callSession || callUi.processingAction === "accept") return;

    const compatibilityMessage = getCallCompatibilityMessage(callSession.call_type);
    if (compatibilityMessage) {
      setCallUi((current) => ({
        ...current,
        open: true,
        incoming: true,
        outgoing: false,
        connecting: false,
        statusText: compatibilityMessage,
        blockedReason: compatibilityMessage,
        processingAction: "",
      }));
      toast.error(compatibilityMessage);
      return;
    }

    try {
      setCallUi((current) => ({
        ...current,
        open: true,
        incoming: true,
        outgoing: false,
        connecting: true,
        statusText: callSession.call_type === "video" ? "Autorisation microphone/camera..." : "Autorisation microphone...",
        blockedReason: "",
        processingAction: "accept",
      }));
      acceptedIncomingRef.current = true;
      const stream = await ensureLocalMedia(callSession.call_type);
      const acceptResponse = await api.post(`/messaging/calls/${callSession.id}/accept/`);
      const nextSession = acceptResponse.data.call;
      setCallSession(nextSession);
      setCallUi((current) => ({
        ...current,
        open: true,
        incoming: false,
        outgoing: false,
        connecting: true,
        statusText: "Connexion...",
        blockedReason: "",
        processingAction: "accept",
      }));

      const pc = await createPeerConnection(nextSession, stream);
      if (nextSession.offer_sdp && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription({ type: "offer", sdp: nextSession.offer_sdp });
        lastOfferRef.current = nextSession.offer_sdp;
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        lastAnswerRef.current = answer.sdp;
        const signalResponse = await api.post(`/messaging/calls/${callSession.id}/signal/`, { answer_sdp: answer.sdp });
        await syncCallSession(signalResponse.data.call, { silent: true });
        setCallUi((current) => ({ ...current, connecting: false, statusText: "Connecte", processingAction: "" }));
      } else {
        setCallUi((current) => ({ ...current, connecting: true, statusText: "Connexion...", processingAction: "" }));
      }
    } catch (error) {
      acceptedIncomingRef.current = false;
      const message = extractApiError(error, error?.message || "Impossible d'accepter l'appel.");
      setCallUi((current) => ({
        ...current,
        open: true,
        incoming: true,
        outgoing: false,
        connecting: false,
        statusText: message,
        blockedReason: message,
        processingAction: "",
      }));
      stopMediaTracks();
      closePeerConnection();
      toast.error(message);
    }
  }, [callSession, callUi.processingAction, closePeerConnection, createPeerConnection, ensureLocalMedia, stopMediaTracks, syncCallSession]);

  const declineCall = useCallback(async () => {
    if (!callSession) {
      resetCallState();
      return;
    }
    try {
      await api.post(`/messaging/calls/${callSession.id}/decline/`);
    } catch {
      // ignore
    } finally {
      resetCallState();
    }
  }, [callSession, resetCallState]);

  const endCall = useCallback(async () => {
    if (!callSession) {
      resetCallState();
      return;
    }
    try {
      await api.post(`/messaging/calls/${callSession.id}/end/`);
    } catch {
      // ignore
    } finally {
      resetCallState();
    }
  }, [callSession, resetCallState]);

  const callDurationLabel = callSession?.started_at && !callUi.incoming
    ? formatCallDuration(callDurationSeconds)
    : "";

  const toggleMute = useCallback(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks?.()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setCallUi((current) => ({ ...current, isMuted: !audioTrack.enabled }));
  }, []);

  const toggleCamera = useCallback(() => {
    const videoTrack = localStreamRef.current?.getVideoTracks?.()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setCallUi((current) => ({ ...current, isCameraOff: !videoTrack.enabled }));
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-5 py-3" style={{ boxShadow: "0 1px 0 #f1f5f9" }}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="relative">
            <InlineAvatar name={otherName} src={otherAvatar} />
            {other.is_online ? <span className="absolute -bottom-px -right-px h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" /> : null}
          </div>

          <div>
            <h2 className="text-[14px] font-bold leading-tight text-slate-900">{otherName}</h2>
            <p className={`text-[11px] font-medium ${other.is_online ? "text-emerald-500" : "text-slate-400"}`}>
              {other.is_online ? "En ligne" : "Hors ligne"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => startCall("voice")}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 active:scale-95"
          >
            <Phone className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => startCall("video")}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 active:scale-95"
          >
            <Video className="h-4 w-4" />
          </button>
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 active:scale-95">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-5"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#e2e8f0 transparent",
          background: "linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%)",
        }}
      >
        {loading ? (
          <div className="flex flex-col gap-3 pt-2">
            {[0, 1, 0, 1, 0].map((reverse, index) => <BubbleSkeleton key={index} reverse={reverse === 1} />)}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-16 text-center">
            <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${palette} text-xl font-bold text-white shadow-lg`}>
              {getInitials(otherName)}
            </div>
            <p className="text-sm font-bold text-slate-700">{otherName}</p>
            <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-slate-400">
              C&apos;est le debut de votre conversation avec <strong>{otherName}</strong>
            </p>
          </div>
        ) : (
          grouped.map(({ label, msgs }) => (
            <div key={label}>
              <div className="my-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="rounded-full border border-slate-100 bg-white px-3 py-0.5 text-[10px] font-semibold capitalize text-slate-400">
                  {label}
                </span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="space-y-1">
                {msgs.map((msg, index) => {
                  const isMine = msg.sender === currentUserId || msg.sender?.id === currentUserId;
                  const prev = msgs[index - 1];
                  const prevIsMine = prev ? (prev.sender === currentUserId || prev.sender?.id === currentUserId) : null;
                  const showAvatar = prevIsMine !== isMine;

                  return (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isMine={isMine}
                      showAvatar={showAvatar}
                      currentUser={currentUserMeta}
                      onOpenPost={openSharedPost}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {showScrollBtn ? (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-32 right-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-md transition hover:bg-slate-50 sm:right-6"
        >
          <ChevronDown className="h-4 w-4" />
          {newMessagesCount > 0 ? <span>{newMessagesCount} nouveau{newMessagesCount > 1 ? "x" : ""}</span> : null}
        </button>
      ) : null}

      <div className="sticky bottom-0 z-20 shrink-0 border-t border-slate-100 bg-white px-4 py-3">
        <AttachmentPreview attachment={attachment} onRemove={resetAttachment} />
        {isRecordingAudio ? (
          <div className="mb-3 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-semibold text-rose-600">Enregistrement...</span>
            </div>
            <span className="font-mono text-sm font-bold text-rose-600">{formatCallDuration(recordingSeconds)}</span>
          </div>
        ) : null}

        <div className="relative" ref={emojiRef}>
          {showEmojiPicker ? (
            <div className="absolute bottom-[calc(100%+0.75rem)] left-0 z-20 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
              <EmojiPicker
                onEmojiClick={handleEmojiSelect}
                autoFocusSearch={false}
                skinTonesDisabled
                previewConfig={{ showPreview: false }}
                searchDisabled={false}
                lazyLoadEmojis
              />
            </div>
          ) : null}

          <div
            className={`flex items-end gap-2 rounded-[24px] border px-3 py-2 transition-all ${
              text || attachment ? "border-emerald-200 bg-white ring-2 ring-emerald-100" : "border-slate-200 bg-slate-50"
            }`}
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mb-0.5 flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-slate-600"
              title="Joindre un fichier"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,.mp3,.wav,.m4a,audio/webm"
              className="hidden"
              onChange={handleAttachmentSelect}
            />

            <button
              type="button"
              onClick={() => setShowEmojiPicker((value) => !value)}
              className="mb-0.5 flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-slate-600"
              title="Ajouter un emoji"
            >
              <Smile className="h-4 w-4" />
            </button>

            <textarea
              ref={inputRef}
              rows={1}
              value={text}
              onChange={(event) => setText(event.target.value)}
              onClick={rememberSelection}
              onKeyUp={rememberSelection}
              onSelect={rememberSelection}
              onKeyDown={handleKeyDown}
              placeholder="Ecrivez un message..."
              className="max-h-28 flex-1 resize-none bg-transparent py-2 text-[13px] leading-relaxed text-slate-800 outline-none placeholder:text-slate-400"
              style={{ scrollbarWidth: "none" }}
            />

            <button
              type="button"
              onClick={isRecordingAudio ? stopAudioRecording : startAudioRecording}
              disabled={sending}
              className={`mb-0.5 inline-flex h-9 items-center gap-1.5 rounded-full border bg-white px-3 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isRecordingAudio
                  ? "border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50"
                  : "border-slate-200 text-slate-500 hover:border-emerald-200 hover:text-emerald-600"
              }`}
              title={isRecordingAudio ? "Arreter l'enregistrement" : "Enregistrer un message vocal"}
            >
              {isRecordingAudio ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4" />}
              <span className="hidden sm:inline">{isRecordingAudio ? "Stop" : "Audio"}</span>
            </button>

            <button
              type="button"
              onClick={sendMessage}
              disabled={(!text.trim() && !attachment) || sending}
              className={`mb-0.5 flex h-9 w-9 items-center justify-center rounded-xl text-white transition-all active:scale-95 ${
                text.trim() || attachment
                  ? "bg-emerald-500 shadow-sm shadow-emerald-200 hover:bg-emerald-600"
                  : "cursor-not-allowed bg-slate-200"
              }`}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="mt-1.5 text-center text-[10px] text-slate-400">
          Entree pour envoyer · Maj+Entree pour saut de ligne
        </p>
      </div>

      <CallOverlay
        open={callUi.open}
        callType={callUi.callType}
        remoteName={callSession?.remote_user?.full_name || otherName}
        remoteAvatar={buildAbsoluteMediaUrl(callSession?.remote_user?.avatar) || otherAvatar}
        statusText={callUi.statusText}
        durationLabel={callDurationLabel}
        incoming={callUi.incoming}
        connecting={callUi.connecting}
        blockedReason={callUi.blockedReason}
        processingAction={callUi.processingAction}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        remoteAudioRef={remoteAudioRef}
        localStreamActive={Boolean(localStreamRef.current)}
        remoteStreamActive={Boolean(remoteStreamRef.current?.getTracks?.().length)}
        isMuted={callUi.isMuted}
        isCameraOff={callUi.isCameraOff}
        onAccept={acceptCall}
        onDecline={declineCall}
        onEnd={endCall}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onClose={endCall}
      />
    </div>
  );
}
