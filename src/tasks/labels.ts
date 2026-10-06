export function itemLabel(key: string): string {
  let m = /^decompose:(\d+):(\d+)$/.exec(key);
  if (m) return `${m[1]} = ${m[2]} + ?`;
  m = /^fillTen:(\d+)$/.exec(key);
  if (m) return `${m[1]} + ? = 10`;
  m = /^addBridgeTen:(\d+)\+(\d+)$/.exec(key);
  if (m) return `${m[1]} + ${m[2]}`;
  return key;
}
