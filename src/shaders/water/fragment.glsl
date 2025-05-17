uniform vec3 uDepthColor;
uniform vec3 uSurfaceColor;
uniform float uColorOffset;
uniform float uColorMultiplier;
uniform sampler2D uTexture;
varying vec2 vUv;
varying float vElevation;

void main()
{
    // compute blend factor
    float mixStrength = clamp((vElevation + uColorOffset) * uColorMultiplier, 0.0, 1.0);
    vec3 gradientColor = mix(uDepthColor, uSurfaceColor, mixStrength);

    // sample texture
    vec4 texColor = texture2D(uTexture, vUv);

    // tint the texture by the gradient color
    vec3 tinted = texColor.rgb * gradientColor;

    gl_FragColor = vec4(tinted, texColor.a);

    #include <colorspace_fragment>
}