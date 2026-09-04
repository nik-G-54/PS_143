export const OceanVertexShader = `
  uniform float uTime;
  uniform float uWaveStrength;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vWaveHeight;

  // Hash function for pseudo-random variation
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  // 2D noise for surface detail
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f); // smoothstep

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Fractional Brownian Motion for layered noise
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

  // Multi-directional wave system
  float getWaveHeight(vec3 p) {
    float height = 0.0;
    float t = uTime;
    
    // Wave 1: Large, slow swell from NW
    height += sin(p.x * 0.03 + p.y * 0.02 + t * 0.35) * 0.8;
    
    // Wave 2: Medium swell from W
    height += sin(p.x * 0.06 - p.y * 0.04 + t * 0.5) * 0.35;
    
    // Wave 3: Medium cross-wave from N
    height += sin(p.x * 0.04 + p.y * 0.08 - t * 0.45) * 0.25;
    
    // Wave 4: Small ripples, faster
    height += sin(p.x * 0.15 + p.y * 0.12 + t * 1.1) * 0.08;
    
    // Wave 5: Tiny surface chop, different direction
    height += sin(p.x * 0.25 - p.y * 0.18 + t * 1.4) * 0.04;
    
    // Wave 6: Very fine detail
    height += sin(p.x * 0.4 + p.y * 0.35 - t * 1.8) * 0.02;

    // Add FBM noise for irregular surface detail
    vec2 noiseCoord = p.xy * 0.04 + vec2(t * 0.05, t * 0.03);
    height += (fbm(noiseCoord) - 0.5) * 0.3;

    return height * uWaveStrength;
  }

  // Calculate analytical normal using central difference
  vec3 getWaveNormal(vec3 p) {
    float eps = 0.15;
    float h0 = getWaveHeight(p);
    float hx = getWaveHeight(p + vec3(eps, 0.0, 0.0));
    float hy = getWaveHeight(p + vec3(0.0, eps, 0.0));
    
    // For a plane geometry rotated -PI/2 on X, the displacement is along local Z
    // which becomes Y in world space.
    // tangent X: (eps, 0, hx - h0)
    // tangent Y: (0, eps, hy - h0)
    vec3 tx = vec3(eps, 0.0, hx - h0);
    vec3 ty = vec3(0.0, eps, hy - h0);
    return normalize(cross(tx, ty));
  }

  void main() {
    vUv = uv;
    vec3 p = position;
    
    // Apply displacement along local Z (which becomes world Y after rotation)
    float waveH = getWaveHeight(p);
    p.z += waveH;
    vWaveHeight = waveH;
    
    vec4 worldPos = modelMatrix * vec4(p, 1.0);
    vWorldPosition = worldPos.xyz;
    
    // Compute normal in local space and transform
    vec3 localNormal = getWaveNormal(position);
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

  // Simple noise for fragment-level detail
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

    // Fresnel effect (Schlick approximation)
    float NdotV = max(0.0, dot(viewDir, normal));
    float f0 = 0.04; // Water IOR ~1.33
    float fresnel = f0 + (1.0 - f0) * pow(1.0 - NdotV, 5.0);

    // Perturb normal slightly at fragment level for micro-detail
    vec2 detailUV = vWorldPosition.xz * 0.8 + uTime * vec2(0.02, 0.015);
    float detail = noise2D(detailUV) * 2.0 - 1.0;
    vec3 perturbedNormal = normalize(normal + vec3(detail * 0.03, 0.0, detail * 0.03));

    // Three-tone color based on fresnel + wave height
    float heightFactor = clamp((vWaveHeight + 0.15) * 2.0, 0.0, 1.0);
    vec3 baseColor = mix(uColorDeep, uColorMid, clamp(fresnel * 1.2, 0.0, 1.0));
    baseColor = mix(baseColor, uColorSurface, clamp(fresnel * fresnel * 2.0 + heightFactor * 0.15, 0.0, 0.4));

    // Specular highlights (Blinn-Phong) using perturbed normal
    vec3 halfVector = normalize(sunDir + viewDir);
    float NdotH = max(0.0, dot(perturbedNormal, halfVector));
    
    float specPrimary = pow(NdotH, 220.0) * 2.4;
    float specBroad = pow(NdotH, 18.0) * 0.32;
    
    float specular = specPrimary + specBroad;

    // Soft ambient + directional lighting
    float NdotL = max(0.0, dot(perturbedNormal, sunDir));
    float diffuse = NdotL * 0.4 + 0.72;

    // Combine
    vec3 finalColor = baseColor * diffuse;
    finalColor += uSunColor * specular * uSunIntensity;
    
    // Sky reflection at grazing angles — bright maritime blue, not a night void
    vec3 skyColor = vec3(0.42, 0.72, 0.92);
    finalColor = mix(finalColor, skyColor, fresnel * 0.45);

    // Horizon fade into the same water family
    float dist = length(cameraPosition - vWorldPosition);
    float fogFactor = smoothstep(80.0, 720.0, dist);
    vec3 fogColor = mix(uColorMid, vec3(0.22, 0.52, 0.78), 0.35);
    finalColor = mix(finalColor, fogColor, fogFactor);
    
    // Edge softening — fade alpha at extreme distance
    float edgeAlpha = 1.0 - smoothstep(350.0, 600.0, dist);

    gl_FragColor = vec4(finalColor, 0.92 * edgeAlpha);
  }
`;
