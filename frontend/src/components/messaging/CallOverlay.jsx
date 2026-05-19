import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  X,
} from "lucide-react";

function initials(name = "") {
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

function AvatarFallback({ name }) {
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-2xl font-black text-white ring-1 ring-white/20">
      {initials(name)}
    </div>
  );
}

export default function CallOverlay({
  open,
  callType,
  remoteName,
  remoteAvatar,
  statusText,
  durationLabel,
  incoming,
  connecting,
  blockedReason,
  processingAction,
  localVideoRef,
  remoteVideoRef,
  remoteAudioRef,
  localStreamActive,
  remoteStreamActive,
  isMuted,
  isCameraOff,
  onAccept,
  onDecline,
  onEnd,
  onToggleMute,
  onToggleCamera,
  onClose,
}) {
  if (!open) return null;

  const isVideo = callType === "video";
  const acceptDisabled = Boolean(blockedReason) || processingAction === "accept";

  return (
    <div className="fixed inset-0 z-[140]">
      <div className="absolute inset-0 bg-slate-950/88 backdrop-blur-md" />

      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between px-5 py-4 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
              {isVideo ? "Appel video" : "Appel vocal"}
            </p>
            <h3 className="mt-1 text-xl font-bold">{remoteName}</h3>
            <p className="mt-1 text-sm text-white/70">{statusText}</p>
            {durationLabel ? <p className="mt-1 text-xs font-semibold text-emerald-300">{durationLabel}</p> : null}
          </div>

          <button
            type="button"
            onClick={incoming ? onDecline : onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/15"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-6">
          {isVideo ? (
            <>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`h-full max-h-[72vh] w-full max-w-5xl rounded-[32px] object-cover shadow-2xl ${
                  remoteStreamActive ? "bg-black" : "bg-white/5"
                }`}
              />

              {!remoteStreamActive ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  {remoteAvatar ? (
                    <img src={remoteAvatar} alt={remoteName} className="h-24 w-24 rounded-full object-cover ring-2 ring-white/20" />
                  ) : (
                    <AvatarFallback name={remoteName} />
                  )}
                  <p className="text-lg font-semibold text-white">{remoteName}</p>
                </div>
              ) : null}

              <div className="absolute bottom-6 right-6 overflow-hidden rounded-[24px] border border-white/15 bg-black/40 shadow-xl">
                {localStreamActive ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-36 w-28 object-cover sm:h-44 sm:w-32"
                  />
                ) : (
                  <div className="flex h-36 w-28 items-center justify-center sm:h-44 sm:w-32">
                    <AvatarFallback name="Moi" />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-center">
              {remoteAvatar ? (
                <img src={remoteAvatar} alt={remoteName} className="h-28 w-28 rounded-full object-cover ring-2 ring-white/20" />
              ) : (
                <AvatarFallback name={remoteName} />
              )}
              <p className="mt-6 text-3xl font-bold text-white">{remoteName}</p>
              <p className="mt-2 text-sm text-white/70">{statusText}</p>
              {blockedReason ? <p className="mt-3 max-w-xs text-xs leading-5 text-amber-200">{blockedReason}</p> : null}
            </div>
          )}
        </div>

        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

        <div className="flex flex-wrap items-center justify-center gap-3 px-4 pb-8">
          {!incoming ? (
            <>
              <button
                type="button"
                onClick={onToggleMute}
                className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
                  isMuted ? "bg-amber-500 text-white" : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              {isVideo ? (
                <button
                  type="button"
                  onClick={onToggleCamera}
                  className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
                    isCameraOff ? "bg-amber-500 text-white" : "bg-white/10 text-white hover:bg-white/15"
                  }`}
                >
                  {isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                </button>
              ) : null}
            </>
          ) : null}

          {incoming ? (
            <>
              <button
                type="button"
                onClick={onDecline}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-white transition hover:bg-rose-600"
              >
                <PhoneOff className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={onAccept}
                disabled={acceptDisabled}
                className={`flex h-14 w-14 items-center justify-center rounded-full text-white transition ${
                  acceptDisabled ? "cursor-not-allowed bg-emerald-800/70" : "bg-emerald-500 hover:bg-emerald-600"
                }`}
              >
                <Phone className="h-5 w-5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onEnd}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-900/30 transition hover:bg-rose-600"
            >
              <PhoneOff className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
