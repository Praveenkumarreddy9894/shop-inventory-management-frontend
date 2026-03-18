/**
 * Voice capture UI: light gradient panel, mic + ripple rings (mockup style).
 */
export function VoiceMicHero({
  disabled,
  supported,
  listening,
  onToggle,
  speakNowLabel,
  tapToSpeakLabel,
  notSupportedLabel,
  loadingLabel,
  helpTitle,
}) {
  const canUse = supported && !disabled;

  return (
    <div className="pb-voice-hero">
      <div
        className={`pb-voice-hero__badge ${listening ? 'is-live' : ''}`}
        aria-live="polite"
      >
        {!supported
          ? notSupportedLabel
          : disabled
            ? loadingLabel
            : listening
              ? speakNowLabel
              : tapToSpeakLabel}
      </div>

      <button
        type="button"
        className={`pb-voice-hero__mic-btn ${listening ? 'is-listening' : ''} ${!canUse ? 'is-disabled' : ''}`}
        disabled={!canUse}
        onClick={() => canUse && onToggle?.()}
        aria-pressed={listening}
        aria-label={listening ? speakNowLabel : tapToSpeakLabel}
      >
        <span className="pb-voice-hero__ripples" aria-hidden>
          {listening && (
            <>
              <span className="pb-voice-hero__ripple pb-voice-hero__ripple--1" />
              <span className="pb-voice-hero__ripple pb-voice-hero__ripple--2" />
              <span className="pb-voice-hero__ripple pb-voice-hero__ripple--3" />
            </>
          )}
        </span>
        <span className="pb-voice-hero__mic-icon" aria-hidden>
          <svg viewBox="0 0 24 24" width="56" height="56" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
          </svg>
        </span>
      </button>

      <div className="pb-voice-hero__info-wrap">
        <span
          className="pb-voice-hero__info"
          title={helpTitle}
          role="img"
          aria-label={helpTitle}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
        </span>
      </div>
    </div>
  );
}
