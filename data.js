// data.js — 種データ・時間帯データ（むしとりアドベンチャー）

const STAGE_W = 1100;
const STAGE_H = 700;

const PERIOD_ORDER = ['morning', 'day', 'evening', 'night'];

// 24時間の中でその時間帯が占める範囲（時）。night は 19:00〜翌5:00 をまたぐ。
const PERIODS = {
  morning: {
    name: '朝', sub: 'しずくきらめく草原', icon: '☀', badge: '#f4c95d',
    hourStart: 5, hourEnd: 11,
    sky: ['#8fd0e6', '#fdf0b8'], hill: '#6fae7c', hill2: '#4c8a5c',
    ground: ['#8fc563', '#5f9d4a'], accent: 'rgba(255,244,200,0.10)'
  },
  day: {
    name: '昼', sub: 'まぶしい森のふち', icon: '⛅', badge: '#5fb0e0',
    hourStart: 11, hourEnd: 17,
    sky: ['#5aa8dc', '#cfe9ee'], hill: '#3f7a4a', hill2: '#2c5836',
    ground: ['#63a94a', '#3c7d38'], accent: 'rgba(255,255,240,0.06)'
  },
  evening: {
    name: '夕', sub: 'ゆうやけの原っぱ', icon: '🌇', badge: '#e8834a',
    hourStart: 17, hourEnd: 19,
    sky: ['#7a5a8e', '#f0965c'], hill: '#5c4a56', hill2: '#3a2e3c',
    ground: ['#8a6a48', '#5c4632'], accent: 'rgba(255,150,80,0.14)'
  },
  night: {
    name: '夜', sub: '月あかりの森', icon: '🌙', badge: '#7a8fd0',
    hourStart: 19, hourEnd: 29, // 29 = 翌5時
    sky: ['#101c34', '#33507a'], hill: '#1a2e2a', hill2: '#101c1a',
    ground: ['#233c2e', '#152820'], accent: 'rgba(150,180,255,0.08)'
  }
};

const DAY_LENGTH_SEC = 210; // 1周（24時間）を約3.5分の実時間で回す

// 36種。時間帯ごとに9種。alert = { sneak, walk, run } はその移動速度で逃げ始める距離(px)
const SPECIES = [
  // ---- 朝（9） ----
  { id: 'monshiro', period: 'morning', name: 'モンシロチョウ', type: 'butterfly', color: '#f6f2e2', mark: '#2a2a2a', habitat: 'flower', note: '白い翅に黒い紋。花畑の上をひらひら舞う', fly: 30, alert: { sneak: 20, walk: 52, run: 140 } },
  { id: 'tento', period: 'morning', name: 'テントウムシ', type: 'ladybeetle', color: '#e5432f', mark: '#1a1a1a', habitat: 'flower', note: '赤い背に黒い点。葉の上をとことこ歩く', fly: 0, alert: { sneak: 8, walk: 20, run: 40 } },
  { id: 'mitsubachi', period: 'morning', name: 'ミツバチ', type: 'bee', color: '#efb93f', mark: '#1a1a1a', habitat: 'flower', note: '花から花へ低く飛び回る', fly: 20, alert: { sneak: 16, walk: 44, run: 100 } },
  { id: 'shoryo', period: 'morning', name: 'ショウリョウバッタ', type: 'hopper', color: '#7cae4f', mark: '#1f2a18', habitat: 'grass', note: '頭が細長い草原のバッタ。跳んで逃げる', fly: 0, alert: { sneak: 14, walk: 38, run: 90 } },
  { id: 'shiokara', period: 'morning', name: 'シオカラトンボ', type: 'dragonfly', color: '#79aeb8', mark: '#1a1a1a', habitat: 'pond', note: 'ホバリングして急にダートする', fly: 38, alert: { sneak: 26, walk: 76, run: 180 } },
  { id: 'aomushi', period: 'morning', name: 'アオムシ', type: 'caterpillar', color: '#8fbf5a', mark: '#3a5a28', habitat: 'grass', note: '葉の上をゆっくり這う。ほぼ逃げない', fly: 0, alert: { sneak: 4, walk: 10, run: 20 } },
  { id: 'monki', period: 'morning', name: 'モンキチョウ', type: 'butterfly', color: '#f0d868', mark: '#7a5a1a', habitat: 'flower', note: '黄色い翅の蝶。花畑を漂う', fly: 28, alert: { sneak: 20, walk: 52, run: 140 } },
  { id: 'hanamuguri', period: 'morning', name: 'ハナムグリ', type: 'jewelbeetle', color: '#5ba86a', mark: '#1a1a1a', habitat: 'flower', note: '花に潜り込む小さな甲虫', fly: 0, alert: { sneak: 10, walk: 24, run: 48 } },
  { id: 'shijimi', period: 'morning', name: 'シジミチョウ', type: 'butterfly', color: '#8fa8d8', mark: '#2a3a5a', habitat: 'grass', note: '小さな青い蝶。地面近くを飛ぶ', fly: 22, alert: { sneak: 18, walk: 46, run: 120 } },

  // ---- 昼（9） ----
  { id: 'ageha', period: 'day', name: 'アゲハチョウ', type: 'butterfly', color: '#f0cf47', mark: '#2a2a2a', habitat: 'flower', note: '黒と黄の大きな蝶。高いところを舞う', fly: 36, alert: { sneak: 24, walk: 62, run: 160 } },
  { id: 'kabuto', period: 'day', name: 'カブトムシ', type: 'rhinoceros', color: '#5a3828', mark: '#1a1010', habitat: 'tree', note: '大きな角を持つ甲虫。木をゆっくり歩く', fly: 0, alert: { sneak: 10, walk: 24, run: 46 } },
  { id: 'kuwagata', period: 'day', name: 'クワガタムシ', type: 'stag', color: '#3b2f28', mark: '#0f0a08', habitat: 'tree', note: '大きなあごを持つ。樹液に集まる', fly: 0, alert: { sneak: 10, walk: 24, run: 46 } },
  { id: 'kamakiri', period: 'day', name: 'カマキリ', type: 'mantis', color: '#6e9c48', mark: '#1f2a18', habitat: 'grass', note: '草に擬態してほぼ動かない', fly: 0, alert: { sneak: 6, walk: 16, run: 32 } },
  { id: 'semi', period: 'day', name: 'セミ', type: 'cicada', color: '#7a9068', mark: '#1a1a1a', habitat: 'tree', note: '幹に止まって鳴く。驚くと飛び去る', fly: 0, alert: { sneak: 18, walk: 48, run: 110 } },
  { id: 'tamamushi', period: 'day', name: 'タマムシ', type: 'jewelbeetle', color: '#2ca37b', mark: '#123', habitat: 'tree', note: '緑と赤の金属光沢。陽を反射する', fly: 0, alert: { sneak: 12, walk: 28, run: 54 } },
  { id: 'koganemushi', period: 'day', name: 'コガネムシ', type: 'jewelbeetle', color: '#4a8a3a', mark: '#1a2a12', habitat: 'flower', note: '緑色に輝く丸い甲虫', fly: 0, alert: { sneak: 10, walk: 26, run: 50 } },
  { id: 'oniyanma', period: 'day', name: 'オニヤンマ', type: 'dragonfly', color: '#e7b83f', mark: '#1a1a1a', habitat: 'pond', note: '日本最大級のトンボ。高速で巡回する', fly: 44, alert: { sneak: 32, walk: 88, run: 200 } },
  { id: 'tonosama', period: 'day', name: 'トノサマバッタ', type: 'hopper', color: '#6a8a4a', mark: '#1f2a18', habitat: 'grass', note: '大型のバッタ。長く跳んで逃げる', fly: 0, alert: { sneak: 16, walk: 42, run: 100 } },

  // ---- 夕（9） ----
  { id: 'akatonbo', period: 'evening', name: 'アカトンボ', type: 'dragonfly', color: '#cf5b3d', mark: '#1a1a1a', habitat: 'pond', note: '夕方の池のまわりを群れ飛ぶ', fly: 34, alert: { sneak: 24, walk: 70, run: 160 } },
  { id: 'ga', period: 'evening', name: 'ガ', type: 'moth', color: '#8a7860', mark: '#2a2016', habitat: 'flower', note: '夕暮れに飛び始める。灯りに集まる', fly: 24, alert: { sneak: 18, walk: 48, run: 110 } },
  { id: 'kirigirisu', period: 'evening', name: 'キリギリス', type: 'cricket', color: '#8a9a4a', mark: '#1f2a18', habitat: 'grass', note: '草地で鳴く。近づくと跳ぶ', fly: 0, alert: { sneak: 14, walk: 36, run: 84 } },
  { id: 'haguro', period: 'evening', name: 'ハグロトンボ', type: 'dragonfly', color: '#3a3a5a', mark: '#0a0a12', habitat: 'pond', note: '黒い翅でひらひらと飛ぶ', fly: 26, alert: { sneak: 20, walk: 54, run: 130 } },
  { id: 'kutsuwa', period: 'evening', name: 'クツワムシ', type: 'cricket', color: '#6a8a48', mark: '#1a2812', habitat: 'grass', note: 'ガチャガチャと鳴く大きな虫', fly: 0, alert: { sneak: 12, walk: 30, run: 70 } },
  { id: 'higurashi', period: 'evening', name: 'ヒグラシ', type: 'cicada', color: '#6c976c', mark: '#1a1a1a', habitat: 'tree', note: '夕暮れにカナカナと鳴く', fly: 0, alert: { sneak: 18, walk: 48, run: 110 } },
  { id: 'benishijimi', period: 'evening', name: 'ベニシジミ', type: 'butterfly', color: '#e07a3a', mark: '#3a2010', habitat: 'flower', note: '赤茶色の小さな蝶', fly: 20, alert: { sneak: 16, walk: 44, run: 110 } },
  { id: 'shakutori', period: 'evening', name: 'シャクトリムシ', type: 'caterpillar', color: '#9a8a5a', mark: '#3a3018', habitat: 'grass', note: '尺を取るように歩く。ほぼ逃げない', fly: 0, alert: { sneak: 4, walk: 10, run: 20 } },
  { id: 'hanmyo', period: 'evening', name: 'ハンミョウ', type: 'jewelbeetle', color: '#3a9a7a', mark: '#0a2018', habitat: 'grass', note: '金属光沢の甲虫。道の上を跳ねて逃げる', fly: 0, alert: { sneak: 14, walk: 34, run: 78 } },

  // ---- 夜（9） ----
  { id: 'hotaru', period: 'night', name: 'ホタル', type: 'firefly', color: '#d9ef62', mark: '#3a3a1a', habitat: 'pond', note: '黄緑にゆっくり点滅しながら漂う', fly: 14, alert: { sneak: 12, walk: 32, run: 74 } },
  { id: 'korogi', period: 'night', name: 'コオロギ', type: 'cricket', color: '#4a4038', mark: '#100c08', habitat: 'grass', note: '鈴のような声で鳴く。近づくと跳ぶ', fly: 0, alert: { sneak: 14, walk: 36, run: 82 } },
  { id: 'kamikiri', period: 'night', name: 'カミキリムシ', type: 'longhorn', color: '#2a3936', mark: '#0a1210', habitat: 'tree', note: '長い触角を持つ甲虫', fly: 0, alert: { sneak: 10, walk: 24, run: 48 } },
  { id: 'oomizuao', period: 'night', name: 'オオミズアオ', type: 'moth', color: '#bfe3ce', mark: '#3a4a40', habitat: 'flower', note: '青白い大きな翅でゆるく舞う', fly: 26, alert: { sneak: 18, walk: 50, run: 120 } },
  { id: 'suzumushi', period: 'night', name: 'スズムシ', type: 'cricket', color: '#4a4238', mark: '#100c08', habitat: 'grass', note: 'リーンリーンと美しく鳴く', fly: 0, alert: { sneak: 14, walk: 36, run: 82 } },
  { id: 'nokogiri', period: 'night', name: 'ノコギリクワガタ', type: 'stag', color: '#6b3d29', mark: '#1a0e08', habitat: 'tree', note: '湾曲した大あご。樹液に集まる', fly: 0, alert: { sneak: 10, walk: 24, run: 46 } },
  { id: 'kokuwa', period: 'night', name: 'コクワガタ', type: 'stag', color: '#3b3029', mark: '#0f0a08', habitat: 'tree', note: '身近な小型のクワガタ', fly: 0, alert: { sneak: 10, walk: 24, run: 46 } },
  { id: 'yaga', period: 'night', name: 'ヤガ', type: 'moth', color: '#7a6a58', mark: '#2a2016', habitat: 'flower', note: '地味な色の夜行性の蛾', fly: 22, alert: { sneak: 16, walk: 44, run: 104 } },
  { id: 'matsumushi', period: 'night', name: 'マツムシ', type: 'cricket', color: '#5a4a30', mark: '#160e08', habitat: 'grass', note: 'チンチロリンと鳴く秋の虫', fly: 0, alert: { sneak: 12, walk: 30, run: 70 } }
];

const SPECIES_BY_ID = Object.fromEntries(SPECIES.map(s => [s.id, s]));
const SPECIES_BY_PERIOD = Object.fromEntries(PERIOD_ORDER.map(p => [p, SPECIES.filter(s => s.period === p)]));
const TOTAL_SPECIES = SPECIES.length; // 36

// 生息地アンカー（ステージ内の相対位置 0..1）。habitatごとに複数ゾーン。
const HABITAT_ZONES = {
  flower: [{ x: 0.22, y: 0.62 }, { x: 0.62, y: 0.7 }, { x: 0.4, y: 0.5 }],
  grass: [{ x: 0.15, y: 0.4 }, { x: 0.5, y: 0.3 }, { x: 0.78, y: 0.55 }],
  tree: [{ x: 0.12, y: 0.22 }, { x: 0.85, y: 0.2 }, { x: 0.68, y: 0.35 }],
  pond: [{ x: 0.82, y: 0.68 }]
};
