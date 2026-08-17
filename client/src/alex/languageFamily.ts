// A simplified language-family taxonomy, scoped to exactly the languages
// that appear in src/data/countries.json. Each entry is a lineage from
// broadest family to the language itself; two languages' narrowest shared
// ancestor is the longest common prefix of their lineages.
//
// This is a pragmatic simplification, not a rigorous classification —
// notably, creoles and pidgins are filed under their lexifier language's
// branch (e.g. Haitian Creole under Romance) rather than treated as
// contact languages in their own right, and sign languages are grouped
// together regardless of their actual (unrelated) origins.
const LANGUAGE_LINEAGE: Record<string, string[]> = {
  // Germanic
  English: ["Indo-European", "Germanic", "West Germanic", "Anglo-Frisian", "English"],
  German: ["Indo-European", "Germanic", "West Germanic", "High German", "German"],
  "Swiss German": ["Indo-European", "Germanic", "West Germanic", "High German", "Swiss German"],
  "Austro-Bavarian German": [
    "Indo-European",
    "Germanic",
    "West Germanic",
    "High German",
    "Austro-Bavarian German",
  ],
  Luxembourgish: ["Indo-European", "Germanic", "West Germanic", "High German", "Luxembourgish"],
  Dutch: ["Indo-European", "Germanic", "West Germanic", "Low Franconian", "Dutch"],
  Afrikaans: ["Indo-European", "Germanic", "West Germanic", "Low Franconian", "Afrikaans"],
  Danish: ["Indo-European", "Germanic", "North Germanic", "Danish"],
  Swedish: ["Indo-European", "Germanic", "North Germanic", "Swedish"],
  Icelandic: ["Indo-European", "Germanic", "North Germanic", "Icelandic"],
  "Norwegian Bokmål": ["Indo-European", "Germanic", "North Germanic", "Norwegian Bokmål"],
  "Norwegian Nynorsk": ["Indo-European", "Germanic", "North Germanic", "Norwegian Nynorsk"],
  "Belizean Creole": [
    "Indo-European",
    "Germanic",
    "West Germanic",
    "English-based Creole",
    "Belizean Creole",
  ],
  "Jamaican Patois": [
    "Indo-European",
    "Germanic",
    "West Germanic",
    "English-based Creole",
    "Jamaican Patois",
  ],
  Bislama: ["Indo-European", "Germanic", "West Germanic", "English-based Creole", "Bislama"],
  "Tok Pisin": ["Indo-European", "Germanic", "West Germanic", "English-based Creole", "Tok Pisin"],

  // Romance / Italic
  French: ["Indo-European", "Italic", "Romance", "Gallo-Romance", "French"],
  Italian: ["Indo-European", "Italic", "Romance", "Italo-Dalmatian", "Italian"],
  Spanish: ["Indo-European", "Italic", "Romance", "Ibero-Romance", "Spanish"],
  Portuguese: ["Indo-European", "Italic", "Romance", "Ibero-Romance", "Portuguese"],
  Catalan: ["Indo-European", "Italic", "Romance", "Occitano-Romance", "Catalan"],
  Romanian: ["Indo-European", "Italic", "Romance", "Eastern Romance", "Romanian"],
  Moldavian: ["Indo-European", "Italic", "Romance", "Eastern Romance", "Moldavian"],
  Romansh: ["Indo-European", "Italic", "Romance", "Rhaeto-Romance", "Romansh"],
  Latin: ["Indo-European", "Italic", "Latin"],
  "Haitian Creole": [
    "Indo-European",
    "Italic",
    "Romance",
    "French-based Creole",
    "Haitian Creole",
  ],
  "Mauritian Creole": [
    "Indo-European",
    "Italic",
    "Romance",
    "French-based Creole",
    "Mauritian Creole",
  ],
  "Seychellois Creole": [
    "Indo-European",
    "Italic",
    "Romance",
    "French-based Creole",
    "Seychellois Creole",
  ],
  "Upper Guinea Creole": [
    "Indo-European",
    "Italic",
    "Romance",
    "Portuguese-based Creole",
    "Upper Guinea Creole",
  ],

  // Slavic
  Russian: ["Indo-European", "Slavic", "East Slavic", "Russian"],
  Ukrainian: ["Indo-European", "Slavic", "East Slavic", "Ukrainian"],
  Belarusian: ["Indo-European", "Slavic", "East Slavic", "Belarusian"],
  Polish: ["Indo-European", "Slavic", "West Slavic", "Polish"],
  Czech: ["Indo-European", "Slavic", "West Slavic", "Czech"],
  Slovak: ["Indo-European", "Slavic", "West Slavic", "Slovak"],
  Bulgarian: ["Indo-European", "Slavic", "South Slavic", "Bulgarian"],
  Macedonian: ["Indo-European", "Slavic", "South Slavic", "Macedonian"],
  Serbian: ["Indo-European", "Slavic", "South Slavic", "Serbian"],
  Croatian: ["Indo-European", "Slavic", "South Slavic", "Croatian"],
  Bosnian: ["Indo-European", "Slavic", "South Slavic", "Bosnian"],
  Montenegrin: ["Indo-European", "Slavic", "South Slavic", "Montenegrin"],
  Slovene: ["Indo-European", "Slavic", "South Slavic", "Slovene"],

  // Baltic
  Lithuanian: ["Indo-European", "Baltic", "Lithuanian"],
  Latvian: ["Indo-European", "Baltic", "Latvian"],

  // Celtic / Hellenic / isolates-within-IE
  Irish: ["Indo-European", "Celtic", "Goidelic", "Irish"],
  Greek: ["Indo-European", "Hellenic", "Greek"],
  Albanian: ["Indo-European", "Albanian"],
  Armenian: ["Indo-European", "Armenian"],

  // Indo-Iranian
  Hindi: ["Indo-European", "Indo-Iranian", "Indo-Aryan", "Hindi"],
  Urdu: ["Indo-European", "Indo-Iranian", "Indo-Aryan", "Urdu"],
  Bengali: ["Indo-European", "Indo-Iranian", "Indo-Aryan", "Bengali"],
  Nepali: ["Indo-European", "Indo-Iranian", "Indo-Aryan", "Nepali"],
  Sinhala: ["Indo-European", "Indo-Iranian", "Indo-Aryan", "Sinhala"],
  Maldivian: ["Indo-European", "Indo-Iranian", "Indo-Aryan", "Maldivian"],
  "Fiji Hindi": ["Indo-European", "Indo-Iranian", "Indo-Aryan", "Fiji Hindi"],
  "Persian (Farsi)": ["Indo-European", "Indo-Iranian", "Iranian", "Persian (Farsi)"],
  Dari: ["Indo-European", "Indo-Iranian", "Iranian", "Dari"],
  Tajik: ["Indo-European", "Indo-Iranian", "Iranian", "Tajik"],
  Pashto: ["Indo-European", "Indo-Iranian", "Iranian", "Pashto"],
  Sorani: ["Indo-European", "Indo-Iranian", "Iranian", "Sorani"],

  // Afro-Asiatic
  Arabic: ["Afro-Asiatic", "Semitic", "Central Semitic", "Arabic"],
  Hebrew: ["Afro-Asiatic", "Semitic", "Central Semitic", "Hebrew"],
  Maltese: ["Afro-Asiatic", "Semitic", "Central Semitic", "Maltese"],
  Aramaic: ["Afro-Asiatic", "Semitic", "Central Semitic", "Aramaic"],
  Amharic: ["Afro-Asiatic", "Semitic", "Ethiopian Semitic", "Amharic"],
  Tigrinya: ["Afro-Asiatic", "Semitic", "Ethiopian Semitic", "Tigrinya"],
  Berber: ["Afro-Asiatic", "Berber"],
  Somali: ["Afro-Asiatic", "Cushitic", "Somali"],

  // Niger-Congo (mostly Bantu)
  Swahili: ["Niger-Congo", "Bantu", "Swahili"],
  Kikongo: ["Niger-Congo", "Bantu", "Kikongo"],
  Lingala: ["Niger-Congo", "Bantu", "Lingala"],
  Tshiluba: ["Niger-Congo", "Bantu", "Tshiluba"],
  Kinyarwanda: ["Niger-Congo", "Bantu", "Kinyarwanda"],
  Kirundi: ["Niger-Congo", "Bantu", "Kirundi"],
  Chewa: ["Niger-Congo", "Bantu", "Chewa"],
  Shona: ["Niger-Congo", "Bantu", "Shona"],
  Ndau: ["Niger-Congo", "Bantu", "Ndau"],
  Chibarwe: ["Niger-Congo", "Bantu", "Chibarwe"],
  Kalanga: ["Niger-Congo", "Bantu", "Kalanga"],
  Lozi: ["Niger-Congo", "Bantu", "Lozi"],
  Ndonga: ["Niger-Congo", "Bantu", "Ndonga"],
  Kwangali: ["Niger-Congo", "Bantu", "Kwangali"],
  Herero: ["Niger-Congo", "Bantu", "Herero"],
  "Northern Sotho": ["Niger-Congo", "Bantu", "Northern Sotho"],
  "Southern Sotho": ["Niger-Congo", "Bantu", "Southern Sotho"],
  Sotho: ["Niger-Congo", "Bantu", "Sotho"],
  Tswana: ["Niger-Congo", "Bantu", "Tswana"],
  Tsonga: ["Niger-Congo", "Bantu", "Tsonga"],
  Swazi: ["Niger-Congo", "Bantu", "Swazi"],
  Venda: ["Niger-Congo", "Bantu", "Venda"],
  Xhosa: ["Niger-Congo", "Bantu", "Xhosa"],
  Zulu: ["Niger-Congo", "Bantu", "Zulu"],
  "Northern Ndebele": ["Niger-Congo", "Bantu", "Northern Ndebele"],
  "Southern Ndebele": ["Niger-Congo", "Bantu", "Southern Ndebele"],
  Comorian: ["Niger-Congo", "Bantu", "Comorian"],
  Tonga: ["Niger-Congo", "Bantu", "Tonga"],
  Sango: ["Niger-Congo", "Ubangian", "Sango"],

  // Khoisan
  Khoekhoe: ["Khoisan", "Khoekhoe"],
  Khoisan: ["Khoisan", "Khoisan"],

  // Sino-Tibetan / Japonic / Koreanic
  Chinese: ["Sino-Tibetan", "Sinitic", "Chinese"],
  Burmese: ["Sino-Tibetan", "Burmese"],
  Dzongkha: ["Sino-Tibetan", "Tibetic", "Dzongkha"],
  Japanese: ["Japonic", "Japanese"],
  Korean: ["Koreanic", "Korean"],

  // Kra-Dai / Austroasiatic
  Thai: ["Kra-Dai", "Thai"],
  Lao: ["Kra-Dai", "Lao"],
  Khmer: ["Austroasiatic", "Khmer"],
  Vietnamese: ["Austroasiatic", "Vietic", "Vietnamese"],

  // Austronesian
  Indonesian: ["Austronesian", "Malayo-Polynesian", "Malayic", "Indonesian"],
  Malay: ["Austronesian", "Malayo-Polynesian", "Malayic", "Malay"],
  Filipino: ["Austronesian", "Malayo-Polynesian", "Philippine", "Filipino"],
  Malagasy: ["Austronesian", "Malayo-Polynesian", "Barito", "Malagasy"],
  Fijian: ["Austronesian", "Malayo-Polynesian", "Oceanic", "Fijian"],
  "Hiri Motu": ["Austronesian", "Malayo-Polynesian", "Oceanic", "Hiri Motu"],
  Samoan: ["Austronesian", "Malayo-Polynesian", "Oceanic", "Samoan"],
  Tongan: ["Austronesian", "Malayo-Polynesian", "Oceanic", "Tongan"],
  Tuvaluan: ["Austronesian", "Malayo-Polynesian", "Oceanic", "Tuvaluan"],
  Māori: ["Austronesian", "Malayo-Polynesian", "Oceanic", "Māori"],
  Gilbertese: ["Austronesian", "Malayo-Polynesian", "Micronesian", "Gilbertese"],
  Marshallese: ["Austronesian", "Malayo-Polynesian", "Micronesian", "Marshallese"],
  Nauru: ["Austronesian", "Malayo-Polynesian", "Micronesian", "Nauru"],
  Palauan: ["Austronesian", "Malayo-Polynesian", "Palauan"],
  Tetum: ["Austronesian", "Malayo-Polynesian", "Tetum"],

  // Uralic
  Finnish: ["Uralic", "Finnic", "Finnish"],
  Estonian: ["Uralic", "Finnic", "Estonian"],
  Sami: ["Uralic", "Sami"],
  Hungarian: ["Uralic", "Ugric", "Hungarian"],

  // Turkic / Mongolic
  Turkish: ["Turkic", "Oghuz", "Turkish"],
  Azerbaijani: ["Turkic", "Oghuz", "Azerbaijani"],
  Turkmen: ["Turkic", "Oghuz", "Turkmen"],
  Kazakh: ["Turkic", "Kipchak", "Kazakh"],
  Kyrgyz: ["Turkic", "Kipchak", "Kyrgyz"],
  Uzbek: ["Turkic", "Karluk", "Uzbek"],
  Mongolian: ["Mongolic", "Mongolian"],

  // Other families
  Georgian: ["Kartvelian", "Georgian"],
  Tamil: ["Dravidian", "Tamil"],
  Quechua: ["Quechuan", "Quechua"],
  Aymara: ["Aymaran", "Aymara"],
  Guaraní: ["Tupian", "Tupi-Guarani", "Guaraní"],

  // Sign languages (grouped together regardless of actual, unrelated origins)
  "New Zealand Sign Language": ["Sign Language", "New Zealand Sign Language"],
  "Zimbabwean Sign Language": ["Sign Language", "Zimbabwean Sign Language"],
};

export function languageLineage(language: string): string[] | undefined {
  return LANGUAGE_LINEAGE[language];
}

export interface LanguageMatch {
  // The guessed-side language whose lineage is shown, chosen as whichever of
  // the guessed country's languages shares the deepest ancestry with any of
  // the target's languages.
  language: string;
  lineage: string[];
  // How many levels from the start of `lineage` are shared with the target
  // (0 if no relation was found at all).
  sharedDepth: number;
}

export function bestLanguageMatch(guessedLanguages: string[], targetLanguages: string[]): LanguageMatch {
  let best: LanguageMatch | null = null;

  for (const guessed of guessedLanguages) {
    const lineageG = LANGUAGE_LINEAGE[guessed];
    if (!lineageG) continue;

    let deepest = 0;
    for (const target of targetLanguages) {
      const lineageT = LANGUAGE_LINEAGE[target];
      if (!lineageT) continue;

      let depth = 0;
      while (
        depth < lineageG.length &&
        depth < lineageT.length &&
        lineageG[depth] === lineageT[depth]
      ) {
        depth++;
      }
      if (depth > deepest) deepest = depth;
    }

    if (!best || deepest > best.sharedDepth) {
      best = { language: guessed, lineage: lineageG, sharedDepth: deepest };
    }
  }

  if (best) return best;

  // No mapped language produced any match (or none are in the taxonomy at
  // all) — fall back to the first language so there's still something to show.
  const fallbackLanguage = guessedLanguages[0];
  return {
    language: fallbackLanguage,
    lineage: LANGUAGE_LINEAGE[fallbackLanguage] ?? [fallbackLanguage],
    sharedDepth: 0,
  };
}
