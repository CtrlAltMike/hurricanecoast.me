#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/img/heroes"

mkdir -p "$OUT/directories" "$OUT/kits" "$OUT/states"

base_svg() {
  local title="$1"
  local glow="$2"
  local shell="$3"
  local water="$4"
  local horizon="$5"
  local foreground="$6"
  local motif="$7"

  cat <<EOF
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 760" role="img" aria-labelledby="title desc">
  <title id="title">$title</title>
  <desc id="desc">A stylized coastal preparedness illustration in the Hurricane Coast visual style.</desc>
  <defs>
    <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="$water"/>
      <stop offset="100%" stop-color="#8aa2a8"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="760" rx="56" fill="#f2ecdf"/>
  <rect width="1200" height="760" rx="56" fill="#e2d9cd" opacity="0.28"/>
  <circle cx="980" cy="122" r="152" fill="$glow" opacity="0.58"/>
  <g fill="none" stroke="#bdb5aa" stroke-width="3" opacity="0.58">
    <path d="M-40 102c153 18 265 31 398 27 144-4 234-28 371-30 156-2 271 18 511 44"/>
    <path d="M-58 156c168 16 280 22 429 9 155-13 238-44 382-50 137-6 246 8 487 33"/>
    <path d="M-34 212c144 10 265 8 404-15 146-24 243-59 391-67 135-7 223 2 479 30"/>
    <path d="M-60 270c162 1 273-8 425-36 154-28 243-62 393-76 127-11 226-4 482 21"/>
  </g>
  <path d="M0 320c144-25 278-16 412-35 166-24 230-67 389-77 120-8 249 12 399 57v156H0Z" fill="$shell"/>
  <path d="M0 418c179-30 298-14 470 8 147 19 249 15 400-6 113-15 218-15 330 7v170H0Z" fill="url(#sea)"/>
  <path d="M0 520c163-58 292-62 451-39 125 18 210 8 329-26 174-49 270-37 420 26v279H0Z" fill="$foreground"/>
  <path d="M0 598c145-33 271-27 399-5 169 29 288 8 444-36 138-39 250-39 357 0v203H0Z" fill="#2f3638" opacity="0.42"/>
  <path d="M0 520c119-44 235-68 329-72 99-3 189 14 289 22 102 8 201-5 318-44 115-39 196-53 264-51v59c-110 24-210 47-322 71-162 35-316 48-483 33-173-15-280-12-395 14Z" fill="$horizon" opacity="0.86"/>
$motif
</svg>
EOF
}

motif_home() {
  cat <<'EOF'
  <g transform="translate(650 242)">
    <rect x="272" y="244" width="16" height="112" fill="#f6efe5"/>
    <rect x="262" y="170" width="36" height="84" rx="16" fill="#f6efe5"/>
    <path d="M232 202c42-26 87-34 120-30-27 36-64 65-120 87Z" fill="#d47f39"/>
    <path d="M0 284c43-42 92-66 147-72 70-8 150 11 241 64 42 24 81 55 119 96H0Z" fill="#47514f"/>
    <path d="M90 152h74v126H90z" fill="#f4eadb"/>
    <path d="M71 155 126 112l58 43v129H71Z" fill="#6e553c"/>
    <rect x="108" y="208" width="36" height="76" rx="18" fill="#c2742b"/>
    <rect x="416" y="200" width="94" height="80" rx="20" fill="#6b7d7f"/>
    <rect x="444" y="146" width="38" height="62" rx="12" fill="#f5efe5"/>
    <circle cx="463" cy="175" r="11" fill="#c2742b"/>
  </g>
EOF
}

motif_kits_directory() {
  cat <<'EOF'
  <g transform="translate(618 250)">
    <rect x="24" y="264" width="474" height="34" rx="17" fill="#46504f"/>
    <rect x="36" y="78" width="154" height="184" rx="34" fill="#6e553c"/>
    <rect x="76" y="32" width="74" height="72" rx="28" fill="#6e553c"/>
    <rect x="66" y="134" width="94" height="56" rx="16" fill="#8a6b49"/>
    <rect x="224" y="92" width="84" height="156" rx="24" fill="#7ca1ab"/>
    <path d="M254 46h26c18 0 32 14 32 32v14h-90V78c0-18 14-32 32-32Z" fill="#7ca1ab"/>
    <rect x="348" y="76" width="110" height="172" rx="22" fill="#f2ecdf"/>
    <path d="M382 122h42" stroke="#6e553c" stroke-width="14" stroke-linecap="round"/>
    <path d="M403 102v42" stroke="#6e553c" stroke-width="14" stroke-linecap="round"/>
    <rect x="304" y="214" width="122" height="62" rx="18" fill="#c2742b"/>
  </g>
EOF
}

motif_states_directory() {
  cat <<'EOF'
  <g transform="translate(650 210)">
    <circle cx="184" cy="180" r="110" fill="#f4eadb" opacity="0.95"/>
    <path d="M182 84v192M86 180h192" stroke="#6e553c" stroke-width="12" stroke-linecap="round"/>
    <path d="M182 98 202 146 250 166 202 186 182 234 162 186 114 166 162 146Z" fill="#c2742b"/>
    <path d="M286 248c-48-84-133-117-210-96-82 23-108 69-140 133 77-44 146-44 222-10 55 25 95 18 128-27Z" fill="#47514f"/>
    <path d="M288 252c-65-29-121-33-183-9-45 18-86 48-123 91 60 0 109 7 156 23 62 21 109 18 150-12Z" fill="#2f3638" opacity="0.46"/>
  </g>
EOF
}

motif_evacuation() {
  cat <<'EOF'
  <g transform="translate(694 246)">
    <rect x="12" y="116" width="224" height="198" rx="42" fill="#6e553c"/>
    <rect x="56" y="24" width="136" height="116" rx="40" fill="#6e553c"/>
    <rect x="64" y="168" width="120" height="62" rx="20" fill="#8a6b49"/>
    <rect x="0" y="136" width="38" height="132" rx="18" fill="#5e4b36"/>
    <rect x="208" y="136" width="38" height="132" rx="18" fill="#5e4b36"/>
    <path d="M320 66 426 88l-34 170-106-22Z" fill="#f5efe5"/>
    <path d="M346 114c18-18 38-32 60-42" stroke="#7ca1ab" stroke-width="11" fill="none" stroke-linecap="round"/>
    <path d="M348 162h66" stroke="#c2742b" stroke-width="11" stroke-linecap="round"/>
    <circle cx="336" cy="270" r="18" fill="#c2742b"/>
  </g>
EOF
}

motif_food_water() {
  cat <<'EOF'
  <g transform="translate(680 246)">
    <path d="M72 24h92v54c0 13 12 24 26 24h8v188c0 34-27 62-62 62h-36c-34 0-62-28-62-62V102h8c14 0 26-11 26-24Z" fill="#7ca1ab"/>
    <rect x="248" y="110" width="120" height="182" rx="28" fill="#6e553c"/>
    <rect x="274" y="72" width="68" height="48" rx="14" fill="#6e553c"/>
    <rect x="222" y="228" width="172" height="56" rx="18" fill="#8a6b49"/>
    <rect x="416" y="162" width="88" height="132" rx="22" fill="#f4eadb"/>
    <path d="M444 190h32M444 224h36M444 258h28" stroke="#6e553c" stroke-width="10" stroke-linecap="round"/>
    <circle cx="118" cy="166" r="34" fill="#f5efe5" opacity="0.72"/>
  </g>
EOF
}

motif_power() {
  cat <<'EOF'
  <g transform="translate(682 224)">
    <path d="M92 62h106v62h24c24 0 42 19 42 42v102c0 23-18 42-42 42H68c-23 0-42-19-42-42V166c0-23 19-42 42-42h24Z" fill="#6e553c"/>
    <path d="M120 18h50c18 0 32 14 32 32v24H88V50c0-18 14-32 32-32Z" fill="#6e553c"/>
    <rect x="88" y="150" width="114" height="102" rx="28" fill="#f6efe5"/>
    <circle cx="145" cy="202" r="34" fill="#f2c97c" opacity="0.9"/>
    <rect x="316" y="142" width="166" height="104" rx="26" fill="#7ca1ab"/>
    <rect x="484" y="172" width="18" height="44" rx="9" fill="#7ca1ab"/>
    <path d="M372 170v48M346 194h52" stroke="#f4eadb" stroke-width="12" stroke-linecap="round"/>
  </g>
EOF
}

motif_first_aid() {
  cat <<'EOF'
  <g transform="translate(690 242)">
    <rect x="24" y="120" width="286" height="176" rx="38" fill="#f2ecdf"/>
    <path d="M106 120v-20c0-36 29-64 64-64h0c35 0 64 28 64 64v20" fill="none" stroke="#6e553c" stroke-width="20"/>
    <path d="M146 164h48v36h36v48h-36v36h-48v-36h-36v-48h36Z" fill="#c2742b"/>
    <rect x="352" y="178" width="152" height="74" rx="26" fill="#7ca1ab"/>
    <circle cx="382" cy="214" r="22" fill="#f4eadb"/>
    <path d="M434 196h44M434 228h44" stroke="#f4eadb" stroke-width="10" stroke-linecap="round"/>
  </g>
EOF
}

motif_documents() {
  cat <<'EOF'
  <g transform="translate(686 240)">
    <path d="M48 108h174l46 44v144H48c-22 0-40-18-40-40V148c0-22 18-40 40-40Z" fill="#c2742b"/>
    <path d="M222 108v44h46" fill="#d99152"/>
    <rect x="274" y="78" width="188" height="216" rx="26" fill="#f6efe5"/>
    <path d="M314 130h104M314 172h104M314 214h92M314 256h84" stroke="#7ca1ab" stroke-width="11" stroke-linecap="round"/>
    <rect x="134" y="226" width="142" height="62" rx="18" fill="#6e553c"/>
  </g>
EOF
}

motif_pet() {
  cat <<'EOF'
  <g transform="translate(676 248)">
    <rect x="28" y="116" width="270" height="172" rx="36" fill="#6e553c"/>
    <rect x="74" y="148" width="178" height="88" rx="22" fill="#f2ecdf"/>
    <path d="M116 164h92" stroke="#7ca1ab" stroke-width="16" stroke-linecap="round"/>
    <path d="M116 198h118" stroke="#7ca1ab" stroke-width="16" stroke-linecap="round"/>
    <circle cx="382" cy="138" r="32" fill="#c2742b"/>
    <circle cx="448" cy="138" r="32" fill="#c2742b"/>
    <circle cx="350" cy="206" r="30" fill="#c2742b"/>
    <circle cx="412" cy="238" r="34" fill="#c2742b"/>
    <circle cx="470" cy="206" r="30" fill="#c2742b"/>
    <ellipse cx="164" cy="318" rx="104" ry="22" fill="#2f3638" opacity="0.28"/>
  </g>
EOF
}

motif_baby_child() {
  cat <<'EOF'
  <g transform="translate(678 236)">
    <rect x="18" y="178" width="118" height="118" rx="18" fill="#c2742b"/>
    <path d="M54 210h46M78 186v94" stroke="#f5efe5" stroke-width="12" stroke-linecap="round"/>
    <path d="M246 74h74v198c0 27-22 48-48 48h-26c-27 0-48-21-48-48V124c0-28 20-50 48-50Z" fill="#7ca1ab"/>
    <path d="M236 18h96v74h-96Z" fill="#7ca1ab"/>
    <path d="M258 18c0-24 17-42 42-42h0c25 0 44 18 44 42" fill="#f4eadb"/>
    <circle cx="448" cy="168" r="46" fill="#8a6b49"/>
    <circle cx="402" cy="126" r="28" fill="#8a6b49"/>
    <circle cx="494" cy="126" r="28" fill="#8a6b49"/>
    <circle cx="432" cy="164" r="6" fill="#1f2a33"/>
    <circle cx="464" cy="164" r="6" fill="#1f2a33"/>
    <path d="M435 188c10 8 18 12 28 12 10 0 18-4 28-12" fill="none" stroke="#1f2a33" stroke-width="8" stroke-linecap="round"/>
  </g>
EOF
}

motif_senior_medical() {
  cat <<'EOF'
  <g transform="translate(676 238)">
    <rect x="42" y="86" width="154" height="228" rx="34" fill="#f2ecdf"/>
    <rect x="74" y="42" width="90" height="62" rx="20" fill="#f2ecdf"/>
    <path d="M92 154h54M92 198h54M92 242h54" stroke="#6e553c" stroke-width="12" stroke-linecap="round"/>
    <rect x="250" y="120" width="214" height="164" rx="32" fill="#7ca1ab"/>
    <path d="M318 140v126" stroke="#f4eadb" stroke-width="12" opacity="0.72"/>
    <path d="M392 140v126" stroke="#f4eadb" stroke-width="12" opacity="0.72"/>
    <path d="M280 188h154" stroke="#f4eadb" stroke-width="12" opacity="0.72"/>
    <path d="M280 232h154" stroke="#f4eadb" stroke-width="12" opacity="0.72"/>
    <circle cx="520" cy="170" r="42" fill="#c2742b"/>
    <path d="M520 130c-16 18-28 34-28 52 0 21 13 34 28 34s28-13 28-34c0-18-12-34-28-52Z" fill="#f5efe5"/>
  </g>
EOF
}

motif_car() {
  cat <<'EOF'
  <g transform="translate(658 276)">
    <path d="M82 146c18-58 48-92 92-102h148c42 10 72 44 90 102h24c28 0 50 22 50 50v52H28v-52c0-28 22-50 50-50Z" fill="#6e553c"/>
    <path d="M142 96h176c25 0 46 16 64 50H88c16-34 30-50 54-50Z" fill="#8a6b49"/>
    <circle cx="146" cy="252" r="46" fill="#2f3638"/>
    <circle cx="146" cy="252" r="18" fill="#f4eadb"/>
    <circle cx="374" cy="252" r="46" fill="#2f3638"/>
    <circle cx="374" cy="252" r="18" fill="#f4eadb"/>
    <rect x="218" y="18" width="86" height="42" rx="12" fill="#c2742b"/>
    <path d="M236 58v38" stroke="#f4eadb" stroke-width="10"/>
    <path d="M286 58v38" stroke="#f4eadb" stroke-width="10"/>
  </g>
EOF
}

motif_florida() {
  cat <<'EOF'
  <g transform="translate(672 212)">
    <path d="M94 12c68 16 126 26 178 28l18 28-40 18 10 42-64 28-20 42 26 40-16 40 48 36-14 40-52-8-34-42-40-18 6-36-42-24 24-38-18-36 34-34-26-34 26-28-4-30Z" fill="#6e553c"/>
    <rect x="344" y="162" width="16" height="168" fill="#f6efe5"/>
    <path d="M304 188c48-30 92-42 138-40-36 48-82 86-138 116Z" fill="#c2742b"/>
    <path d="M34 322c78-48 146-62 230-38 40 12 82 35 124 74H0c6-8 16-20 34-36Z" fill="#47514f"/>
  </g>
EOF
}

motif_texas() {
  cat <<'EOF'
  <g transform="translate(662 232)">
    <path d="M72 54h188l24 32 108-2 12 68-42 32 10 64-60 18-24 60-88-18-30-42-62-8-30-52 16-42-46-42 24-68Z" fill="#6e553c"/>
    <path d="M362 196c52-38 96-54 134-50-20 50-54 96-110 136Z" fill="#7ca1ab"/>
    <rect x="28" y="304" width="504" height="24" rx="12" fill="#2f3638" opacity="0.34"/>
    <path d="M110 300c28-68 86-114 170-142" stroke="#c2742b" stroke-width="12" stroke-linecap="round" fill="none"/>
  </g>
EOF
}

motif_louisiana() {
  cat <<'EOF'
  <g transform="translate(650 238)">
    <path d="M0 306c72-72 142-102 226-102 72 0 142 20 214 72 40 29 76 64 110 110H0c0-22 0-48 0-80Z" fill="#47514f"/>
    <rect x="160" y="96" width="122" height="122" rx="18" fill="#f4eadb"/>
    <path d="M140 102 222 48l80 54v116H140Z" fill="#6e553c"/>
    <rect x="208" y="150" width="28" height="68" rx="14" fill="#c2742b"/>
    <path d="M116 220v94M326 220v94" stroke="#6e553c" stroke-width="12" stroke-linecap="round"/>
    <path d="M338 244c52-6 94 4 142 34" stroke="#88a56e" stroke-width="14" stroke-linecap="round" fill="none"/>
    <path d="M94 264c-44 8-78 26-104 54" stroke="#88a56e" stroke-width="14" stroke-linecap="round" fill="none"/>
  </g>
EOF
}

motif_gulf_coast() {
  cat <<'EOF'
  <g transform="translate(654 226)">
    <path d="M0 336c50-52 104-86 162-100 84-20 174-3 262 58 56 38 104 90 146 154H0Z" fill="#47514f"/>
    <path d="M130 282v-86M202 282v-112M274 282v-92" stroke="#f4eadb" stroke-width="14" stroke-linecap="round"/>
    <path d="M92 182c30 16 48 34 54 54" stroke="#c2742b" stroke-width="12" stroke-linecap="round" fill="none"/>
    <path d="M362 212c36-26 82-42 138-48-20 44-58 80-118 112Z" fill="#7ca1ab"/>
  </g>
EOF
}

motif_carolinas() {
  cat <<'EOF'
  <g transform="translate(662 216)">
    <path d="M0 356c64-58 128-92 194-102 96-15 188 18 280 100h60c-28 18-54 32-78 42H0Z" fill="#47514f"/>
    <rect x="214" y="118" width="30" height="182" fill="#f4eadb"/>
    <path d="M194 166h70l-34-56Z" fill="#c2742b"/>
    <path d="M160 246c58-14 100-12 150 6" stroke="#f4eadb" stroke-width="12" stroke-linecap="round" fill="none"/>
    <path d="M354 184c50-36 96-54 140-56-20 52-64 102-136 146Z" fill="#d9d1c6"/>
  </g>
EOF
}

motif_georgia() {
  cat <<'EOF'
  <g transform="translate(652 230)">
    <path d="M0 326c54-44 114-70 176-76 101-10 191 36 270 138H0Z" fill="#47514f"/>
    <path d="M244 42c70 10 120 42 148 94-52 4-102 0-154-12Z" fill="#6e553c"/>
    <path d="M286 66c-18 68-16 126 6 178" stroke="#6e553c" stroke-width="16" stroke-linecap="round" fill="none"/>
    <path d="M118 220c20 28 26 62 18 102M154 214c14 32 18 68 10 108M192 222c10 28 14 62 10 100" stroke="#88a56e" stroke-width="12" stroke-linecap="round"/>
  </g>
EOF
}

motif_alabama() {
  cat <<'EOF'
  <g transform="translate(658 228)">
    <path d="M0 340c62-54 122-84 184-92 94-11 180 21 260 98h84c-36 20-76 36-120 48H0Z" fill="#47514f"/>
    <path d="M182 220h160" stroke="#f4eadb" stroke-width="14" stroke-linecap="round"/>
    <path d="M220 136v84M300 136v84" stroke="#f4eadb" stroke-width="12" stroke-linecap="round"/>
    <path d="M332 98c42 8 74 30 92 62-34 4-72 0-112-12Z" fill="#6e553c"/>
    <path d="M116 154c24 12 42 30 56 54" stroke="#c2742b" stroke-width="12" stroke-linecap="round" fill="none"/>
  </g>
EOF
}

motif_mississippi() {
  cat <<'EOF'
  <g transform="translate(654 232)">
    <path d="M0 336c52-52 110-82 178-88 93-8 176 22 254 92h112c-42 24-84 40-128 48H0Z" fill="#47514f"/>
    <path d="M162 246c34-34 78-54 130-58 54-4 100 10 140 42" stroke="#f4eadb" stroke-width="14" fill="none" stroke-linecap="round"/>
    <path d="M90 214c44-14 86-14 126 0" stroke="#88a56e" stroke-width="12" stroke-linecap="round"/>
    <path d="M378 174c42-28 84-40 126-36-22 46-60 88-114 126Z" fill="#7ca1ab"/>
  </g>
EOF
}

motif_puerto_rico() {
  cat <<'EOF'
  <g transform="translate(648 226)">
    <path d="M0 354c54-24 110-36 172-34 60 1 138 18 232 50 52 18 110 26 174 24-54 18-114 28-180 30-90 2-181-10-274-38-45-14-86-24-124-32Z" fill="#47514f"/>
    <path d="M40 286c50-52 100-82 154-92 68-12 130 4 194 50 42 29 80 70 116 124H0c8-28 20-56 40-82Z" fill="#6e553c"/>
    <path d="M356 156c50-34 96-50 140-48-22 54-62 104-122 150Z" fill="#88a56e"/>
    <path d="M114 156c36 26 56 58 62 98" stroke="#c2742b" stroke-width="12" stroke-linecap="round" fill="none"/>
  </g>
EOF
}

write_file() {
  local path="$1"
  local title="$2"
  local glow="$3"
  local shell="$4"
  local water="$5"
  local horizon="$6"
  local foreground="$7"
  local motif="$8"
  base_svg "$title" "$glow" "$shell" "$water" "$horizon" "$foreground" "$motif" >"$path"
}

write_file "$OUT/home-coast.svg" "Home coastal preparedness scene" "#f2c97c" "#d8d1c5" "#bdc0b7" "#a8b7b6" "#4d5754" "$(motif_home)"
write_file "$OUT/directories/kits-library.svg" "Preparedness kit library illustration" "#efc487" "#d9d0c5" "#c1c5bb" "#94aab0" "#4d5653" "$(motif_kits_directory)"
write_file "$OUT/directories/states-atlas.svg" "State and region guide illustration" "#f0c67d" "#d8d1c5" "#bec4bc" "#91a7ad" "#4b5552" "$(motif_states_directory)"

write_file "$OUT/kits/evacuation-kit.svg" "Evacuation kit illustration" "#efbf7f" "#d7cdc1" "#bfc2b8" "#8ea6ad" "#4b5351" "$(motif_evacuation)"
write_file "$OUT/kits/food-water-kit.svg" "Food and water kit illustration" "#f1ca8b" "#d9d0c5" "#c4c5ba" "#97acb2" "#4b5552" "$(motif_food_water)"
write_file "$OUT/kits/power-outage-kit.svg" "Power outage kit illustration" "#efbd75" "#d2cbc0" "#bcc2b9" "#8ca2a9" "#495350" "$(motif_power)"
write_file "$OUT/kits/first-aid-kit.svg" "First aid kit illustration" "#efc07d" "#d8d0c5" "#c5c5bb" "#93a8ae" "#4c5552" "$(motif_first_aid)"
write_file "$OUT/kits/documents-kit.svg" "Documents kit illustration" "#efc68a" "#d9d0c5" "#c3c5bb" "#95aaaf" "#4b5451" "$(motif_documents)"
write_file "$OUT/kits/pet-kit.svg" "Pet kit illustration" "#f1c88a" "#d8d0c4" "#c2c5bb" "#95aaaf" "#4a5351" "$(motif_pet)"
write_file "$OUT/kits/baby-child-kit.svg" "Baby and child kit illustration" "#f0c382" "#d7cfc3" "#c1c5bc" "#95aab0" "#4c5552" "$(motif_baby_child)"
write_file "$OUT/kits/senior-medical-kit.svg" "Senior and medical kit illustration" "#efbf77" "#d7cec2" "#c1c5bb" "#93a8ae" "#4a5350" "$(motif_senior_medical)"
write_file "$OUT/kits/car-kit.svg" "Car kit illustration" "#efc17c" "#d5cdc1" "#c0c4bb" "#90a6ac" "#4a5350" "$(motif_car)"

write_file "$OUT/states/florida.svg" "Florida hurricane guide illustration" "#f0c582" "#d7cec2" "#c1c5bc" "#96abb0" "#4c5552" "$(motif_florida)"
write_file "$OUT/states/texas.svg" "Texas hurricane guide illustration" "#efc07b" "#d5cdc1" "#bec3bb" "#92a7ad" "#4a5451" "$(motif_texas)"
write_file "$OUT/states/louisiana.svg" "Louisiana hurricane guide illustration" "#efbf76" "#d4ccc0" "#bcc2ba" "#8fa5ac" "#48524f" "$(motif_louisiana)"
write_file "$OUT/states/gulf-coast.svg" "Gulf Coast hurricane guide illustration" "#f0c37e" "#d7cec2" "#c0c4bb" "#93a8ae" "#4a5451" "$(motif_gulf_coast)"
write_file "$OUT/states/carolinas.svg" "Carolinas hurricane guide illustration" "#f1c98c" "#d8d0c5" "#c4c5bb" "#97abb1" "#4b5552" "$(motif_carolinas)"
write_file "$OUT/states/georgia.svg" "Georgia hurricane guide illustration" "#efc27d" "#d6cdc1" "#c0c3bb" "#92a8ad" "#4a5351" "$(motif_georgia)"
write_file "$OUT/states/alabama.svg" "Alabama hurricane guide illustration" "#efc17b" "#d6cdc1" "#c0c4bb" "#93a7ad" "#4a5350" "$(motif_alabama)"
write_file "$OUT/states/mississippi.svg" "Mississippi hurricane guide illustration" "#efc27b" "#d6cdc1" "#c0c4bb" "#93a7ad" "#4b5451" "$(motif_mississippi)"
write_file "$OUT/states/puerto-rico.svg" "Puerto Rico hurricane guide illustration" "#f0c783" "#d7cec2" "#c1c5bc" "#94a8ae" "#4a5451" "$(motif_puerto_rico)"
