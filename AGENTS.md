# Project Rules: Remotion Commercial Motion Graphics (Adobe Stock Standard)

## 1. Tech Stack & Code Quality
- **Framework:** Remotion (React + TypeScript).
- **Styling & Graphics:** Gunakan inline styles, SVG bersih (`<svg>`), dan `<AbsoluteFill>` bawaan Remotion. Hindari pustaka animasi eksternal (seperti Framer Motion atau GSAP) yang tidak sinkron dengan `useCurrentFrame()`.
- **Determinism:** Semua gerakan, posisi, rotasi, skala, dan opasitas WAJIB dihitung secara deterministik dari `useCurrentFrame()` dan `useVideoConfig()`. Dilarang keras menggunakan `Math.random()`, `Date.now()`, atau CSS transitions/animations (`transition`, `@keyframes`).

## 2. Adobe Stock Technical Specifications
Setiap komposisi baru di `src/Root.tsx` WAJIB menggunakan standar default berikut kecuali diminta berbeda secara eksplisit:
- **Resolution:** `3840` x `2160` (4K UHD, rasio 16:9).
- **Frame Rate:** `30` fps.
- **Duration:** `300` frames (10 detik tepat).
- **Audio:** Tanpa komponen `<Audio />` (silent), kecuali diminta secara spesifik.

## 3. Seamless Loop Architecture (Wajib)
Semua animasi latar belakang atau elemen berulang HARUS berupa *seamless loop* (kondisi visual pada `frame === 0` harus identik 100% dengan `frame === durationInFrames`):
- Gunakan siklus fase ternormalisasi: `const progress = (frame % durationInFrames) / durationInFrames;` dan `const angle = progress * Math.PI * 2;`.
- Gunakan fungsi periodik (`Math.sin(angle)`, `Math.cos(angle)`) atau interpolasi simetris (`interpolate(progress, [0, 0.5, 1], [start, peak, start])`) dengan easing yang mulus (`Easing.inOut(Easing.sin)` atau `Easing.inOut(Easing.cubic)`).
- Untuk pola berulang (*tiling/grid/waves*), pastikan pergeseran jarak tepat satu unit periode grid sehingga tidak ada patahan (*jump*) saat video berulang.

## 4. Aesthetic & Commercial Design Standards
- **Style:** Minimalis, geometris, vektor datar (*flat 2D vector*), tajam, dan modern (cocok untuk presentasi korporat, teknologi, atau *abstract background*).
- **Clean Canvas:** Jangan tambahkan *watermark*, teks *placeholder* yang rumit, atau elemen merek/logo berhak cipta.
- **Anti-Banding:** Jika menggunakan gradasi halus (*linear/radial gradient*), pastikan transisi warna bersih atau sediakan opsi *subtle grain overlay* (opasitas 0.01–0.02) jika diperlukan untuk mencegah *color banding* pasca-kompresi.

## 5. Batch Variation & Props Structure ("1 Design, 4 Variations")
Setiap komponen komposisi WAJIB menerima objek `props` bertipe `z.object(...)` (Zod schema) atau TypeScript `interface` untuk memudahkan *batch rendering* via CLI:
- Wajib menyertakan minimal properti berikut di `defaultProps`:
  - `backgroundColor: string`
  - `primaryColor: string`
  - `secondaryColor: string`
  - `accentColor: string`
  - `speedMultiplier: number` (harus berupa bilangan bulat positif `1`, `2`, `3`, dst. agar *seamless loop* tetap terjaga!)
  - `strokeWidth: number` (jika berbasis garis/geometri)

## 6. File Organization & Export Conventions
- Simpan setiap komponen desain di `src/compositions/<NamaKomponen>.tsx`.
- Daftarkan seluruh komposisi di `src/Root.tsx` menggunakan `id` format PascalCase yang deskriptif (contoh: `MinimalistCorporateGrid4K`).
- Saat diminta membuatkan perintah atau skrip render, selalu gunakan pengaturan kualitas tinggi untuk Adobe Stock:
  - Standard MP4: `npx remotion render <CompId> out/<filename>.mp4 --codec=h264 --crf=16 --pixel-format=yuv420p`
  - Transparent Alpha (MOV): `npx remotion render <CompId> out/<filename>.mov --codec=prores --prores-profile=4444 --image-format=png`