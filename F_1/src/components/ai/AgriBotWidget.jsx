import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  X,
  Mic,
  MicOff,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Volume2,
  VolumeX,
  ChevronDown,
  ShieldCheck,
  ShoppingBag,
  PlusCircle,
  Package,
  Sprout,
  ArrowRight,
  Maximize2,
  Minimize2,
  Handshake,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../hooks/useRouter';
import { sendAiChatMessage, getAiStarterSuggestions } from '../../services/aiChatService';
import './AgriBotWidget.css';

export default function AgriBotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [starterPrompts, setStarterPrompts] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const { user } = useAuth();
  const { currentRoute, navigate } = useRouter();
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const userRole = user?.role || 'guest';

  useEffect(() => {
    getAiStarterSuggestions(userRole).then((prompts) => {
      setStarterPrompts(prompts);
    });
  }, [userRole]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const handleSendMessage = async (textToSend = null) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    setInputMessage('');
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const newUserMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const response = await sendAiChatMessage(query, {
        role: userRole,
        currentPath: currentRoute,
      });

      const botReply = {
        id: Date.now() + 1,
        sender: 'bot',
        text: response.reply,
        topic: response.topic,
        suggestions: response.suggestions || [],
        actionLinks: response.actionLinks || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botReply]);

      if (soundEnabled && 'speechSynthesis' in window && response.reply) {
        window.speechSynthesis.cancel();
        const plainText = response.reply.replace(/[#*_`[\]()]/g, '');
        const utterance = new SpeechSynthesisUtterance(plainText);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'I am currently having trouble connecting. Please verify your connection or ask again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVoice = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleClearChat = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setMessages([]);
  };

  const handleCopyMessage = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleActionClick = (url) => {
    if (url) {
      navigate(url);
      if (window.innerWidth < 640) {
        setIsOpen(false);
      }
    }
  };

  const renderFormattedText = (rawText) => {
    if (!rawText) return null;

    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={idx} className="agribot-md-h3">
            {trimmed.replace('### ', '')}
          </h4>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h3 key={idx} className="agribot-md-h2">
            {trimmed.replace('## ', '')}
          </h3>
        );
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemContent = trimmed.slice(2);
        return (
          <li key={idx} className="agribot-md-bullet">
            {parseInlineStyles(itemContent)}
          </li>
        );
      }
      if (/^\d+\.\s/.test(trimmed)) {
        const itemContent = trimmed.replace(/^\d+\.\s/, '');
        return (
          <li key={idx} className="agribot-md-number">
            {parseInlineStyles(itemContent)}
          </li>
        );
      }
      if (!trimmed) {
        return <div key={idx} className="agribot-md-space" />;
      }
      return (
        <p key={idx} className="agribot-md-p">
          {parseInlineStyles(trimmed)}
        </p>
      );
    });
  };

  const parseInlineStyles = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="agribot-md-bold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="agribot-md-code">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const getActionIcon = (iconName) => {
    switch (iconName) {
      case 'PlusCircle':
        return <PlusCircle size={14} className="text-emerald-600" />;
      case 'ShoppingBag':
        return <ShoppingBag size={14} className="text-emerald-600" />;
      case 'Package':
        return <Package size={14} className="text-emerald-600" />;
      case 'ShieldCheck':
        return <ShieldCheck size={14} className="text-emerald-600" />;
      case 'Handshake':
        return <Handshake size={14} className="text-emerald-600" />;
      case 'TrendingUp':
        return <TrendingUp size={14} className="text-emerald-600" />;
      default:
        return <ArrowRight size={14} className="text-emerald-600" />;
    }
  };

  return (
    <>
      <motion.div
        className="agribot-trigger-wrapper"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className={`agribot-fab-button ${isOpen ? 'active' : ''}`}
          aria-label="Open FaRm AI Assistant"
          title="FaRm AI Assistant (AgriBot)"
        >
          <div className="agribot-fab-glow" />
          <div className="agribot-fab-inner">
            {isOpen ? (
              <X size={24} className="text-white" />
            ) : (
              <>
                <Bot size={26} className="text-white" />
                <span className="agribot-online-indicator" />
              </>
            )}
          </div>
        </button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`agribot-modal-container ${isExpanded ? 'expanded' : ''}`}
            initial={{ opacity: 0, y: 25, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="agribot-header">
              <div className="agribot-header-left">
                <div className="agribot-avatar-badge">
                  <Sprout size={18} className="text-white" />
                  <span className="agribot-avatar-status" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="agribot-header-title">FaRm AgriBot</h3>
                    <span className="agribot-pill-badge">AI Assistant</span>
                  </div>
                  <p className="agribot-header-subtitle">
                    Farming & Direct Marketplace Guide
                  </p>
                </div>
              </div>

              <div className="agribot-header-actions">
                <button
                  onClick={() => setSoundEnabled((prev) => !prev)}
                  className={`agribot-header-btn ${soundEnabled ? 'active' : ''}`}
                  title={soundEnabled ? 'Disable Read-Aloud' : 'Enable Read-Aloud'}
                >
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>

                <button
                  onClick={handleClearChat}
                  className="agribot-header-btn"
                  title="Clear Chat (Stateless Reset)"
                >
                  <RefreshCw size={16} />
                </button>

                <button
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="agribot-header-btn hidden sm:flex"
                  title={isExpanded ? 'Standard View' : 'Expand View'}
                >
                  {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="agribot-header-btn"
                  title="Close Assistant"
                >
                  <ChevronDown size={18} />
                </button>
              </div>
            </div>

            <div className="agribot-privacy-bar">
              <ShieldCheck size={13} className="text-emerald-700" />
              <span>Zero-History &bull; Private &bull; Agriculture Guardrails Active</span>
            </div>

            <div className="agribot-body">
              {messages.length === 0 ? (
                <div className="agribot-welcome">
                  <div className="agribot-welcome-icon-box">
                    <Sparkles size={26} className="text-emerald-600" />
                  </div>
                  <h4 className="agribot-welcome-title">
                    Welcome to FaRm AgriBot
                  </h4>
                  <p className="agribot-welcome-desc">
                    Ask questions about crop cultivation, soil health, pest control, pricing, or navigating the marketplace!
                  </p>

                  <div className="agribot-starter-grid">
                    {starterPrompts.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(item.query)}
                        className="agribot-starter-card"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="agribot-starter-category">{item.category}</span>
                        </div>
                        <span className="agribot-starter-label">{item.label}</span>
                        <p className="agribot-starter-query">{item.query}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="agribot-messages-list">
                  {messages.map((msg, index) => (
                    <div
                      key={msg.id}
                      className={`agribot-message-row ${msg.sender === 'user' ? 'user-row' : 'bot-row'}`}
                    >
                      {msg.sender === 'bot' && (
                        <div className="agribot-bubble-avatar">
                          <Bot size={15} className="text-emerald-700" />
                        </div>
                      )}

                      <div className={`agribot-bubble ${msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                        {msg.sender === 'user' ? (
                          <p className="text-sm font-medium leading-relaxed m-0">{msg.text}</p>
                        ) : (
                          <div className="agribot-bot-content">
                            {renderFormattedText(msg.text)}

                            {msg.actionLinks && msg.actionLinks.length > 0 && (
                              <div className="agribot-action-links">
                                {msg.actionLinks.map((action, aIdx) => (
                                  <button
                                    key={aIdx}
                                    onClick={() => handleActionClick(action.url)}
                                    className="agribot-action-chip"
                                  >
                                    {getActionIcon(action.icon)}
                                    <span>{action.label}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {msg.suggestions && msg.suggestions.length > 0 && (
                              <div className="agribot-suggestions-wrapper">
                                <span className="agribot-suggestions-title">
                                  Suggested queries:
                                </span>
                                <div className="agribot-suggestions-chips">
                                  {msg.suggestions.map((sug, sIdx) => (
                                    <button
                                      key={sIdx}
                                      onClick={() => handleSendMessage(sug)}
                                      className="agribot-sug-chip"
                                    >
                                      {sug}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="agribot-bubble-actions">
                              <button
                                onClick={() => handleCopyMessage(msg.text, index)}
                                className="agribot-copy-btn"
                                title="Copy response"
                              >
                                {copiedIndex === index ? (
                                  <span className="flex items-center gap-1 text-emerald-600">
                                    <Check size={13} /> Copied
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <Copy size={13} /> Copy
                                  </span>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="agribot-message-row bot-row">
                      <div className="agribot-bubble-avatar">
                        <Bot size={15} className="text-emerald-700" />
                      </div>
                      <div className="agribot-bubble bot-bubble typing">
                        <div className="agribot-typing-dots">
                          <span />
                          <span />
                          <span />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">AgriBot is thinking...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="agribot-footer">
              {isListening && (
                <div className="agribot-listening-banner">
                  <span className="agribot-recording-dot" />
                  <span>Listening... Speak your farming question</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="agribot-input-form"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    isListening
                      ? 'Listening to your voice...'
                      : userRole === 'farmer'
                      ? 'Ask about crops, pests, prices, or listings...'
                      : 'Ask about produce, orders, or negotiations...'
                  }
                  className="agribot-text-input"
                  disabled={isLoading}
                />

                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`agribot-mic-btn ${isListening ? 'listening' : ''}`}
                  title={isListening ? 'Stop Listening' : 'Voice Input (Speak)'}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="agribot-send-btn"
                  title="Send Question"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
