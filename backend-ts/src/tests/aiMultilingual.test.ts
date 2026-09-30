import { detectLanguage, aiService } from '../services/aiService.js';

describe('T1.6 Multilingual - English, Hindi, and Odia Support', () => {
  describe('detectLanguage()', () => {
    it('detects Odia from Odia unicode script', () => {
      const odiaQuery = 'ଆଳୁର ବଜାର ଦର କେତେ?';
      expect(detectLanguage(odiaQuery)).toBe('od');
    });

    it('detects Hindi from Devanagari unicode script', () => {
      const hindiQuery = 'टमाटर का भाव क्या है?';
      expect(detectLanguage(hindiQuery)).toBe('hi');
    });

    it('detects English from Latin text', () => {
      const enQuery = 'What is the current market price of wheat?';
      expect(detectLanguage(enQuery)).toBe('en');
    });

    it('respects context language hint if provided', () => {
      expect(detectLanguage('hello world', 'od')).toBe('od');
      expect(detectLanguage('hello world', 'hi')).toBe('hi');
      expect(detectLanguage('hello world', 'en')).toBe('en');
    });

    it('detects romanized Odia keywords', () => {
      expect(detectLanguage('kemiti chasa karibi')).toBe('od');
      expect(detectLanguage('odisha mandi rate')).toBe('od');
    });

    it('detects romanized Hindi keywords', () => {
      expect(detectLanguage('kisan bhai namaste')).toBe('hi');
      expect(detectLanguage('fasal ka daam batao')).toBe('hi');
    });
  });

  describe('Multilingual AgriBot Fallbacks', () => {
    it('returns authentic Odia response when user query is in Odia', async () => {
      const res = await aiService.processMessage({
        message: 'ଆଜିର ବଜାର ଦର କେତେ?',
      });

      expect(res.success).toBe(true);
      expect(res.reply).toContain('ନମସ୍କାର');
      expect(res.reply).toContain('FaRm');
      expect(res.suggestions.some((s) => /[\u0B00-\u0B7F]/.test(s))).toBe(true);
      expect(res.modelUsed).toContain('od');
    });

    it('returns authentic Hindi response when user query is in Hindi', async () => {
      const res = await aiService.processMessage({
        message: 'मेरी फसल कैसे बेचें?',
      });

      expect(res.success).toBe(true);
      expect(res.reply).toContain('नमस्ते');
      expect(res.reply).toContain('FaRm');
      expect(res.suggestions.some((s) => /[\u0900-\u097F]/.test(s))).toBe(true);
      expect(res.modelUsed).toContain('hi');
    });

    it('returns English response for general English query', async () => {
      const res = await aiService.processMessage({
        message: 'How do I start selling as a farmer?',
      });

      expect(res.success).toBe(true);
      expect(res.reply).toContain('FaRm');
      expect(res.reply).toMatch(/How to List Crops/i);
    });
  });
});
