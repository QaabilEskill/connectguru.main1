import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { normalizeForTts, applyVoiceGender } from './ttsNormalize.ts';

Deno.test('symbols become words', () => {
  assertEquals(normalizeForTts('2 + 3 = 5'), '2 plus 3 equals 5');
  assertEquals(normalizeForTts('tea & coffee'), 'tea and coffee');
  assertEquals(normalizeForTts('50% off'), '50 percent off');
  assertEquals(normalizeForTts('email me @home'), 'email me at home');
});

Deno.test('word fixes', () => {
  assertEquals(normalizeForTts('Aflat is small'), 'a flat is small');
  assertEquals(normalizeForTts('Mr. Sharma is here'), 'Mister Sharma is here');
  assertEquals(normalizeForTts('e.g. mango, apple etc.'), 'for example mango, apple et cetera');
});

Deno.test('Use only rewritten in Hinglish context', () => {
  // English-only sentence — leave "use" alone
  assertEquals(normalizeForTts('Please use the door'), 'Please use the door');
  // Hinglish — "Use" becomes "yoos"
  const r = normalizeForTts('Use ka matlab hain istemaal');
  if (!r.includes('yoos')) throw new Error('expected yoos, got: ' + r);
});

Deno.test('gender rewrite male', () => {
  assertEquals(applyVoiceGender('Main aapko sikhaungi', 'male'), 'Main aapko sikhaunga');
  assertEquals(applyVoiceGender('karungi karti rahi gayi', 'male'), 'karunga karta raha gaya');
});

Deno.test('gender rewrite female no-op', () => {
  assertEquals(applyVoiceGender('Main aapko sikhaungi', 'female'), 'Main aapko sikhaungi');
});

Deno.test('pronunciation: Ab -> ub', () => {
  const r = normalizeForTts('Ab hum shuru karenge');
  if (!/\bub\b/.test(r)) throw new Error('expected "ub", got: ' + r);
});

Deno.test('pronunciation: Join -> joyn', () => {
  assertEquals(normalizeForTts('Please join the class'), 'Please joyn the class');
});

Deno.test('symbol: + never becomes "plus sign"', () => {
  const r = normalizeForTts('2 + 2 = 4');
  if (/plus sign/i.test(r)) throw new Error('+ leaked as "plus sign": ' + r);
  if (!/plus/.test(r)) throw new Error('expected "plus", got: ' + r);
});

Deno.test('phrase: comma inserted before "live" for stress', () => {
  assertEquals(normalizeForTts('Where do you live?'), 'Where do you, live?');
});

