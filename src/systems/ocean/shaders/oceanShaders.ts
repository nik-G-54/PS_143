/**
 * GLSL chunks adapted from WaterThreeJS src/shaders/common.js
 * Copyright (c) 2026 mohamedachrefelouafi — MIT License.
 *
 * Intentionally omits: SSR, refraction depth textures, underwater Snell's window,
 * volumetric cloud shadows, contact-foam body arrays.
 */

export const NOISE = /* glsl */ `
  float hash21(vec2 p){
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  vec3 noised(vec2 x){
    vec2 p = floor(x);
    vec2 f = fract(x);
    vec2 u  = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
    float a = hash21(p + vec2(0.0, 0.0));
    float b = hash21(p + vec2(1.0, 0.0));
    float c = hash21(p + vec2(0.0, 1.0));
    float d = hash21(p + vec2(1.0, 1.0));
    float k1 = b - a;
    float k2 = c - a;
    float k3 = a - b - c + d;
    float n  = a + k1 * u.x + k2 * u.y + k3 * u.x * u.y;
    vec2  g  = du * vec2(k1 + k3 * u.y, k2 + k3 * u.x);
    return vec3(n, g);
  }

  const mat2 FBM_M = mat2(1.6, 1.2, -1.2, 1.6);

  float fbm(vec2 p, int oct){
    float amp = 0.5, sum = 0.0;
    for (int i = 0; i < 8; i++){
      if (i >= oct) break;
      sum += amp * noised(p).x;
      p = FBM_M * p;
      amp *= 0.5;
    }
    return sum;
  }
`;

/** Analytic atmosphere for sky reflections (HDR-lite; sun disk capped for R3F tonemap). */
export const ATMOSPHERE = /* glsl */ `
  vec3 atmosphere(vec3 dir, vec3 sunDir){
    dir = normalize(dir);
    float up      = clamp(dir.y, -1.0, 1.0);
    float sunAmt  = max(dot(dir, sunDir), 0.0);
    float sunElev = clamp(sunDir.y, 0.0, 1.0);

    vec3 zenith  = mix(vec3(0.04, 0.12, 0.38), vec3(0.07, 0.22, 0.55), sunElev);
    vec3 horizon = mix(vec3(0.28, 0.40, 0.58), vec3(0.48, 0.62, 0.78), sunElev);
    float h = pow(clamp(1.0 - up, 0.0, 1.0), 2.6);
    vec3 col = mix(zenith, horizon, h);

    vec3 warm = vec3(1.0, 0.72, 0.45);
    col = mix(col, warm, h * pow(sunAmt, 2.5) * (0.75 - 0.5 * sunElev));
    col = mix(col, vec3(0.04, 0.08, 0.12), smoothstep(0.0, -0.22, up));

    if (up > 0.04){
      float t = 900.0 / max(up, 0.05);
      vec2 cp = dir.xz * t * 0.0011 + uTime * vec2(0.006, 0.004);
      float base = fbm(cp, 4);
      float det  = fbm(cp * 2.9 + 4.0, 3);
      float density = base * 0.7 + det * 0.3;
      float cov = smoothstep(0.50, 0.70, density) * uCloudCover;
      cov *= smoothstep(0.05, 0.26, up);
      float shade = smoothstep(0.46, 0.82, density);
      vec3 cloudDark = mix(vec3(0.32, 0.36, 0.46), vec3(0.50, 0.40, 0.38), (1.0 - sunElev));
      vec3 cloudCol  = mix(cloudDark, vec3(1.05, 1.02, 0.98), shade);
      cloudCol += vec3(1.0, 0.82, 0.55) * pow(sunAmt, 4.0) * 0.45;
      col = mix(col, cloudCol, cov);
    }

    vec3 sunTint = mix(vec3(1.00, 0.55, 0.28), vec3(1.00, 0.96, 0.88), sunElev);
    float glow = pow(sunAmt, 8.0) * 0.28 + pow(sunAmt, 90.0) * 0.45;
    col += sunTint * glow * (0.55 + 0.35 * h);
    float disk = smoothstep(0.9994, 0.99975, sunAmt);
    col += sunTint * disk * 4.5;
    return max(col, vec3(0.0));
  }
`;

export const OCEAN_GERSTNER = /* glsl */ `
  #define MAX_WAVES 40

  uniform float uTime;
  uniform vec2  uWindDir;
  uniform float uWaveCount;
  uniform float uBaseFreq;
  uniform float uAmplitude;
  uniform float uChoppy;
  uniform float uDirSpread;
  uniform float uFreqMul;
  uniform float uAmpMul;
  uniform float uSpeed;

  struct WaveSample {
    vec3  displacement;
    vec3  normal;
    float fold;
    float height;
  };

  WaveSample sampleOcean(vec2 pos){
    vec3  disp = vec3(0.0);
    vec3  nrm  = vec3(0.0, 1.0, 0.0);
    float jxx = 1.0, jzz = 1.0, jxz = 0.0;

    float baseAngle = atan(uWindDir.y, uWindDir.x);
    float freq  = uBaseFreq;
    float amp   = uAmplitude;
    int   count = int(uWaveCount);

    for (int i = 0; i < MAX_WAVES; i++){
      if (i >= count) break;
      float fi = float(i);
      float r0 = hash21(vec2(fi, 1.7));
      float r1 = hash21(vec2(fi, 9.1));
      float angle = baseAngle + (r0 * 2.0 - 1.0) * uDirSpread;
      vec2  d = vec2(cos(angle), sin(angle));
      float w = freq;
      float A = amp;
      float phase = sqrt(9.81 * w) * uSpeed;
      float Q = uChoppy / max(w * A * uWaveCount, 1e-3);
      float arg = w * dot(d, pos) + uTime * phase + r1 * 6.2831853;
      float s = sin(arg);
      float c = cos(arg);
      float WA = w * A;
      disp.x += Q * A * d.x * c;
      disp.z += Q * A * d.y * c;
      disp.y += A * s;
      nrm.x -= d.x * WA * c;
      nrm.z -= d.y * WA * c;
      nrm.y -= Q * WA * s;
      jxx -= Q * d.x * d.x * WA * s;
      jzz -= Q * d.y * d.y * WA * s;
      jxz -= Q * d.x * d.y * WA * s;
      freq *= uFreqMul;
      amp  *= uAmpMul;
    }

    WaveSample o;
    o.displacement = disp;
    o.normal = normalize(nrm);
    o.height = disp.y;
    o.fold = jxx * jzz - jxz * jxz;
    return o;
  }
`;

export const DETAIL_NORMAL = /* glsl */ `
  vec3 detailNormal(vec2 p, float t, float strength){
    vec2 g = vec2(0.0);
    float amp = 1.0;
    mat2 m = mat2(1.7, 1.1, -1.1, 1.7);
    vec2 flow = uWindDir * t * 0.6;
    for (int i = 0; i < 5; i++){
      vec3 n = noised(p + flow);
      g += amp * n.yz;
      p = m * p;
      flow = -flow * 0.85;
      amp *= 0.55;
    }
    return normalize(vec3(-g.x, 1.0 / max(strength, 1e-3), -g.y));
  }
`;

export const OceanVertexShader = /* glsl */ `
  precision highp float;
  ${NOISE}
  ${OCEAN_GERSTNER}
  uniform float uSurfaceY;

  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vFold;
  varying float vHeight;

  void main(){
    vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    worldPos.y = uSurfaceY;

    WaveSample w = sampleOcean(worldPos.xz);
    vec3 displaced = worldPos + w.displacement;

    vWorldPos = displaced;
    vNormal   = w.normal;
    vFold     = w.fold;
    vHeight   = w.height;

    gl_Position = projectionMatrix * viewMatrix * vec4(displaced, 1.0);
  }
`;

export const OceanFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3  uSunDir;
  uniform vec2  uWindDir;
  uniform float uDetailScale;
  uniform float uDetailStrength;
  uniform float uRoughness;
  uniform float uCloudCover;
  uniform float uSSSStrength;
  uniform float uFoamThreshold;
  uniform float uFoamSoftness;
  uniform float uCrestFoamStart;
  uniform float uFoamCoverage;
  uniform float uFoamEdge;
  uniform float uFoamOpacity;
  uniform vec3  uDeepColor;
  uniform vec3  uShallowColor;
  uniform vec3  uFoamColor;
  uniform vec3  uSSSColor;
  uniform float uNight;

  ${NOISE}
  ${ATMOSPHERE}
  ${DETAIL_NORMAL}

  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vFold;
  varying float vHeight;

  float fresnelF(float c, float f0){
    return f0 + (1.0 - f0) * pow(clamp(1.0 - c, 0.0, 1.0), 5.0);
  }

  float dggx(float NoH, float a){
    float a2 = a * a;
    float d = (NoH * a2 - NoH) * NoH + 1.0;
    return a2 / (3.14159265 * d * d);
  }

  void main(){
    vec3 sunDir = normalize(uSunDir);
    vec3 V = normalize(cameraPosition - vWorldPos);
    float sunElev = clamp(sunDir.y, 0.05, 1.0);
    float dist = length(cameraPosition - vWorldPos);

    vec3 N = normalize(vNormal);
    float detFade = exp(-dist * 0.012);
    vec3 dN1 = detailNormal(vWorldPos.xz * uDetailScale, uTime, 1.0);
    vec3 dN2 = detailNormal(vWorldPos.xz * uDetailScale * 3.7 + 11.0, uTime * 1.35, 1.0);
    vec2 dsum = dN1.xz * uDetailStrength
              + dN2.xz * uDetailStrength * 0.45 * mix(0.4, 1.0, detFade);
    N = normalize(vec3(N.x + dsum.x, N.y, N.z + dsum.y));
    vec3 Ns = N.y >= 0.0 ? N : -N;
    if (dot(N, V) < 0.0) N = -N;

    vec3 R = reflect(-V, N);
    vec3 Rsky = R; Rsky.y = abs(Rsky.y);
    vec3 reflection = atmosphere(Rsky, sunDir);

    float fres = fresnelF(max(dot(N, V), 0.0), 0.02);

    // Depth-ish body colour without refraction pass (dark maritime investigation look)
    float depthCue = clamp(1.0 - fres * 0.85 + vHeight * 0.08, 0.0, 1.0);
    vec3 waterCol = mix(uDeepColor, uShallowColor, (1.0 - depthCue) * 0.55 + fres * 0.2);
    waterCol *= 0.55 + 0.55 * sunElev;

    vec3 color = mix(waterCol, reflection, fres * 0.92);

    // Subsurface glow on back-lit crests
    float back  = pow(max(dot(V, -sunDir), 0.0), 4.0);
    float crest = smoothstep(0.15, 0.85, vHeight) * max(N.y, 0.0);
    color += uSSSColor * back * crest * sunElev * uSSSStrength;

    // GGX sun glints
    vec3 H = normalize(V + sunDir);
    float rough = clamp(uRoughness + (1.0 - detFade) * 0.10, 0.02, 0.55);
    float D = dggx(max(dot(N, H), 0.0), rough * rough);
    float fh = fresnelF(max(dot(H, V), 0.0), 0.02);
    float sunNoL = max(dot(Ns, sunDir), 0.0);
    color += vec3(1.0, 0.94, 0.82) * D * fh * sunNoL * 2.4 * sunElev;

    // Foam from Jacobian folds + whitecaps
    float breakE = smoothstep(uFoamThreshold, uFoamThreshold - uFoamSoftness, vFold);
    float crestE = smoothstep(uCrestFoamStart, uCrestFoamStart + 1.2, vHeight);
    float energy = clamp((breakE + crestE * 0.7) * uFoamCoverage, 0.0, 1.2);

    vec2 fp = vWorldPos.xz;
    vec2 flow = uWindDir * uTime * 0.4;
    vec2 wperp = vec2(-uWindDir.y, uWindDir.x);
    vec2 sp = vec2(dot(fp, uWindDir), dot(fp, wperp) * 3.0);
    float tCoarse = fbm(sp * 0.12 + flow, 4);
    float tMid    = fbm(fp * 0.8 - flow * 1.3, 3);
    float tex = tCoarse * 0.65 + tMid * 0.35;
    float thr  = 1.0 - clamp(energy, 0.0, 1.0);
    float foam = smoothstep(thr - uFoamEdge, thr + uFoamEdge, tex);
    foam *= smoothstep(0.0, 0.12, energy);

    float foamLight = 0.55 + 0.5 * max(dot(Ns, sunDir), 0.0);
    vec3 foamCol = uFoamColor * foamLight;
    color = mix(color, foamCol, clamp(foam, 0.0, 1.0) * uFoamOpacity);

    // Horizon haze
    vec3 horizonDir = normalize(vec3(-V.x, 0.02, -V.z));
    vec3 fogCol = min(atmosphere(horizonDir, sunDir), vec3(1.35));
    float fogAmt = 1.0 - exp(-dist * 0.0005);
    color = mix(color, fogCol, clamp(fogAmt, 0.0, 0.85));

    if (uNight > 0.5) {
      color *= vec3(0.35, 0.42, 0.55);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;