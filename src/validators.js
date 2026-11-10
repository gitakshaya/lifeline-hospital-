// Verhoeff checksum used by Aadhaar
const d = [
  [0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],
  [3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],
  [6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],
  [9,8,7,6,5,4,3,2,1,0],
];
const p = [
  [0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],
  [8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],
  [2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8],
];

export function isValidAadhaar(value) {
  const s = String(value || '').replace(/\s/g, '');
  if (!/^[2-9]\d{11}$/.test(s)) return false;
  let c = 0;
  s.split('').reverse().forEach((ch, i) => { c = d[c][p[i % 8][Number(ch)]]; });
  return c === 0;
}

export const isValidPan = (v) => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(String(v || '').toUpperCase());
export const isValidPhone = (v) => /^[6-9]\d{9}$/.test(String(v || ''));

export function ageFromDob(dob) {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

// yyyy-mm-dd from the LOCAL date. toISOString() would convert to UTC and give the previous day in India.
export const toYMD = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
