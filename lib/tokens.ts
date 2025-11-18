const dayTokenMap = [
  { day: 1, envKey: "DAY1_TOKEN", value: process.env.DAY1_TOKEN },
  { day: 2, envKey: "DAY2_TOKEN", value: process.env.DAY2_TOKEN },
  { day: 3, envKey: "DAY3_TOKEN", value: process.env.DAY3_TOKEN },
  { day: 4, envKey: "DAY4_TOKEN", value: process.env.DAY4_TOKEN },
];

export function getProgramDayFromToken(token: string | null) {
  if (!token) return null;
  const match = dayTokenMap.find(
    (entry) => entry.value && entry.value.length > 0 && entry.value === token
  );
  if (!match) {
    return null;
  }
  return { day: match.day };
}

export function tokenEnvKeys() {
  return dayTokenMap
    .filter((entry) => !entry.value)
    .map((entry) => entry.envKey);
}
