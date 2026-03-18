import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function getSpeechRecognition() {
  return (
    window.SpeechRecognition ||
    window.webkitSpeechRecognition ||
    null
  );
}

export function useSpeechRecognition(langCode = 'en') {
  const Recognition = useMemo(() => getSpeechRecognition(), []);
  const recognitionRef = useRef(null);
  const [supported, setSupported] = useState(Boolean(Recognition));
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setSupported(Boolean(Recognition));
    if (!Recognition) return;

    const recog = new Recognition();
    recog.continuous = true;
    recog.interimResults = true;
    if (langCode === 'ta') {
      recog.lang = 'ta-IN';
    } else {
      recog.lang = 'en-IN';
    }

    recog.onstart = () => {
      setError('');
      setListening(true);
    };

    recog.onend = () => {
      setListening(false);
    };

    recog.onerror = (e) => {
      setListening(false);
      setError(e?.error || 'voice_error');
    };

    recog.onresult = (event) => {
      try {
        let text = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          text += event.results[i][0]?.transcript || '';
        }
        setTranscript((prev) => {
          const next = (prev ? `${prev} ` : '') + text;
          return next.replace(/\s+/g, ' ').trim();
        });
      } catch {
        // ignore parsing issues
      }
    };

    recognitionRef.current = recog;
    return () => {
      try {
        recog.onstart = null;
        recog.onend = null;
        recog.onerror = null;
        recog.onresult = null;
        recog.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, [Recognition, langCode]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    setError('');
    try {
      recognitionRef.current.start();
    } catch (e) {
      // Calling start twice throws in some browsers
      if (!String(e?.message || '').toLowerCase().includes('start')) {
        setError('voice_start_failed');
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      // ignore
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setError('');
  }, []);

  return {
    supported,
    listening,
    transcript,
    error,
    start,
    stop,
    reset,
  };
}

