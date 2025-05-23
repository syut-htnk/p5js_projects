precision mediump float;

// p5.jsから渡される変数
attribute vec3 aPosition;
attribute vec2 aTexCoord;

// フラグメントシェーダーに渡す変数
varying vec2 vTexCoord;

void main() {
    vec4 positionVec4 = vec4(aPosition, 1.0);
    positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
    gl_Position = positionVec4;
    vTexCoord = aTexCoord;
}