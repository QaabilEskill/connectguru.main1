// CLIENT MIRROR of supabase/functions/_shared/ttsNormalize.ts.
// Keep these two files in sync — same rules must apply on the server (primary
// ElevenLabs path) and on the browser SpeechSynthesis fallback so that e.g.
// "+" is never read as "plus sign" no matter which path plays.
//
// Shared TTS preprocessing for the AI Tutor.

//
// Goals:
//  1. Convert symbols (+, &, %, =, /, @, #, $, ₹, *) into natural spoken words
//     BEFORE sending to ElevenLabs, so they aren't read as "plus sign", etc.
//  2. Fix common mispronunciations (Aflat, OK, Mr., e.g., etc.) and Hinglish
//     words that ElevenLabs garbles when read with English phonetics.
//  3. Provide a gender rewriter that converts female-only Hinglish verb forms
//     (karungi, gayi, rahi, ...) to male equivalents when the active TTS voice
//     is male. This keeps spoken dialogue consistent with the voice persona.
//
// All transforms are pure string -> string with word-boundary regexes so they
// can be unit tested. Order matters: symbols first (so "&" inside "Q&A" is
// expanded before word-fixes run), then word fixes, then gender rewrite.

export type TutorVoiceGender = 'male' | 'female';

// ---------- Symbols ----------
// Replace recognised symbols with spoken words. We keep "." "?" "!" "," ";"
// ":" so the TTS engine still gets natural prosody and pauses.
const SYMBOL_MAP: Array<[RegExp, string]> = [
  // Strip markdown emphasis without leaving bare punctuation in the middle of
  // a word ("**hello**" -> "hello", "_word_" -> "word").
  [/\*\*(.+?)\*\*/g, '$1'],
  [/(^|[\s(])_([^_\n]+)_(?=[\s).,!?]|$)/g, '$1$2'],
  // Em / en dash and double hyphen become a comma pause.
  [/\s*[—–]\s*|\s--\s/g, ', '],
  // Currency
  [/₹/g, ' rupees '],
  [/\$/g, ' dollar '],
  // Math / logic
  [/\s\+\s|\+/g, ' plus '],
  [/\s=\s|=/g, ' equals '],
  [/\s%\s|%/g, ' percent '],
  // Connectors
  [/\s&\s|&/g, ' and '],
  [/\s\/\s/g, ' or '],
  // Social / refs
  [/(^|\s)@(\w)/g, '$1at $2'],
  [/(^|\s)#(\w)/g, '$1number $2'],
  // Standalone asterisk (after the **bold** transform above has consumed pairs)
  [/\s\*\s|\*/g, ' star '],
];

// ---------- Word fixes ----------
// Case-insensitive whole-word replacements. The replacement is lower-case
// because TTS uses pronunciation not capitalisation. Use ASCII letters only
// in keys; build regexes once at module load.
const WORD_FIXES: Array<[string, string]> = [
  // ---- Pronunciation corrections reported by users ----
  // "Ab" in Hinglish means "now" and should be pronounced /ʌb/ ("ub"), not
  // /ɑːb/ ("aab"). The default English TTS pronounces it long. Force short.
  ['Ab', 'ub'],
  ['ab', 'ub'],
  // "Join" — George was clipping the diphthong. Respell phonetically.
  ['join', 'joyn'],
  ['Join', 'joyn'],
  ['joined', 'joynd'],
  ['joining', 'joyning'],
  ['joins', 'joynz'],
  // Guard against the model literally saying "plus sign" if any upstream
  // text contains the phrase (the symbol → word map already handles "+").
  ['plus sign', 'plus'],
  ['minus sign', 'minus'],

  // ---- English / abbreviations ----
  ['Aflat', 'a flat'],
  ['aflat', 'a flat'],
  ['pls', 'please'],
  ['plz', 'please'],
  ['OK', 'okay'],
  ['Ok', 'okay'],
  ['Mr\\.', 'Mister'],
  ['Mrs\\.', 'Misses'],
  ['Ms\\.', 'Miss'],
  ['Dr\\.', 'Doctor'],
  ['etc\\.', 'et cetera'],
  ['e\\.g\\.', 'for example'],
  ['i\\.e\\.', 'that is'],
  ['vs\\.', 'versus'],
  ['Q&A', 'questions and answers'],
  ['FYI', 'F Y I'],
  ['ASAP', 'as soon as possible'],
  ['IMO', 'in my opinion'],
  ['btw', 'by the way'],


  // ---- Common English-learning vocabulary often mispronounced ----
  // (left side is the on-screen word, right side is the spoken form)
  ['colleague', 'kollig'],
  ['colleagues', 'kolligs'],
  ['schedule', 'sheduel'],
  ['often', 'offen'],
  ['vocabulary', 'voh-cab-yu-lary'],
  ['pronunciation', 'pro-nun-see-ay-shun'],
  ['comfortable', 'kumf-ter-bul'],
  ['Wednesday', 'wenz-day'],
  ['February', 'feb-roo-ary'],
  ['restaurant', 'res-tu-rant'],
  ['queue', 'kyoo'],
  ['debut', 'day-byoo'],
  ['genre', 'zhon-ruh'],
  ['suite', 'sweet'],
  ['receipt', 'ree-seet'],
  ['island', 'eye-land'],
  ['hour', 'aur'],
  ['honest', 'on-est'],
  ['honour', 'on-er'],
  ['honor', 'on-er'],

  // ---- Greetings / classroom phrases ----
  ['namaste', 'nuh-muss-tay'],
  ['namaskar', 'nuh-muss-kaar'],
  ['shabaash', 'shah-baash'],
  ['shabash', 'shah-baash'],
  ['bahut', 'buh-hut'],
  ['acha', 'uh-chha'],
  ['accha', 'uh-chha'],
  ['theek', 'theek'],
  ['matlab', 'mut-lub'],
  ['samjhe', 'sum-jhay'],
  ['samjha', 'sum-jha'],
  ['samjhi', 'sum-jhee'],
  ['suniye', 'soo-nee-yay'],
  ['boliye', 'bo-lee-yay'],
  ['dijiye', 'dee-jee-yay'],
  ['bataiye', 'buh-tah-ee-yay'],
  ['jawab', 'juh-waab'],
  ['galti', 'gul-tee'],
  ['sahi', 'suh-hee'],
  ['choti', 'chho-tee'],
  ['chhoti', 'chho-tee'],
  ['dosto', 'dosh-toh'],
  ['dost', 'dohst'],

  // ---- Indian city names (common mispronunciations by neural TTS) ----
  ['Mumbai', 'Mum-bye'],
  ['Bengaluru', 'Ben-guh-loo-roo'],
  ['Bangalore', 'Bang-uh-lor'],
  ['Kolkata', 'Kol-kah-tah'],
  ['Chennai', 'Chen-eye'],
  ['Hyderabad', 'Hy-der-a-baad'],
  ['Ahmedabad', 'Ah-muh-daa-baad'],
  ['Pune', 'Poo-nay'],
  ['Jaipur', 'Jai-poor'],
  ['Lucknow', 'Luck-now'],
  ['Kanpur', 'Kaan-poor'],
  ['Varanasi', 'Vuh-raa-nuh-see'],
  ['Kochi', 'Koh-chee'],
  ['Mysuru', 'My-soo-roo'],
  ['Mysore', 'My-sor'],
  ['Thiruvananthapuram', 'Thi-ru-vuh-nun-thuh-poo-rum'],

  // ---- Career / professional vocabulary ----
  ['entrepreneur', 'on-truh-pruh-nur'],
  ['resume', 'rez-oo-may'],
  ['CV', 'C V'],
  ['HR', 'H R'],
  ['CEO', 'C E O'],
  ['CTO', 'C T O'],
  ['MNC', 'M N C'],
  ['IT', 'I T'],
  ['BPO', 'B P O'],
  ['salary', 'sal-uh-ree'],
  ['interview', 'in-ter-vyoo'],
  ['career', 'kuh-reer'],
  ['opportunity', 'op-er-too-ni-tee'],
  ['manager', 'man-uh-jer'],

  // ---- Hinglish phonetic hints already present ----
  ['hain', 'hain'],
  ['hun', 'hoon'],
  ['hoon', 'hoon'],
  ['nahi', 'nahin'],
  ['nahin', 'nahin'],
  ['kyunki', 'kyon-ki'],
  ['kijiye', 'kee-jee-yay'],
  ['seekhenge', 'seekh-en-gay'],
  ['seekhe', 'seekh-ay'],
  ['rehte', 'reh-tay'],
  ['rehta', 'reh-taa'],
  ['rehti', 'reh-tee'],
  ['karta', 'kar-taa'],
  ['karti', 'kar-tee'],
  ['karenge', 'kuh-rain-gay'],
  ['kijiyega', 'kee-jee-yay-gaa'],
  ['shukriya', 'shook-ree-yaa'],
  ['dhanyavaad', 'dhun-yuh-vaad'],
];

const WORD_FIX_REGEX: Array<[RegExp, string]> = WORD_FIXES.map(([from, to]) => {
  // \b matches between word and non-word characters. If `from` ends with a
  // non-word char (e.g. "Mr\\.", "etc\\."), a trailing \b would not match
  // before a following space — drop it in that case.
  const endsWithNonWord = /\\\.|\W$/.test(from);
  const pattern = `\\b${from}${endsWithNonWord ? '' : '\\b'}`;
  return [new RegExp(pattern, 'gi'), to] as [RegExp, string];
});

// Standalone "Use" in Hinglish lessons means the noun (yoos), not the English
// verb (yooz). Trigger list widened so common Hindi function words also
// activate the rewrite ("aap", "hai", "ka", "ki", "ke", "mein", "se", ...).
function fixUseWord(s: string): string {
  const isHinglish = /\b(hain|hai|hun|hoon|kar|karo|kya|mein|nahi|nahin|aap|matlab|jaise|toh|ka|ki|ke|ko|se|bhi|par|kuch|liye|wala|wali|kaise|kahan|kab)\b/i.test(s);
  if (!isHinglish) return s;
  return s.replace(/\bUse\b/g, 'yoos').replace(/\buse\b/g, 'yoos').replace(/\buse ka\b/gi, 'yoos ka');
}

// Phrase-level prosody hints. Stress in short English questions often lands
// on the wrong word in flash v2.5 ("WHERE do you live?" vs "Where do you
// LIVE?"). A subtle comma before the target word pushes the model to pause
// briefly and emphasise what follows, without changing the displayed caption.
const PHRASE_FIXES: Array<[RegExp, string]> = [
  [/\bWhere do you live\b/gi, 'Where do you, live'],
  [/\bWhat do you do\b/gi, 'What do you, do'],
  [/\bHow do you do\b/gi, 'How do you, do'],
];


// ---------- Gender rewriter ----------
// Female-only Hinglish verb endings -> male equivalents. We keep the list to
// forms we have actually seen in the lesson scripts. Stem preservation is
// case-insensitive via a callback so "Karungi" / "karungi" both work.
const FEMALE_TO_MALE: Array<[RegExp, string]> = [
  [/\bkarungi\b/gi, 'karunga'],
  [/\bkaroongi\b/gi, 'karoonga'],
  [/\bkarti\b/gi, 'karta'],
  [/\brahi\b/gi, 'raha'],
  [/\brehti\b/gi, 'rehta'],
  [/\brahungi\b/gi, 'rahunga'],
  [/\brahoongi\b/gi, 'rahoonga'],
  [/\bgayi\b/gi, 'gaya'],
  [/\bgai\b/gi, 'gaya'],
  [/\bjaungi\b/gi, 'jaunga'],
  [/\bjaoongi\b/gi, 'jaoonga'],
  [/\bseekhungi\b/gi, 'seekhunga'],
  [/\bbolungi\b/gi, 'bolunga'],
  [/\bsamjhaungi\b/gi, 'samjhaunga'],
  [/\bsamjhaugi\b/gi, 'samjhaunga'],
  [/\bsikhaungi\b/gi, 'sikhaunga'],
  [/\bsikhaugi\b/gi, 'sikhaunga'],
  [/\bpadhati\b/gi, 'padhata'],
  [/\bpadhungi\b/gi, 'padhunga'],
  [/\bpadhaungi\b/gi, 'padhaunga'],
  [/\bpadhaugi\b/gi, 'padhaunga'],
  [/\bsunungi\b/gi, 'sununga'],
  [/\bsunaungi\b/gi, 'sunaunga'],
  [/\bbatlaungi\b/gi, 'batlaunga'],
  [/\bbataungi\b/gi, 'bataunga'],
  [/\bbataugi\b/gi, 'bataunga'],
  [/\bdikhaungi\b/gi, 'dikhaunga'],
  [/\bdikhaugi\b/gi, 'dikhaunga'],
  [/\blikhungi\b/gi, 'likhunga'],
  [/\bpoochungi\b/gi, 'poochunga'],
  [/\bpuchungi\b/gi, 'puchunga'],
  [/\bdungi\b/gi, 'dunga'],
  [/\blungi\b/gi, 'lunga'],
  [/\bteacher hu\b/gi, 'teacher hoon'],
];

export function applyVoiceGender(text: string, gender: TutorVoiceGender): string {
  if (gender !== 'male') return text;
  let out = text;
  for (const [re, repl] of FEMALE_TO_MALE) out = out.replace(re, repl);
  return out;
}

// ---------- Public entrypoint ----------
export function normalizeForTts(text: string, gender: TutorVoiceGender = 'male'): string {
  let s = String(text ?? '');
  for (const [re, repl] of SYMBOL_MAP) s = s.replace(re, repl);
  // Phrase-level prosody hints run BEFORE word fixes so the comma insertion
  // does not interfere with word-boundary matches downstream.
  for (const [re, repl] of PHRASE_FIXES) s = s.replace(re, repl);
  s = fixUseWord(s);
  for (const [re, repl] of WORD_FIX_REGEX) s = s.replace(re, repl);
  s = applyVoiceGender(s, gender);
  // Collapse whitespace introduced by symbol expansions.
  s = s.replace(/[ \t]+/g, ' ').replace(/ ([,.!?;:])/g, '$1').trim();
  return s;
}

