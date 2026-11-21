import * as React from "react";

type FloatingMusicPlayerProps = {
  src?: string;
  title?: string;
  subtitle?: string;
};

/**
 * Floating Spider-Verse / 2099-inspired player.
 * Tries to start at the saved opening volume; the visitor can pause or adjust it.
 */
export default function FloatingMusicPlayer({
  src = "/audio/spiderman-2099-score.mp3",
  title = "MIGUEL O'HARA // 2099",
  subtitle = "ACROSS THE SPIDER-VERSE · ORIGINAL SCORE",
}: FloatingMusicPlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const dragRef = React.useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  });
  const suppressClick = React.useRef(false);
  const [playing, setPlaying] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [current, setCurrent] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(0.42);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [loadError, setLoadError] = React.useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = React.useState(false);

  const progress = duration > 0 ? Math.min(1, current / duration) : 0;
  const circumference = 276.46;
  const timeLabel = (value: number) => {
    if (!Number.isFinite(value)) return "0:00";
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        setLoadError(false);
        setAutoplayBlocked(false);
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
        setAutoplayBlocked(true);
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  const beginDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    drag.moved = true;
    const margin = 16;
    const maxX = 0;
    const maxY = 0;
    setOffset({
      x: Math.min(maxX, Math.max(-window.innerWidth + 112 + margin, drag.originX + dx)),
      y: Math.min(maxY, Math.max(-window.innerHeight + 112 + margin, drag.originY + dy)),
    });
  };

  const endDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;
    if (drag.moved) suppressClick.current = true;
    dragRef.current.pointerId = -1;
  };

  const handleCoreClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    void togglePlayback();
  };

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrent(audio.currentTime || 0);
    const onDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onPlay = () => { setPlaying(true); setAutoplayBlocked(false); };
    const onPause = () => setPlaying(false);
    const onError = () => { setLoadError(true); setPlaying(false); };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onDuration);
    audio.addEventListener("durationchange", onDuration);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);
    audio.volume = volume;
    void audio.play().catch(() => setAutoplayBlocked(true));
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onDuration);
      audio.removeEventListener("durationchange", onDuration);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, []);

  React.useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const seek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    if (audioRef.current && Number.isFinite(next)) {
      audioRef.current.currentTime = next;
      setCurrent(next);
    }
  };

  const changeVolume = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    setVolume(next);
    if (audioRef.current) audioRef.current.volume = next;
  };

  return (
    <>
      <audio ref={audioRef} src={src} loop preload="metadata" autoPlay />
      <div
        className={`m2099-player ${playing ? "is-playing" : ""} ${expanded ? "is-expanded" : ""}`}
        style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}
      >
        <div className="m2099-panel" aria-hidden={!expanded}>
          <div className="m2099-panel-top">
            <span className="m2099-kicker">EARTH-928 / AUDIO CHANNEL</span>
            <span className="m2099-live"><i /> {playing ? "PLAYING" : autoplayBlocked ? "TAP TO START" : "STANDBY"}</span>
          </div>
          <div className="m2099-track-title">{title}</div>
          <div className="m2099-track-subtitle">{subtitle}</div>
          <div className="m2099-eq" aria-hidden="true">
            {Array.from({ length: 18 }, (_, index) => <i key={index} style={{ ["--bar" as string]: index } as React.CSSProperties} />)}
          </div>
          <div className="m2099-progress-row">
            <span>{timeLabel(current)}</span>
            <input
              aria-label="Seek track"
              type="range"
              min={0}
              max={Math.max(duration, 0.1)}
              step={0.1}
              value={Math.min(current, duration || 0)}
              onChange={seek}
            />
            <span>{timeLabel(duration)}</span>
          </div>
          <div className="m2099-controls-row">
            <span className="m2099-file-state">{loadError ? "AUDIO FILE NOT FOUND · CHECK public/audio/" : autoplayBlocked ? "TAP PLAY TO START AUDIO" : playing ? "PLAYING LOCAL SCORE" : "ORIGINAL SCORE / LOCAL AUDIO"}</span>
            <label className="m2099-volume">
              <span>VOL</span>
              <input aria-label="Volume" type="range" min={0} max={1} step={0.01} value={volume} onChange={changeVolume} />
            </label>
          </div>
          <div className="m2099-panel-foot">TAP THE CORE TO {playing ? "PAUSE" : "INITIALISE"} AUDIO</div>
        </div>

        <div className="m2099-dock">
          <button
            type="button"
            className="m2099-core"
            aria-label={playing ? "Pause Spider-Man 2099 score" : "Play Spider-Man 2099 score"}
            title="Drag to move · Click to play or pause"
            onPointerDown={beginDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClick={handleCoreClick}
          >
            <span className="m2099-reticle m2099-spin-slow" aria-hidden="true" />
            <svg className="m2099-progress-ring" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="44" />
              <circle cx="50" cy="50" r="44" className="m2099-progress-value" style={{ strokeDasharray: circumference, strokeDashoffset: circumference * (1 - progress) }} />
            </svg>
            <span className="m2099-core-mark" aria-hidden="true">2099</span>
            <span className="m2099-play-symbol" aria-hidden="true">
              {playing ? (
                <span className="m2099-center-wave">
                  <i /><i /><i /><i />
                </span>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>
              )}
            </span>
            <span className="m2099-core-caption">{playing ? "ON AIR" : "PLAY"}</span>
          </button>
          <div className="m2099-dock-copy">
            <span className="m2099-dock-title">MIGUEL O'HARA</span>
            <span className="m2099-dock-status">{playing ? "SCORE ACTIVE" : autoplayBlocked ? "TAP PLAY TO START" : "AUDIO STANDBY"}</span>
          </div>
          <button
            type="button"
            className="m2099-expand"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse music player" : "Expand music player"}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "−" : "+"}
          </button>
        </div>
      </div>

      <style>{PLAYER_CSS}</style>
    </>
  );
}

const PLAYER_CSS = `
.m2099-player{position:fixed;right:22px;bottom:22px;z-index:1000;width:94px;height:94px;color:#e8eef6;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;isolation:isolate;will-change:transform;user-select:none}
.m2099-dock{position:absolute;right:0;bottom:0;display:flex;align-items:center;gap:10px;width:94px;height:94px;transition:width .35s cubic-bezier(.2,.8,.2,1)}
.m2099-player.is-expanded .m2099-dock{width:260px}
.m2099-core{position:relative;flex:none;width:88px;height:88px;display:grid;place-items:center;border:1px solid rgba(232,238,246,.27);border-radius:50%;background:linear-gradient(145deg,rgba(10,26,48,.96),rgba(7,21,37,.92));box-shadow:0 14px 40px rgba(0,0,0,.52),inset 0 1px 0 rgba(232,238,246,.16),0 0 25px rgba(23,105,170,.2);backdrop-filter:blur(18px);cursor:grab;touch-action:none;overflow:hidden;transition:transform .25s ease,border-color .25s ease,box-shadow .25s ease}
.m2099-core:active{cursor:grabbing;transform:scale(.97)}
.m2099-core:hover{border-color:rgba(240,24,60,.75);box-shadow:0 14px 45px rgba(0,0,0,.58),0 0 28px rgba(240,24,60,.18)}
.m2099-reticle{position:absolute;inset:4px;border:1px dashed rgba(126,183,238,.38);border-radius:50%;background:conic-gradient(from 0deg,transparent 0 38%,rgba(240,24,60,.8) 42%,transparent 48% 75%,rgba(23,105,170,.8) 82%,transparent 89%);mask:radial-gradient(transparent 62%,#000 64%);opacity:.9}
.m2099-spin-slow{animation:m2099-spin 18s linear infinite}
.m2099-progress-ring{position:absolute;inset:3px;width:calc(100% - 6px);height:calc(100% - 6px);transform:rotate(-90deg);overflow:visible}
.m2099-progress-ring circle{fill:none;stroke:rgba(232,238,246,.1);stroke-width:2}
.m2099-progress-ring .m2099-progress-value{stroke:#f0183c;stroke-width:2.8;stroke-linecap:round;filter:drop-shadow(0 0 4px rgba(240,24,60,.7));transition:stroke-dashoffset .15s linear}
.m2099-core-mark{position:absolute;top:25px;font-size:8px;letter-spacing:.2em;color:#8bb6dc}
.m2099-play-symbol{position:absolute;left:50%;top:32px;transform:translateX(-50%);display:grid;place-items:center;width:24px;height:22px;font-family:Arial,sans-serif;font-size:18px;color:#e8eef6;text-shadow:0 0 12px rgba(126,183,238,.7)}
.m2099-play-symbol svg{display:block;width:18px;height:18px;fill:currentColor}
.m2099-center-wave{display:flex;align-items:center;justify-content:center;gap:2.5px;width:21px;height:20px}
.m2099-center-wave i{display:block;width:2px;height:7px;border-radius:2px;background:linear-gradient(180deg,#e8eef6 0%,#49c7dc 55%,#1769aa 100%);transform-origin:center;animation:m2099-center-wave 850ms ease-in-out infinite}
.m2099-center-wave i:nth-child(1){animation-delay:-.22s}
.m2099-center-wave i:nth-child(2){animation-delay:-.48s}
.m2099-center-wave i:nth-child(3){animation-delay:-.12s}
.m2099-center-wave i:nth-child(4){animation-delay:-.36s}
.m2099-core-caption{position:absolute;bottom:20px;font-size:7px;letter-spacing:.24em;color:#f45a73}
.m2099-player.is-playing .m2099-reticle{animation-duration:7s}
.m2099-panel{position:absolute;right:0;bottom:105px;width:min(352px,calc(100vw - 28px));padding:18px 18px 14px;border:1px solid rgba(126,183,238,.3);border-radius:7px;background:linear-gradient(145deg,rgba(10,26,48,.96),rgba(7,21,37,.97));box-shadow:0 22px 65px rgba(0,0,0,.56),inset 0 1px 0 rgba(232,238,246,.1);backdrop-filter:blur(22px);opacity:0;visibility:hidden;transform:translateY(10px) scale(.97);transform-origin:bottom right;transition:opacity .25s ease,transform .25s ease,visibility .25s}
.m2099-player.is-expanded .m2099-panel{opacity:1;visibility:visible;transform:translateY(0) scale(1)}
.m2099-panel-top,.m2099-controls-row{display:flex;justify-content:space-between;align-items:center;gap:10px}
.m2099-kicker,.m2099-live,.m2099-file-state,.m2099-panel-foot{font-size:8px;letter-spacing:.14em;color:rgba(232,238,246,.52)}
.m2099-live{display:flex;align-items:center;gap:6px;color:#e8eef6}
.m2099-live i{width:6px;height:6px;border-radius:50%;background:#f0183c;box-shadow:0 0 9px #f0183c}
.m2099-track-title{margin-top:16px;font:600 14px/1.2 system-ui,sans-serif;letter-spacing:.07em;color:#e8eef6}
.m2099-track-subtitle{margin-top:5px;font-size:8px;letter-spacing:.13em;color:#69b8ea}
.m2099-eq{height:32px;display:flex;align-items:center;gap:4px;margin:14px 0 10px;padding:0 2px}
.m2099-eq i{display:block;flex:1;height:5px;border-radius:3px;background:linear-gradient(180deg,#f0183c,#1769aa);opacity:.45;transform-origin:center;animation:m2099-eq 1.1s ease-in-out infinite;animation-delay:calc(var(--bar)*-0.071s);animation-play-state:paused}
.m2099-player.is-playing .m2099-eq i{animation-play-state:running;opacity:.95}
.m2099-progress-row{display:grid;grid-template-columns:34px minmax(0,1fr) 34px;align-items:center;gap:8px;font-size:8px;color:rgba(232,238,246,.55)}
.m2099-progress-row span:last-child{text-align:right}
.m2099-progress-row input,.m2099-volume input{width:100%;height:3px;accent-color:#f0183c;cursor:pointer}
.m2099-controls-row{margin-top:14px}
.m2099-volume{display:flex;align-items:center;gap:8px;font-size:8px;letter-spacing:.1em;color:rgba(232,238,246,.55);width:116px}
.m2099-panel-foot{margin-top:14px;padding-top:10px;border-top:1px solid rgba(232,238,246,.1);color:#f45a73}
.m2099-dock-copy{display:none;min-width:0;flex:1;flex-direction:column;gap:4px;opacity:0;transition:opacity .25s ease}
.m2099-player.is-expanded .m2099-dock-copy{display:flex;opacity:1}
.m2099-dock-title{font-size:9px;letter-spacing:.12em;color:#e8eef6;white-space:nowrap}
.m2099-dock-status{font-size:8px;letter-spacing:.11em;color:#69b8ea;white-space:nowrap}
.m2099-expand{position:absolute;right:0;top:2px;width:24px;height:24px;border:1px solid rgba(232,238,246,.25);border-radius:50%;background:rgba(7,21,37,.95);color:#e8eef6;font-size:16px;line-height:1;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.3);transition:background .2s ease,border-color .2s ease}
.m2099-expand:hover{background:#1769aa;border-color:#69b8ea}
@keyframes m2099-spin{to{transform:rotate(360deg)}}
@keyframes m2099-eq{0%,100%{transform:scaleY(.25)}20%{transform:scaleY(1.5)}45%{transform:scaleY(.55)}70%{transform:scaleY(1.15)}}
@keyframes m2099-center-wave{0%,100%{transform:scaleY(.42)}22%{transform:scaleY(1.55)}48%{transform:scaleY(.68)}72%{transform:scaleY(1.18)}}
@media(max-width:520px){.m2099-player{right:12px;bottom:12px}.m2099-player.is-expanded .m2099-dock{width:218px}.m2099-panel{bottom:100px}.m2099-panel{width:min(330px,calc(100vw - 24px))}}
@media(prefers-reduced-motion:reduce){.m2099-spin-slow,.m2099-eq i,.m2099-center-wave i{animation:none!important}.m2099-panel,.m2099-core,.m2099-expand{transition:none!important}}
`;
