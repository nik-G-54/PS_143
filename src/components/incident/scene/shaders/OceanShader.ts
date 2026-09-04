export const OceanVertexShader = `
  uniform float uTime;
  uniform float uWaveStrength;
  uniform vec2 uWorldOffset;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vWaveHeight;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.1;
      amplitude *= 0.45;
    }
    return value;
  }

  // World-space waves so camera-follow snapping never pops
  float getWaveHeight(vec2 worldXZ) {
    float height = 0.0;
    float t = uTime;
    vec3 p = vec3(worldXZ.x, worldXZ.y, 0.0);

    height += sin(p.x * 0.03 + p.y * 0.02 + t * 0.35) * 0.8;
    height += sin(p.x * 0.06 - p.y * 0.04 + t * 0.5) * 0.35;
    height += sin(p.x * 0.04 + p.y * 0.08 - t * 0.45) * 0.25;
    height += sin(p.x * 0.15 + p.y * 0.12 + t * 1.1) * 0.08;
    height += sin(p.x * 0.25 - p.y * 0.18 + t * 1.4) * 0.04;
    height += sin(p.x * 0.4 + p.y * 0.35 - t * 1.8) * 0.02;

    vec2 noiseCoord = worldXZ * 0.04 + vec2(t * 0.05, t * 0.03);
    height += (fbm(noiseCoord) - 0.5) * 0.3;

    return height * uWaveStrength;
  }

  vec3 getWaveNormal(vec2 worldXZ) {
    float eps = 0.15;
    float h0 = getWaveHeight(worldXZ);
    float hx = getWaveHeight(worldXZ + vec2(eps, 0.0));
    float hy = getWaveHeight(worldXZ + vec2(0.0, eps));

    vec3 tx = vec3(eps, 0.0, hx - h0);
    vec3 ty = vec3(0.0, eps, hy - h0);
    return normalize(cross(tx, ty));
  }

  void main() {
    vUv = uv;
    vec3 p = position;

    // Plane XY maps to world XZ after -90° X rotation + mesh offset
    vec2 worldXZ = vec2(p.x + uWorldOffset.x, -p.y + uWorldOffset.y);
    float waveH = getWaveHeight(worldXZ);
    p.z += waveH;
    vWaveHeight = waveH;

    vec4 worldPos = modelMatrix * vec4(p, 1.0);
    vWorldPosition = worldPos.xyz;

    vec3 localNormal = getWaveNormal(worldXZ);
    vNormal = normalize(normalMatrix * localNormal);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const OceanFragmentShader = `
  uniform vec3 uColorDeep;
  uniform vec3 uColorMid;
  uniform vec3 uColorSurface;
  uniform vec3 uSunDirection;
  uniform vec3 uSunColor;
  uniform float uSunIntensity;
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vWaveHeight;

  float hash2D(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise2D(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash2D(i);
    float b = hash2D(i + vec2(1.0, 0.0));
    float c = hash2D(i + vec2(0.0, 1.0));
    float d = hash2D(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 sunDir = normalize(uSunDirection);

    float NdotV = max(0.0, dot(viewDir, normal));
    float f0 = 0.04;
    float fresnel = f0 + (1.0 - f0) * pow(1.0 - NdotV, 5.0);

    vec2 detailUV = vWorldPosition.xz * 0.8 + uTime * vec2(0.02, 0.015);
    float detail = noise2D(detailUV) * 2.0 - 1.0;
    vec3 perturbedNormal = normalize(normal + vec3(detail * 0.03, 0.0, detail * 0.03));

    float heightFactor = clamp((vWaveHeight + 0.15) * 2.0, 0.0, 1.0);
    vec3 baseColor = mix(uColorDeep, uColorMid, clamp(fresnel * 1.2, 0.0, 1.0));
    baseColor = mix(baseColor, uColorSurface, clamp(fresnel * fresnel * 2.0 + heightFactor * 0.15, 0.0, 0.4));

    // Soft whitecaps on wave peaks
    float foam = smoothstep(0.18, 0.42, vWaveHeight) * 0.22;
    baseColor = mix(baseColor, vec3(0.85, 0.93, 0.98), foam);

    vec3 halfVector = normalize(sunDir + viewDir);
    float NdotH = max(0.0, dot(perturbedNormal, halfVector));
    float specular = pow(NdotH, 220.0) * 2.4 + pow(NdotH, 18.0) * 0.32;

    float NdotL = max(0.0, dot(perturbedNormal, sunDir));
    float diffuse = NdotL * 0.4 + 0.72;

    vec3 finalColor = baseColor * diffuse;
    finalColor += uSunColor * specular * uSunIntensity;

    vec3 skyColor = vec3(0.38, 0.66, 0.88);
    finalColor = mix(finalColor, skyColor, fresnel * 0.42);

    float dist = length(cameraPosition - vWorldPosition);
    float fogFactor = smoothstep(200.0, 2200.0, dist);
    vec3 fogColor = mix(uColorMid, vec3(0.18, 0.45, 0.72), 0.4);
    finalColor = mix(finalColor, fogColor, fogFactor);

    gl_FragColor = vec4(finalColor, 0.96);
  }
`;
