"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Minimal Web Speech API hook for chat dictation.
 *
 * Browser support at time of writing: Chrome/Edge/Safari have varying
 * `webkitSpeechRecognition` implementations; Firefox has nothing. The
 * hook reports `supported: false` on unsupported browsers so callers
 * can hide the mic button rather than render a dead affordance.
 *
 * Behaviour:
 *   - `start()`   — begins listening, streams `interimTranscript` in
 *     real time and appends completed phrases to `finalTranscript`.
 *   - `stop()`    — asks the browser to finalise the current segment.
 *   - `reset()`   — clears both transcripts.
 *
 * The caller decides what to do with the transcript (usually: append
 * to the message textarea and clear).
 */

// The DOM lib types SpeechRecognition as WebkitSpeechRecognitionEvent
// only on some TS versions. We narrow to `unknown` and re-cast at use
// sites to avoid bloating the app with a shim.
interface RecognitionResultLike {
  isFinal: boolean;
  [index: number]: { transcript: string };
}
interface RecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: RecognitionResultLike;
  };
}
interface RecognitionInstance {
  start: () => void;
  stop: () => void;
  abort: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: RecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

function getRecognitionCtor(): (new () => RecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => RecognitionInstance;
    webkitSpeechRecognition?: new () => RecognitionInstance;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface UseVoiceInput {
  supported: boolean;
  listening: boolean;
  interimTranscript: string;
  finalTranscript: string;
  error: string | null;
  start: (lang?: string) => void;
  stop: () => void;
  reset: () => void;
}

export function useVoiceInput(): UseVoiceInput {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterim] = useState("");
  const [finalTranscript, setFinal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<RecognitionInstance | null>(null);

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const start = useCallback((lang: string = "en-IN") => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError("Voice input isn't supported on this browser.");
      return;
    }
    setError(null);
    setInterim("");

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;
    rec.onresult = (event: RecognitionEventLike) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;
        const chunk = result[0]?.transcript ?? "";
        if (result.isFinal) final += chunk;
        else interim += chunk;
      }
      setInterim(interim);
      if (final.length > 0) {
        setFinal((prev) => (prev.length > 0 ? `${prev} ${final}`.trim() : final));
      }
    };
    rec.onerror = (e) => {
      setError(e.error ?? "Voice input failed.");
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
    };
    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start recording.");
      setListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    setInterim("");
    setFinal("");
    setError(null);
  }, []);

  return {
    supported,
    listening,
    interimTranscript,
    finalTranscript,
    error,
    start,
    stop,
    reset,
  };
}
