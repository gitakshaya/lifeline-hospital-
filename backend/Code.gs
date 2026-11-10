/**
 * Google Apps Script backend. Deploy as: Web app, Execute as "Me", Access "Anyone".
 *
 * EASY SETUP: open your Google Sheet > Extensions > Apps Script, paste this file, choose
 * "setupSheet" in the function dropdown and press Run. It creates every tab with headers, sample rows,
 * a Drive folder for photos and the TOKEN / SHEET_ID / salt properties. Then add the Razorpay and Places keys.
 * Script Properties to set (Project Settings > Script properties):
 *   TOKEN               shared secret, same as API_TOKEN in src/config.js
 *   SHEET_ID            ID of your Google Sheet
 *   DRIVE_FOLDER_ID     Drive folder for customer photos
 *   RAZORPAY_KEY_ID     rzp_test_... / rzp_live_...
 *   RAZORPAY_SECRET     Razorpay key secret (never put this in the app)
 *   PLACES_API_KEY      Google Places API (New) key
 *   PLACE_ID            your hospital's Google Place ID
 *   AADHAAR_SALT        any long random string
 *   STORE_FULL_AADHAAR  "false" (default, stores masked + hash) or "true"
 *
 * Sheet tabs (row 1 = headers):
 *   Facilities: name | description
 *   Plans:      id | name | price | cover | benefits
 *   Gallery:    url
 *   Discounts:  code | type (PERCENT or FLAT) | value | minAmount | expiry (yyyy-mm-dd) | active (TRUE/FALSE) | maxUses | used
 *   Customers:  customerId | idNumber | createdAt | name | phone | email | address | dob | age | ageCode | patientType | cardType | aadhaarMasked | aadhaarHash | aadhaarFull | pan | photoUrl | planId | paymentStatus
 *   Payments:   timestamp | customerId | planId | discountCode | amount | orderId | paymentId | status
 */

function P(k) { return PropertiesService.getScriptProperties().getProperty(k); }
function sheet(name) { return SpreadsheetApp.openById(P('SHEET_ID')).getSheetByName(name); }

function rows(name) {
  const v = sheet(name).getDataRange().getValues();
  const h = v.shift();
  return v.filter(r => r.join('') !== '').map(r => {
    const o = {}; h.forEach((k, i) => o[k] = r[i]); return o;
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const req = JSON.parse(e.postData.contents);
    if (req.token !== P('TOKEN')) return out(false, 'Unauthorized');
    const h = {
      getFacilities: () => rows('Facilities'),
      getPlans: () => rows('Plans'),
      getGallery: () => rows('Gallery'),
      getReviews, validateDiscount: () => validateDiscount(req.code, Number(req.amount)),
      createOrder: () => createOrder(req),
      confirmPayment: () => confirmPayment(req),
      registerCustomer: () => registerCustomer(req.customer),
      getIdCard: () => getIdCard(req.idNumber),
    }[req.action];
    if (!h) return out(false, 'Unknown action');
    return out(true, h());
  } catch (err) {
    return out(false, String(err.message || err));
  } finally {
    lock.releaseLock();
  }
}

function out(ok, data) {
  const body = ok ? { ok: true, data: data } : { ok: false, error: data };
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- Google reviews (cached 6h) ---------- */
function getReviews() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('reviews');
  if (hit) return JSON.parse(hit);
  const res = UrlFetchApp.fetch('https://places.googleapis.com/v1/places/' + P('PLACE_ID'), {
    headers: { 'X-Goog-Api-Key': P('PLACES_API_KEY'), 'X-Goog-FieldMask': 'rating,userRatingCount,reviews' },
    muteHttpExceptions: true,
  });
  const j = JSON.parse(res.getContentText());
  if (res.getResponseCode() !== 200) throw new Error('Places API error');
  const data = {
    rating: j.rating, total: j.userRatingCount,
    reviews: (j.reviews || []).map(r => ({
      author: r.authorAttribution && r.authorAttribution.displayName,
      rating: r.rating, text: r.text && r.text.text, when: r.relativePublishTimeDescription,
    })),
  };
  cache.put('reviews', JSON.stringify(data), 21600);
  return data;
}

/* ---------- Discounts ---------- */
function findDiscount(code, amount) {
  if (!code) return { discount: 0, final: amount };
  const sh = sheet('Discounts');
  const v = sh.getDataRange().getValues();
  const h = v[0];
  for (let i = 1; i < v.length; i++) {
    const r = {}; h.forEach((k, j) => r[k] = v[i][j]);
    if (String(r.code).toUpperCase() !== String(code).toUpperCase()) continue;
    if (String(r.active).toUpperCase() !== 'TRUE') throw new Error('Code is not active');
    if (r.expiry && new Date(r.expiry) < new Date()) throw new Error('Code has expired');
    if (r.maxUses && Number(r.used || 0) >= Number(r.maxUses)) throw new Error('Code usage limit reached');
    if (r.minAmount && amount < Number(r.minAmount)) throw new Error('Minimum amount is Rs ' + r.minAmount);
    let d = r.type === 'PERCENT' ? Math.round(amount * Number(r.value) / 100) : Number(r.value);
    d = Math.min(d, amount);
    return { discount: d, final: amount - d, row: i + 1, usedCol: h.indexOf('used') + 1, used: Number(r.used || 0) };
  }
  throw new Error('Invalid discount code');
}

function validateDiscount(code, amount) {
  const d = findDiscount(code, amount);
  return { discount: d.discount, final: d.final };
}

/* ---------- Payments (Razorpay) ---------- */
function planById(id) {
  const p = rows('Plans').filter(x => String(x.id) === String(id))[0];
  if (!p) throw new Error('Plan not found');
  return p;
}

function createOrder(req) {
  const plan = planById(req.planId);
  const d = findDiscount(req.code, Number(plan.price));
  const res = UrlFetchApp.fetch('https://api.razorpay.com/v1/orders', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Basic ' + Utilities.base64Encode(P('RAZORPAY_KEY_ID') + ':' + P('RAZORPAY_SECRET')) },
    payload: JSON.stringify({
      amount: d.final * 100, currency: 'INR', receipt: String(req.customerId).slice(0, 40),
      notes: { customerId: req.customerId, planId: req.planId, code: req.code || '' },
    }),
  });
  const j = JSON.parse(res.getContentText());
  if (res.getResponseCode() !== 200) throw new Error((j.error && j.error.description) || 'Order failed');
  return { orderId: j.id, amountPaise: j.amount };
}

function confirmPayment(req) {
  const sig = Utilities.computeHmacSha256Signature(req.orderId + '|' + req.paymentId, P('RAZORPAY_SECRET'));
  const hex = sig.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
  if (hex !== req.signature) throw new Error('Payment signature mismatch');

  const plan = planById(req.planId);
  const d = findDiscount(req.discountCode, Number(plan.price));
  sheet('Payments').appendRow([new Date(), req.customerId, req.planId, req.discountCode || '', d.final, req.orderId, req.paymentId, 'PAID']);
  if (req.discountCode && d.row) sheet('Discounts').getRange(d.row, d.usedCol).setValue(d.used + 1);

  const sh = sheet('Customers');
  const v = sh.getDataRange().getValues();
  const h = v[0];
  for (let i = 1; i < v.length; i++) {
    if (v[i][h.indexOf('customerId')] === req.customerId) {
      sh.getRange(i + 1, h.indexOf('paymentStatus') + 1).setValue('PAID');
      break;
    }
  }
  return { status: 'PAID' };
}

/* ---------- Customers & e-ID ---------- */
function ageCode(age) { return age < 21 ? 'S' : (age <= 60 ? 'A' : 'E'); }

// Format: [N|O][I|M][S|A|E][YYYY][MM][5 random digits]  e.g. NIA20261148392
function makeIdNumber(c, existing) {
  const now = new Date();
  const ym = Utilities.formatDate(now, 'Asia/Kolkata', 'yyyyMM');
  for (let t = 0; t < 50; t++) {
    const rnd = ('0000' + Math.floor(Math.random() * 100000)).slice(-5);
    const id = c.patientType + c.cardType + ageCode(c.age) + ym + rnd;
    if (existing.indexOf(id) === -1) return id;
  }
  throw new Error('Could not generate a unique ID, please retry');
}

function sha256(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s + P('AADHAAR_SALT'))
    .map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function registerCustomer(c) {
  if (!/^[2-9]\d{11}$/.test(c.aadhaar || '')) throw new Error('Valid 12-digit Aadhaar is compulsory');
  if (c.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(c.pan)) throw new Error('Invalid PAN');
  if (!['N', 'O'].includes(c.patientType) || !['I', 'M'].includes(c.cardType)) throw new Error('Invalid card options');

  const sh = sheet('Customers');
  const v = sh.getDataRange().getValues();
  const h = v[0];
  const hash = sha256(c.aadhaar);
  const ids = v.slice(1).map(r => r[h.indexOf('idNumber')]);
  const dupe = v.slice(1).filter(r => r[h.indexOf('aadhaarHash')] === hash && r[h.indexOf('cardType')] === c.cardType)[0];
  if (dupe) return { customerId: dupe[h.indexOf('customerId')], idNumber: dupe[h.indexOf('idNumber')] };

  // Photo to Drive
  let photoUrl = '';
  if (c.photoBase64) {
    const blob = Utilities.newBlob(Utilities.base64Decode(c.photoBase64), c.photoMime || 'image/jpeg', 'photo_' + Date.now() + '.jpg');
    const f = DriveApp.getFolderById(P('DRIVE_FOLDER_ID')).createFile(blob);
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    photoUrl = 'https://drive.google.com/uc?export=view&id=' + f.getId();
  }

  const customerId = Utilities.getUuid();
  const idNumber = makeIdNumber(c, ids);
  const full = P('STORE_FULL_AADHAAR') === 'true';
  sh.appendRow([
    customerId, idNumber, new Date(), c.name, c.phone, c.email || '', c.address || '', c.dob, c.age,
    ageCode(c.age), c.patientType, c.cardType,
    'XXXXXXXX' + c.aadhaar.slice(-4), hash, full ? c.aadhaar : '',
    c.pan || '', photoUrl, c.planId || '', 'PENDING',
  ]);
  return { customerId: customerId, idNumber: idNumber };
}

function getIdCard(idNumber) {
  const v = sheet('Customers').getDataRange().getValues();
  const h = v[0];
  const r = v.slice(1).filter(x => x[h.indexOf('idNumber')] === idNumber)[0];
  if (!r) throw new Error('ID not found');
  const g = k => r[h.indexOf(k)];
  return {
    idNumber: g('idNumber'), name: g('name'), dob: fmtDate(g('dob')),
    ageCode: g('ageCode'), patientType: g('patientType'), cardType: g('cardType'),
    aadhaarLast4: String(g('aadhaarMasked')).slice(-4), photoUrl: g('photoUrl'),
  };
}

function fmtDate(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Kolkata', 'yyyy-MM-dd');
  return String(v).slice(0, 10);
}

/* ---------- One-time setup: run "setupSheet" once from the Apps Script editor ---------- */
function setupSheet() {
  const ss = SpreadsheetApp.getActive();
  if (!ss) throw new Error('Open your Google Sheet, then Extensions > Apps Script, and run this from there.');
  const props = PropertiesService.getScriptProperties();
  const cur = props.getProperties();
  const add = { SHEET_ID: ss.getId() };
  if (!cur.TOKEN) add.TOKEN = Utilities.getUuid().replace(/-/g, '');
  if (!cur.AADHAAR_SALT) add.AADHAAR_SALT = Utilities.getUuid() + Utilities.getUuid();
  if (!cur.STORE_FULL_AADHAAR) add.STORE_FULL_AADHAAR = 'false';
  if (!cur.DRIVE_FOLDER_ID) add.DRIVE_FOLDER_ID = DriveApp.createFolder('Lifeline Customer Photos').getId();
  ['RAZORPAY_KEY_ID', 'RAZORPAY_SECRET', 'PLACES_API_KEY', 'PLACE_ID'].forEach(function (k) {
    if (!cur[k]) add[k] = 'PASTE_HERE';
  });
  props.setProperties(add);

  const TEXT_COLS = { Customers: ['idNumber', 'phone', 'dob', 'aadhaarFull', 'pan'] };
  const TABS = {
    Facilities: { h: ['name', 'description'], sample: [
      ['Emergency & Trauma (24x7)', 'Round-the-clock emergency care and ambulance service'],
      ['ICU / Critical Care Unit', 'Fully equipped ICU with monitoring and ventilator support'],
      ['In-patient Department (IPD)', 'Comfortable wards and private rooms'],
      ['Pharmacy & Pathology', 'In-house pharmacy and diagnostic laboratory'],
    ] },
    Plans: { h: ['id', 'name', 'price', 'cover', 'benefits'], sample: [
      [1, 'Basic Care', 999, 100000, 'IPD cover, free health check-up (edit these sample plans)'],
      [2, 'Family Care', 2499, 300000, 'Cover for the family, cashless treatment (edit these sample plans)'],
    ] },
    Gallery: { h: ['url'], sample: [] },
    Discounts: { h: ['code', 'type', 'value', 'minAmount', 'expiry', 'active', 'maxUses', 'used'], sample: [
      ['WELCOME10', 'PERCENT', 10, 500, '2027-12-31', 'TRUE', 100, 0],
    ] },
    Customers: { h: ['customerId', 'idNumber', 'createdAt', 'name', 'phone', 'email', 'address', 'dob', 'age', 'ageCode',
      'patientType', 'cardType', 'aadhaarMasked', 'aadhaarHash', 'aadhaarFull', 'pan', 'photoUrl', 'planId', 'paymentStatus'], sample: [] },
    Payments: { h: ['timestamp', 'customerId', 'planId', 'discountCode', 'amount', 'orderId', 'paymentId', 'status'], sample: [] },
  };

  Object.keys(TABS).forEach(function (name) {
    const t = TABS[name];
    const sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, t.h.length).setValues([t.h]).setFontWeight('bold').setBackground('#203878').setFontColor('#ffffff');
      sh.setFrozenRows(1);
      (TEXT_COLS[name] || []).forEach(function (col) {
        // plain-text columns keep leading zeros and stop Sheets turning dates / IDs into other types
        sh.getRange(2, t.h.indexOf(col) + 1, sh.getMaxRows() - 1, 1).setNumberFormat('@');
      });
      if (t.sample.length) sh.getRange(2, 1, t.sample.length, t.h.length).setValues(t.sample);
    }
  });
  const dflt = ss.getSheetByName('Sheet1');
  if (dflt && ss.getSheets().length > 1 && dflt.getLastRow() === 0) ss.deleteSheet(dflt);

  Logger.log('Setup done.\nTOKEN (put this in src/config.js as API_TOKEN): ' + props.getProperty('TOKEN') +
    '\nNow open Project Settings > Script properties and replace each PASTE_HERE value, then Deploy > New deployment > Web app.');
}
