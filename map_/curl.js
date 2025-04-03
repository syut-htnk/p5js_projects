// Curl-Noise for Procedural Fluid Flow
// Based on Robert Bridson's paper

let particles = [];
const numParticles = 10000;
let noiseScale = 0.005; // Scale factor for noise
let timeScale = 0.001; // For time-varying flow
let flowStrength = 50; // Strength of the flow
let obstacles = []; // Array to store obstacles
let showField = false; // Toggle to show velocity field

// ノイズマップ関連の変数
let showNoiseMap = false; // ノイズマップ表示のトグル
let noiseMapResolution = 4; // ノイズマップの解像度（数値が小さいほど高解像度）
let noiseMapOpacity = 150; // ノイズマップの透明度
let minNoiseValue = 0; // ノイズの最小値（自動調整用）
let maxNoiseValue = 1; // ノイズの最大値（自動調整用）

function setup() {
    createCanvas(800, 600);

    // Create particles
    for (let i = 0; i < numParticles; i++) {
        particles.push({
            pos: createVector(random(width), random(height)),
            col: color(255, 255, 255, random(100, 255))
        });
    }

    // Create some obstacles
    // obstacles.push({ pos: createVector(width / 2, height / 2), radius: 100 });
    // obstacles.push({ pos: createVector(width / 4, height / 3), radius: 50 });

    // Create UI controls
    // createButton('Toggle Velocity Field').mousePressed(() => showField = !showField);
    // createButton('Add Obstacle').mousePressed(addObstacle);

    // let sliderNoise = createSlider(0.001, 0.01, noiseScale, 0.001);
    // sliderNoise.input(() => noiseScale = sliderNoise.value());

    // let sliderStrength = createSlider(10, 200, flowStrength, 5);
    // sliderStrength.input(() => flowStrength = sliderStrength.value());

    // background(10, 10, 30);
}

function draw() {
    // 時間の更新（ここで先に定義する）
    let time = millis() * timeScale;

    // Fade the background slightly for trail effect
    background(0, 0, 0, 10);

    // ノイズマップを描画（時間変数が定義された後で呼び出す）
    if (showNoiseMap) {
        drawNoiseMap(time);
    }

    if (showField) {
        // Draw velocity field (for visualization)
        drawVelocityField(time);
    }

    // Update and draw particles
    for (let p of particles) {
        // Get curl-noise vector at particle position
        let flow = getCurlFlow(p.pos.x, p.pos.y, time);

        // Apply flow velocity to particle
        p.pos.add(flow);

        // Wrap around edges
        if (p.pos.x < 0) p.pos.x = width;
        if (p.pos.x > width) p.pos.x = 0;
        if (p.pos.y < 0) p.pos.y = height;
        if (p.pos.y > height) p.pos.y = 0;

        // Draw particle
        noStroke();
        fill(p.col);
        ellipse(p.pos.x, p.pos.y, 3, 3);
    }

    // Draw obstacles
    drawObstacles();

    // デバッグ情報の表示
    if (showNoiseMap || showField) {
        displayDebugInfo();
    }
}

// Calculate the curl of the noise field at position (x,y)
function getCurlFlow(x, y, time) {
    // Small step for numerical differentiation
    let epsilon = 0.0001 * width;

    // Get modulated noise potential
    let pot = getModulatedPotential(x, y, time);
    let dpdx = (getModulatedPotential(x + epsilon, y, time) - pot) / epsilon;
    let dpdy = (getModulatedPotential(x, y + epsilon, time) - pot) / epsilon;

    // For 2D curl: v = (∂ψ/∂y, -∂ψ/∂x)
    return createVector(dpdy, -dpdx).mult(flowStrength);
}

// Get noise potential with boundary conditions applied
function getModulatedPotential(x, y, time) {
    // Base noise potential
    let noise1 = noise(x * noiseScale, y * noiseScale, time);
    let noise2 = noise(x * noiseScale * 2, y * noiseScale * 2, time + 1000) * 0.5;
    let noise3 = noise(x * noiseScale * 4, y * noiseScale * 4, time + 2000) * 0.25;
    let pot = noise1 + noise2 + noise3;

    // Apply distance-based modulation for boundaries
    let minDist = getMinDistanceToObstacles(x, y);
    let boundaryRamp = getRampFunction(minDist / 50); // 50 is the ramp width

    return pot * boundaryRamp;
}

// Get minimum distance to all obstacles
function getMinDistanceToObstacles(x, y) {
    let minDist = width + height; // Large initial value
    for (let obs of obstacles) {
        let d = dist(x, y, obs.pos.x, obs.pos.y) - obs.radius;
        minDist = min(minDist, d);
    }
    return minDist;
}

// Smooth ramp function as described in the paper
function getRampFunction(r) {
    if (r >= 1) return 1;
    if (r <= -1) return -1;
    return (15 / 8) * r - (10 / 8) * pow(r, 3) + (3 / 8) * pow(r, 5);
}

// Draw obstacles
function drawObstacles() {
    stroke(0);
    strokeWeight(1); // ここに値を指定
    fill(0, 0, 0, 0);
    for (let obs of obstacles) {
        ellipse(obs.pos.x, obs.pos.y, obs.radius * 2, obs.radius * 2);
    }
}

// Draw velocity field for visualization
function drawVelocityField(time) {
    stroke(255, 100);
    strokeWeight(1);

    let spacing = 20;
    for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
            let flow = getCurlFlow(x, y, time);
            let len = flow.mag() * 0.1;
            line(x, y, x + flow.x * len, y + flow.y * len);
        }
    }
}

// Add obstacle at mouse position
function addObstacle() {
    obstacles.push({
        pos: createVector(mouseX, mouseY),
        radius: random(30, 80) // より実用的な値に変更
    });
}

// Mouse interactions
function mouseDragged() {
    // Add particles at mouse position
    for (let i = 0; i < 5; i++) {
        particles.push({
            pos: createVector(mouseX + random(-10, 10), mouseY + random(-10, 10)),
            col: color(random(100, 255), random(100, 255), random(200, 255), 150)
        });

        // Keep particle count limited
        if (particles.length > numParticles * 1.5) {
            particles.splice(0, 5);
        }
    }
}

// デバッグ情報表示
function displayDebugInfo() {
    fill(255);
    noStroke();
    textSize(12);
    textAlign(LEFT);

    let yPos = height - 60;
    if (showNoiseMap) {
        text(`Noise Map: ON (Resolution: ${noiseMapResolution}px)`, 10, yPos);
        yPos += 15;
    }
    if (showField) {
        text(`Velocity Field: ON`, 10, yPos);
        yPos += 15;
    }

    text(`Controls: N: toggle noise map, V: toggle velocity field`, 10, yPos);
    yPos += 15;
    text(`+/-: change resolution, O: add obstacle`, 10, yPos);
}

// ノイズマップを描画する関数（改良版）
function drawNoiseMap(time) {
    noStroke();

    // 定期的にノイズ範囲をサンプリング（30フレームごと）
    if (frameCount % 30 === 0) {
        let minNoise = 1000;
        let maxNoise = -1000;

        // キャンバス全体からサンプリング
        for (let x = 0; x < width; x += width / 10) {
            for (let y = 0; y < height; y += height / 10) {
                let val = getModulatedPotential(x, y, time);
                minNoise = min(minNoise, val);
                maxNoise = max(maxNoise, val);
            }
        }

        // 範囲に余裕を持たせる
        minNoiseValue = minNoise - (maxNoise - minNoise) * 0.1;
        maxNoiseValue = maxNoise + (maxNoise - minNoise) * 0.1;
    }

    // キャンバス全体をノイズマップで埋める
    for (let x = 0; x < width; x += noiseMapResolution) {
        for (let y = 0; y < height; y += noiseMapResolution) {
            // ノイズ値を取得
            let noiseValue = getModulatedPotential(x, y, time);

            // 動的に計算された範囲でマッピング
            noiseValue = map(noiseValue, minNoiseValue, maxNoiseValue, 0, 1);
            noiseValue = constrain(noiseValue, 0, 1); // 0〜1の範囲に制限

            // カラーマッピング（青から赤へのグラデーション）
            let r = map(noiseValue, 0, 1, 0, 255);
            let g = map(noiseValue, 0, 1, 50, 150);
            let b = map(noiseValue, 0, 1, 255, 0);
            fill(r, g, b, noiseMapOpacity);

            // 四角形を描画
            rect(x, y, noiseMapResolution, noiseMapResolution);
        }
    }
}

// キー入力処理
function keyPressed() {
    if (key === 'n' || key === 'N') {
        // 'n'キーでノイズマップ表示のトグル
        showNoiseMap = !showNoiseMap;
    } else if (key === 'v' || key === 'V') {
        // 'v'キーで速度場表示のトグル
        showField = !showField;
    } else if (key === '+' || key === '=') {
        // '+'キーでノイズマップの解像度を上げる（数値を小さくする）
        noiseMapResolution = max(1, noiseMapResolution - 1);
    } else if (key === '-') {
        // '-'キーでノイズマップの解像度を下げる（数値を大きくする）
        noiseMapResolution += 1;
    } else if (key === 'o' || key === 'O') {
        // 'o'キーで障害物を追加
        addObstacle();
    }
}