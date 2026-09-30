/* Static game data: species, stages, pots, tools, weather conditions, photos. */

const SPECIES = {
  barrel: {
    name: 'Golden Barrel',
    latin: 'Echinocactus grusonii',
    nick: 'Goldie',
    blurb: 'A round, ribbed globe with golden spines. Tough and forgiving.',
    fact: 'Critically endangered in its Mexican canyons, yet one of the most common cacti in gardens.',
    difficulty: 'Easy',
    sun: 3, water: 1, speed: 2,
    lightNeed: 6, dryDays: 21, rotSens: 1.0, coldMin: 5, sunburn: 0.5, rate: 1.0,
    bloom: '#FFD43B', bloomMonths: [4, 5, 6, 7, 8], pups: 0,
    water_every: 'every 2–3 weeks',
  },
  bunny: {
    name: 'Bunny Ears',
    latin: 'Opuntia microdasys',
    nick: 'Hopper',
    blurb: 'Flat pads covered in fuzzy dots. Grows new “ears” quickly.',
    fact: 'No big spines, but those fuzzy dots are glochids: tiny barbed bristles. Look, don’t pet.',
    difficulty: 'Easy',
    sun: 3, water: 2, speed: 3,
    lightNeed: 6, dryDays: 14, rotSens: 1.0, coldMin: 5, sunburn: 0.5, rate: 1.3,
    bloom: '#FFE066', bloomMonths: [4, 5, 6, 7], pups: 0,
    water_every: 'every 1–2 weeks',
  },
  saguaro: {
    name: 'Saguaro',
    latin: 'Carnegiea gigantea',
    nick: 'Sonny',
    blurb: 'The classic desert column. Slow, proud, and easy to overwater.',
    fact: 'In the wild a saguaro can take 10 years to reach one inch and around 70 years to grow an arm.',
    difficulty: 'Tricky',
    sun: 3, water: 1, speed: 1,
    lightNeed: 7, dryDays: 28, rotSens: 1.45, coldMin: 4, sunburn: 0.4, rate: 0.85,
    bloom: '#FFFFFF', bloomMonths: [5, 6], pups: 0,
    water_every: 'every 3–4 weeks',
  },
  moon: {
    name: 'Moon Cactus',
    latin: 'Gymnocalycium mihanovichii',
    nick: 'Luna',
    blurb: 'A candy-coloured ball grafted on a green stem. Likes gentler light.',
    fact: 'The coloured top has no chlorophyll, so it lives on food made by the green cactus it is grafted onto.',
    difficulty: 'Medium',
    sun: 2, water: 2, speed: 1,
    lightNeed: 4, dryDays: 12, rotSens: 1.1, coldMin: 10, sunburn: 1.6, rate: 0.9,
    bloom: '#FF8FB1', bloomMonths: [5, 6, 7], pups: 2,
    water_every: 'every 1–2 weeks',
    colors: { red: '#E8413C', pink: '#F06CA8', orange: '#F7862F', yellow: '#F7C531' },
  },
  oldlady: {
    name: 'Old Lady',
    latin: 'Mammillaria hahniana',
    nick: 'Granny',
    blurb: 'A fuzzy white ball that grows a crown of pink flowers.',
    fact: 'The white “hair” is made of modified spines that shade the cactus like a sun hat.',
    difficulty: 'Easy',
    sun: 3, water: 1, speed: 2,
    lightNeed: 6, dryDays: 18, rotSens: 1.2, coldMin: 5, sunburn: 0.35, rate: 1.05,
    bloom: '#E0409A', bloomMonths: [3, 4, 5, 6], pups: 3,
    water_every: 'every 2–3 weeks',
  },
  christmas: {
    name: 'Christmas Cactus',
    latin: 'Schlumbergera × buckleyi',
    nick: 'Holly',
    blurb: 'A rainforest cactus with arching segments. Thirstier than the rest.',
    fact: 'It grows on trees in Brazil’s coastal forests. Long, cool autumn nights trigger its winter flowers.',
    difficulty: 'Medium',
    sun: 2, water: 3, speed: 2,
    lightNeed: 4, dryDays: 5, rotSens: 0.75, coldMin: 7, sunburn: 1.3, rate: 1.1,
    bloom: '#E6317A', bloomMonths: [11, 12, 1], pups: 0,
    water_every: 'when the top inch is dry',
    likesMist: true,
  },
};
const SPECIES_ORDER = ['barrel', 'bunny', 'saguaro', 'moon', 'oldlady', 'christmas'];

const STAGES = [
  { id: 'seedling', name: 'Seedling', at: 0 },
  { id: 'sprout', name: 'Sprout', at: 12 },
  { id: 'young', name: 'Young', at: 34 },
  { id: 'juvenile', name: 'Juvenile', at: 70 },
  { id: 'adult', name: 'Adult', at: 125 },
  { id: 'mature', name: 'Mature', at: 200 },
];
function stageIndex(growth) {
  let i = 0;
  for (let k = 0; k < STAGES.length; k++) if (growth >= STAGES[k].at) i = k;
  return i;
}
/* Visual size 0.2..1 from growth points. */
const sizeFromGrowth = (g) => 0.2 + 0.8 * (1 - Math.exp(-g / 115));

const POT_SIZES = [
  { name: 'Tiny', cm: 6, cap: 0.42, w: 94 },
  { name: 'Small', cm: 9, cap: 0.63, w: 120 },
  { name: 'Medium', cm: 12, cap: 0.83, w: 148 },
  { name: 'Large', cm: 16, cap: 1.5, w: 178 },
];

const POT_STYLES = {
  terracotta: { name: 'Terracotta', how: 'Every cactus starts here.', unlock: null },
  sky: { name: 'Sky Glaze', how: 'Reach day 7.', unlock: 'week' },
  cream: { name: 'Speckled Cream', how: 'Repot for the first time.', unlock: 'repotted' },
  talavera: { name: 'Talavera', how: 'Reach day 30.', unlock: 'month' },
  sunset: { name: 'Sunset Stripes', how: 'Keep health above 85 for a week.', unlock: 'greenThumb' },
  midnight: { name: 'Midnight Matte', how: 'Get your cactus to bloom.', unlock: 'firstBloom' },
};

const ACHIEVEMENTS = {
  planted: { name: 'Planted', desc: 'Potted your first baby cactus.' },
  firstDrink: { name: 'First drink', desc: 'Watered your cactus for the first time.' },
  week: { name: 'One week', desc: 'Seven days on the windowsill.' },
  month: { name: 'One month', desc: 'Thirty days on the windowsill.' },
  hundred: { name: '100 days', desc: 'A hundred days of care.' },
  rainBuddy: { name: 'Rainy day buddy', desc: 'Checked in while it was really raining outside.' },
  snowDay: { name: 'Snow day', desc: 'Watched real snow fall together.' },
  stormWatch: { name: 'Storm watcher', desc: 'Kept your cactus company through a real thunderstorm.' },
  stargazer: { name: 'Stargazer', desc: 'Visited on a clear night.' },
  earlyBird: { name: 'Early bird', desc: 'Visited around sunrise.' },
  freshAir: { name: 'Fresh air', desc: 'Opened the window on a mild, dry day.' },
  spinner: { name: 'Even growth', desc: 'Turned the pot 10 times.' },
  repotted: { name: 'Room to grow', desc: 'Repotted into a bigger pot.' },
  pestFree: { name: 'Bug buster', desc: 'Cleared out mealybugs.' },
  firstBloom: { name: 'First flower', desc: 'Your cactus bloomed.' },
  greenThumb: { name: 'Green thumb', desc: 'Health above 85 for seven days straight.' },
  mature: { name: 'All grown up', desc: 'Reached the Mature stage.' },
  sparkling: { name: 'Sparkling glass', desc: 'Cleaned the window.' },
};

/* Tools in the caddy. Order is display order. */
const TOOLS = [
  { id: 'water', name: 'Water', key: 'W', tip: 'Soak the soil, then let it dry out completely.' },
  { id: 'meter', name: 'Moisture', key: 'M', tip: 'Push the probe into the soil for a reading.' },
  { id: 'turn', name: 'Turn pot', key: 'T', tip: 'A quarter turn keeps growth straight.' },
  { id: 'food', name: 'Feed', key: 'F', tip: 'Cactus food, about once a month in spring and summer.' },
  { id: 'swab', name: 'Swab', key: 'S', tip: 'Rubbing alcohol on a cotton swab removes mealybugs.' },
  { id: 'mist', name: 'Mister', key: 'I', tip: 'Most cacti skip this. Forest cacti enjoy it.' },
  { id: 'cloth', name: 'Cloth', key: 'C', tip: 'Wipe the glass so more light gets through.' },
  { id: 'lamp', name: 'Lamp', key: 'L', tip: 'Extra light for dark, cloudy days.' },
  { id: 'repot', name: 'Repot', key: 'R', tip: 'Move to a bigger pot when the roots fill this one.' },
];

/* Weather conditions (normalised). cloud: default cover %, precip: 0..1 intensity. */
const CONDITIONS = {
  clear: { label: 'Clear', cloud: 5, precip: 0 },
  mostly_clear: { label: 'Mostly sunny', cloud: 22, precip: 0 },
  partly: { label: 'Partly cloudy', cloud: 45, precip: 0 },
  cloudy: { label: 'Mostly cloudy', cloud: 75, precip: 0 },
  overcast: { label: 'Overcast', cloud: 96, precip: 0 },
  haze: { label: 'Hazy sun', cloud: 30, precip: 0 },
  fog: { label: 'Fog', cloud: 100, precip: 0 },
  drizzle: { label: 'Drizzle', cloud: 95, precip: 0.25 },
  rain: { label: 'Rain', cloud: 100, precip: 0.6 },
  heavy_rain: { label: 'Heavy rain', cloud: 100, precip: 1 },
  storm: { label: 'Thunderstorm', cloud: 100, precip: 0.85 },
  flurries: { label: 'Flurries', cloud: 80, precip: 0.25 },
  snow: { label: 'Snow', cloud: 100, precip: 0.7 },
  sleet: { label: 'Sleet', cloud: 100, precip: 0.6 },
  freezing_rain: { label: 'Freezing rain', cloud: 100, precip: 0.6 },
};
const MANUAL_CONDITIONS = ['clear', 'partly', 'cloudy', 'rain', 'storm', 'snow', 'fog'];

/* Real photographs (Open Images / Flickr, CC BY 2.0). focus = object-position. */
const PHOTOS = {
  clear: { focus: '50% 45%', title: 'Menai Bridge', author: 'Rebecca Boardman', url: 'https://www.flickr.com/photos/grish616/15262080019' },
  farm: { focus: '40% 50%', title: 'Train ride - WV', author: 'Patti Bean McIntyre', url: 'https://www.flickr.com/photos/pbmcintyre222/9848069796' },
  partly: { focus: '55% 45%', title: 'Begumpur, Matlab North, Chandpur', author: 'Crysis Rubel', url: 'https://www.flickr.com/photos/crysisrubel/15041368608' },
  hazy: { focus: '45% 40%', title: 'Magical neolithics', author: 'Eoin O’Mahony', url: 'https://www.flickr.com/photos/73man/7507694230' },
  cloudy: { focus: '50% 45%', title: 'distant sheep near Trawden', author: 'Julia Gillen', url: 'https://www.flickr.com/photos/juliagillen/4760635714' },
  cloudy_fall: { focus: '62% 50%', title: 'House overlooking Cooks Bridge marsh', author: 'InAweofGod’sCreation', url: 'https://www.flickr.com/photos/nhoulihan/3652594458' },
  rain: { focus: '45% 50%', title: 'Afternoon soaking downpour', author: 'Peter Stevens', url: 'https://www.flickr.com/photos/nordique/7251908904' },
  storm: { focus: '55% 45%', title: 'Scottsdale Microburst', author: 'Dru Bloomfield', url: 'https://www.flickr.com/photos/athomeinscottsdale/3742762544' },
  lightning: { focus: '50% 50%', title: 'Lightning over Somerset County, New Jersey', author: 'Anthony Quintano', url: 'https://www.flickr.com/photos/quintanomedia/14706711086' },
  snow: { focus: '50% 45%', title: 'Winter Storm', author: 'Scott Robinson', url: 'https://www.flickr.com/photos/clearlyambiguous/4337896326' },
  snow_sun: { focus: '50% 40%', title: 'snOwMaGeddon 2010: Sunday', author: 'Blake Patterson', url: 'https://www.flickr.com/photos/blakespot/4338003438' },
  fog: { focus: '50% 45%', title: 'IMG_2579', author: 'Jodie Wilson', url: 'https://www.flickr.com/photos/jumpyjodes/7304138512' },
  golden: { focus: '60% 55%', title: 'Streaks.', author: 'Florian Plag', url: 'https://www.flickr.com/photos/florianplag/5617808014' },
  dusk: { focus: '60% 55%', title: 'Venus at sunrise', author: 'Mike Lewinski', url: 'https://www.flickr.com/photos/ikewinski/8106387198' },
  night: { focus: '55% 55%', title: 'Voie Lactée', author: 'Niko Kaptur', url: 'https://www.flickr.com/photos/81602246@N03/9415192288/' },
  night_rain: { focus: '45% 45%', title: 'rain', author: 'Jason Rosenberg', url: 'https://www.flickr.com/photos/underpants/18975285258' },
};
const photoSrc = (name) => `photos/${name}.jpg`;

/* Rough coordinates for common time zones, used for sunrise/sunset before a place is set. */
const TZ_COORDS = {
  'America/New_York': [40.71, -74.01, 'New York'], 'America/Detroit': [42.33, -83.05, 'Detroit'],
  'America/Toronto': [43.65, -79.38, 'Toronto'], 'America/Chicago': [41.88, -87.63, 'Chicago'],
  'America/Indiana/Indianapolis': [39.77, -86.16, 'Indianapolis'], 'America/Denver': [39.74, -104.99, 'Denver'],
  'America/Phoenix': [33.45, -112.07, 'Phoenix'], 'America/Boise': [43.62, -116.2, 'Boise'],
  'America/Los_Angeles': [34.05, -118.24, 'Los Angeles'], 'America/Vancouver': [49.28, -123.12, 'Vancouver'],
  'America/Edmonton': [53.55, -113.49, 'Edmonton'], 'America/Winnipeg': [49.9, -97.14, 'Winnipeg'],
  'America/Halifax': [44.65, -63.58, 'Halifax'], 'America/St_Johns': [47.56, -52.71, 'St. John’s'],
  'America/Anchorage': [61.22, -149.9, 'Anchorage'], 'Pacific/Honolulu': [21.31, -157.86, 'Honolulu'],
  'America/Puerto_Rico': [18.47, -66.1, 'San Juan'], 'America/Mexico_City': [19.43, -99.13, 'Mexico City'],
  'America/Bogota': [4.71, -74.07, 'Bogotá'], 'America/Lima': [-12.05, -77.04, 'Lima'],
  'America/Santiago': [-33.45, -70.67, 'Santiago'], 'America/Sao_Paulo': [-23.55, -46.63, 'São Paulo'],
  'America/Argentina/Buenos_Aires': [-34.6, -58.38, 'Buenos Aires'], 'America/Caracas': [10.48, -66.9, 'Caracas'],
  'Europe/London': [51.51, -0.13, 'London'], 'Europe/Dublin': [53.35, -6.26, 'Dublin'],
  'Europe/Lisbon': [38.72, -9.14, 'Lisbon'], 'Europe/Madrid': [40.42, -3.7, 'Madrid'],
  'Europe/Paris': [48.86, 2.35, 'Paris'], 'Europe/Brussels': [50.85, 4.35, 'Brussels'],
  'Europe/Amsterdam': [52.37, 4.9, 'Amsterdam'], 'Europe/Berlin': [52.52, 13.4, 'Berlin'],
  'Europe/Zurich': [47.37, 8.54, 'Zürich'], 'Europe/Rome': [41.9, 12.5, 'Rome'],
  'Europe/Vienna': [48.21, 16.37, 'Vienna'], 'Europe/Prague': [50.08, 14.44, 'Prague'],
  'Europe/Warsaw': [52.23, 21.01, 'Warsaw'], 'Europe/Stockholm': [59.33, 18.07, 'Stockholm'],
  'Europe/Oslo': [59.91, 10.75, 'Oslo'], 'Europe/Copenhagen': [55.68, 12.57, 'Copenhagen'],
  'Europe/Helsinki': [60.17, 24.94, 'Helsinki'], 'Europe/Athens': [37.98, 23.73, 'Athens'],
  'Europe/Istanbul': [41.01, 28.98, 'Istanbul'], 'Europe/Kyiv': [50.45, 30.52, 'Kyiv'],
  'Europe/Kiev': [50.45, 30.52, 'Kyiv'], 'Europe/Moscow': [55.76, 37.62, 'Moscow'],
  'Africa/Cairo': [30.04, 31.24, 'Cairo'], 'Africa/Lagos': [6.52, 3.38, 'Lagos'],
  'Africa/Nairobi': [-1.29, 36.82, 'Nairobi'], 'Africa/Johannesburg': [-26.2, 28.05, 'Johannesburg'],
  'Africa/Casablanca': [33.57, -7.59, 'Casablanca'], 'Asia/Jerusalem': [31.77, 35.21, 'Jerusalem'],
  'Asia/Dubai': [25.2, 55.27, 'Dubai'], 'Asia/Riyadh': [24.71, 46.68, 'Riyadh'],
  'Asia/Karachi': [24.86, 67.0, 'Karachi'], 'Asia/Kolkata': [28.61, 77.21, 'New Delhi'],
  'Asia/Calcutta': [28.61, 77.21, 'New Delhi'], 'Asia/Dhaka': [23.81, 90.41, 'Dhaka'],
  'Asia/Bangkok': [13.76, 100.5, 'Bangkok'], 'Asia/Ho_Chi_Minh': [10.82, 106.63, 'Ho Chi Minh City'],
  'Asia/Jakarta': [-6.2, 106.85, 'Jakarta'], 'Asia/Singapore': [1.35, 103.82, 'Singapore'],
  'Asia/Kuala_Lumpur': [3.14, 101.69, 'Kuala Lumpur'], 'Asia/Manila': [14.6, 120.98, 'Manila'],
  'Asia/Hong_Kong': [22.32, 114.17, 'Hong Kong'], 'Asia/Shanghai': [31.23, 121.47, 'Shanghai'],
  'Asia/Taipei': [25.03, 121.57, 'Taipei'], 'Asia/Seoul': [37.57, 126.98, 'Seoul'],
  'Asia/Tokyo': [35.68, 139.69, 'Tokyo'], 'Australia/Perth': [-31.95, 115.86, 'Perth'],
  'Australia/Adelaide': [-34.93, 138.6, 'Adelaide'], 'Australia/Brisbane': [-27.47, 153.03, 'Brisbane'],
  'Australia/Sydney': [-33.87, 151.21, 'Sydney'], 'Australia/Melbourne': [-37.81, 144.96, 'Melbourne'],
  'Pacific/Auckland': [-36.85, 174.76, 'Auckland'],
};

function guessHome() {
  let tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { /* no Intl */ }
  const hit = TZ_COORDS[tz];
  if (hit) return { lat: hit[0], lon: hit[1], name: hit[2], tz, guessed: true };
  const lon = clamp(-new Date().getTimezoneOffset() / 4, -180, 180);
  return { lat: 40, lon, name: 'your area', tz, guessed: true };
}

const WINDOW_FACING = {
  S: { az: 180, label: 'South', note: 'Best for cacti: sun most of the day.' },
  E: { az: 90, label: 'East', note: 'Bright, gentle morning sun.' },
  W: { az: 270, label: 'West', note: 'Hot afternoon sun.' },
  N: { az: 0, label: 'North', note: 'Soft light only. A grow light helps.' },
};

const WALL_COLORS = {
  plaster: { name: 'Warm plaster', base: '#D3C3AE' },
  sage: { name: 'Sage', base: '#AEB9A0' },
  sky: { name: 'Powder blue', base: '#AFC0CC' },
  blush: { name: 'Blush', base: '#DDB9AE' },
  charcoal: { name: 'Charcoal', base: '#56595C' },
};
