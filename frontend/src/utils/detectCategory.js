// Heuristic skill-title → category detector. Matches whole words (English + Russian keywords)
// against the title; first category with a hit wins. Returns null when nothing matches so the
// caller can keep the user's current choice. Order matters: more specific lists come first.

const KEYWORDS = {
  PROGRAMMING: [
    'python', 'java', 'javascript', 'js', 'typescript', 'ts', 'react', 'angular', 'vue', 'node',
    'c++', 'c#', 'go', 'golang', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'sql', 'html', 'css',
    'coding', 'programming', 'developer', 'development', 'software', 'web', 'app', 'data science',
    'machine learning', 'ml', 'ai', 'devops', 'docker', 'kubernetes', 'backend', 'frontend',
    'algorithm', 'database',
    'программирование', 'программист', 'разработка', 'код', 'питон', 'джава', 'веб', 'сайт',
    'базы данных', 'данные',
  ],
  DESIGN: [
    'design', 'ui', 'ux', 'ui/ux', 'figma', 'photoshop', 'illustrator', 'graphic', 'branding',
    'logo', 'typography', 'sketch', 'prototyping', 'wireframe',
    'дизайн', 'графика', 'логотип', 'фигма', 'верстка',
  ],
  LANGUAGE: [
    'english', 'spanish', 'french', 'german', 'chinese', 'mandarin', 'japanese', 'korean',
    'russian', 'kazakh', 'arabic', 'italian', 'portuguese', 'turkish', 'language', 'conversation',
    'grammar', 'ielts', 'toefl',
    'английский', 'испанский', 'французский', 'немецкий', 'китайский', 'японский', 'корейский',
    'русский', 'казахский', 'арабский', 'язык', 'язык', 'грамматика',
  ],
  MUSIC: [
    'guitar', 'piano', 'drums', 'violin', 'bass', 'singing', 'vocals', 'music', 'song', 'songwriting',
    'producer', 'dj', 'saxophone', 'flute', 'ukulele', 'cello', 'beat',
    'гитара', 'пианино', 'фортепиано', 'барабаны', 'скрипка', 'вокал', 'пение', 'музыка', 'песня',
  ],
  COOKING: [
    'cooking', 'cook', 'baking', 'bake', 'pastry', 'chef', 'cuisine', 'recipe', 'grill', 'bbq',
    'besh', 'beshbarmak', 'sushi', 'pasta', 'bread', 'fish', 'meat',
    'кулинария', 'готовка', 'готовить', 'выпечка', 'кухня', 'рецепт', 'бешбармак', 'рыба', 'мясо',
  ],
  PHOTOGRAPHY: [
    'photography', 'photo', 'photoshoot', 'camera', 'lightroom', 'portrait', 'videography', 'video',
    'editing', 'cinematography', 'lens',
    'фотография', 'фото', 'камера', 'съемка', 'видео', 'монтаж',
  ],
  FITNESS: [
    'fitness', 'gym', 'workout', 'yoga', 'pilates', 'running', 'crossfit', 'training', 'trainer',
    'bodybuilding', 'cardio', 'strength', 'boxing', 'swimming', 'cycling', 'nutrition',
    'фитнес', 'спорт', 'тренировка', 'йога', 'бег', 'качалка', 'тренер', 'плавание', 'бокс', 'питание',
  ],
  BUSINESS: [
    'business', 'marketing', 'sales', 'finance', 'accounting', 'management', 'startup',
    'entrepreneur', 'analytics', 'seo', 'advertising', 'economics', 'investing', 'excel',
    'consulting', 'strategy',
    'бизнес', 'маркетинг', 'продажи', 'финансы', 'бухгалтерия', 'менеджмент', 'стартап',
    'экономика', 'инвестиции', 'реклама',
  ],
}

// Match a keyword as a whole token (so "go" doesn't match "google", but "c++"/"ui/ux" still work).
function hasKeyword(haystack, kw) {
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Unicode-aware word boundary: keyword not flanked by another letter/digit.
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, 'iu')
  return re.test(haystack)
}

/**
 * @param {string} title raw skill title
 * @returns {string|null} a SkillCategory enum value, or null if nothing confidently matched
 */
export function detectCategory(title) {
  if (!title || !title.trim()) return null
  const text = title.toLowerCase().trim()
  for (const [category, words] of Object.entries(KEYWORDS)) {
    for (const kw of words) {
      if (hasKeyword(text, kw.toLowerCase())) return category
    }
  }
  return null
}
