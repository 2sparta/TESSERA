import type { CivKey, ResourceKey, TerrainKey } from './types';

export interface TerrainDef {
  name: string;
  food: number;
  stars: number;
  sci: number;
  move: number;
  def: number;
  water?: boolean;
  impassable?: boolean;
  color: string;
  icon: string;
}

export const TERRAIN: Record<TerrainKey, TerrainDef> = {
  plains: { name: 'Равнина', food: 1, stars: 0, sci: 0, move: 1, def: 0, color: '#c3cf86', icon: '' },
  forest: { name: 'Лес', food: 1, stars: 0, sci: 0, move: 2, def: 0.25, color: '#6b9a58', icon: '🌲' },
  hills: { name: 'Холмы', food: 1, stars: 1, sci: 0, move: 2, def: 0.25, color: '#c0a668', icon: '⛰️' },
  mountains: { name: 'Горы', food: 0, stars: 1, sci: 0, move: 3, def: 0.5, impassable: true, color: '#9a918a', icon: '🏔️' },
  desert: { name: 'Пустыня', food: 0, stars: 0, sci: 0, move: 1, def: -0.1, color: '#e8d4a0', icon: '' },
  swamp: { name: 'Болото', food: 1, stars: 0, sci: 0, move: 3, def: -0.25, color: '#7d8f62', icon: '💧' },
  tundra: { name: 'Тундра', food: 0, stars: 0, sci: 0, move: 1, def: 0, color: '#dfe6e2', icon: '' },
  coast: { name: 'Побережье', food: 1, stars: 0, sci: 0, move: 1, def: 0, water: true, color: '#59a4c6', icon: '' },
  ocean: { name: 'Океан', food: 2, stars: 0, sci: 0, move: 1, def: 0, water: true, color: '#2f6f95', icon: '' },
  reef: { name: 'Рифы', food: 2, stars: 1, sci: 0, move: 2, def: 0, water: true, color: '#49b0b5', icon: '🪸' },
};

export interface ResourceDef {
  name: string;
  icon: string;
  food: number;
  stars: number;
  sci: number;
  cap: string;
  cost: number;
  on: TerrainKey[];
}

export const RESOURCES: Record<ResourceKey, ResourceDef> = {
  fruit: { name: 'Фрукты', icon: '🍇', food: 2, stars: 0, sci: 0, cap: 'agri', cost: 5, on: ['plains', 'forest'] },
  game: { name: 'Дичь', icon: '🦌', food: 2, stars: 0, sci: 0, cap: 'hunt', cost: 5, on: ['forest'] },
  cattle: { name: 'Скот', icon: '🐄', food: 1, stars: 1, sci: 0, cap: 'husb', cost: 5, on: ['plains'] },
  grain: { name: 'Зерно', icon: '🌾', food: 3, stars: 0, sci: 0, cap: 'agri', cost: 5, on: ['plains'] },
  fish: { name: 'Рыба', icon: '🐟', food: 2, stars: 0, sci: 0, cap: 'fish', cost: 5, on: ['coast'] },
  whale: { name: 'Кит', icon: '🐋', food: 2, stars: 1, sci: 0, cap: 'whale', cost: 6, on: ['ocean'] },
  ore: { name: 'Руда', icon: '⛏️', food: 0, stars: 2, sci: 0, cap: 'mine', cost: 5, on: ['hills'] },
  gems: { name: 'Самоцветы', icon: '💎', food: 0, stars: 3, sci: 0, cap: 'gems', cost: 6, on: ['mountains'] },
  salt: { name: 'Соль', icon: '🧂', food: 1, stars: 2, sci: 0, cap: 'salt', cost: 5, on: ['desert'] },
  spices: { name: 'Специи', icon: '🌿', food: 1, stars: 2, sci: 0, cap: 'herb', cost: 5, on: ['swamp'] },
  obelisk: { name: 'Обелиск', icon: '🗿', food: 0, stars: 0, sci: 2, cap: 'write', cost: 5, on: [] },
};

export interface UnitDef {
  name: string;
  cost: number;
  hp: number;
  atk: number;
  def: number;
  mv: number;
  rng: number;
  icon: string;
  note: string;
  naval?: boolean;
  siege?: boolean;
  cav?: boolean;
  inf?: boolean;
  settler?: boolean;
  hero?: boolean;
  limit?: number;
  civ?: CivKey;
  tech?: string;
  needPort?: boolean;
}

export const UNITS: Record<string, UnitDef> = {
  warrior: { name: 'Воин', cost: 2, hp: 10, atk: 2, def: 2, mv: 1, rng: 1, icon: '🗡️', inf: true, note: 'Дешёвая пехота' },
  spearman: { name: 'Копейщик', cost: 3, hp: 12, atk: 2, def: 3, mv: 1, rng: 1, icon: '🔱', inf: true, note: '+50% против кавалерии' },
  archer: { name: 'Лучник', cost: 3, hp: 10, atk: 2, def: 1, mv: 1, rng: 2, icon: '🏹', inf: true, note: 'Стреляет на 2, без ответного удара' },
  horseman: { name: 'Всадник', cost: 5, hp: 12, atk: 3, def: 1, mv: 3, rng: 1, icon: '🐎', cav: true, note: 'Может отойти после атаки' },
  catapult: { name: 'Катапульта', cost: 8, hp: 10, atk: 4, def: 1, mv: 1, rng: 3, icon: '🪨', siege: true, note: 'Не двигается в ход стрельбы' },
  trireme: { name: 'Трирема', cost: 5, hp: 12, atk: 2, def: 2, mv: 3, rng: 1, icon: '⛵', naval: true, needPort: true, note: 'Только вода' },
  settler: { name: 'Колонист', cost: 5, hp: 10, atk: 0, def: 0, mv: 1, rng: 0, icon: '🚩', settler: true, note: 'Основывает город' },

  hoplite: { name: 'Гоплит', cost: 5, hp: 15, atk: 4, def: 4, mv: 1, rng: 1, icon: '🛡️', inf: true, civ: 'sparta', tech: 'spa_hoplites', note: 'Элитная тяжёлая пехота' },
  spartiate: { name: 'Спартиат', cost: 12, hp: 25, atk: 6, def: 6, mv: 2, rng: 1, icon: '🦁', inf: true, limit: 1, civ: 'sparta', tech: 'spa_300', note: 'Лечится +3 HP/ход вне боя' },
  ballista: { name: 'Баллиста', cost: 8, hp: 12, atk: 3, def: 2, mv: 1, rng: 2, icon: '🎯', siege: true, civ: 'sparta', tech: 'spa_siege', note: '+100% против стен' },
  leonidas: { name: 'Леонид', cost: 14, hp: 30, atk: 6, def: 5, mv: 2, rng: 1, icon: '👑', hero: true, inf: true, limit: 1, civ: 'sparta', tech: 'spa_leonidas', note: 'Аура +15% атаки союзникам' },

  velite: { name: 'Велит', cost: 3, hp: 8, atk: 3, def: 1, mv: 1, rng: 2, icon: '🪃', inf: true, civ: 'rome', tech: 'rom_velites', note: 'Метатель дротиков' },
  legionary: { name: 'Легионер', cost: 5, hp: 15, atk: 4, def: 3, mv: 1, rng: 1, icon: '🦅', inf: true, civ: 'rome', tech: 'rom_principes', note: 'Основа легиона' },
  onager: { name: 'Онагр', cost: 10, hp: 12, atk: 6, def: 1, mv: 1, rng: 3, icon: '💥', siege: true, civ: 'rome', tech: 'rom_siege', note: '+150% против городов' },

  bireme: { name: 'Бирема', cost: 6, hp: 15, atk: 3, def: 3, mv: 3, rng: 1, icon: '🚣', naval: true, needPort: true, civ: 'phoenicia', tech: 'pho_bireme', note: 'Таран: +50% против кораблей' },
  quinquereme: { name: 'Квинкверема', cost: 12, hp: 22, atk: 5, def: 5, mv: 2, rng: 2, icon: '🚢', naval: true, needPort: true, civ: 'phoenicia', tech: 'pho_quinq', note: 'Морская артиллерия' },
  numidian: { name: 'Нумидийский всадник', cost: 5, hp: 12, atk: 4, def: 1, mv: 4, rng: 1, icon: '🐴', cav: true, civ: 'phoenicia', tech: 'pho_merc', note: 'Наёмник, движение 4' },

  gaesatae: { name: 'Гаесат', cost: 5, hp: 14, atk: 5, def: 1, mv: 1, rng: 1, icon: '🪓', inf: true, civ: 'gaul', tech: 'gal_axes', note: 'Ярость: +1 атака при HP < 50%' },
  grider: { name: 'Галльский всадник', cost: 6, hp: 12, atk: 4, def: 2, mv: 3, rng: 1, icon: '🐗', cav: true, civ: 'gaul', tech: 'gal_cavalry', note: 'Игнорирует штраф леса' },
  druid: { name: 'Друид', cost: 6, hp: 12, atk: 1, def: 2, mv: 1, rng: 1, icon: '🌿', inf: true, civ: 'gaul', tech: 'gal_druids', note: 'Лечит +3 HP союзникам рядом' },
  vercingetorix: { name: 'Верцингеторикс', cost: 14, hp: 30, atk: 6, def: 5, mv: 2, rng: 1, icon: '🌟', hero: true, inf: true, limit: 1, civ: 'gaul', tech: 'gal_verc', note: 'Аура +15%; возрождается через 5 ходов' },
};

export interface BuildingDef {
  name: string;
  cost: number;
  icon: string;
  desc: string;
  req?: string;
  civ?: CivKey;
  banCiv?: CivKey;
  tech?: string;
}

export const BUILDINGS: Record<string, BuildingDef> = {
  workshop: { name: 'Мастерская', cost: 5, icon: '🔨', desc: '+2 звезды' },
  market: { name: 'Рынок', cost: 8, icon: '🏺', desc: '+2 звезды, +1 за каждую другую постройку (макс +4)' },
  library: { name: 'Библиотека', cost: 6, icon: '📜', desc: '+2 науки' },
  academy: { name: 'Академия', cost: 12, icon: '🏛️', desc: '+4 науки', req: 'library' },
  temple: { name: 'Храм', cost: 10, icon: '⛩️', desc: '+2 звезды, +2 культуры', banCiv: 'sparta' },
  barracks: { name: 'Казармы', cost: 8, icon: '🏕️', desc: 'Новые юниты — Ветераны' },
  walls: { name: 'Стены', cost: 10, icon: '🧱', desc: '+100% HP города, город бьёт в ответ' },
  port: { name: 'Порт', cost: 8, icon: '⚓', desc: 'Флот; +1 звезда с каждой водной клетки' },
  colosseum: { name: 'Колизей', cost: 15, icon: '🏟️', desc: '+3 звезды, +1 культура', civ: 'rome' },
};

export const WONDERS: Record<string, { name: string; icon: string; desc: string }> = {
  colossus: { name: 'Колосс Родосский', icon: '🗽', desc: '+5 звёзд' },
  library_alex: { name: 'Александрийская библиотека', icon: '📚', desc: '+5 науки' },
  great_wall: { name: 'Великая стена', icon: '🏯', desc: '+2 к защите всех городов' },
  stonehenge: { name: 'Стоунхендж', icon: '🪨', desc: '+1 наука с каждого холма в границах' },
};

export const WONDER_COST = 25;

export interface Tech {
  id: string;
  name: string;
  cost: number;
  desc: string;
  caps?: string[];
  unlocks?: string[];
}

export interface CivDef {
  id: CivKey;
  name: string;
  emoji: string;
  color: string;
  colorSoft: string;
  motto: string;
  bonusName: string;
  bonus: string;
  branches: { name: string; techs: Tech[] }[];
  cityNames: string[];
}

export const CIVS: Record<CivKey, CivDef> = {
  sparta: {
    id: 'sparta',
    name: 'Спартанцы',
    emoji: '🔴',
    color: '#dc2626',
    colorSoft: '#fecaca',
    motto: 'Со щитом или на щите',
    bonusName: 'Агоге',
    bonus: 'Вся пехота −2 звезды. Казармы −50%. Храмы недоступны. Копейщики со старта. При захвате города +2 звезды.',
    cityNames: ['Спарта', 'Амиклы', 'Гитион', 'Селласия', 'Пеллана', 'Мессена', 'Феры', 'Кифера'],
    branches: [
      {
        name: 'Война',
        techs: [
          { id: 'spa_spear', name: 'Копейщики', cost: 0, desc: 'Открывает Копейщика (стартовая технология).' },
          { id: 'spa_phalanx', name: 'Фаланга', cost: 45, desc: 'Пехота: +20% защиты за каждого смежного союзного пехотинца (макс +40%).' },
          { id: 'spa_hoplites', name: 'Гоплиты', cost: 90, desc: 'Открывает Гоплита (15 HP, 4/4, цена 5).', unlocks: ['hoplite'] },
          { id: 'spa_300', name: '300 спартанцев', cost: 160, desc: 'Пехота +1 движение. Открывает Спартиата (лимит 1).', unlocks: ['spartiate'] },
        ],
      },
      {
        name: 'Илоты',
        techs: [
          { id: 'spa_agri', name: 'Земледелие', cost: 20, desc: 'Позволяет осваивать Фрукты и Зерно.', caps: ['agri'] },
          { id: 'spa_helots', name: 'Илоты', cost: 45, desc: '+1 звезда за каждые 2 населения города, но −10% науки.' },
          { id: 'spa_quarry', name: 'Каменоломни', cost: 90, desc: 'Руда +1 звезда, холмы +1 пища.', caps: ['mine'] },
          { id: 'spa_agora', name: 'Агора', cost: 160, desc: 'Рынок даёт +3 звезды, торговые пути между городами +2 звезды.' },
        ],
      },
      {
        name: 'Дисциплина',
        techs: [
          { id: 'spa_formation', name: 'Строй', cost: 20, desc: 'Юниты рядом с союзниками получают +10% защиты.' },
          { id: 'spa_school', name: 'Военная школа', cost: 45, desc: 'Новые юниты создаются Ветеранами.' },
          { id: 'spa_siege', name: 'Осадное дело', cost: 90, desc: 'Открывает Баллисту (+100% против стен).', unlocks: ['ballista'] },
          { id: 'spa_leonidas', name: 'Леонид', cost: 160, desc: 'Герой Леонид. При его смерти все города теряют 1 уровень.', unlocks: ['leonidas'] },
        ],
      },
    ],
  },
  rome: {
    id: 'rome',
    name: 'Римляне',
    emoji: '🟣',
    color: '#9333ea',
    colorSoft: '#e9d5ff',
    motto: 'SPQR',
    bonusName: 'Римский путь',
    bonus: 'Дороги строятся бесплатно, +1 движение по дорогам, +1 звезда за каждый город, соединённый дорогой со столицей. Уникальное здание — Колизей.',
    cityNames: ['Рома', 'Остия', 'Капуя', 'Неаполис', 'Равенна', 'Медиолан', 'Тарент', 'Аквилея'],
    branches: [
      {
        name: 'Война',
        techs: [
          { id: 'rom_velites', name: 'Велиты', cost: 20, desc: 'Открывает Велита (дальность 2, цена 3).', unlocks: ['velite'] },
          { id: 'rom_principes', name: 'Принципы', cost: 45, desc: 'Открывает Легионера (15 HP, 4/3, цена 5).', unlocks: ['legionary'] },
          { id: 'rom_triarii', name: 'Триарии', cost: 90, desc: '+30% защиты против кавалерии и дальних юнитов.' },
          { id: 'rom_siege', name: 'Осадный корпус', cost: 160, desc: 'Открывает Онагр (+150% против городов).', unlocks: ['onager'] },
        ],
      },
      {
        name: 'Инженерия',
        techs: [
          { id: 'rom_roads', name: 'Дороги', cost: 0, desc: 'Бесплатные дороги, +1 движение (стартовая технология).' },
          { id: 'rom_masonry', name: 'Каменная кладка', cost: 45, desc: 'Стены доступны, +50% HP города.' },
          { id: 'rom_aqueduct', name: 'Акведук', cost: 90, desc: '+1 пища городу за каждую смежную водную клетку.' },
          { id: 'rom_concrete', name: 'Бетон', cost: 160, desc: 'Все города +2 защиты, +25% HP.' },
        ],
      },
      {
        name: 'Право',
        techs: [
          { id: 'rom_writing', name: 'Письменность', cost: 20, desc: 'Обелиски и Библиотеки.', caps: ['write'] },
          { id: 'rom_law', name: 'Римское право', cost: 45, desc: 'Все здания −15% стоимости.' },
          { id: 'rom_colon', name: 'Колонизация', cost: 90, desc: 'Колонист −50% цены, новый город сразу 2 уровня.' },
          { id: 'rom_empire', name: 'Империя', cost: 160, desc: '+1 звезда за каждый город, +2 слота юнитов.' },
        ],
      },
    ],
  },
  phoenicia: {
    id: 'phoenicia',
    name: 'Финикийцы',
    emoji: '🟦',
    color: '#0891b2',
    colorSoft: '#a5f3fc',
    motto: 'Хозяева Великого моря',
    bonusName: 'Мореходы',
    bonus: 'Мореплавание со старта (флот без порта), корабли −2 звезды, прибрежные города +1 звезда. Города можно ставить на побережье. При захвате города +1 звезда/ход навсегда.',
    cityNames: ['Тир', 'Сидон', 'Библ', 'Карфаген', 'Утика', 'Гадес', 'Мотия', 'Панормус'],
    branches: [
      {
        name: 'Море',
        techs: [
          { id: 'pho_fishing', name: 'Рыболовство', cost: 20, desc: 'Рыба; +1 пища с любой прибрежной клетки.', caps: ['fish'] },
          { id: 'pho_bireme', name: 'Бирема', cost: 45, desc: 'Открывает Бирему (таран +50% против кораблей).', unlocks: ['bireme'] },
          { id: 'pho_quinq', name: 'Квинкверема', cost: 90, desc: 'Открывает Квинкверему (22 HP, дальность 2).', unlocks: ['quinquereme'] },
          { id: 'pho_fleet', name: 'Флот Тира', cost: 160, desc: '+1 движение кораблям, +25% атаки на воде, лечение в порту.' },
        ],
      },
      {
        name: 'Торговля',
        techs: [
          { id: 'pho_post', name: 'Торговый пост', cost: 20, desc: '+1 звезда с каждой прибрежной клетки в границах.' },
          { id: 'pho_routes', name: 'Торговые пути', cost: 45, desc: 'Каждая пара своих городов даёт +2 звезды.' },
          { id: 'pho_factory', name: 'Фактория', cost: 90, desc: 'Колонист может основать факторию у чужих берегов: +3 звезды сразу.' },
          { id: 'pho_exchange', name: 'Биржа', cost: 160, desc: '+10% ко всем звёздам (минимум +1 за город).' },
        ],
      },
      {
        name: 'Колонии',
        techs: [
          { id: 'pho_colon', name: 'Колонизация', cost: 20, desc: 'Колонист −2 звезды.' },
          { id: 'pho_merc', name: 'Наёмники', cost: 45, desc: 'Нумидийский всадник; юниты −25% цены в захваченных городах.', unlocks: ['numidian'] },
          { id: 'pho_garrison', name: 'Гарнизоны', cost: 90, desc: '+50% HP городов, +1 звезда за город.' },
          { id: 'pho_carthage', name: 'Карфаген', cost: 160, desc: 'Столица +5 звёзд, +1 слот юнита за каждый город.' },
        ],
      },
    ],
  },
  gaul: {
    id: 'gaul',
    name: 'Галлы',
    emoji: '🟢',
    color: '#16a34a',
    colorSoft: '#bbf7d0',
    motto: 'Лес — наш дом, лес — наша крепость',
    bonusName: 'Дети леса',
    bonus: 'Лес стоит 1 движение и даёт +1 пищу. Дороги строить нельзя. Охота со старта.',
    cityNames: ['Бибракта', 'Герговия', 'Алезия', 'Лютеция', 'Аварик', 'Немет', 'Кенаб', 'Толоса'],
    branches: [
      {
        name: 'Лес',
        techs: [
          { id: 'gal_hunt', name: 'Охота', cost: 0, desc: 'Дичь +2 пищи (стартовая технология).', caps: ['hunt'] },
          { id: 'gal_logging', name: 'Лесозаготовка', cost: 45, desc: 'Срубить лес: +8 звёзд разово, клетка становится равниной.' },
          { id: 'gal_groves', name: 'Священные рощи', cost: 90, desc: 'Каждая лесная клетка в границах +1 звезда.' },
          { id: 'gal_druids', name: 'Друиды', cost: 160, desc: 'Друид-лекарь; лес даёт +1 науку.', unlocks: ['druid'] },
        ],
      },
      {
        name: 'Война',
        techs: [
          { id: 'gal_axes', name: 'Топоры', cost: 20, desc: 'Открывает Гаесата (14 HP, атака 5, ярость).', unlocks: ['gaesatae'] },
          { id: 'gal_ambush', name: 'Засада', cost: 45, desc: '+50% атаки из леса.' },
          { id: 'gal_cavalry', name: 'Кавалерия', cost: 90, desc: 'Открывает Галльского всадника.', unlocks: ['grider'] },
          { id: 'gal_verc', name: 'Верцингеторикс', cost: 160, desc: 'Герой; все города +1 звезда, +1 слот юнита.', unlocks: ['vercingetorix'] },
        ],
      },
      {
        name: 'Дух',
        techs: [
          { id: 'gal_oral', name: 'Устная традиция', cost: 20, desc: '+1 наука с каждого города.' },
          { id: 'gal_stones', name: 'Круг камней', cost: 45, desc: 'Холмы дают +2 науки, горы проходимы.' },
          { id: 'gal_metal', name: 'Металлургия', cost: 90, desc: 'Вся пехота +1 атака, Руда +1 звезда.', caps: ['mine'] },
          { id: 'gal_crown', name: 'Арвернская корона', cost: 160, desc: '+25% науки, +2 культуры с города.' },
        ],
      },
    ],
  },
};

export const CIV_LIST: CivKey[] = ['sparta', 'rome', 'phoenicia', 'gaul'];

export const ALL_CAPS = ['agri', 'hunt', 'husb', 'fish', 'whale', 'mine', 'gems', 'salt', 'herb', 'write'];

export function techById(id: string): Tech | null {
  for (const civ of CIV_LIST) {
    for (const br of CIVS[civ].branches) {
      for (const t of br.techs) if (t.id === id) return t;
    }
  }
  return null;
}

export function civTechs(civ: CivKey): Tech[] {
  return CIVS[civ].branches.flatMap((b) => b.techs);
}

/** Capabilities that this civ must research (all others are known from the start) */
export function civGatedCaps(civ: CivKey): string[] {
  const caps = new Set<string>();
  civTechs(civ).forEach((t) => t.caps?.forEach((c) => caps.add(c)));
  return [...caps];
}

export const GROWTH_COST = [0, 8, 18, 35, 60, 45];
export function foodNeeded(level: number) {
  return level < GROWTH_COST.length ? GROWTH_COST[level] : 45 + (level - 5) * 10;
}
