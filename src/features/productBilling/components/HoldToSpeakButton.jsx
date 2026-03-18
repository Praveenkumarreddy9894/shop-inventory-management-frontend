export function VoiceToggleButton({
  disabled,
  supported,
  listening,
  onToggle,
  labelOn,
  labelOff,
}) {
  return (
    <button
      type="button"
      className={`btn btn-primary pb-hold-btn ${listening ? 'is-listening' : ''}`}
      disabled={disabled || !supported}
      onClick={() => onToggle?.()}
      aria-pressed={listening}
    >
      {listening ? labelOff : labelOn}
    </button>
  );
}
