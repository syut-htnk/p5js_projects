precision mediump float;

// 画面の解像度
uniform vec2 u_resolution;
uniform float u_time;

// 頂点シェーダーから受け取るテクスチャ座標
varying vec2 vTexCoord;

// メタボールの数
const int NUM_BALLS = 10;

// 擬似乱数生成関数
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    // アスペクト比を計算
    float aspectRatio = u_resolution.x / u_resolution.y;

    // アスペクト比を考慮したUV座標
    vec2 uv = vTexCoord;

    // X座標をアスペクト比で調整（Y座標を基準に）
    if(aspectRatio > 1.0) {
        // 横長の場合
        uv.x = (uv.x - 0.5) * aspectRatio + 0.5;
    } else {
        // 縦長の場合
        uv.y = (uv.y - 0.5) / aspectRatio + 0.5;
    }

    // メタボールの合計値
    float metaballValue = 0.0;

    // メタボール処理
    for(int i = 0; i < NUM_BALLS; i++) {
        // 各メタボールの固有シード値
        vec2 seed = vec2(float(i) * 0.1234, float(i) * 0.6789);

        // ランダムな速度を生成（各メタボール固有）
        float speedX = mix(0.2, 0.6, random(seed));
        float speedY = mix(0.2, 0.6, random(seed + vec2(0.1)));

        // ランダムなフェーズオフセット
        float phaseX = mix(0.0, 6.283, random(seed + vec2(0.2)));
        float phaseY = mix(0.0, 6.283, random(seed + vec2(0.3)));

        // ランダムな動きの範囲
        float rangeX = mix(0.1, 0.3, random(seed + vec2(0.4)));
        float rangeY = mix(0.1, 0.3, random(seed + vec2(0.5)));

        // 中心位置のランダムなオフセット
        float centerX = mix(0.3, 0.7, random(seed + vec2(0.6)));
        float centerY = mix(0.3, 0.7, random(seed + vec2(0.7)));

        // 各メタボールの位置を計算（時間に応じて変化 + ランダムパラメータ）
        vec2 ballPos = vec2(centerX + rangeX * cos(u_time * speedX + phaseX), centerY + rangeY * sin(u_time * speedY + phaseY));

        // メタボールのサイズ
        float ballSize = 0.02;

        // 現在のピクセルとメタボールの距離
        float dist = distance(uv, ballPos);

        // メタボールの影響を計算（距離の二乗の逆数）
        metaballValue += ballSize / (dist * dist);
    }

    // メタボールの閾値と色の設定
    vec3 color;
    float threshold = 15.0; // メタボールの閾値

    if(metaballValue > threshold) {
        color = vec3(0.09, 0.09, 0.09); // メタボール内部は黒
    } else {
        color = vec3(0.96, 0.96, 0.96); // メタボール外部は青っぽい色
    }

    // 最終的な色の出力
    gl_FragColor = vec4(color, 1.0);
}