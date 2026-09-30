import { useState, useEffect, useCallback, useRef } from 'react';

export const useVoiceSearch = (onResult, languageOrOptions = 'en-IN') => {
  const requestedLang = typeof languageOrOptions === 'string'
    ? languageOrOptions
    : languageOrOptions?.lang || 'en-IN';

  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [activeLang, setActiveLang] = useState(requestedLang);
  const [recognition, setRecognition] = useState(null);

  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    setActiveLang(requestedLang);
  }, [requestedLang]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSupported(true);
        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = activeLang;

        recog.onstart = () => {
          setIsListening(true);
        };

        recog.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (onResultRef.current) {
            onResultRef.current(transcript);
          }
          setIsListening(false);
        };

        recog.onerror = (event) => {
          // If Odia ('or-IN' or 'or') is not supported in the user's browser, fall back to 'hi-IN' or 'en-IN'
          if (event.error === 'language-not-supported' && (activeLang === 'or-IN' || activeLang === 'or')) {
            console.warn(`Web Speech API does not support Odia (${activeLang}) on this browser, falling back to Hindi (hi-IN)`);
            recog.lang = 'hi-IN';
            setActiveLang('hi-IN');
            try {
              recog.start();
              return;
            } catch {
              // Ignore restart error
            }
          } else {
            console.warn('Speech recognition error:', event.error);
          }
          setIsListening(false);
        };

        recog.onend = () => {
          setIsListening(false);
        };

        setRecognition(recog);
      }
    }
  }, [activeLang]);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      try {
        recognition.lang = activeLang;
        recognition.start();
      } catch (err) {
        console.error('Error starting recognition:', err);
      }
    }
  }, [recognition, isListening, activeLang]);

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
    activeLang,
    setLanguage: setActiveLang,
    startListening,
    stopListening
  };
};
