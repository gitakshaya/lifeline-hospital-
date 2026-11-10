# Lifeline Hospital: Hospital + Insurance app (React Native / Expo)

## What's included
- Facilities, Health plans, Google Reviews, photo gallery, emergency + ambulance call buttons
- Customer registration: name, phone, DOB, Aadhaar (compulsory, checksum validated), PAN (optional), photo
- e-ID card number: `[N|O][I|M][S|A|E][YYYY][MM][5 random digits]`, e.g. `NIA20261148392`
  - N = New patient, O = Old patient
  - I = IPD, M = Mediclaim
  - S = under 21, A = 21 to 60, E = over 60
- Razorpay payment with server-side discount codes
- All data stored in Google Sheets (via a Google Apps Script web app)

## 1. Google Sheet backend (about 10 minutes)
All registrations, payments and discount codes are stored in your own Google Sheet.
1. Create a blank Google Sheet (name it e.g. "Lifeline Hospital Data").
2. In it: Extensions > Apps Script. Delete the sample code and paste all of `backend/Code.gs`. Save.
3. In the function dropdown pick **setupSheet** and press Run. Approve the permissions. This creates the tabs
   (Facilities, Plans, Gallery, Discounts, Customers, Payments) with headers and sample rows, a Drive folder for
   customer photos, and a random TOKEN. Open View > Logs (Execution log) and copy the TOKEN.
4. Project Settings (gear icon) > Script properties: replace each `PASTE_HERE` (Razorpay key id and secret,
   Google Places API key, your hospital's Place ID). The Razorpay and Places keys are only needed for payments and reviews.
5. Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone. Copy the `/exec` URL.
6. In `src/config.js` set `API_URL` to that URL and `API_TOKEN` to the TOKEN from step 3.
7. Edit the Plans, Facilities and Gallery tabs (photo links) with your real data. Re-deploy is NOT needed for data changes.
If you change `Code.gs` later: Deploy > Manage deployments > edit > New version.

Where data goes: each registration adds a row to **Customers** (name, phone, DOB, age, e-ID number, masked Aadhaar, PAN,
photo link, plan, payment status); each successful payment adds a row to **Payments**. Keep the Sheet private
(do not share it publicly): it holds patients' personal data.

## 2. App
```
npm install
npx expo prebuild
npx expo run:android      # or run:ios
```
`react-native-razorpay` is a native module, so **Expo Go will not work**. Use a development build.
To publish: `eas build --platform android` (APK/AAB) and `--platform ios`.

## Run as a web app (in the browser)
```
npm install
npm run web            # opens http://localhost:8081 in your browser
```
To publish it as a website:
```
npm run build:web      # creates the dist/ folder
```
Upload the `dist/` folder to any static host (Netlify, Vercel, Firebase Hosting, GitHub Pages, or your own server).
Use HTTPS in production (Razorpay checkout requires it). On web, Razorpay opens its hosted checkout window, the date of
birth uses the browser's date input, and the photo box opens the browser's file chooser. The same Google Sheet backend is used.
If the browser shows a CORS or network error, re-check that the Apps Script web app is deployed with "Who has access: Anyone"
and that `API_URL` in `src/config.js` ends with `/exec`.

## Privacy and compliance (important)
- Aadhaar is sensitive. By default the sheet stores only the masked number and a salted hash. Set `STORE_FULL_AADHAAR=true` only if you have a legal basis; the Aadhaar Act and India's DPDP Act apply to hospitals and insurers. Prefer ABHA / DigiLocker verification for production.
- Insurance products need IRDAI-compliant onboarding. Confirm your plans' legal structure before launch.
- Google Sheets suits a pilot. For real volumes, move to a proper database (Firebase, Postgres) and restrict access.
- Keep the Razorpay secret and Places API key only in Script properties, never in the app.

## Branding and theme
- Logo: `assets/banner.jpg` is shown on Home, Theme and the e-ID card (on a light plate so it reads well in dark mode). `assets/icon.png`, `adaptive-icon.png` and `splash.png` are cut from the same banner for the app icon and splash screen.
- Brand colours (from the logo): red `#D81818`, navy `#203878`, defined in `src/theme.js`.
- Theme tab: System default, Light or Dark. The choice is saved on the device (AsyncStorage). Edit the `THEMES` object in `src/theme.js` to change colours.
- After pulling this update run `npm install` (adds `@react-native-async-storage/async-storage`).
