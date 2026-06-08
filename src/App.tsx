import { useState, useRef, useCallback, useEffect } from "react";
import carInterior from "./vehicle_interior.jpg";

const ACCENT = "#4a9eff";
const BLOCK_BG = "#1c1c1e";
const TRACK_BG = "#363639";
const TEXT_PRIMARY = "#f0f0f0";
const TEXT_SEC = "#888";
const ARR_GAP = 18;
const BW = 260;
const BH = 280;
const halfW = (BW - 32) / 2;
const SW_W = 640;
const SW_H = 300;
const AUTO_TEMP = 68;
const AUTO_FAN = 3;
const AUTO_WIPER = 2;
const TRACK_GLOW = "0 0 8px 2px rgba(74,159,255,0.6)";
const PLAIN_SHADOW =
  "0 2px 4px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -1px 2px rgba(0,0,0,0.6)";
const THUMB_BASE: React.CSSProperties = {
  position: "absolute",
  left: "50%",
  transform: "translate(-50%,50%)",
  width: 22,
  height: 22,
  borderRadius: "50%",
  background:
    "radial-gradient(circle at 35% 35%, #5a5a5e 0%, #1a1a1e 60%, #0d0d0f 100%)",
  border: "2px solid #c8c8c8",
  boxShadow: PLAIN_SHADOW,
  transition: "bottom 0.1s",
  zIndex: 2,
};

const TEMP_MIN = 56,
  TEMP_MAX = 84,
  TEMP_LEVELS = [56, 60, 70, 80, 84],
  TEMP_UNITS = [6, 8, 8, 6],
  TEMP_TOTAL = 28;
const TEMP_PCTS = TEMP_LEVELS.map((_, i) =>
  i === 0
    ? 0
    : (TEMP_UNITS.slice(0, i).reduce((a, b) => a + b, 0) / TEMP_TOTAL) * 100
);
const tempMarks = [TEMP_PCTS[1], TEMP_PCTS[2], TEMP_PCTS[3]];
function tempToPct(v) {
  v = Math.max(TEMP_MIN, Math.min(TEMP_MAX, v));
  for (let i = 0; i < TEMP_LEVELS.length - 1; i++) {
    if (v <= TEMP_LEVELS[i + 1]) {
      const s = (v - TEMP_LEVELS[i]) / (TEMP_LEVELS[i + 1] - TEMP_LEVELS[i]);
      return TEMP_PCTS[i] + s * (TEMP_PCTS[i + 1] - TEMP_PCTS[i]);
    }
  }
  return 100;
}
function pctToTemp(p) {
  p = Math.max(0, Math.min(100, p));
  for (let i = 0; i < TEMP_PCTS.length - 1; i++) {
    if (p <= TEMP_PCTS[i + 1]) {
      const s = (p - TEMP_PCTS[i]) / (TEMP_PCTS[i + 1] - TEMP_PCTS[i]);
      return TEMP_LEVELS[i] + s * (TEMP_LEVELS[i + 1] - TEMP_LEVELS[i]);
    }
  }
  return TEMP_MAX;
}

const MAP_SPEED = 12,
  ROAD_W = 16,
  BLOCK_SIZE = 78,
  CELL_H = BLOCK_SIZE + ROAD_W,
  ARROW_Y = SW_H / 2,
  MAP_ZOOM = 1.25;
const STREET_SEQ = [
  { name: "LUNA BLVD", major: true },
  { name: "MOORE BLVD", major: true },
  { name: "KING ST", major: false },
  { name: "GROVE RD", major: false },
  { name: "ACORN ST", major: false },
  { name: "LILAC RD", major: false },
  { name: "NORM BLVD", major: true },
  { name: "CLARE RD", major: false },
  { name: "SPRING ST", major: false },
  { name: "FERN RD", major: false },
  { name: "WEST RD", major: false },
  { name: "FIELD RD", major: false },
  { name: "SCOTT ST", major: false },
  { name: "ROSE LN", major: false },
  { name: "OTIS ST", major: false },
  { name: "OAK ST", major: false },
  { name: "OPAL LN", major: false },
  { name: "WHITE RD", major: false },
  { name: "RUTH ST", major: false },
  { name: "WEST BLVD", major: true },
  { name: "HILL ST", major: false },
  { name: "PARK ST", major: false },
  { name: "NELL RD", major: false },
  { name: "ROSS LN", major: false },
  { name: "FALL ST", major: false },
  { name: "RUBY RD", major: false },
  { name: "GRANT ST", major: false },
  { name: "HERB RD", major: false },
];
const N_STREETS = STREET_SEQ.length,
  TOTAL_CYCLE = N_STREETS * CELL_H,
  N_VCOLS = 5;
const V_GAP = Math.round((SW_W - N_VCOLS * ROAD_W) / (N_VCOLS + 1));
const V_ROAD_XS = [0, 1, 2, 3, 4].map((i) => (i + 1) * V_GAP + i * ROAD_W);
const ROUTE_X = V_ROAD_XS[2] + Math.round(ROAD_W / 2) - 3;
const V_LABELS = [
  { cx: Math.round(V_ROAD_XS[0] + ROAD_W / 2), worldY: 0, name: "MAPLE LN" },
  { cx: Math.round(V_ROAD_XS[1] + ROAD_W / 2), worldY: 140, name: "COX AVE" },
  { cx: Math.round(V_ROAD_XS[3] + ROAD_W / 2), worldY: 70, name: "MASON RD" },
  { cx: Math.round(V_ROAD_XS[4] + ROAD_W / 2), worldY: 210, name: "OAK AVE" },
];
function getDistLabel(s) {
  if (s <= 18) return ((20 - s) / 10).toFixed(1) + " mi";
  if (s <= 23) return (24 - s) * 100 + " ft";
  return "50 ft";
}

function WiperSVG({ s = 44 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 512 512" fill={TEXT_PRIMARY}>
      <path d="M365.731,12.463c-2.818-2.853-5.643-5.717-8.408-8.333l-0.016-0.016c-5.775-5.479-14.852-5.477-20.623,0.002c-2.811,2.661-5.684,5.566-8.549,8.47c-20.572,20.914-56.137,63.076-56.137,92.412c-0.001,41.353,33.646,76.999,74.998,76.999s74.999-35.647,74.999-76.999C421.995,75.368,386.612,33.656,365.731,12.463z" />
      <path d="M503.703,153.58c-17.9-8.947-34.876-16.934-54.13-24.529c-10.175,47.322-52.261,82.946-102.577,82.946c-57.89,0-104.999-47.109-104.999-104.999c0-4.735,0.861-9.565,1.811-14.394C164.418,94.215,88.652,113.397,8.29,153.58c-7.476,3.753-10.374,12.767-6.709,20.127l101.103,202.22c3.361,6.741,11.137,9.813,18.032,7.559c12.568-4.069,25.302-7.383,38.108-10.278l-82.77-163.729c-11.193-22.174-2.387-49.23,19.878-60.468c21.432-11.05,48.927-2.957,60.453,19.878l97.794,193.438c45.732-0.104,93.378,6.923,137.1,21.116c6.987,2.285,14.736-0.908,18.047-7.559l101.088-202.176C514.118,166.295,511.115,157.286,503.703,153.58z" />
      <path d="M254.997,421.995c-1.392,0-2.703,0.286-4.063,0.41L129.607,182.407c-3.735-7.397-12.803-10.4-20.156-6.621c-7.397,3.735-10.356,12.759-6.621,20.156l120.774,238.907c-8.372,8.177-13.607,19.547-13.607,32.146c0,24.814,20.186,45,45,45c24.814,0,45-20.186,45-45C299.996,442.181,279.81,421.995,254.997,421.995z" />
    </svg>
  );
}
function FrontWinSVG({ s = 44 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 512 512" fill={TEXT_PRIMARY}>
      <path d="m211.946 333.878c-11.531 2.84-22.713 6.797-33.413 11.816-2.675 5.56-6.995 11.334-13.473 17.812-27.996 27.997-27.996 73.55 0 101.546 5.858 5.859 15.357 5.857 21.213 0 5.858-5.858 5.858-15.355 0-21.213-16.299-16.299-16.299-42.821 0-59.121 18.234-18.232 24.855-34.973 25.673-50.84z" />
      <path d="m363.576 363.58c-8.104-5.945-16.639-11.182-25.532-15.665-2.709 4.881-6.697 9.97-12.318 15.591-27.996 27.997-27.996 73.55 0 101.546 5.858 5.859 15.357 5.857 21.213 0 5.858-5.858 5.858-15.355 0-21.213-16.299-16.299-16.299-42.821 0-59.121 7.271-7.27 12.69-14.302 16.637-21.138z" />
      <path d="m507.606 146.606c-138.736-138.736-364.476-138.736-503.212 0-4.298 4.298-5.578 10.765-3.24 16.375l80.333 192.8c1.925 4.62 6.026 7.975 10.935 8.946 4.909.97 9.979-.57 13.518-4.108 21.512-21.512 46.536-37.418 73.24-47.744-1.359-4.767-3.099-9.91-5.04-15.634-6.003-17.704-13.474-39.735-13.474-67.729v-28.054l-22.593 22.593c-5.856 5.857-15.355 5.859-21.213 0-5.858-5.857-5.858-15.355 0-21.213l48.2-48.2c5.852-5.852 15.354-5.859 21.213 0l48.2 48.2c5.858 5.858 5.858 15.355 0 21.213-5.857 5.858-15.355 5.858-21.213 0l-22.594-22.594v28.054c.055 30.181 9.798 49.479 17.164 74.56 44.11-10.209 90.871-6.208 132.893 12.029-1.44-5.657-3.53-11.824-5.916-18.86-6.003-17.704-13.474-39.735-13.474-67.729v-28.054l-22.593 22.593c-5.856 5.857-15.355 5.859-21.213 0-5.858-5.857-5.858-15.355 0-21.213l48.2-48.2c5.852-5.852 15.354-5.859 21.213 0l48.2 48.2c5.858 5.858 5.858 15.355 0 21.213-5.857 5.858-15.355 5.858-21.213 0l-22.594-22.594v28.054c-.924 40.603 21.49 66.157 21.305 103.852 11.822 7.781 23.031 16.864 33.422 27.255 2.057 2.058 6.872 5.422 13.518 4.108 4.909-.971 9.011-4.326 10.936-8.946l80.333-192.8c2.336-5.608 1.057-12.075-3.241-16.373z" />
    </svg>
  );
}
function RearWinSVG({ s = 44 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 512 512" fill={TEXT_PRIMARY}>
      <path d="m497 0h-482c-8.284 0-15 6.716-15 15v280c0 8.284 6.716 15 15 15h109.278c-15.269-33.721-23.278-70.567-23.278-107.65v-51.137l-14.393 14.393c-5.858 5.858-15.355 5.858-21.213 0-5.858-5.858-5.858-15.355 0-21.213l40-40c5.858-5.858 15.355-5.858 21.213 0l40 40c5.858 5.858 5.858 15.355 0 21.213-5.858 5.858-15.355 5.858-21.213 0l-14.394-14.393v51.137c0 37.418 9.211 74.566 26.661 107.65h106.617c-15.269-33.72-23.278-70.567-23.278-107.65v-51.137l-14.393 14.393c-5.858 5.858-15.355 5.858-21.213 0-5.858-5.858-5.858-15.355 0-21.213l40-40c5.858-5.858 15.355-5.858 21.213 0l40 40c5.858 5.858 5.858 15.355 0 21.213-5.858 5.858-15.355 5.858-21.213 0l-14.394-14.393v51.137c0 37.419 9.211 74.567 26.66 107.65h106.617c-15.268-33.72-23.277-70.567-23.277-107.65v-51.137l-14.393 14.393c-5.858 5.858-15.355 5.858-21.213 0-5.858-5.858-5.858-15.355 0-21.213l40-40c5.858-5.858 15.355-5.858 21.213 0l40 40c5.858 5.858 5.858 15.355 0 21.213-5.858 5.858-15.355 5.858-21.213 0l-14.394-14.393v51.137c0 37.419 9.211 74.567 26.66 107.65h59.34c8.284 0 15-6.716 15-15v-280c0-8.284-6.716-15-15-15z" />
      <path d="m412.831 327.183c18.429 33.785 28.169 71.984 28.169 110.467v6c0 8.284 6.716 15 15 15s15-6.716 15-15v-6c0-43.487-11.007-86.654-31.832-124.833-.51-.935-1.011-1.875-1.508-2.817h-33.383c2.638 5.825 5.487 11.559 8.554 17.183z" />
      <path d="m272.831 327.183c18.429 33.785 28.169 71.984 28.169 110.467v6c0 8.284 6.716 15 15 15s15-6.716 15-15v-6c0-43.487-11.007-86.654-31.832-124.833-.51-.935-1.011-1.875-1.508-2.817h-33.382c2.637 5.825 5.486 11.559 8.553 17.183z" />
      <path d="m132.832 327.183c18.427 33.784 28.168 71.984 28.168 110.467v6c0 8.284 6.716 15 15 15s15-6.716 15-15v-6c0-43.488-11.007-86.655-31.832-124.833-.51-.935-1.011-1.875-1.508-2.817h-33.382c2.638 5.825 5.486 11.559 8.554 17.183z" />
    </svg>
  );
}
function HeadlightSVG({ s = 44 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 512.001 512.001" fill={TEXT_PRIMARY}>
      <path d="M499.461,301.201l-180-30c-8.115-1.421-15.894,4.16-17.256,12.334c-1.362,8.174,4.16,15.894,12.334,17.256l180,30c0.835,0.146,1.655,0.205,2.476,0.205c7.207,0,13.564-5.2,14.78-12.539C513.157,310.283,507.635,302.564,499.461,301.201z" />
      <path d="M499.461,241.201l-180-30c-8.115-1.494-15.894,4.16-17.256,12.334c-1.362,8.174,4.16,15.894,12.334,17.256l180,30c0.835,0.146,1.655,0.205,2.476,0.205c7.207,0,13.564-5.2,14.78-12.539C513.157,250.283,507.635,242.564,499.461,241.201z" />
      <path d="M499.461,181.201l-180-30c-8.115-1.406-15.894,4.16-17.256,12.334c-1.362,8.174,4.16,15.894,12.334,17.256l180,30c0.835,0.146,1.655,0.205,2.476,0.205c7.207,0,13.564-5.2,14.78-12.539C513.157,190.283,507.635,182.563,499.461,181.201z" />
      <path d="M499.461,361.201l-180-30c-8.115-1.509-15.894,4.146-17.256,12.334c-1.362,8.174,4.16,15.894,12.334,17.256l180,30c0.835,0.146,1.655,0.205,2.476,0.205c7.207,0,13.564-5.2,14.78-12.539C513.157,370.283,507.635,362.564,499.461,361.201z" />
      <path d="M0,255.996c0,74.572,73.638,137.135,180,157.758V98.238C73.638,118.861,0,181.425,0,255.996z" />
      <path d="M255.381,104.239c-9.375-8.584-21.87-12.906-34.6-11.778c-3.658,0.313-7.181,0.84-10.781,1.247v324.576c3.6,0.406,7.123,0.934,10.781,1.247C246.82,421.898,270,401.271,270,374.56V137.432C270,124.864,264.668,112.764,255.381,104.239z" />
    </svg>
  );
}
function VolumeSVG({ s = 44, muted = false }) {
  const mp =
    "m9.383 3.07599c.18269.07575.33881.20396.44863.36843.10983.16447.16837.35781.16837.55557v12.00001c-.00004.1977-.05871.391-.1686.5555-.10988.1644-.26605.2925-.44875.3682-.1827.0756-.38373.0954-.57768.0569-.19395-.0386-.37212-.1338-.51197-.2736l-3.707-3.707h-2.586c-.26522 0-.51957-.1054-.70711-.2929-.18753-.1875-.29289-.4419-.29289-.7071v-4.00001c0-.26521.10536-.51957.29289-.7071.18754-.18754.44189-.2929.70711-.2929h2.586l3.707-3.707c.13985-.13993.31805-.23524.51208-.27386.19402-.03863.39515-.01884.57792.05686zm2.91 4.217c.1875-.18747.4418-.29278.707-.29278s.5195.10531.707.29278l1.293 1.293 1.293-1.293c.0922-.09551.2026-.17169.3246-.2241s.2532-.07999.386-.08115c.1328-.00115.2645.02415.3874.07443.1228.05028.2345.12454.3284.21843s.1681.20554.2184.32844.0756.25458.0745.38736c-.0012.13277-.0288.26399-.0812.386-.0524.122-.1286.23235-.2241.32459l-1.293 1.293 1.293 1.29301c.1822.1886.283.4412.2807.7034s-.1075.513-.2929.6984-.4362.2906-.6984.2929c-.2622.0022-.5148-.0985-.7034-.2807l-1.293-1.293-1.293 1.293c-.1886.1822-.4412.2829-.7034.2807-.2622-.0023-.513-.1075-.6984-.2929s-.2906-.4362-.2929-.6984.0985-.5148.2807-.7034l1.293-1.29301-1.293-1.293c-.1875-.18752-.2928-.44183-.2928-.707 0-.26516.1053-.51947.2928-.707z";
  const up =
    "m9.383 3.07602c.18269.07574.33881.20395.44863.36842.10983.16447.16837.35781.16837.55558v11.99998c-.00004.1978-.05871.3911-.1686.5555-.10988.1644-.26605.2925-.44875.3682s-.38373.0955-.57768.0569-.37212-.1338-.51197-.2736l-3.707-3.707h-2.586c-.26522 0-.51957-.1053-.70711-.2929-.18753-.1875-.29289-.4419-.29289-.7071v-3.99998c0-.26522.10536-.51957.29289-.70711.18754-.18754.44189-.29289.70711-.29289h2.586l3.707-3.707c.13985-.13994.31805-.23524.51208-.27387.19402-.03863.39515-.01884.57792.05687zm5.274-.147c.1875-.18747.4418-.29279.707-.29279s.5195.10532.707.29279c.9298.92765 1.6672 2.02985 2.1699 3.24331.5026 1.21345.7606 2.51425.7591 3.82767.0015 1.3135-.2565 2.6143-.7591 3.8277-.5027 1.2135-1.2401 2.3157-2.1699 3.2433-.1886.1822-.4412.283-.7034.2807s-.513-.1075-.6984-.2929-.2906-.4362-.2929-.6984.0985-.5148.2807-.7034c.7441-.7419 1.3342-1.6237 1.7363-2.5945.4022-.9709.6083-2.0117.6067-3.0625 0-2.20998-.894-4.20798-2.343-5.65698-.1875-.18753-.2928-.44184-.2928-.707 0-.26517.1053-.51948.2928-.707zm-2.829 2.828c.0929-.09298.2032-.16674.3246-.21706.1214-.05033.2515-.07623.3829-.07623s.2615.0259.3829.07623c.1214.05032.2317.12408.3246.21706.5579.55666 1.0003 1.21806 1.3018 1.94621.3015.72814.4562 1.50868.4552 2.29677.001.7881-.1537 1.5686-.4553 2.2968-.3015.7281-.7439 1.3895-1.3017 1.9462-.1876.1877-.4421.2931-.7075.2931s-.5199-.1054-.7075-.2931c-.1876-.1876-.2931-.4421-.2931-.7075 0-.2653.1055-.5198.2931-.7075.3722-.3708.6673-.8116.8685-1.2969.2011-.4854.3043-1.0057.3035-1.5311.0008-.52537-.1023-1.04572-.3035-1.53107-.2011-.48536-.4963-.92612-.8685-1.29691-.093-.09288-.1667-.20316-.2171-.32456-.0503-.1214-.0762-.25153-.0762-.38294 0-.13142.0259-.26155.0762-.38294.0504-.1214.1241-.23169.2171-.32456z";
  return (
    <svg width={s} height={s} viewBox="0 0 20 20" fill={TEXT_PRIMARY}>
      <path clipRule="evenodd" d={muted ? mp : up} fillRule="evenodd" />
    </svg>
  );
}
function TempSVG({ s = 44 }) {
  return (
    <svg width={s} height={s} viewBox="-110 0 512 512" fill={TEXT_PRIMARY}>
      <path d="m276.863281 279.488281h-46.488281c-8.285156 0-15-6.714843-15-15 0-8.285156 6.714844-15 15-15h46.488281c8.28125 0 15 6.714844 15 15 0 8.285157-6.71875 15-15 15zm0 0" />
      <path d="m276.863281 219.476562h-46.488281c-8.285156 0-15-6.714843-15-15 0-8.285156 6.714844-15 15-15h46.488281c8.28125 0 15 6.714844 15 15 0 8.285157-6.71875 15-15 15zm0 0" />
      <path d="m276.863281 159.464844h-46.488281c-8.285156 0-15-6.714844-15-15s6.714844-15 15-15h46.488281c8.28125 0 15 6.714844 15 15s-6.71875 15-15 15zm0 0" />
      <path d="m276.863281 99.453125h-46.488281c-8.285156 0-15-6.714844-15-15 0-8.28125 6.714844-15 15-15h46.488281c8.28125 0 15 6.71875 15 15 0 8.285156-6.71875 15-15 15zm0 0" />
      <path d="m179.214844 313.605469-3.839844-3.003907v-246.148437c0-35.539063-28.910156-64.453125-64.445312-64.453125-35.53125 0-64.441407 28.914062-64.441407 64.453125v246.148437l-3.839843 3c-27.105469 21.1875-42.648438 53.058594-42.648438 87.445313 0 61.179687 49.765625 110.953125 110.929688 110.953125 61.167968 0 110.933593-49.773438 110.933593-110.953125 0-34.386719-15.546875-66.257813-42.648437-87.441406zm-68.285156 148.382812c-33.597657 0-60.929688-27.335937-60.929688-60.941406 0-28.425781 19.5625-52.363281 45.929688-59.066406v-197.761719c0-8.285156 6.71875-15 15-15 8.285156 0 15 6.714844 15 15v197.761719c26.367187 6.703125 45.933593 30.640625 45.933593 59.070312 0 33.601563-27.335937 60.9375-60.933593 60.9375zm0 0" />
      <path d="m110.929688 431.988281c-17.054688 0-30.929688-13.878906-30.929688-30.941406 0-17.058594 13.875-30.9375 30.929688-30.9375 17.058593 0 30.933593 13.878906 30.933593 30.9375 0 17.0625-13.875 30.941406-30.933593 30.941406zm0 0" />
    </svg>
  );
}
function FanSVG({ s = 44 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 512 512" fill={TEXT_PRIMARY}>
      <circle cx="255.98" cy="255.95" r="65.4" />
      <path d="m504.3 235.47c-7.07-18.93-23.29-34.74-43.19-41.91-37.49-13.63-81.4-9.94-128.13 9.59a93.17 93.17 0 0 1 2.1 102.39 91.21 91.21 0 0 1 60.48 78.81s.21 2.21.16 7a28.53 28.53 0 0 0 4.83 16.11 27 27 0 0 0 36.66 8.33l.53-.32c50.09-36.36 92.08-114.32 66.56-180z" />
      <path d="m162.58 256a92.87 92.87 0 0 1 14.24-49.53 91.2 91.2 0 0 1 -60.38-78.77s-.21-2.21-.16-7a28.53 28.53 0 0 0 -4.83-16.11 27 27 0 0 0 -36.66-8.33l-.53.32c-50.09 36.33-92.08 114.29-66.56 180 7.07 18.93 23.29 34.73 43.19 41.91 37.49 13.64 81.41 9.94 128.15-9.6a92.82 92.82 0 0 1 -16.46-52.89z" />
      <path d="m415.73 74.79-.31-.53c-36.34-50.09-114.29-92.08-180-66.56-18.93 7.07-34.73 23.29-41.9 43.19-13.64 37.48-9.94 81.38 9.57 128.1a93.21 93.21 0 0 1 102.44-2.16 91.21 91.21 0 0 1 78.78-60.39s2.21-.21 7-.16a28.55 28.55 0 0 0 16.11-4.83 27 27 0 0 0 8.31-36.66z" />
      <path d="m256 349.35a92.84 92.84 0 0 1 -49.55-14.26 91.21 91.21 0 0 1 -78.81 60.47s-2.21.21-7 .16a28.5 28.5 0 0 0 -16.1 4.83 27 27 0 0 0 -8.33 36.66l.31.53c36.34 50.09 114.29 92.08 180 66.56 18.93-7.07 34.73-23.29 41.91-43.19 13.63-37.5 9.93-81.43-9.61-128.18a92.89 92.89 0 0 1 -52.82 16.42z" />
    </svg>
  );
}
function SeatSVG({ s = 44 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 512 512" fill={TEXT_PRIMARY}>
      <path d="M213.333,394.667c0-24.615,4.813-36.635,9.896-49.375c4.88-12.181,9.888-24.763,11.133-46.625h10.971c4.313,0,8.208-2.594,9.854-6.583c1.646-3.99,0.729-8.573-2.313-11.625l-21.333-21.333c-4.167-4.167-10.917-4.167-15.083,0l-21.333,21.333c-3.042,3.052-3.958,7.635-2.313,11.625c1.646,3.99,5.542,6.583,9.854,6.583h10.124c-1.215,17.441-5.1,28.052-9.353,38.708c-2.917,7.281-5.866,14.741-8.047,24.194l-4.891,0.514L171.833,199.49c-0.604-4.406-1.979-8.906-3.729-12.458c-5.5-17.917-20.188-31.76-38.667-36.208c-8.583-2-15.25-2.094-24.583,0.094c-23.208,5.594-39.667,25.594-40.646,50.979c-0.125,0.708-0.208,1.531-0.208,2.177c0,42.396,5.208,84.75,15.5,125.906l19.833,79.354c5.625,22.469,20.708,41.281,41.417,51.635c10.938,5.469,23.208,8.365,35.438,8.365h33.251c2.268,8.289,3.895,18.034,3.895,32c0,5.896,4.771,10.667,10.667,10.667s10.667-4.771,10.667-10.667c0-28.719-5.813-43.25-11.438-57.292C218.146,431.302,213.333,419.281,213.333,394.667z" />
      <path d="M288,394.667c0-24.615,4.813-36.635,9.896-49.375c4.88-12.181,9.888-24.763,11.133-46.625H320c4.313,0,8.208-2.594,9.854-6.583c1.646-3.99,0.729-8.573-2.313-11.625l-21.333-21.333c-4.167-4.167-10.917-4.167-15.083,0l-21.333,21.333c-3.042,3.052-3.958,7.635-2.313,11.625c1.646,3.99,5.542,6.583,9.854,6.583h10.124c-1.215,17.441-5.1,28.052-9.353,38.708c-2.225,5.555-4.464,11.225-6.376,17.78l-24.436,1.991c-4.563,0.375-8.396,3.635-9.479,8.104c-2.146,8.76-3.146,18.104-3.146,29.417c0,24.656,4.813,36.667,9.917,49.365c2.125,5.333,4.375,10.99,6.292,17.625c1.333,4.552,5.5,7.677,10.25,7.677h22.98c2.268,8.289,3.895,18.034,3.895,32c0,5.896,4.771,10.667,10.667,10.667c5.896,0,10.667-4.771,10.667-10.667c0-28.719-5.813-43.25-11.438-57.292C292.813,431.302,288,419.281,288,394.667z" />
      <path d="M362.667,394.667c0-24.615,4.813-36.635,9.896-49.375c4.88-12.181,9.888-24.763,11.133-46.625h10.971c4.313,0,8.208-2.594,9.854-6.583c1.646-3.99,0.729-8.573-2.313-11.625l-21.333-21.333c-4.167-4.167-10.917-4.167-15.083,0l-21.333,21.333c-3.042,3.052-3.958,7.635-2.313,11.625c1.646,3.99,5.542,6.583,9.854,6.583h10.124c-1.215,17.441-5.1,28.052-9.353,38.708c-1.488,3.716-2.983,7.488-4.387,11.526l-24.572,2.005c-4.292,0.354-7.958,3.271-9.292,7.375c-3.625,11.365-5.188,22.25-5.188,36.385c0,24.656,4.813,36.667,9.917,49.365c2.125,5.333,4.375,10.99,6.292,17.625c1.333,4.552,5.5,7.677,10.25,7.677h18.25c1.568,0,3.078-0.253,4.624-0.358c2.324,8.365,4.001,18.184,4.001,32.358c0,5.896,4.771,10.667,10.667,10.667c5.896,0,10.667-4.771,10.667-10.667c0-28.719-5.813-43.25-11.438-57.292C367.479,431.302,362.667,419.281,362.667,394.667z" />
      <path d="M434.083,356.844c-8.896-8.396-21.083-12.885-33.229-12.104c-4.208,0.24-7.875,2.927-9.375,6.865C387,363.438,384,375.292,384,394.667c0,24.656,4.813,36.667,9.917,49.375c0.021,0.052,0.875,2.188,0.896,2.24c1.25,3.01,3.813,5.281,6.958,6.156c0.958,0.271,1.917,0.396,2.875,0.396c2.229,0,4.438-0.698,6.292-2.052c16.375-11.938,28.396-28.375,34.75-47.49c1.542-4.542,2.313-9.302,2.313-14.135C448,376.802,443.063,365.323,434.083,356.844z" />
      <path d="M117.563,128c21.771,0,40.667-15.5,44.938-36.844l7.271-36.333c2.708-13.521-0.75-27.385-9.5-38.042C151.542,6.115,138.604,0,124.813,0h-7.25C92.271,0,71.708,20.563,71.708,45.833v36.333C71.708,107.438,92.271,128,117.563,128z" />
    </svg>
  );
}
function SpeedSVG({ s = 20 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 512 512" fill={TEXT_PRIMARY}>
      <path d="M435.143,129.356c-6.796-6.795-17.463-7.797-25.407-2.384c-29.926,20.398-180.03,122.969-196.162,139.1c-23.394,23.395-23.394,61.459,0,84.854c11.697,11.696,27.063,17.545,42.427,17.545c15.364,0,30.729-5.849,42.427-17.545c16.131-16.132,118.701-166.236,139.1-196.162C442.939,146.821,441.938,136.153,435.143,129.356z" />
      <path d="M92.231,401.523l-24.69,12.044C49.475,381.325,40,345.338,40,308.499c0-26.991,4.977-52.842,14.06-76.683l28.291,13.57c2.79,1.338,5.735,1.972,8.636,1.972c7.453,0,14.608-4.185,18.047-11.355c4.776-9.959,0.576-21.906-9.384-26.683l-27.932-13.398c34.717-56.62,94.784-96.095,164.283-102.505v30.081c0,11.046,8.954,20,20,20c11.046,0,20-8.954,20-20V93.402c23.828,2.169,46.884,8.237,68.771,18.117c10.065,4.545,21.912,0.066,26.457-9.999c4.545-10.068,0.068-21.913-10-26.458C328.063,60.091,292.659,52.499,256,52.499c-68.38,0-132.667,26.628-181.02,74.98C26.629,175.832,0,240.119,0,308.499c0,50.53,14.998,99.674,43.373,142.115c3.822,5.715,10.141,8.886,16.639,8.886c2.954,0,5.946-0.655,8.757-2.026l41-20c9.928-4.843,14.05-16.816,9.207-26.744C114.133,400.803,102.159,396.682,92.231,401.523z" />
      <path d="M489.436,203.271c-4.544-10.067-16.387-14.547-26.458-10c-10.067,4.545-14.544,16.39-9.999,26.457C465.601,247.686,472,277.553,472,308.499c0,36.894-9.506,72.939-27.625,105.218l-25.777-12.275c-9.971-4.748-21.906-0.515-26.656,9.459c-4.749,9.972-0.514,21.907,9.459,26.656l42,20c2.763,1.315,5.692,1.944,8.588,1.944c6.5,0,12.82-3.175,16.637-8.886C497.002,408.173,512,359.029,512,308.499C512,271.84,504.408,236.436,489.436,203.271z" />
    </svg>
  );
}
function AUp({ s = 18 }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 32 32"
      fill={TEXT_PRIMARY}
      style={{ transform: "rotate(180deg)" }}
    >
      <path d="m29.6043 10.528-12.0735 12.8281c-.83.8819-2.2315.8819-3.0615 0l-12.0736-12.8281c-.9071-.9639-.2238-2.5455 1.0998-2.5455h25.0089c1.3237 0 2.007 1.5816 1.0999 2.5455z" />
    </svg>
  );
}
function ADn({ s = 18 }) {
  return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill={TEXT_PRIMARY}>
      <path d="m29.6043 10.528-12.0735 12.8281c-.83.8819-2.2315.8819-3.0615 0l-12.0736-12.8281c-.9071-.9639-.2238-2.5455 1.0998-2.5455h25.0089c1.3237 0 2.007 1.5816 1.0999 2.5455z" />
    </svg>
  );
}

function IconBtn({ active, glowColor = ACCENT, triggerRef, pulseScale = 1.03, children }) {
  const [scale, setScale] = useState(1);
  const timerRef = useRef(null);
  const c = glowColor || ACCENT;
  const f = `drop-shadow(0 0 5px ${c}) drop-shadow(0 0 12px ${c})`;
  const ps = pulseScale || 1.03;
  const trigger = useCallback(() => {
    clearTimeout(timerRef.current);
    setScale(ps);
    timerRef.current = setTimeout(() => setScale(1), 200);
  }, [ps]);
  useEffect(() => {
    if (triggerRef) triggerRef.current = trigger;
  }, [trigger, triggerRef]);
  useEffect(() => () => clearTimeout(timerRef.current), []);
  return (
    <div
      style={{
        display: "inline-flex",
        transform: `scale(${scale})`,
        transition:
          scale === 1 ? "transform 0.18s ease-out" : "transform 0.08s ease-out",
      }}
    >
      <div style={{ position: "relative", display: "inline-flex" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            filter: f,
            pointerEvents: "none",
            opacity: active ? 1 : 0,
            transition: "opacity 0.35s ease",
          }}
        >
          {children}
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      </div>
    </div>
  );
}
function Thumb({ pct }) {
  return <div style={{ ...THUMB_BASE, bottom: pct + "%" }} />;
}
function TrackFill({ pct, active }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: 10,
        height: pct + "%",
        background: ACCENT,
        borderRadius: 99,
        opacity: active ? 1 : 0.45,
        boxShadow: active ? TRACK_GLOW : "none",
        transition: "height 0.1s, opacity 0.35s ease, box-shadow 0.35s ease",
      }}
    />
  );
}
function TickMark({ p, pct }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: p + "%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 10,
        height: 2,
        background: p <= pct ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.4)",
        borderRadius: 1,
        zIndex: 1,
      }}
    />
  );
}
function Track({ pct, height, marks = [], trackRef, onPointerDown, active }) {
  return (
    <div
      ref={trackRef}
      onPointerDown={onPointerDown}
      style={{
        position: "relative",
        width: 28,
        height,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 10,
          background: TRACK_BG,
          borderRadius: 99,
        }}
      />
      <TrackFill pct={pct} active={active} />
      {(marks || []).map((p, i) => (
        <TickMark key={i} p={p} pct={pct} />
      ))}
      <Thumb pct={pct} />
    </div>
  );
}
function VertSlider({ value, onChange, min, max, step, height = 140, active }) {
  const ref = useRef(null);
  const pct = ((value - min) / (max - min)) * 100;
  const getV = useCallback(
    (y) => {
      const r = ref.current.getBoundingClientRect();
      const p = 1 - Math.max(0, Math.min(1, (y - r.top) / r.height));
      return Math.max(
        min,
        Math.min(max, Math.round((min + p * (max - min)) / step) * step)
      );
    },
    [min, max, step]
  );
  const onPD = (e) => {
    e.preventDefault();
    onChange(getV(e.clientY));
    const mv = (ev: PointerEvent) => onChange(getV(ev.clientY));
    const up = () => {
      window.removeEventListener("pointermove", mv);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: ARR_GAP,
      }}
    >
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          opacity: 0.75,
          lineHeight: 0,
          display: "flex",
        }}
      >
        <AUp />
      </button>
      <Track
        pct={pct}
        height={height}
        trackRef={ref}
        onPointerDown={onPD}
        active={active}
      />
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          opacity: 0.75,
          lineHeight: 0,
          display: "flex",
        }}
      >
        <ADn />
      </button>
    </div>
  );
}
function StepSlider({ steps, labels, value, onChange, height = 140, active }) {
  const ref = useRef(null);
  const n = steps - 1;
  const pct = n === 0 ? 0 : (value / n) * 100;
  const marks = labels.slice(1, -1).map((_, i) => ((i + 1) / n) * 100);
  const getS = useCallback(
    (y) => {
      const r = ref.current.getBoundingClientRect();
      return Math.round(
        (1 - Math.max(0, Math.min(1, (y - r.top) / r.height))) * n
      );
    },
    [n]
  );
  const onPD = (e) => {
    e.preventDefault();
    onChange(getS(e.clientY));
    const mv = (ev: PointerEvent) => onChange(getS(ev.clientY));
    const up = () => {
      window.removeEventListener("pointermove", mv);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: ARR_GAP,
      }}
    >
      <div style={{ width: 28, display: "flex", justifyContent: "center" }}>
        <button
          onClick={() => onChange(Math.min(n, value + 1))}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            opacity: 0.75,
            lineHeight: 0,
            display: "flex",
          }}
        >
          <AUp />
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ position: "relative", height, width: 20 }}>
          {labels
            .slice()
            .reverse()
            .map((l, i) => {
              const p = n === 0 ? 0 : ((n - i) / n) * 100;
              return (
                <span
                  key={i}
                  style={{
                    fontSize: 9,
                    color: TEXT_SEC,
                    lineHeight: 1,
                    fontFamily: "'Poppins',sans-serif",
                    position: "absolute",
                    right: 0,
                    bottom: p + "%",
                    transform: "translateY(50%)",
                  }}
                >
                  {l}
                </span>
              );
            })}
        </div>
        <Track
          pct={pct}
          height={height}
          marks={marks}
          trackRef={ref}
          onPointerDown={onPD}
          active={active}
        />
      </div>
      <div style={{ width: 28, display: "flex", justifyContent: "center" }}>
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            opacity: 0.75,
            lineHeight: 0,
            display: "flex",
          }}
        >
          <ADn />
        </button>
      </div>
    </div>
  );
}
function Val({ children, active, fs }) {
  return (
    <span
      style={{
        fontFamily: "'Poppins',sans-serif",
        fontSize: fs || 12,
        fontWeight: 600,
        color: active ? ACCENT : TEXT_SEC,
        letterSpacing: 0.5,
      }}
    >
      {children}
    </span>
  );
}
function TempTrack({ value, onChange, active }) {
  const ref = useRef(null);
  const pct = tempToPct(value);
  const getV = useCallback((y) => {
    const r = ref.current.getBoundingClientRect();
    const p = (1 - Math.max(0, Math.min(1, (y - r.top) / r.height))) * 100;
    return Math.max(
      TEMP_MIN,
      Math.min(TEMP_MAX, Math.round(pctToTemp(p) / 2) * 2)
    );
  }, []);
  const onPD = (e) => {
    e.preventDefault();
    onChange(getV(e.clientY));
    const mv = (ev: PointerEvent) => onChange(getV(ev.clientY));
    const up = () => {
      window.removeEventListener("pointermove", mv);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
  };
  return (
    <div
      ref={ref}
      onPointerDown={onPD}
      style={{
        position: "relative",
        width: 28,
        height: 140,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 10,
          background: TRACK_BG,
          borderRadius: 99,
        }}
      />
      <TrackFill pct={pct} active={active} />
      {tempMarks.map((p, i) => (
        <TickMark key={i} p={p} pct={pct} />
      ))}
      <Thumb pct={pct} />
    </div>
  );
}
function DividerHighlights() {
  const p = 8,
    g = 8,
    gw = BW * 3 + p * 2 + g * 2,
    gh = BH * 2 + p * 2 + g,
    vx1 = p + BW + g / 2,
    vx2 = p + BW * 2 + g + g / 2,
    hy = p + BH + g / 2;
  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        overflow: "hidden",
        borderRadius: 16,
      }}
      width={gw}
      height={gh}
    >
      <defs>
        <filter id="gblur" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <linearGradient id="vg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
        <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
      </defs>
      <rect
        x={vx1 - 3}
        y={2}
        width={6}
        height={gh - 4}
        rx={3}
        fill="url(#vg)"
        filter="url(#gblur)"
      />
      <rect
        x={vx2 - 3}
        y={2}
        width={6}
        height={gh - 4}
        rx={3}
        fill="url(#vg)"
        filter="url(#gblur)"
      />
      <rect
        x={2}
        y={hy - 3}
        width={gw - 4}
        height={6}
        rx={3}
        fill="url(#hg)"
        filter="url(#gblur)"
      />
      <rect
        x={0}
        y={-3}
        width={gw}
        height={6}
        rx={3}
        fill="url(#hg)"
        filter="url(#gblur)"
      />
      <rect
        x={0}
        y={gh - 3}
        width={gw}
        height={6}
        rx={3}
        fill="url(#hg)"
        filter="url(#gblur)"
      />
      <rect
        x={-3}
        y={0}
        width={6}
        height={gh}
        rx={3}
        fill="url(#vg)"
        filter="url(#gblur)"
      />
      <rect
        x={gw - 3}
        y={0}
        width={6}
        height={gh}
        rx={3}
        fill="url(#vg)"
        filter="url(#gblur)"
      />
    </svg>
  );
}
function SWHighlights() {
  const W = SW_W + 16,
    H = SW_H + 16;
  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: W,
        height: H,
        pointerEvents: "none",
        zIndex: 10,
        borderRadius: 18,
        overflow: "hidden",
      }}
      width={W}
      height={H}
    >
      <defs>
        <filter id="swblur" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <linearGradient id="sw_hg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(220,230,255,0.75)" />
          <stop offset="100%" stopColor="rgba(220,230,255,0.75)" />
        </linearGradient>
        <linearGradient id="sw_vg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(220,230,255,0.45)" />
          <stop offset="100%" stopColor="rgba(220,230,255,0.45)" />
        </linearGradient>
      </defs>
      <rect
        x={4}
        y={-0.5}
        width={W - 8}
        height={1}
        rx={0.5}
        fill="url(#sw_hg)"
        filter="url(#swblur)"
      />
      <rect
        x={4}
        y={H - 0.5}
        width={W - 8}
        height={1}
        rx={0.5}
        fill="url(#sw_hg)"
        filter="url(#swblur)"
      />
      <rect
        x={-0.5}
        y={4}
        width={1}
        height={H - 8}
        rx={0.5}
        fill="url(#sw_vg)"
        filter="url(#swblur)"
      />
      <rect
        x={W - 0.5}
        y={4}
        width={1}
        height={H - 8}
        rx={0.5}
        fill="url(#sw_vg)"
        filter="url(#swblur)"
      />
    </svg>
  );
}

function AnimatedMap({
  chips,
  tempMode,
  tL,
  fanMode,
  muted,
  sosH,
  sosC,
  sosPulse,
  sosCount,
  startSos,
  cancelSos,
  setSosC,
}) {
  const canvasRef = useRef(null);
  const scrollRef = useRef(0);
  const rafRef = useRef(null);
  const lastRef = useRef(null);
  const speedPhaseRef = useRef(0);
  const [distStep, setDistStep] = useState(0);
  const [displaySpeed, setDisplaySpeed] = useState(25);
  const timerRef = useRef(null);
  useEffect(() => {
    function sched(step) {
      const delay = step <= 18 ? 6000 : step <= 23 ? 2000 : 1500;
      timerRef.current = setTimeout(() => {
        const next = step >= 24 ? 0 : step + 1;
        setDistStep(next);
        sched(next);
      }, delay);
    }
    sched(0);
    return () => clearTimeout(timerRef.current);
  }, []);
  useEffect(() => {
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = SW_W * dpr;
    canvas.height = SW_H * dpr;
    canvas.style.width = SW_W + "px";
    canvas.style.height = SW_H + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const W = SW_W,
      H = SW_H,
      LABEL_HALF = 60,
      VGAP = 5,
      V_CYCLE = H + LABEL_HALF + VGAP,
      vScrollRate = 20;
    function hSY(scroll, i) {
      const worldY = i * CELL_H;
      const raw =
        (((worldY - scroll) % TOTAL_CYCLE) + TOTAL_CYCLE) % TOTAL_CYCLE;
      return raw < TOTAL_CYCLE / 2
        ? ARROW_Y - raw
        : ARROW_Y + (TOTAL_CYCLE - raw);
    }
    function draw(ts) {
      if (!lastRef.current) lastRef.current = ts;
      const dt = (ts - lastRef.current) / 1000;
      lastRef.current = ts;
      scrollRef.current += MAP_SPEED * dt;
      speedPhaseRef.current += dt * 0.3;
      const rawSpd =
        25.5 +
        1.2 * Math.sin(speedPhaseRef.current) +
        0.8 * Math.sin(speedPhaseRef.current * 1.7 + 1.3) +
        0.5 * Math.sin(speedPhaseRef.current * 2.6 + 0.7);
      setDisplaySpeed(Math.min(27, Math.max(24, Math.round(rawSpd))));
      const scroll = scrollRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(MAP_ZOOM, MAP_ZOOM);
      ctx.translate(-W / 2, -H / 2);
      ctx.fillStyle = "#0f1520";
      ctx.fillRect(-W, -H, W * 3, H * 3);
      ctx.fillStyle = "#141c2a";
      ctx.fillRect(-W, -H, V_ROAD_XS[0] + W, H * 3);
      for (let i = 0; i < N_VCOLS - 1; i++)
        ctx.fillRect(
          V_ROAD_XS[i] + ROAD_W,
          -H,
          V_ROAD_XS[i + 1] - (V_ROAD_XS[i] + ROAD_W),
          H * 3
        );
      ctx.fillRect(V_ROAD_XS[N_VCOLS - 1] + ROAD_W, -H, W * 2, H * 3);
      for (let i = 0; i < N_STREETS * 3; i++) {
        const sY = hSY(scroll, i);
        if (sY < -60 || sY > H + 60) continue;
        const rw = STREET_SEQ[i % N_STREETS].major ? 20 : ROAD_W;
        ctx.fillStyle = "#253045";
        ctx.fillRect(-W, sY - rw / 2, W * 3, rw);
      }
      ctx.fillStyle = "#253045";
      V_ROAD_XS.forEach((x) => ctx.fillRect(x, -H, ROAD_W, H * 3));
      ctx.save();
      ctx.font = "600 9px 'Exo 2', sans-serif";
      ctx.fillStyle = "#8a9bb5";
      ctx.textAlign = "center";
      ctx.letterSpacing = "1px";
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.clip();
      V_LABELS.forEach((lbl) => {
        const phase = lbl.worldY % V_CYCLE;
        const raw =
          (scrollRef.current * vScrollRate) / (vScrollRate + 2) + phase;
        const pos = ((raw % V_CYCLE) + V_CYCLE) % V_CYCLE;
        if (pos >= H + LABEL_HALF) return;
        ctx.save();
        ctx.translate(lbl.cx, pos - BLOCK_SIZE / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(lbl.name, 0, 3);
        ctx.restore();
      });
      ctx.restore();
      ctx.save();
      ctx.font = "600 9px 'Exo 2', sans-serif";
      ctx.fillStyle = "#8a9bb5";
      ctx.letterSpacing = "0.5px";
      for (let i = 0; i < N_STREETS * 3; i++) {
        const sY = hSY(scroll, i);
        if (sY < -20 || sY > H + 20) continue;
        const idx = i % N_STREETS;
        if (idx % 2 === 0) {
          ctx.textAlign = "right";
          ctx.fillText(STREET_SEQ[idx].name, ROUTE_X - 135, sY + 3.5);
        } else {
          ctx.textAlign = "left";
          ctx.fillText(STREET_SEQ[idx].name, ROUTE_X + 143, sY + 3.5);
        }
      }
      ctx.restore();
      ctx.restore();
      ctx.fillStyle = "#4a9eff";
      ctx.fillRect(ROUTE_X, 0, 6, H);
      const carW = 40,
        carH = 40,
        carX = ROUTE_X + 3 - carW / 2,
        carY = ARROW_Y - carH / 2,
        sx = carW / 479.885,
        sy = carH / 479.885;
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;
      ctx.translate(carX + carW / 2, carY + carH / 2);
      ctx.scale(sx, -sy);
      ctx.translate(-479.885 / 2, -479.885 / 2);
      const lw = 22;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "white";
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.moveTo(388.431, 273.293);
      ctx.bezierCurveTo(386.23, 271.803, 383.433, 271.503, 380.967, 272.493);
      ctx.lineTo(347.807, 285.757);
      ctx.lineTo(343.943, 239.917);
      ctx.lineTo(355.399, 103.117);
      ctx.bezierCurveTo(358.507, 67.299, 339.314, 33.246, 307.063, 17.357);
      ctx.lineTo(300.743, 14.213);
      ctx.bezierCurveTo(262.425, -4.738, 217.461, -4.738, 179.143, 14.213);
      ctx.lineTo(172.831, 17.357);
      ctx.bezierCurveTo(140.568, 33.236, 121.361, 67.292, 124.463, 103.117);
      ctx.lineTo(135.943, 239.917);
      ctx.lineTo(132.103, 285.789);
      ctx.lineTo(98.943, 272.525);
      ctx.bezierCurveTo(94.847, 270.868, 90.184, 272.845, 88.527, 276.941);
      ctx.bezierCurveTo(88.144, 277.887, 87.946, 278.897, 87.943, 279.917);
      ctx.lineTo(87.943, 301.085);
      ctx.bezierCurveTo(87.912, 310.91, 93.898, 319.752, 103.031, 323.373);
      ctx.lineTo(128.095, 333.397);
      ctx.lineTo(124.743, 373.221);
      ctx.bezierCurveTo(121.59, 410.893, 142.981, 446.331, 177.783, 461.093);
      ctx.lineTo(205.271, 472.829);
      ctx.bezierCurveTo(227.417, 482.237, 252.437, 482.237, 274.583, 472.829);
      ctx.lineTo(302.071, 461.093);
      ctx.bezierCurveTo(336.886, 446.342, 358.291, 410.901, 355.143, 373.221);
      ctx.lineTo(351.807, 333.397);
      ctx.lineTo(376.871, 323.373);
      ctx.bezierCurveTo(385.998, 319.747, 391.976, 310.906, 391.943, 301.085);
      ctx.lineTo(391.943, 279.917);
      ctx.bezierCurveTo(391.943, 277.263, 390.628, 274.782, 388.431, 273.293);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = lw;
      ctx.stroke();
      ctx.shadowColor = "transparent";
      ctx.beginPath();
      ctx.moveTo(302.191, 105.741);
      ctx.lineTo(297.167, 135.917);
      ctx.lineTo(182.719, 135.917);
      ctx.lineTo(177.687, 105.733);
      ctx.bezierCurveTo(177.129, 102.393, 178.735, 99.064, 181.695, 97.421);
      ctx.lineTo(197.207, 88.805);
      ctx.bezierCurveTo(223.761, 73.949, 256.125, 73.949, 282.679, 88.805);
      ctx.lineTo(298.191, 97.421);
      ctx.bezierCurveTo(301.14, 99.078, 302.738, 102.402, 302.191, 105.741);
      ctx.closePath();
      ctx.fillStyle = "#111";
      ctx.fill();
      ctx.lineWidth = lw;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(299.495, 334.157);
      ctx.lineTo(297.471, 335.501);
      ctx.bezierCurveTo(262.63, 358.709, 217.256, 358.709, 182.415, 335.501);
      ctx.lineTo(180.399, 334.165);
      ctx.bezierCurveTo(177.934, 332.524, 176.576, 329.656, 176.871, 326.709);
      ctx.lineTo(183.183, 263.813);
      ctx.lineTo(296.743, 263.813);
      ctx.lineTo(303.055, 326.717);
      ctx.bezierCurveTo(303.336, 329.665, 301.967, 332.527, 299.495, 334.157);
      ctx.closePath();
      ctx.fillStyle = "#111";
      ctx.fill();
      ctx.lineWidth = lw;
      ctx.stroke();
      ctx.save();
      ctx.translate(175.92 + 8, 371.044 + 28.844);
      ctx.rotate(-Math.atan2(-0.5547, 0.832));
      ctx.fillStyle = "#111";
      ctx.fillRect(-4, -14, 8, 28);
      ctx.lineWidth = lw * 0.5;
      ctx.strokeRect(-4, -14, 8, 28);
      ctx.restore();
      ctx.save();
      ctx.translate(267.165 + 28.8475, 392.063 + 8.001);
      ctx.rotate(-Math.atan2(-0.8319, 0.5549));
      ctx.fillStyle = "#111";
      ctx.fillRect(-14, -4, 28, 8);
      ctx.lineWidth = lw * 0.5;
      ctx.strokeRect(-14, -4, 28, 8);
      ctx.restore();
      ctx.restore();
      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: SW_W,
        height: SW_H,
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        width={SW_W}
        height={SW_H}
        style={{ display: "block", borderRadius: 10 }}
      />
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          background: "rgba(10,12,18,0.92)",
          borderRadius: 10,
          padding: "13px 11px 13px",
          border: "1px solid rgba(255,255,255,0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            marginLeft: -8,
          }}
        >
          <svg
            width="31"
            height="31"
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            fill={TEXT_PRIMARY}
            style={{ position: "relative", top: 1 }}
          >
            <path d="m45.7031 22.9487a4.0007 4.0007 0 0 1 -5.6518-.2456l-4.0513-4.4198v37.7167a4 4 0 0 1 -8 0v-37.7167l-4.0513 4.42a4 4 0 0 1 -5.8974-5.4062l11-12a4.0006 4.0006 0 0 1 5.8974 0l11 12a4 4 0 0 1 -.2456 5.6516z" />
          </svg>
          <div style={{ marginLeft: -10, marginTop: -2 }}>
            <div
              style={{
                fontFamily: "'Exo 2',sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: TEXT_PRIMARY,
                letterSpacing: 0.5,
                position: "relative",
                top: 1,
              }}
            >
              {getDistLabel(distStep)}
            </div>
            <div
              style={{
                fontFamily: "'Exo 2',sans-serif",
                fontSize: 10,
                color: TEXT_PRIMARY,
                letterSpacing: 0.25,
                marginTop: 5,
              }}
            >
              Continue on Lake Ave
            </div>
          </div>
        </div>
      </div>
      {chips.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 13,
            right: 14,
            display: "flex",
            gap: 5,
          }}
        >
          {chips.map((c, i) => (
            <div
              key={i}
              style={{
                width: 30,
                height: 30,
                background: "rgba(10,12,18,0.92)",
                borderRadius: 7,
                boxShadow: `0 0 0 1px ${c.glow}, 0 0 8px 3px ${c.glow}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
              }}
            >
              {c.icon}
              <span
                style={{
                  fontFamily: "'Exo 2',sans-serif",
                  fontSize: 6,
                  fontWeight: 700,
                  color: TEXT_PRIMARY,
                  letterSpacing: 0.3,
                }}
              >
                {c.label}
              </span>
            </div>
          ))}
        </div>
      )}
      <div
        style={{
          position: "absolute",
          top: 49,
          right: 13,
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(10,12,18,0.92)",
          borderRadius: 8,
          padding: "3px 8px",
          border: "1px solid rgba(255,255,255,0.25)",
          width: 68,
          boxSizing: "border-box",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "'Exo 2',sans-serif",
            fontSize: 14,
            fontWeight: 700,
            color: TEXT_PRIMARY,
            marginLeft: -1,
          }}
        >
          {tempMode === "OFF" ? "70°F" : tL}
        </span>
        <div
          style={{
            opacity: fanMode === "OFF" ? 0.3 : 1,
            transition: "opacity 0.2s",
            position: "relative",
            top: 1.75,
          }}
        >
          <FanSVG s={15} />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: 12,
          display: "flex",
          alignItems: "baseline",
          background: "rgba(10,12,18,0.92)",
          borderRadius: 8,
          padding: "6px 9px 8px",
          border: "1px solid rgba(255,255,255,0.25)",
          gap: 0,
          transform: "scale(1.07)",
          transformOrigin: "bottom left",
        }}
      >
        <div
          style={{ lineHeight: 0, position: "relative", top: 3, marginLeft: 1 }}
        >
          <SpeedSVG s={21} />
        </div>
        <span
          style={{
            fontFamily: "'Exo 2',sans-serif",
            fontSize: 20,
            fontWeight: 700,
            color: TEXT_PRIMARY,
            marginLeft: 7,
          }}
        >
          {displaySpeed}
        </span>
        <span
          style={{
            fontFamily: "'Exo 2',sans-serif",
            fontSize: 10,
            color: TEXT_PRIMARY,
            marginLeft: 3,
          }}
        >
          MPH
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 12,
          right: 13,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 3,
          transform: "scale(0.92)",
          transformOrigin: "bottom right",
        }}
      >
        <div style={{ height: 16, display: "flex", alignItems: "center" }}>
          {sosH && (
            <span
              style={{
                fontFamily: "'Exo 2',sans-serif",
                fontSize: 10,
                color: TEXT_SEC,
                letterSpacing: 1,
              }}
            >
              HOLD {sosCount}s
            </span>
          )}
        </div>
        {sosC ? (
          <div
            style={{
              height: 32,
              background: "rgba(255,74,74,0.22)",
              border: "1.5px solid #ff4a4a",
              borderRadius: 7,
              padding: "0 12px",
              display: "flex",
              gap: 8,
              alignItems: "center",
              boxSizing: "border-box",
              boxShadow: `0 0 0 1.5px #ff4a4a, 0 0 ${
                sosPulse ? "19px" : "12px"
              } rgba(255,74,74,${sosPulse ? "0.8" : "0.45"})`,
              transition: "box-shadow 0.15s ease",
            }}
          >
            <span
              style={{
                fontFamily: "'Exo 2',sans-serif",
                fontSize: 12,
                fontWeight: 700,
                color: "#ff4a4a",
              }}
            >
              CALLING...
            </span>
            <button
              onClick={() => setSosC(false)}
              style={{
                fontSize: 9,
                background: "none",
                border: "1px solid #ff4a4a",
                color: "#ff4a4a",
                borderRadius: 4,
                padding: "1px 6px",
                cursor: "pointer",
                fontFamily: "'Exo 2',sans-serif",
              }}
            >
              END
            </button>
          </div>
        ) : (
          <button
            onMouseDown={startSos}
            onMouseUp={cancelSos}
            onMouseLeave={cancelSos}
            onTouchStart={startSos}
            onTouchEnd={cancelSos}
            style={{
              height: 32,
              padding: "0 12px",
              border: "1px solid #ff4a4a",
              borderRadius: 7,
              background: sosH ? "rgba(255,74,74,0.2)" : "rgba(255,74,74,0.15)",
              color: "#ff4a4a",
              fontFamily: "'Exo 2',sans-serif",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              letterSpacing: 2,
              transition: "box-shadow 0.25s ease",
              boxSizing: "border-box",
              boxShadow: sosH
                ? `0 0 0 1.5px #ff4a4a, 0 0 ${
                    sosPulse ? "19px" : "12px"
                  } rgba(255,74,74,${sosPulse ? "0.8" : "0.45"})`
                : "none",
            }}
          >
            <span style={{ position: "relative", left: 1, top: -1 }}>SOS</span>
          </button>
        )}
      </div>
    </div>
  );
}

const wL = ["OFF", "LOW", "MED", "HIGH"],
  fL = ["OFF", "1", "2", "3", "4", "5"],
  sL = ["OFF", "1", "2", "3"];
const modeLabel = (m) => (m === 1 ? "DEFROST" : m === 2 ? "DEFOG" : "OFF");
const modeLabelShort = (m) => (m === 1 ? "DEF" : m === 2 ? "FOG" : "OFF");
const modeLabelColor = (m) =>
  m === 1 ? "#ff4a4a" : m === 2 ? ACCENT : TEXT_SEC;

const TBOX: React.CSSProperties = {
  background: "rgba(10,14,24,0.78)",
  border: "1px solid rgba(74,159,255,0.35)",
  borderRadius: 10,
  padding: "13px 15px",
  display: "inline-flex",
  flexDirection: "column",
  pointerEvents: "auto",
};
const THEAD: React.CSSProperties = {
  fontFamily: "'Exo 2',sans-serif",
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: 1,
  color: ACCENT,
  textTransform: "uppercase",
  marginBottom: 6,
};
const TBODY: React.CSSProperties = {
  fontFamily: "'Poppins',sans-serif",
  fontWeight: 400,
  fontSize: 11.5,
  color: "rgba(240,240,240,0.88)",
  lineHeight: 1.55,
};
const BZ = "rgba(74,159,255,0.13)";
const BD = "1px dashed rgba(74,159,255,0.4)";
const BS = "1px solid rgba(74,159,255,0.2)";
const ZL: React.CSSProperties = {
  fontFamily: "'Exo 2',sans-serif",
  fontSize: 8,
  fontWeight: 700,
  color: ACCENT,
  letterSpacing: 1,
};
const ZLS: React.CSSProperties = {
  fontFamily: "'Exo 2',sans-serif",
  fontSize: 7,
  fontWeight: 700,
  color: ACCENT,
  letterSpacing: 0.8,
};
const togglePill: React.CSSProperties = {
  background: "rgba(10,14,24,0.72)",
  border: "1px solid rgba(74,159,255,0.35)",
  borderRadius: 8,
  padding: "2px 6px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

function TapZoneOverlay({ gridRef, layoutRef }) {
  const [rect, setRect] = useState(null);
  useEffect(() => {
    if (!gridRef.current) return;
    const r = gridRef.current.getBoundingClientRect();
    const pr = layoutRef.current.getBoundingClientRect();
    setRect({
      top: r.top - pr.top,
      left: r.left - pr.left,
      width: r.width,
      height: r.height,
    });
  }, []);
  if (!rect) return null;
  const scale = rect.width / (BW * 3 + 32);
  const H = 52 * scale,
    MH = (BH - 52 * 2) * scale,
    iconW = Math.round(BW * 0.55 * scale);
  return (
    <div
      style={{
        position: "absolute",
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        zIndex: 201,
        pointerEvents: "none",
      }}
    >
      {[
        { type: "icon-left" },
        { type: "lr-split" },
        { type: "icon-left" },
        { type: "full-toggle" },
        { type: "dual-slider" },
        { type: "icon-left" },
      ].map((b, i) => {
        const col = i % 3,
          row = Math.floor(i / 3),
          x = 8 + col * (BW + 8),
          y = 8 + row * (BH + 8);
        const wrap: React.CSSProperties = {
          position: "absolute",
          left: x * scale,
          top: y * scale,
          width: BW * scale,
          height: BH * scale,
          borderRadius: 12,
          overflow: "hidden",
          border: BS,
        };
        if (b.type === "full-toggle")
          return (
            <div key={i} style={wrap}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: BZ,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ ...ZL, ...togglePill }}>TOGGLE</span>
              </div>
            </div>
          );
        if (b.type === "lr-split")
          return (
            <div key={i} style={wrap}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  right: "50%",
                  background: BZ,
                  borderRight: BS,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ ...ZL, ...togglePill }}>TOGGLE</span>
              </div>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  left: "50%",
                  background: BZ,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ ...ZL, ...togglePill }}>TOGGLE</span>
              </div>
            </div>
          );
        if (b.type === "dual-slider")
          return (
            <div key={i} style={wrap}>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "50%",
                  height: H,
                  background: BZ,
                  borderBottom: BD,
                  borderRight: BS,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ ...ZL, ...togglePill }}>UP</span>
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "50%",
                  height: H,
                  background: BZ,
                  borderBottom: BD,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ ...ZL, ...togglePill }}>UP</span>
              </div>
              <div
                style={{
                  position: "absolute",
                  top: H,
                  left: 0,
                  width: "27%",
                  height: MH,
                  background: BZ,
                  borderRight: BS,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ ...ZLS, ...togglePill }}>TOGGLE</span>
              </div>
              <div
                style={{
                  position: "absolute",
                  top: H,
                  left: "52%",
                  width: "20%",
                  height: MH,
                  background: BZ,
                  borderLeft: BS,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ ...ZLS, ...togglePill }}>TOGGLE</span>
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "50%",
                  height: H,
                  background: BZ,
                  borderTop: BD,
                  borderRight: BS,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ ...ZL, ...togglePill }}>DOWN</span>
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: "50%",
                  height: H,
                  background: BZ,
                  borderTop: BD,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ ...ZL, ...togglePill }}>DOWN</span>
              </div>
            </div>
          );
        return (
          <div key={i} style={wrap}>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: H,
                background: BZ,
                borderBottom: BD,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ ...ZL, ...togglePill }}>UP</span>
            </div>
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: H,
                background: BZ,
                borderTop: BD,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ ...ZL, ...togglePill }}>DOWN</span>
            </div>
            <div
              style={{
                position: "absolute",
                top: H,
                left: 0,
                width: iconW,
                height: MH,
                background: BZ,
                borderRight: BS,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ ...ZL, ...togglePill }}>TOGGLE</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── AnimatedStep: handles entrance and exit fades for tutorial content ──
function AnimatedStep({ children, stepKey, exiting }) {
  const [displayed, setDisplayed] = useState(children);
  const [phase, setPhase] = useState("entering");
  const timerRef = useRef(null);
  const isFirst = useRef(true);

  useEffect(() => {
    if (exiting) {
      clearTimeout(timerRef.current);
      setPhase("fading");
      return;
    }
    if (isFirst.current) {
      isFirst.current = false;
      timerRef.current = setTimeout(() => setPhase("visible"), 10);
      return () => clearTimeout(timerRef.current);
    }
    clearTimeout(timerRef.current);
    setPhase("fading");
    timerRef.current = setTimeout(() => {
      setDisplayed(children);
      setPhase("visible");
    }, 180);
    return () => clearTimeout(timerRef.current);
  }, [stepKey, exiting]);

  return (
    <div
      style={{
        opacity: phase === "visible" ? 1 : 0,
        transform:
          phase === "entering" ? "translateY(10px)" : "translateY(0px)",
        transition:
          phase === "visible" && !isFirst.current
            ? "opacity 0.2s ease-out"
            : phase === "entering" || (phase === "visible" && isFirst.current)
            ? "opacity 0.22s ease-out, transform 0.22s ease-out"
            : "opacity 0.12s ease-in",
        pointerEvents: phase === "visible" ? "auto" : "none",
        position: "relative",
        zIndex: 200,
      }}
    >
      {displayed}
    </div>
  );
}

function Tutorial({
  step,
  exiting,
  onNext,
  onBack,
  onExit,
  gridRef,
  swRef,
  ccRef,
  layoutRef,
}) {
  if (step === 0 && !exiting) return null;

  // Nav bar fades in sync with AnimatedStep using same delay + duration
  const [navVisible, setNavVisible] = useState(false);
  useEffect(() => {
    if (exiting) {
      setNavVisible(false);
      return;
    }
    const t = setTimeout(() => setNavVisible(true), 10);
    return () => clearTimeout(t);
  }, [exiting]);

  function useRefRect(ref) {
    const [rect, setRect] = useState(null);
    useEffect(() => {
      if (!ref?.current) return;
      const el = ref.current;
      const pr = el.offsetParent?.getBoundingClientRect() || {
        top: 0,
        left: 0,
      };
      const r = el.getBoundingClientRect();
      setRect({
        top: r.top - pr.top,
        left: r.left - pr.left,
        width: r.width,
        height: r.height,
      });
    }, []);
    return rect;
  }

  const overlay: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    zIndex: 200,
    pointerEvents: "none",
  };
  const navBar: React.CSSProperties = {
    position: "fixed",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 300,
    display: "flex",
    alignItems: "center",
    gap: 16,
    background: "rgba(10,14,24,0.97)",
    border: "1px solid rgba(74,159,255,0.25)",
    borderRadius: 30,
    padding: "8px 18px",
    pointerEvents: exiting ? "none" : "auto",
    boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
    opacity: exiting ? 0 : navVisible ? 1 : 0,
    transition: exiting ? "opacity 0.2s ease-in" : "opacity 0.22s ease-out",
};
  const navBtn: React.CSSProperties = {
    background: "none",
    border: "1px solid rgba(74,159,255,0.4)",
    color: ACCENT,
    fontFamily: "'Exo 2',sans-serif",
    fontWeight: 700,
    fontSize: 10,
    letterSpacing: 1.5,
    padding: "5px 14px",
    borderRadius: 20,
    cursor: "pointer",
  };
  const dot = (a) => ({
    width: a ? 18 : 6,
    height: 6,
    borderRadius: 3,
    background: a ? ACCENT : "rgba(74,159,255,0.3)",
    transition: "width 0.2s",
  });

  function Step1() {
    const sw = useRefRect(swRef);
    const cc = useRefRect(ccRef);
    return (
      <div style={overlay}>
        {sw && cc && (
          <div
            style={{
              position: "absolute",
              top: sw.top + sw.height + 21,
              left: sw.left + 39,
              zIndex: 201,
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <div style={{ ...TBOX, maxWidth: 180 }}>
              <div style={THEAD}>Driving Mode Interface</div>
              <div style={TBODY}>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 5 }}
                >
                  <div>
                    Demonstrates a two-screen vehicle interface designed to
                    reduce visual attention demand while driving.
                  </div>
                  <div>
                    • <b>Note that the dividers between blocks are physical:</b>{" "}
                    in the production version, they extend above the screen
                    surface, allowing drivers to locate controls by touch
                  </div>
                </div>
              </div>
            </div>
            <div style={{ ...TBOX, maxWidth: 165, position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  top: -11,
                  left: 16,
                  width: 20,
                  height: 20,
                  background: "rgba(10,14,24,0.78)",
                  border: "1.5px solid rgba(74,159,255,0.35)",
                  borderRight: "none",
                  borderBottom: "none",
                  transform: "rotate(45deg)",
                  borderRadius: "2px 0 0 0",
                }}
              />
              <div style={THEAD}>Steering Wheel Display</div>
              <div style={TBODY}>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 5 }}
                >
                  <div>• Positioned directly within the driver's sightline</div>
                  <div>
                    • Shows real-time navigation, current speed, and the status
                    of important systems
                  </div>
                </div>
              </div>
            </div>
            <div style={{ ...TBOX, maxWidth: 151, position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  right: -11,
                  width: 20,
                  height: 20,
                  background: "rgba(10,14,24,0.78)",
                  border: "1.5px solid rgba(74,159,255,0.35)",
                  borderLeft: "none",
                  borderBottom: "none",
                  transform: "rotate(45deg)",
                  borderRadius: "0 2px 0 0",
                }}
              />
              <div style={THEAD}>Center Console</div>
              <div style={TBODY}>
                Main control surface, organized into six blocks:
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  {[
                    "Wipers",
                    "Front/Rear Defroster & Defogger",
                    "Volume",
                    "Headlights",
                    "Temperature & Fan",
                    "Seat Heater",
                  ].map((name, i) => (
                    <div key={i} style={{ display: "flex", gap: 8 }}>
                      <span
                        style={{
                          color: ACCENT,
                          minWidth: 14,
                          fontFamily: "'Exo 2',sans-serif",
                          fontSize: 11,
                        }}
                      >
                        {i + 1}.
                      </span>
                      <span>{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function Step2() {
    const sw = useRefRect(swRef);
    return (
      <div style={overlay}>
        {sw && (
          <div
            style={{
              position: "absolute",
              top: sw.top + sw.height + 21,
              left: sw.left + 276,
              zIndex: 201,
              ...TBOX,
              minWidth: 347,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 16,
                right: -11,
                width: 20,
                height: 20,
                background: "rgba(10,14,24,0.78)",
                border: "1.5px solid rgba(74,159,255,0.35)",
                borderLeft: "none",
                borderBottom: "none",
                transform: "rotate(45deg)",
                borderRadius: "0 2px 0 0",
              }}
            />
            <div style={THEAD}>Toggling</div>
            <div style={TBODY}>
              Controls cycle through states with each tap:
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  marginTop: 6,
                }}
              >
                <div>
                  • <span style={{ fontWeight: 600 }}>Wipers:</span> AUTO → ON →
                  OFF → AUTO
                </div>
                <div>
                  • <span style={{ fontWeight: 600 }}>Front/Rear Window:</span>{" "}
                  OFF → DEFROST → DEFOG → OFF
                </div>
                <div>
                  • <span style={{ fontWeight: 600 }}>Headlights:</span> AUTO →
                  ON → OFF → AUTO
                </div>
                <div>
                  • <span style={{ fontWeight: 600 }}>Temperature & Fan:</span>{" "}
                  AUTO → ON → OFF → AUTO
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function Step3() {
    const sw = useRefRect(swRef);
    return (
      <div style={overlay}>
        <TapZoneOverlay gridRef={ccRef} layoutRef={layoutRef} />
        {sw && (
          <div
            style={{
              position: "absolute",
              top: sw.top + sw.height + 21,
              left: sw.left + 330,
              zIndex: 202,
              ...TBOX,
              maxWidth: 300,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 16,
                right: -11,
                width: 20,
                height: 20,
                background: "rgba(10,14,24,0.78)",
                border: "1.5px solid rgba(74,159,255,0.35)",
                borderLeft: "none",
                borderBottom: "none",
                transform: "rotate(45deg)",
                borderRadius: "0 2px 0 0",
              }}
            />
            <div style={THEAD}>Tap Zones</div>
            <div style={TBODY}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <div>• "Tap zones" minimize the need for precise input</div>
                <div>• Top and bottom edges step the slider up or down</div>
                <div>• Tapping the icon area toggles the function's state</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function Step4() {
    const sw = useRefRect(swRef);
    return (
      <div style={overlay}>
        {sw && (
          <div
            style={{
              position: "absolute",
              top: sw.top + sw.height + 21,
              left: sw.left + 273,
              zIndex: 201,
              ...TBOX,
              maxWidth: 350,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -11,
                right: 16,
                width: 20,
                height: 20,
                background: "rgba(10,14,24,0.78)",
                border: "1.5px solid rgba(74,159,255,0.35)",
                borderRight: "none",
                borderBottom: "none",
                transform: "rotate(45deg)",
                borderRadius: "2px 0 0 0",
              }}
            />
            <div style={THEAD}>SOS Button</div>
            <div style={TBODY}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <div>
                  • Located in the bottom-right of the steering wheel display
                </div>
                <div>
                  • Pressing and holding this button for 3 seconds contacts
                  emergency services; countdown appears while holding
                </div>
                <div>
                  • Tap <b>END</b> at any time to end the call
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function Step5() {
    const sw = useRefRect(swRef);
    return (
      <div style={overlay}>
        {sw && (
          <div
            style={{
              position: "absolute",
              top: sw.top + sw.height + 21,
              left: sw.left + 327,
              zIndex: 201,
              ...TBOX,
              maxWidth: 300,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -11,
                left: 16,
                width: 20,
                height: 20,
                background: "rgba(10,14,24,0.78)",
                border: "1.5px solid rgba(74,159,255,0.35)",
                borderRight: "none",
                borderBottom: "none",
                transform: "rotate(45deg)",
                borderRadius: "2px 0 0 0",
              }}
            />
            <div style={THEAD}>Status Chips</div>
            <div style={TBODY}>
              Steering wheel display shows small status chips for:
              <div
                style={{
                  marginTop: 6,
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  lineHeight: 1.4,
                }}
              >
                <div>
                  • Front/Rear <b>DEFROST</b> and <b>DEFOG</b>
                </div>
                <div>
                  • Volume <b>MUTE</b>
                </div>
                <div>
                  • Headlights <b>ON</b> and <b>OFF</b>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const stepComponents = [Step1, Step2, Step3, Step4, Step5];
  const Content = stepComponents[step - 1];
  return (
    <>
      <AnimatedStep stepKey={step} exiting={exiting}>
        <Content />
      </AnimatedStep>
      <div style={navBar}>
        <button
          onClick={onBack}
          disabled={step === 1}
          style={{ ...navBtn, opacity: step === 1 ? 0.3 : 1 }}
        >
          ❮ BACK
        </button>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={dot(i === step)} />
          ))}
        </div>
        {step < 5 ? (
          <button onClick={onNext} style={navBtn}>
            NEXT ❯
          </button>
        ) : (
          <button
            onClick={onExit}
            style={{ ...navBtn, borderColor: "rgba(74,159,255,0.7)" }}
          >
            DONE ✔
          </button>
        )}
      </div>
    </>
  );
}

const IMG_URL = carInterior;
const SW_IMG_LEFT = 163,
  SW_IMG_TOP = 110,
  SW_IMG_W = 486,
  SW_IMG_H = 242;
const CC_IMG_LEFT = 799,
  CC_IMG_TOP = 120,
  CC_IMG_W = 606,
  CC_IMG_H = 600;

function CarInterior({ swContent, ccContent }) {
  const swScale = SW_IMG_W / SW_W;
  const CC_NATIVE_W = BW * 3 + 32,
    CC_NATIVE_H = BH * 2 + 24;
  const ccScale = CC_IMG_W / CC_NATIVE_W;
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100vh - 85px)",
        borderRadius: 16,
        overflow: "hidden",
        background: "transparent",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 14,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontFamily: "'Exo 2',sans-serif",
            fontSize: 14,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: 0.5,
          }}
        >
          Best viewed at 100% zoom in a full browser window
        </span>
      </div>
      <img
        src={IMG_URL}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "top",
        }}
        alt=""
        onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
      />
      <div
        style={{
          position: "absolute",
          top: SW_IMG_TOP,
          left: SW_IMG_LEFT,
          width: SW_IMG_W,
          height: SW_IMG_H,
          borderRadius: 8,
          overflow: "hidden",
          zIndex: 1,
        }}
      >
        <div
          style={{
            transform: `scale(${swScale})`,
            transformOrigin: "top left",
            width: SW_W,
            height: SW_H,
          }}
        >
          {swContent}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: CC_IMG_TOP,
          left: CC_IMG_LEFT,
          width: CC_IMG_W,
          height: CC_IMG_H,
          borderRadius: 8,
          overflow: "hidden",
          zIndex: 1,
        }}
      >
        <div
          style={{
            transform: `scale(${ccScale})`,
            transformOrigin: "top left",
            width: CC_NATIVE_W,
            height: CC_NATIVE_H,
          }}
        >
          {ccContent}
        </div>
      </div>
    </div>
  );
}

function ViewToggle({ view, setView }) {
  const isInterior = view === "interior";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "rgba(15,18,28,0.9)",
        border: "1px solid rgba(74,159,255,0.2)",
        borderRadius: 30,
        padding: "6px 15px",
      }}
    >
      <span
        style={{
          fontFamily: "'Exo 2',sans-serif",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1.2,
          color: !isInterior ? ACCENT : "rgba(255,255,255,0.3)",
          transition: "color 0.2s",
        }}
      >
        SCREEN VIEW
      </span>
      <div
        onClick={() => setView(isInterior ? "screen" : "interior")}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          background: isInterior
            ? "rgba(74,159,255,0.2)"
            : "rgba(255,255,255,0.08)",
          border: `1px solid ${
            isInterior ? "rgba(74,159,255,0.5)" : "rgba(255,255,255,0.15)"
          }`,
          cursor: "pointer",
          position: "relative",
          transition: "all 0.3s",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 3,
            left: isInterior ? 21 : 3,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: isInterior ? ACCENT : "rgba(255,255,255,0.4)",
            transition: "left 0.3s, background 0.3s",
            boxShadow: isInterior ? `0 0 8px ${ACCENT}` : "none",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "'Exo 2',sans-serif",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1.2,
          color: isInterior ? ACCENT : "rgba(255,255,255,0.3)",
          transition: "color 0.2s",
        }}
      >
        INTERIOR VIEW
      </span>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    if (!document.querySelector('link[href*="Exo+2"]')) {
      const l = document.createElement("link");
      l.href =
        "https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700&family=Poppins:wght@300;400;500;600&display=swap";
      l.rel = "stylesheet";
      document.head.appendChild(l);
    }
  }, []);
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const [view, setView] = useState("screen");
  const [wiperMode, setWiperMode] = useState("AUTO");
  const [wS, setWS] = useState(AUTO_WIPER);
  const wP = useRef(AUTO_WIPER);
  const cycleWiperMode = () =>
    setWiperMode((v) => {
      if (v === "AUTO") return "ON";
      if (v === "ON") {
        wP.current = wS;
        setWS(0);
        return "OFF";
      }
      setWS(AUTO_WIPER);
      return "AUTO";
    });
  const stepW = (v) => {
    if (v > 0) {
      wP.current = v;
      setWS(v);
      setWiperMode("ON");
    } else {
      setWS(0);
      setWiperMode("OFF");
    }
  };
  const [fM, setFM] = useState(0),
    [rM, setRM] = useState(0);
  const [hl, setHl] = useState("AUTO");
  const hlCycle = () =>
    setHl((v) => (v === "AUTO" ? "ON" : v === "ON" ? "OFF" : "AUTO"));
  const [vol, setVol] = useState(50),
    [muted, setMuted] = useState(false);
  const [tempMode, setTempMode] = useState("AUTO"),
    [temp, setTemp] = useState(AUTO_TEMP);
  const tL = temp <= TEMP_MIN ? "LO" : temp >= TEMP_MAX ? "HI" : temp + "°F";
  const [fanMode, setFanMode] = useState("AUTO"),
    [fanS, setFanS] = useState(AUTO_FAN);
  const fP = useRef(AUTO_FAN);
  const cycleTempMode = () =>
    setTempMode((v) => {
      if (v === "AUTO") return "ON";
      if (v === "ON") return "OFF";
      setTemp(AUTO_TEMP);
      return "AUTO";
    });
  const cycleFanMode = () =>
    setFanMode((v) => {
      if (v === "AUTO") return "ON";
      if (v === "ON") {
        if (fanS > 0) fP.current = fanS;
        setFanS(0);
        return "OFF";
      }
      setFanS(AUTO_FAN);
      return "AUTO";
    });
  const stepFan = (v) => {
    if (v > 0) {
      fP.current = v;
      setFanS(v);
      setFanMode("ON");
    } else {
      setFanS(0);
      setFanMode("OFF");
    }
  };
  const tempActive = tempMode !== "OFF",
    fanActive = fanMode !== "OFF";
  const [seatS, setSeatS] = useState(0);
  const sP = useRef(1);
  const togSeat = () => {
    if (seatS > 0) {
      sP.current = seatS;
      setSeatS(0);
    } else setSeatS(sP.current);
  };
  const [sosH, setSosH] = useState(false),
    [sosC, setSosC] = useState(false),
    [sosCount, setSosCount] = useState(3);
  const [sosPulse, setSosPulse] = useState(false);
  const sosTimers = useRef([]);
  const callingPulseRef = useRef(null);
  useEffect(() => {
    if (sosC) {
      const doPulse = () => {
        setSosPulse(true);
        callingPulseRef.current = setTimeout(() => {
          setSosPulse(false);
          callingPulseRef.current = setTimeout(doPulse, 200);
        }, 250);
      };
      doPulse();
    } else {
      clearTimeout(callingPulseRef.current);
      setSosPulse(false);
    }
    return () => clearTimeout(callingPulseRef.current);
  }, [sosC]);
  const startSos = () => {
    setSosH(true);
    setSosCount(3);
    const pulse = (d) =>
      setTimeout(() => {
        setSosPulse(true);
        setTimeout(() => setSosPulse(false), 320);
      }, d);
    const t1 = setTimeout(() => setSosCount(2), 1000),
      t2 = setTimeout(() => setSosCount(1), 2000),
      t3 = setTimeout(() => {
        setSosC(true);
        setSosH(false);
        setSosCount(3);
      }, 3000);
    sosTimers.current = [t1, t2, t3, pulse(0), pulse(1000), pulse(2000)];
  };
  const cancelSos = () => {
    sosTimers.current.forEach(clearTimeout);
    setSosH(false);
    setSosCount(3);
    setSosPulse(false);
  };

  const wiperPulse = useRef(null),
    frontPulse = useRef(null),
    rearPulse = useRef(null),
    volPulse = useRef(null),
    hlPulse = useRef(null),
    tempPulse = useRef(null),
    fanPulse = useRef(null),
    seatPulse = useRef(null),
    gridRef = useRef(null),
    swRef = useRef(null),
    ccRef = useRef(null),
    layoutRef = useRef(null);

  const chips = [
    fM > 0
      ? {
          icon: <FrontWinSVG s={11} />,
          label: modeLabelShort(fM),
          glow: fM === 1 ? "#ff4a4a" : ACCENT,
        }
      : null,
    rM > 0
      ? {
          icon: <RearWinSVG s={11} />,
          label: modeLabelShort(rM),
          glow: rM === 1 ? "#ff4a4a" : ACCENT,
        }
      : null,
    hl === "ON"
      ? { icon: <HeadlightSVG s={11} />, label: "ON", glow: ACCENT }
      : null,
    hl === "OFF"
      ? { icon: <HeadlightSVG s={11} />, label: "OFF", glow: TEXT_SEC }
      : null,
    muted
      ? {
          icon: <VolumeSVG s={11} muted={true} />,
          label: "MUTE",
          glow: TEXT_SEC,
        }
      : null,
  ].filter(Boolean);

  const bs: React.CSSProperties = {
    background: BLOCK_BG,
    borderRadius: 12,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    padding: "0 16px",
    userSelect: "none",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
    boxShadow:
      "inset 6px 0 14px -2px rgba(0,0,0,0.9), inset -6px 0 14px -2px rgba(0,0,0,0.9), inset 0 6px 14px -2px rgba(0,0,0,0.9), inset 0 -6px 14px -2px rgba(0,0,0,0.9)",
  };

  const [tutStep, setTutStep] = useState(0);
  const [lastTutStep, setLastTutStep] = useState(1);
  const [tutExiting, setTutExiting] = useState(false);
  const [dimVisible, setDimVisible] = useState(false);
  const tutActive = tutStep > 0 || tutExiting;

  const exitTutorial = useCallback((nextLastStep) => {
    setTutExiting(true);
    setDimVisible(false);
    setTimeout(() => {
      setTutStep(0);
      if (nextLastStep !== undefined) setLastTutStep(nextLastStep);
      setTutExiting(false);
    }, 320);
  }, []);

  useEffect(() => {
    if (tutStep > 0 && !tutExiting) {
      const t = setTimeout(() => setDimVisible(true), 10);
      return () => clearTimeout(t);
    }
  }, [tutStep, tutExiting]);

  const swScreen = (
    <div
      ref={swRef}
      style={{
        position: "relative",
        padding: 8,
        background: "#3a3a3e",
        borderRadius: 18,
        display: "inline-block",
      }}
    >
      <SWHighlights />
      <AnimatedMap
        chips={chips}
        tempMode={tempMode}
        tL={tL}
        fanMode={fanMode}
        muted={muted}
        sosH={sosH}
        sosC={sosC}
        sosPulse={sosPulse}
        sosCount={sosCount}
        startSos={startSos}
        cancelSos={cancelSos}
        setSosC={setSosC}
      />
    </div>
  );

  const ccScreen = (
    <div
      ref={ccRef}
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: `repeat(3,${BW}px)`,
        gridTemplateRows: `${BH}px ${BH}px`,
        gap: 8,
        background: "#3a3a3e",
        padding: 8,
        borderRadius: 16,
      }}
    >
      {/* Wipers */}
      <div style={bs}>
        <div
          onClick={() => stepW(Math.min(3, wS + 1))}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 52,
            cursor: "pointer",
            zIndex: 99,
          }}
        />
        <div
          onClick={() => stepW(Math.max(0, wS - 1))}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 52,
            cursor: "pointer",
            zIndex: 99,
          }}
        />
        <div
          onClick={() => {
            cycleWiperMode();
            wiperPulse.current && wiperPulse.current();
          }}
          style={{
            position: "absolute",
            left: 0,
            top: 52,
            width: "55%",
            bottom: 52,
            cursor: "pointer",
            zIndex: 98,
          }}
        />
        <div
          style={{
            position: "relative",
            width: 90,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 8,
          }}
        >
          <div style={{ position: "absolute", top: "calc(50% - 62px)" }}>
            <IconBtn active={wiperMode !== "OFF"} triggerRef={wiperPulse}>
              <WiperSVG s={90} />
            </IconBtn>
          </div>
          <div style={{ position: "absolute", top: "calc(50% + 42px)" }}>
            <Val active={wiperMode !== "OFF"} fs={16}>
              {wiperMode === "AUTO" ? "AUTO" : wL[wS]}
            </Val>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            opacity: wiperMode === "AUTO" || wiperMode === "OFF" ? 0.62 : 1,
            transition: "opacity 0.2s",
          }}
        >
          <StepSlider
            steps={4}
            labels={wL}
            value={wS}
            onChange={stepW}
            height={140}
            active={wiperMode === "ON"}
          />
        </div>
      </div>
      {/* Front/Rear */}
      <div style={bs}>
        <div
          onClick={() => {
            setFM((v) => (v + 1) % 3);
            frontPulse.current && frontPulse.current();
          }}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "50%",
            bottom: 0,
            cursor: "pointer",
            zIndex: 98,
          }}
        />
        <div
          onClick={() => {
            setRM((v) => (v + 1) % 3);
            rearPulse.current && rearPulse.current();
          }}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: "50%",
            bottom: 0,
            cursor: "pointer",
            zIndex: 98,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            width: "100%",
            boxSizing: "border-box",
            marginTop: -1,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              flex: 1,
              marginTop: 13,
              marginLeft: 6,
            }}
          >
            <IconBtn
              active={fM > 0}
              glowColor={fM === 1 ? "#ff4a4a" : ACCENT}
              triggerRef={frontPulse}
            >
              <FrontWinSVG s={82} />
            </IconBtn>
            <span
              style={{
                fontFamily: "'Exo 2',sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: TEXT_SEC,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                marginTop: -5,
              }}
            >
              FRONT
            </span>
            <span
              style={{
                fontFamily: "'Poppins',sans-serif",
                fontSize: 16,
                fontWeight: 600,
                color: modeLabelColor(fM),
                marginLeft: -1,
                letterSpacing: 0.5,
              }}
            >
              {modeLabel(fM)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              marginTop: 20,
              flex: 1,
              marginRight: 6,
            }}
          >
            <IconBtn
              active={rM > 0}
              glowColor={rM === 1 ? "#ff4a4a" : ACCENT}
              triggerRef={rearPulse}
            >
              <RearWinSVG s={76} />
            </IconBtn>
            <span
              style={{
                fontFamily: "'Exo 2',sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: TEXT_SEC,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                marginTop: -6,
              }}
            >
              REAR
            </span>
            <span
              style={{
                fontFamily: "'Poppins',sans-serif",
                fontSize: 16,
                fontWeight: 600,
                color: modeLabelColor(rM),
                marginLeft: -1,
                letterSpacing: 0.5,
              }}
            >
              {modeLabel(rM)}
            </span>
          </div>
        </div>
      </div>
      {/* Volume */}
      <div style={bs}>
        <div
          onClick={() => {
            setMuted(false);
            setVol((v) => Math.min(100, v + 5));
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 52,
            cursor: "pointer",
            zIndex: 99,
          }}
        />
        <div
          onClick={() => setVol((v) => Math.max(0, v - 5))}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 52,
            cursor: "pointer",
            zIndex: 99,
          }}
        />
        <div
          onClick={() => {
            setMuted((v) => !v);
            volPulse.current && volPulse.current();
          }}
          style={{
            position: "absolute",
            left: 0,
            top: 52,
            width: "62%",
            bottom: 52,
            cursor: "pointer",
            zIndex: 98,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            marginLeft: 8,
            marginTop: 8,
          }}
        >
          <IconBtn active={!muted && vol > 0} triggerRef={volPulse}>
            <div style={{ marginTop: -2 }}>
              <VolumeSVG s={104} muted={muted} />
            </div>
          </IconBtn>
          <div style={{ marginTop: -5 }}>
            <Val active={!muted} fs={16}>
              {muted ? "MUTED" : vol}
            </Val>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            opacity: muted ? 0.62 : 1,
            transition: "opacity 0.2s",
          }}
        >
          <VertSlider
            min={0}
            max={100}
            step={5}
            value={vol}
            onChange={(v) => {
              setMuted(false);
              setVol(v);
            }}
            height={140}
            active={!muted && vol > 0}
          />
        </div>
      </div>
      {/* Headlights */}
      <div style={bs}>
        <div
          onClick={() => {
            hlCycle();
            hlPulse.current && hlPulse.current();
          }}
          style={{
            position: "absolute",
            inset: 8,
            cursor: "pointer",
            zIndex: 99,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            marginTop: 3,
          }}
        >
          <IconBtn active={hl !== "OFF"} triggerRef={hlPulse}>
            <div style={{ marginTop: -8 }}>
              <HeadlightSVG s={112} />
            </div>
          </IconBtn>
          <div style={{ position: "relative", zIndex: 100 }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 8,
                boxShadow:
                  "0 0 10px rgba(74,159,255,0.45), 0 0 20px rgba(74,159,255,0.2)",
                opacity: hl === "AUTO" ? 1 : 0,
                transition: "opacity 0.35s ease",
                pointerEvents: "none",
              }}
            />
            <button
              onClick={() => {
                hlCycle();
                hlPulse.current && hlPulse.current();
              }}
              style={{
                fontFamily: "'Exo 2',sans-serif",
                fontWeight: 700,
                fontSize: 19,
                letterSpacing: 3.25,
                padding: "14px 0",
                width: 104,
                borderRadius: 8,
                cursor: "pointer",
                background:
                  hl === "AUTO"
                    ? "rgba(74,159,255,0.12)"
                    : hl === "ON"
                    ? "rgba(74,159,255,0.03)"
                    : "transparent",
                color: hl !== "OFF" ? ACCENT : TEXT_SEC,
                border:
                  hl === "AUTO"
                    ? `1.5px solid ${ACCENT}`
                    : hl === "ON"
                    ? "1.5px solid rgba(74,159,255,0.65)"
                    : `1.5px solid ${TRACK_BG}`,
                transition:
                  "background 0.35s ease, color 0.35s ease, border 0.35s ease",
                position: "relative",
              }}
            >
              {hl}
            </button>
          </div>
        </div>
      </div>
      {/* Temp & Fan */}
      <div style={bs}>
        <div
          onClick={() => {
            if (tempMode === "OFF" || tempMode === "AUTO") setTempMode("ON");
            setTemp((v) => Math.min(TEMP_MAX, v + 2));
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "50%",
            height: 52,
            cursor: "pointer",
            zIndex: 99,
          }}
        />
        <div
          onClick={() => {
            stepFan(Math.min(5, fanS + 1));
          }}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "50%",
            height: 52,
            cursor: "pointer",
            zIndex: 99,
          }}
        />
        <div
          onClick={() => {
            if (tempMode === "OFF" || tempMode === "AUTO") setTempMode("ON");
            setTemp((v) => Math.max(TEMP_MIN, v - 2));
          }}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "50%",
            height: 52,
            cursor: "pointer",
            zIndex: 99,
          }}
        />
        <div
          onClick={() => {
            stepFan(Math.max(0, fanS - 1));
          }}
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "50%",
            height: 52,
            cursor: "pointer",
            zIndex: 99,
          }}
        />
        <div
          onClick={() => {
            cycleTempMode();
            tempPulse.current && tempPulse.current();
          }}
          style={{
            position: "absolute",
            left: 0,
            top: 52,
            width: "27%",
            bottom: 52,
            cursor: "pointer",
            zIndex: 98,
          }}
        />
        <div
          onClick={() => {
            cycleFanMode();
            fanPulse.current && fanPulse.current();
          }}
          style={{
            position: "absolute",
            left: "52%",
            top: 52,
            width: "20%",
            bottom: 52,
            cursor: "pointer",
            zIndex: 98,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            width: "100%",
            boxSizing: "border-box",
            paddingLeft: 1,
          }}
        >
          <div
            style={{
              width: halfW,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 6,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <IconBtn
                active={tempActive}
                triggerRef={tempPulse}
                pulseScale={1.07}
              >
                <div style={{ marginLeft: 2 }}>
                  <TempSVG s={40} />
                </div>
              </IconBtn>
              <div style={{ marginTop: 2, marginLeft: -2 }}>
                <Val active={tempActive} fs={13}>
                  {tempMode === "AUTO"
                    ? "AUTO"
                    : tempMode === "OFF"
                    ? "OFF"
                    : tL}
                </Val>
              </div>
            </div>
            <div
              style={{
                marginLeft: 65,
                opacity: tempMode === "AUTO" || tempMode === "OFF" ? 0.62 : 1,
                transition: "opacity 0.2s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: ARR_GAP,
                }}
              >
                <div
                  style={{
                    width: 28,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <button
                    onClick={() => {
                      setTempMode("ON");
                      setTemp((v) => Math.min(TEMP_MAX, v + 2));
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      opacity: 0.75,
                      lineHeight: 0,
                      display: "flex",
                    }}
                  >
                    <AUp />
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      height: 140,
                      alignItems: "flex-end",
                      position: "relative",
                    }}
                  >
                    {[
                      { label: "HI", pct: 100 },
                      { label: "80°", pct: TEMP_PCTS[3] },
                      { label: "70°", pct: TEMP_PCTS[2] },
                      { label: "60°", pct: TEMP_PCTS[1] },
                      { label: "LO", pct: 0 },
                    ].map((item, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 9,
                          color: TEXT_SEC,
                          lineHeight: 1,
                          fontFamily: "'Poppins',sans-serif",
                          position: "absolute",
                          right: 0,
                          bottom: item.pct + "%",
                          transform: "translateY(50%)",
                        }}
                      >
                        {item.label}
                      </span>
                    ))}
                  </div>
                  <TempTrack
                    value={temp}
                    onChange={(v) => {
                      setTempMode("ON");
                      setTemp(v);
                    }}
                    active={tempMode === "ON"}
                  />
                </div>
                <div
                  style={{
                    width: 28,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <button
                    onClick={() => {
                      setTempMode("ON");
                      setTemp((v) => Math.max(TEMP_MIN, v - 2));
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      opacity: 0.75,
                      lineHeight: 0,
                      display: "flex",
                    }}
                  >
                    <ADn />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              width: halfW,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              justifyContent: "center",
              marginLeft: -8,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                marginLeft: 15,
              }}
            >
              <IconBtn
                active={fanActive && fanS > 0}
                triggerRef={fanPulse}
                pulseScale={1.07}
              >
                <FanSVG s={40} />
              </IconBtn>
              <div style={{ marginTop: 2 }}>
                <Val active={fanMode !== "OFF" && fanS > 0} fs={13}>
                  {fanMode === "AUTO"
                    ? "AUTO"
                    : fanMode === "OFF"
                    ? "OFF"
                    : fL[fanS]}
                </Val>
              </div>
            </div>
            <div
              style={{
                opacity: fanMode === "AUTO" || fanMode === "OFF" ? 0.62 : 1,
                transition: "opacity 0.2s",
                marginLeft: -6,
              }}
            >
              <StepSlider
                steps={6}
                labels={fL}
                value={fanS}
                onChange={(v) => {
                  if (v > 0) fP.current = v;
                  setFanS(v);
                  if (v === 0) setFanMode("OFF");
                  else setFanMode("ON");
                }}
                height={140}
                active={fanMode === "ON" && fanS > 0}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Seat Heater */}
      <div style={bs}>
        <div
          onClick={() => {
            const v = Math.min(3, seatS + 1);
            if (v > 0) sP.current = v;
            setSeatS(v);
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 52,
            cursor: "pointer",
            zIndex: 99,
          }}
        />
        <div
          onClick={() => {
            const v = Math.max(0, seatS - 1);
            if (v > 0) sP.current = v;
            setSeatS(v);
          }}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 52,
            cursor: "pointer",
            zIndex: 99,
          }}
        />
        <div
          onClick={() => {
            togSeat();
            seatPulse.current && seatPulse.current();
          }}
          style={{
            position: "absolute",
            left: 0,
            top: 52,
            width: "58%",
            bottom: 52,
            cursor: "pointer",
            zIndex: 98,
          }}
        />
        <div
          style={{
            position: "relative",
            width: 96,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 9,
          }}
        >
          <div style={{ position: "absolute", top: "calc(50% - 61px)" }}>
            <IconBtn active={seatS > 0} triggerRef={seatPulse}>
              <SeatSVG s={96} />
            </IconBtn>
          </div>
          <div style={{ position: "absolute", top: "calc(50% + 49px)" }}>
            <Val active={seatS > 0} fs={16}>
              {sL[seatS]}
            </Val>
          </div>
        </div>
        <div
          style={{
            marginLeft: -18,
            opacity: seatS === 0 ? 0.62 : 1,
            transition: "opacity 0.2s",
          }}
        >
          <StepSlider
            steps={4}
            labels={sL}
            value={seatS}
            onChange={(v) => {
              if (v > 0) sP.current = v;
              setSeatS(v);
            }}
            height={140}
            active={seatS > 0}
          />
        </div>
      </div>
      <DividerHighlights />
    </div>
  );

  return (
    <div
      style={{
        fontFamily: "'Poppins',sans-serif",
        background: "#0a0a0a",
        minHeight: view === "interior" ? "auto" : "100vh",
        padding: "28px 28px 0 28px",
        display: "flex",
        flexDirection: "column",
        gap: view === "interior" ? 0 : 16,
        boxSizing: "border-box",
        position: "relative",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        <ViewToggle view={view} setView={setView} />
        <div style={{ position: "absolute", right: 0 }}>
          {view === "screen" && (
            <button
              onClick={() => {
                if (tutStep > 0 && !tutExiting) {
                  exitTutorial(tutStep);
                } else if (!tutExiting) {
                  setTutStep(lastTutStep);
                }
              }}
              style={{
                fontFamily: "'Exo 2',sans-serif",
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: 1.8,
                padding: "7px 16px",
                borderRadius: 20,
                border: `1px solid ${
                  tutStep > 0 && !tutExiting
                    ? "rgba(255,100,100,0.5)"
                    : "rgba(74,159,255,0.4)"
                }`,
                background:
                  tutStep > 0 && !tutExiting
                    ? "rgba(255,100,100,0.08)"
                    : "rgba(74,159,255,0.07)",
                color: tutStep > 0 && !tutExiting ? "#ff8080" : ACCENT,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {tutStep > 0 && !tutExiting ? "EXIT TUTORIAL" : "TUTORIAL"}
            </button>
          )}
        </div>
      </div>
      {view === "screen" ? (
        <div ref={layoutRef} style={{ position: "relative" }}>
          {tutActive && (
            <>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.32)",
                  borderRadius: 16,
                  pointerEvents: "none",
                  opacity: dimVisible ? 1 : 0,
                  transition: "opacity 0.32s ease-out",
                  zIndex: 199,
                }}
              />
              <Tutorial
                step={tutStep}
                exiting={tutExiting}
                onNext={() => setTutStep((s) => Math.min(5, s + 1))}
                onBack={() => setTutStep((s) => Math.max(1, s - 1))}
                onExit={() => exitTutorial(1)}
                gridRef={ccRef}
                swRef={swRef}
                ccRef={ccRef}
                layoutRef={layoutRef}
              />
            </>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              height: "fit-content",
              alignItems: "flex-start",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
                flexWrap: "nowrap",
                transform: "scale(0.95)",
                transformOrigin: "center",
                marginTop: -15,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span
                  style={{
                    fontFamily: "'Exo 2',sans-serif",
                    fontSize: 10,
                    fontWeight: 600,
                    color: TEXT_SEC,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                  }}
                >
                  Steering Wheel Display
                </span>
                {swScreen}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span
                  style={{
                    fontFamily: "'Exo 2',sans-serif",
                    fontSize: 10,
                    fontWeight: 600,
                    color: TEXT_SEC,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                  }}
                >
                  Center Console: Driving Mode
                </span>
                {ccScreen}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <CarInterior
          swContent={
            <AnimatedMap
              chips={chips}
              tempMode={tempMode}
              tL={tL}
              fanMode={fanMode}
              muted={muted}
              sosH={sosH}
              sosC={sosC}
              sosPulse={sosPulse}
              sosCount={sosCount}
              startSos={startSos}
              cancelSos={cancelSos}
              setSosC={setSosC}
            />
          }
          ccContent={ccScreen}
        />
      )}
    </div>
  );
}
