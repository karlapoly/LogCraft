export const CORRUPCAO_FRAGMENT_SHADER = `
precision mediump float;

uniform sampler2D uMainSampler;
varying vec2 outTexCoord;

void main() {
  float pixelSize = 320.0;
  vec2 uv = floor(outTexCoord * pixelSize) / pixelSize;
  vec4 color = texture2D(uMainSampler, uv);
  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  vec3 desaturated = mix(color.rgb, vec3(gray), 0.42);
  gl_FragColor = vec4(desaturated, color.a);
}
`;
