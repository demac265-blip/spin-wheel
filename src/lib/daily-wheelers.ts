// Deterministic daily randomizer: same 3 names+payouts for everyone on a given day,
// changes automatically at UTC midnight.

const NAMES = [
  "Matthew Cole", "Amanda Collins", "Jessica Anderson", "David Hughes", "Sarah Mitchell",
  "James Carter", "Emily Roberts", "Michael Brooks", "Olivia Bennett", "Daniel Foster",
  "Sophia Reed", "Ethan Parker", "Ava Sanders", "Liam Russell", "Mia Coleman",
  "Noah Patterson", "Isabella Hayes", "Lucas Morgan", "Charlotte Price", "Mason Bell",
  "Amelia Wood", "Logan Ward", "Harper Cox", "Elijah Diaz", "Evelyn Murphy",
  "Benjamin Long", "Abigail Hill", "Henry Rivera", "Emma Powell", "Alexander Gray",
  "Grace Sullivan", "Sebastian Kelly", "Chloe Ramirez", "Jack Stewart", "Lily Howard",
  "Owen Jenkins", "Zoe Perry", "Carter Bailey", "Hannah Watson", "Wyatt Brooks",
];

// Mulberry32 PRNG seeded by date
function seededRandom(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dateSeed(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  return y * 10000 + m * 100 + d;
}

export interface Wheeler {
  rank: number;
  name: string;
  amount: number;
}

export function getDailyWheelers(date = new Date()): Wheeler[] {
  const rand = seededRandom(dateSeed(date));
  const pool = [...NAMES];
  const picked: string[] = [];
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(rand() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  // Descending payouts between $30 and $120
  const amounts = [0, 0, 0]
    .map(() => Math.round((30 + rand() * 90) * 100) / 100)
    .sort((a, b) => b - a);
  return picked.map((name, i) => ({ rank: i + 1, name, amount: amounts[i] }));
}

export function generateTopWinners(): Wheeler[] {
  const pool = [...NAMES];
  const winners: Omit<Wheeler, "rank">[] = [];

  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const name = pool.splice(idx, 1)[0];
    const amount = Math.floor(Math.random() * 351) + 150;
    winners.push({ name, amount });
  }

  return winners
    .sort((a, b) => b.amount - a.amount)
    .map((winner, index) => ({ rank: index + 1, ...winner }));
}
