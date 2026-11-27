// Core vocabulary per Global Success unit (grade 6–9), used to tag dictionary results with
// "Unit X – Lớp Y" and as word lists for the English games.
// CẦN GIÁO VIÊN KIỂM TRA – danh sách soạn theo chủ đề Unit, chưa đối chiếu sách in.
// unitId matches ENGLISH_UNITS in src/data/gameCurriculum.ts.
export interface TextbookWord {
  word: string;
  grade: string; // "Lớp 6"
  unitId: string; // "e6-1"
}

const UNIT_WORDS: Record<string, string[]> = {
  // ---------- Lớp 6 ----------
  "e6-1": ["school", "classmate", "uniform", "subject", "timetable", "pencil case", "calculator", "compass", "notebook", "rubber", "textbook", "homework", "boarding school", "excited", "smart", "library", "playground", "lesson"],
  "e6-2": ["house", "apartment", "bedroom", "kitchen", "living room", "bathroom", "hall", "attic", "town house", "country house", "furniture", "cupboard", "wardrobe", "dishwasher", "fridge", "sofa", "lamp", "messy"],
  "e6-3": ["friend", "appearance", "personality", "kind", "clever", "confident", "creative", "funny", "hard-working", "patient", "shy", "friendly", "curly", "chubby", "cheek", "shoulder", "picnic", "talkative"],
  "e6-4": ["neighbourhood", "street", "cathedral", "temple", "railway station", "square", "art gallery", "statue", "memorial", "suburb", "crowded", "peaceful", "noisy", "convenient", "polluted", "historic", "narrow", "turn left"],
  "e6-5": ["natural wonder", "mountain", "island", "bay", "cave", "desert", "waterfall", "forest", "river", "lake", "scenery", "landscape", "compass", "backpack", "sleeping bag", "sun cream", "travel", "explore"],
  "e6-6": ["tet", "holiday", "lucky money", "firework", "peach blossom", "apricot blossom", "calendar", "decorate", "celebrate", "wish", "relative", "special food", "shopping", "clean", "family gathering", "present", "pagoda", "new year"],
  "e6-7": ["television", "channel", "programme", "cartoon", "comedy", "news", "game show", "documentary", "talent show", "weather forecast", "viewer", "remote control", "character", "educational", "entertaining", "funny", "boring", "schedule"],
  "e6-8": ["sport", "game", "football", "badminton", "volleyball", "table tennis", "swimming", "cycling", "karate", "chess", "racket", "goggles", "ball", "competition", "marathon", "champion", "player", "fit"],
  "e6-9": ["city", "capital", "landmark", "tower", "palace", "museum", "market", "famous", "modern", "ancient", "busy", "tourist", "postcard", "weather", "festival", "crowded", "exciting", "beautiful"],
  "e6-10": ["future", "robot", "smart home", "solar energy", "wireless", "appliance", "UFO", "space", "ocean", "skyscraper", "hi-tech", "washing machine", "electric cooker", "palace", "cottage", "computer", "comfortable", "underground"],
  "e6-11": ["environment", "recycle", "reuse", "reduce", "rubbish", "plastic bag", "bottle", "pollution", "litter", "energy", "electricity", "plant trees", "bin", "green", "air", "water", "protect", "nature"],
  "e6-12": ["robot", "machine", "do the dishes", "guard", "lift", "understand", "recognise", "planet", "space station", "teaching robot", "worker robot", "doctor robot", "home robot", "move", "cut", "make the bed", "skill", "power"],
  // ---------- Lớp 7 ----------
  "e7-1": ["hobby", "collect", "stamp", "gardening", "horse riding", "skating", "dollhouse", "building model", "making model", "jogging", "photography", "board game", "unusual", "creative", "patient", "share", "enjoy", "free time"],
  "e7-2": ["healthy", "diet", "exercise", "calorie", "vitamin", "acne", "sunburn", "chapped lips", "fast food", "junk food", "tired", "sleep", "fit", "skin", "allergy", "soft drink", "vegetable", "lifestyle"],
  "e7-3": ["community service", "volunteer", "donate", "charity", "homeless", "elderly", "disabled", "orphanage", "tutor", "clean up", "plant", "recycle", "blanket", "raise money", "nursing home", "support", "help", "benefit"],
  "e7-4": ["music", "art", "instrument", "piano", "guitar", "violin", "drum", "painting", "portrait", "artist", "musician", "concert", "puppet show", "water puppetry", "exhibition", "perform", "talented", "classical"],
  "e7-5": ["food", "drink", "beef", "pork", "noodle", "pancake", "omelette", "spring roll", "eel soup", "lemonade", "mineral water", "milk tea", "ingredient", "recipe", "teaspoon", "gram", "delicious", "tasty"],
  "e7-6": ["school", "gifted", "facility", "lab", "library", "school garden", "outdoor activity", "midterm", "exam", "project", "excursion", "experiment", "principal", "staff", "visit", "entrance", "playground", "famous"],
  "e7-7": ["traffic", "road sign", "traffic light", "cycle lane", "pedestrian", "zebra crossing", "helmet", "seat belt", "traffic jam", "accident", "driving licence", "vehicle", "passenger", "obey", "safety", "rush hour", "fine", "pavement"],
  "e7-8": ["film", "cinema", "comedy", "horror film", "science fiction", "documentary", "animation", "action film", "director", "actor", "actress", "plot", "review", "gripping", "shocking", "moving", "boring", "star"],
  "e7-9": ["festival", "celebrate", "parade", "costume", "firework", "harvest", "lantern", "candle", "Christmas", "Easter", "Thanksgiving", "Diwali", "mid-autumn", "mooncake", "perform", "dance", "tradition", "gather"],
  "e7-10": ["energy", "source", "renewable", "non-renewable", "solar", "wind", "hydro", "nuclear", "coal", "oil", "natural gas", "electricity", "power", "panel", "save energy", "waste", "cheap", "plentiful"],
  "e7-11": ["future", "travel", "transport", "flying car", "hyperloop", "skyTran", "bamboo-copter", "teleporter", "solar-powered", "driverless", "autopilot", "eco-friendly", "fume", "traffic jam", "fast", "safe", "convenient", "electric bike"],
  "e7-12": ["English-speaking country", "native speaker", "castle", "kangaroo", "koala", "landscape", "loch", "symbol", "tower", "culture", "tourist attraction", "accent", "local", "visit", "capital", "palace", "island", "unique"],
  // ---------- Lớp 8 ----------
  "e8-1": ["leisure", "free time", "hang out", "surf the net", "DIY", "crafts", "knitting", "cooking", "socialise", "addicted", "balance", "relax", "detest", "fancy", "prefer", "spend time", "outdoor", "indoor"],
  "e8-2": ["countryside", "village", "paddy field", "buffalo", "cattle", "harvest", "plough", "rice", "farmer", "picturesque", "peaceful", "slow", "vast", "hospitable", "load", "dry", "herd", "orchard"],
  "e8-3": ["teenager", "peer pressure", "stress", "bully", "social media", "online", "forum", "account", "log on", "browse", "notification", "concentrate", "upset", "worried", "club", "schoolwork", "expectation", "independent"],
  "e8-4": ["ethnic group", "minority", "majority", "costume", "stilt house", "communal house", "terraced field", "gong", "culture", "custom", "folk dance", "speciality", "highland", "lowland", "heritage", "traditional", "unique", "population"],
  "e8-5": ["custom", "tradition", "family", "festival", "worship", "ancestor", "offering", "bow", "respect", "superstition", "ritual", "pass down", "generation", "follow", "break", "manner", "table manners", "belief"],
  "e8-6": ["lifestyle", "habit", "change", "online learning", "e-commerce", "native", "greeting", "maintain", "cuisine", "rural", "urban", "community", "tribal", "practise", "trend", "fashion", "modern", "traditional"],
  "e8-7": ["environmental protection", "pollution", "carbon footprint", "habitat", "species", "endangered", "wildlife", "ecosystem", "deforestation", "global warming", "climate change", "litter", "waste", "eco-friendly", "conservation", "release", "contaminate", "sustainable"],
  "e8-8": ["shopping", "shopping centre", "supermarket", "convenience store", "discount", "price tag", "bargain", "customer", "online shopping", "open-air market", "farmers' market", "goods", "receipt", "cash", "credit card", "browse", "addicted", "sale"],
  "e8-9": ["natural disaster", "earthquake", "flood", "storm", "typhoon", "tornado", "landslide", "drought", "tsunami", "volcano", "erupt", "damage", "destroy", "victim", "rescue", "shelter", "emergency", "warning"],
  "e8-10": ["communication", "future", "video conference", "social network", "emoji", "message", "smartphone", "telepathy", "holography", "translation", "language barrier", "face-to-face", "landline", "interact", "connect", "instant", "privacy", "technology"],
  "e8-11": ["science", "technology", "invention", "inventor", "scientist", "experiment", "discover", "robot", "artificial intelligence", "laboratory", "research", "improve", "develop", "device", "engineer", "medicine", "space", "progress"],
  "e8-12": ["planet", "alien", "spaceship", "space station", "astronaut", "galaxy", "solar system", "Mars", "gravity", "oxygen", "surface", "crater", "telescope", "orbit", "habitable", "creature", "UFO", "explore"],
  // ---------- Lớp 9 ----------
  "e9-1": ["local community", "craftsman", "handicraft", "artisan", "workshop", "pottery", "embroidery", "lacquerware", "attraction", "facility", "community helper", "firefighter", "delivery person", "volunteer", "local", "pass down", "preserve", "cast"],
  "e9-2": ["city", "metro", "skyscraper", "traffic jam", "crowded", "noisy", "convenient", "public transport", "cost of living", "entertainment", "liveable", "downtown", "pollution", "opportunity", "suburb", "resident", "rush hour", "fascinating"],
  "e9-3": ["healthy living", "teen", "balanced diet", "stress", "pressure", "mental health", "physical health", "sleep", "screen time", "exercise", "nutrition", "meditation", "well-being", "habit", "manage", "schedule", "accomplish", "concentrate"],
  "e9-4": ["past", "remember", "ancestor", "historical", "monument", "ruin", "heritage", "dynasty", "emperor", "temple", "worship", "custom", "preserve", "generation", "era", "ancient", "dye", "keep"],
  "e9-5": ["experience", "adventure", "explore", "trip", "memorable", "embarrassing", "frightening", "exciting", "unforgettable", "abroad", "volunteer", "competition", "challenge", "brave", "nervous", "proud", "achievement", "journey"],
  "e9-6": ["lifestyle", "then", "now", "extended family", "nuclear family", "tram", "trolleybus", "rickshaw", "cyclo", "rice cooker", "charcoal", "food stamp", "ration", "tolerate", "behave", "modernise", "obey", "generation"],
  "e9-7": ["natural wonder", "canyon", "glacier", "volcano", "rainforest", "coral reef", "waterfall", "desert", "valley", "peak", "geological", "spectacular", "breathtaking", "unique", "preserve", "tourist", "landscape", "protect"],
  "e9-8": ["tourism", "tourist", "destination", "package tour", "travel agency", "itinerary", "accommodation", "sightseeing", "resort", "luggage", "passport", "visa", "souvenir", "budget", "ecotourism", "explore", "excursion", "reservation"],
  "e9-9": ["English", "language", "accent", "dialect", "native speaker", "official language", "second language", "foreign language", "fluent", "bilingual", "grammar", "vocabulary", "pronunciation", "communicate", "global", "variety", "flexible", "mother tongue"],
  "e9-10": ["planet", "earth", "continent", "ocean", "atmosphere", "climate", "species", "biodiversity", "ecosystem", "rainforest", "pole", "habitat", "resource", "sustainable", "protect", "survive", "extinction", "gravity"],
  "e9-11": ["electronic device", "smartphone", "tablet", "laptop", "smartwatch", "e-reader", "headphones", "charger", "battery", "screen", "touchscreen", "app", "digital", "device", "camera", "voice recognition", "track", "portable"],
  "e9-12": ["career", "job", "profession", "occupation", "vocational", "academic", "university", "college", "apprentice", "skill", "salary", "employer", "employee", "interview", "qualification", "experience", "mechanic", "tailor"],
};

export const TEXTBOOK_WORDS: TextbookWord[] = Object.entries(UNIT_WORDS).flatMap(([unitId, words]) => {
  const grade = `Lớp ${unitId.match(/^e(\d)/)?.[1] || "6"}`;
  return words.map((word) => ({ word: word.toLowerCase(), grade, unitId }));
});

/** Words of one unit (for games and word lists). */
export function wordsOfUnit(unitId: string): string[] {
  return (UNIT_WORDS[unitId] || []).map((w) => w.toLowerCase());
}

export const TEXTBOOK_UNIT_IDS = Object.keys(UNIT_WORDS);
