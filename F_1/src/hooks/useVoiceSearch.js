import { useState, useEffect, useCallback, useRef } from 'react';

export const useVoiceSearch = (onResult) => {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [recognition, setRecognition] = useState(null);

  // BUG 7 FIX: Store onResult in a ref so the recognition handler always calls
  // the latest version without needing to recreate the recognition object.
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSupported(true);
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = 'en-IN'; // Better support for Indian accents

        recog.onstart = () => {
          setIsListening(true);
        };

        recog.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          // Always call the latest onResult via ref — avoids stale closure
          if (onResultRef.current) {
            onResultRef.current(transcript);
          }
          setIsListening(false);
        };

        recog.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };

        recog.onend = () => {
          setIsListening(false);
        };

        setRecognition(recog);
      }
    }
  // Recognition object is created once on mount; onResult updates go through the ref.
  }, []);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      try {
        recognition.start();
      } catch (err) {
        console.error('Error starting recognition:', err);
      }
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      try {
        recognition.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
    }
  }, [recognition, isListening]);

  return {
    isListening,
    supported,
    startListening,
    stopListening
  };
};
