let sketch = function (p) {
    // === 基本設定 ===
    let particles = [];
    let maxParticles = 20000;
    let activeParticles = 20000; // 実際に計算・描画するパーティクル数
    let noiseScale = 1500;
    let noiseStrength = 6;
    let overlayAlpha = 30;        // オーバーレイの透明度を下げて軌跡を残りやすく
    let strokeWidth = 1;        // 線を少し太く
    let time = 0;
    let timeSpeed = 0.002;
    let updateBatch = 2000;       // 1フレームでの更新バッチサイズを増加
    let drawMode = 3;             // 描画モード（1,2,3）

    // パフォーマンス監視
    let frameRateTarget = 60;     // 目標フレームレートを下げてパーティクル処理を優先
    let lastFrameRate = 0;
    let frameRateHistory = [];
    let autoAdjustPerformance = false; // 自動パフォーマンス調整を無効化

    // === ノイズマップ設定 ===
    let showNoiseMap = false;
    let noiseGridSize = 10;
    let noiseMapAlpha = 100;
    let noiseBuffer;

    // === マウス相互作用設定 ===
    let mouseForceStrength = 15;
    let mouseForceRadius = 128;
    let mouseForceActive = true;
    let mousePos = { x: 0, y: 0 };
    let prevMousePos = { x: 0, y: 0 };
    let mouseVelocity = { x: 0, y: 0 };
    let mouseSpeedThreshold = 2;
    let mouseForceDecay = 0.95;
    let mouseTrail = [];
    let maxTrailLength = 8;

    // オフスクリーンレンダリング用バッファ
    let buffer;

    p.setup = function () {
        p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
        p.background(255);
        p.smooth();
        p.frameRate(60);

        // 高DPIディスプレイの場合は低めのpixelDensityに
        let pd = window.devicePixelRatio > 1 ? 1 : 2;
        p.pixelDensity(pd);

        // オフスクリーンレンダリング用バッファの作成
        // WebGLでは座標系が異なるため、P2D指定した2Dバッファを使用
        buffer = p.createGraphics(p.width, p.height, p.P2D);
        buffer.pixelDensity(pd);
        buffer.background(255);

        // ノイズバッファの初期化
        if (showNoiseMap) {
            updateNoiseBuffer();
        }

        // パーティクルプールの初期化 - 画面全体に均等に分布させる
        initializeParticlesGrid();

        // マウス位置の初期化
        mousePos = getMousePos();
        prevMousePos = { x: mousePos.x, y: mousePos.y };
    };

    // グリッド状にパーティクルを配置
    function initializeParticlesGrid() {
        particles = [];
        // グリッド間隔を計算
        let cols = Math.ceil(Math.sqrt(maxParticles * p.width / p.height));
        let rows = Math.ceil(maxParticles / cols);
        let stepX = p.width / cols;
        let stepY = p.height / rows;

        let count = 0;
        for (let y = 0; y < rows && count < maxParticles; y++) {
            for (let x = 0; x < cols && count < maxParticles; x++) {
                // グリッド位置に少しランダム性を加える
                let posX = (x + 0.5) * stepX + p.random(-stepX / 4, stepX / 4);
                let posY = (y + 0.5) * stepY + p.random(-stepY / 4, stepY / 4);
                // WEBGL座標系（中心が原点）に合わせて調整
                posX = posX - p.width / 2;
                posY = posY - p.height / 2;
                particles.push(new Particle(true, posX, posY));
                count++;
            }
        }

        activeParticles = particles.length;
    }

    p.draw = function () {
        // 時間の更新
        time += timeSpeed;

        // マウス位置と速度の更新
        updateMousePosition();

        // 半透明の背景でフェードアウト - オフスクリーンバッファに描画
        buffer.fill(255, overlayAlpha);
        buffer.noStroke();
        buffer.rect(0, 0, buffer.width, buffer.height);

        // より多くのパーティクルを一度に処理
        for (let i = 0; i < activeParticles; i += updateBatch) {
            let endIdx = Math.min(i + updateBatch, activeParticles);

            for (let j = i; j < endIdx; j++) {
                if (particles[j].active) {
                    particles[j].updateAndDraw(time);
                }
            }
        }

        // ノイズマップの表示（有効時、更新は少なく）
        if (showNoiseMap && p.frameCount % 6 === 0) {
            updateNoiseBuffer();
        }

        // WebGLの座標系で描画するための調整
        p.push();
        p.translate(-p.width / 2, -p.height / 2); // 左上を原点とする

        // オフスクリーンバッファを描画
        p.imageMode(p.CORNER);
        p.image(buffer, 0, 0);

        // ノイズマップを描画（最前面）
        if (showNoiseMap && noiseBuffer) {
            p.image(noiseBuffer, 0, 0);
        }

        p.pop();

        // パフォーマンス調整
        if (autoAdjustPerformance && p.frameCount % 30 === 0) {
            adjustPerformance();
        }
    };

    // パフォーマンスに応じてパーティクル数を動的に調整
    function adjustPerformance() {
        frameRateHistory.push(p.frameRate());
        if (frameRateHistory.length > 5) {
            frameRateHistory.shift();
        }

        // 直近5フレームの平均フレームレート
        let avgFrameRate = frameRateHistory.reduce((a, b) => a + b, 0) / frameRateHistory.length;

        // フレームレートが目標より低い場合、パーティクル数を減らす
        if (avgFrameRate < frameRateTarget - 5 && activeParticles > 1000) {
            activeParticles = Math.max(1000, Math.floor(activeParticles * 0.9));
            deactivateParticles();
        }
        // フレームレートが目標より高い場合、パーティクル数を増やす
        else if (avgFrameRate > frameRateTarget + 5 && activeParticles < maxParticles) {
            activeParticles = Math.min(maxParticles, Math.floor(activeParticles * 1.1));
            activateParticles();
        }
    }

    function deactivateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            if (i >= activeParticles) {
                particles[i].active = false;
            }
        }
    }

    function activateParticles() {
        for (let i = 0; i < activeParticles; i++) {
            if (i < particles.length) {
                particles[i].active = true;
            }
        }
    }

    function updateNoiseBuffer() {
        if (!noiseBuffer) {
            noiseBuffer = p.createGraphics(p.width, p.height, p.P2D);
            noiseBuffer.pixelDensity(1); // 低解像度で十分
        }

        noiseBuffer.clear();
        noiseBuffer.background(255, 0);
        drawNoiseMap(noiseBuffer);
    }

    function updateMousePosition() {
        prevMousePos = { x: mousePos.x, y: mousePos.y };
        mousePos = getMousePos();
        mouseVelocity.x = mousePos.x - prevMousePos.x;
        mouseVelocity.y = mousePos.y - prevMousePos.y;

        let mouseSpeedSq = mouseVelocity.x * mouseVelocity.x + mouseVelocity.y * mouseVelocity.y;
        if (mouseSpeedSq > mouseSpeedThreshold * mouseSpeedThreshold) {
            mouseForceActive = true;
            addToMouseTrail(mousePos.x, mousePos.y);
        } else {
            mouseForceActive = mouseForceActive && (mouseTrail.length > 0);
        }

        updateMouseTrail();
    }

    // マウス位置を取得（WEBGL座標系を考慮）
    function getMousePos() {
        let x = p.mouseX - p.width / 2;
        let y = p.mouseY - p.height / 2;

        // 画面内に制限
        x = p.constrain(x, -p.width / 2, p.width / 2);
        y = p.constrain(y, -p.height / 2, p.height / 2);

        return { x, y };
    }

    // マウス位置を2Dバッファの座標系に変換
    function getMousePosForBuffer() {
        // WebGL座標系からP2D座標系へ変換
        return {
            x: mousePos.x + p.width / 2,
            y: mousePos.y + p.height / 2
        };
    }

    // マウスの軌跡を追加
    function addToMouseTrail(x, y) {
        mouseTrail.push({
            x: x,
            y: y,
            vx: mouseVelocity.x,
            vy: mouseVelocity.y,
            age: 1.0
        });

        if (mouseTrail.length > maxTrailLength) {
            mouseTrail.shift();
        }
    }

    // マウスの軌跡を更新（古いポイントを減衰）
    function updateMouseTrail() {
        for (let i = mouseTrail.length - 1; i >= 0; i--) {
            mouseTrail[i].age *= mouseForceDecay;

            if (mouseTrail[i].age < 0.01) {
                mouseTrail.splice(i, 1);
            }
        }
    }

    // マウスの動きによる外力を計算
    function calculateMouseMotionForce(pos) {
        let totalForce = p.createVector(0, 0);

        for (let i = 0; i < mouseTrail.length; i++) {
            let point = mouseTrail[i];
            let dx = pos.x - point.x;
            let dy = pos.y - point.y;
            let distSq = dx * dx + dy * dy;
            let radiusSq = mouseForceRadius * mouseForceRadius;

            if (distSq > radiusSq || distSq < 0.01) continue;

            let normalizedDist = p.sqrt(distSq) / mouseForceRadius;
            let falloff = p.exp(-8 * normalizedDist);
            let strength = mouseForceStrength * falloff * point.age;

            totalForce.x += point.vx * strength / 10;
            totalForce.y += point.vy * strength / 10;
        }

        return totalForce;
    }

    // 通常のカールノイズの生成
    function curlNoise(x, y) {
        let n = p.noise(x, y) * noiseStrength;
        let dx = p.noise(x + 0.01, y) * noiseStrength - n;
        let dy = p.noise(x, y + 0.01) * noiseStrength - n;
        return p.createVector(dy, -dx).normalize().mult(noiseStrength);
    }

    // 時間を考慮したカールノイズの生成
    function curlNoiseTime(x, y, t) {
        let n = p.noise(x, y, t) * noiseStrength;
        let dx = p.noise(x + 0.01, y, t) * noiseStrength - n;
        let dy = p.noise(x, y + 0.01, t) * noiseStrength - n;
        return p.createVector(dy, -dx).normalize().mult(noiseStrength);
    }

    // ノイズマップを描画する関数
    function drawNoiseMap(target) {
        let canvas = target || p;
        canvas.push();
        canvas.strokeWeight(1);

        // 少ないグリッドでノイズマップを表示
        let step = noiseGridSize * 3;
        for (let x = 0; x < p.width; x += step) {
            for (let y = 0; y < p.height; y += step) {
                let curl;

                // WebGL座標系に変換してノイズ計算
                let nx = (x - p.width / 2) / noiseScale;
                let ny = (y - p.height / 2) / noiseScale;

                switch (drawMode) {
                    case 1:
                        curl = curlNoise(nx, ny);
                        break;
                    case 2:
                        let angle = p.noise(nx, ny) * p.TWO_PI * 2;
                        curl = p.createVector(p.cos(angle), p.sin(angle)).mult(noiseStrength);
                        break;
                    default:
                        curl = curlNoiseTime(nx, ny, time);
                }

                let angle = p.atan2(curl.y, curl.x);
                let magnitude = curl.mag();
                let brightness = p.map(magnitude, 0, noiseStrength, 50, 255);

                canvas.stroke(brightness, noiseMapAlpha);
                drawArrow(canvas, x, y, angle, noiseGridSize * 1.5);
            }
        }

        canvas.pop();
    }

    // 矢印を描画する関数
    function drawArrow(canvas, x, y, angle, length) {
        canvas.stroke(0, 100);

        let endX = x + p.cos(angle) * length;
        let endY = y + p.sin(angle) * length;
        canvas.line(x, y, endX, endY);

        let arrowSize = length * 0.3;
        let backAngle = angle + p.PI;
        let arrow1X = endX + p.cos(backAngle + 0.2) * arrowSize;
        let arrow1Y = endY + p.sin(backAngle + 0.2) * arrowSize;
        let arrow2X = endX + p.cos(backAngle - 0.2) * arrowSize;
        let arrow2Y = endY + p.sin(backAngle - 0.2) * arrowSize;

        canvas.line(endX, endY, arrow1X, arrow1Y);
        canvas.line(endX, endY, arrow2X, arrow2Y);
    }

    // キーボード操作
    p.keyPressed = function () {
        let key = p.key.toLowerCase();

        // 描画モード切替
        if (p.key === '1') drawMode = 1;
        if (p.key === '2') drawMode = 2;
        if (p.key === '3') drawMode = 3;

        // 一般操作
        if (p.key === ' ') p.noiseSeed(p.floor(p.random(100000)));
        if (p.keyCode === p.BACKSPACE) {
            p.background(255);
            buffer.background(255);
        }
        if (key === 'r') {
            // パーティクルを再初期化
            initializeParticlesGrid();
        }

        // ノイズマップ制御
        if (key === 'v') {
            showNoiseMap = !showNoiseMap;
            if (showNoiseMap) updateNoiseBuffer();
        }
        if (key === 'g') noiseGridSize = p.constrain(noiseGridSize + 2, 4, 50);
        if (key === 'h') noiseGridSize = p.constrain(noiseGridSize - 2, 4, 50);

        // マウス力の設定
        if (p.key === '+') mouseForceStrength = p.constrain(mouseForceStrength + 0.5, 0, 20);
        if (p.key === '-') mouseForceStrength = p.constrain(mouseForceStrength - 0.5, 0, 20);
        if (p.key === '[') mouseForceRadius = p.constrain(mouseForceRadius - 10, 50, 500);
        if (p.key === ']') mouseForceRadius = p.constrain(mouseForceRadius + 10, 50, 500);

        // パフォーマンス制御
        if (key === 'a') autoAdjustPerformance = !autoAdjustPerformance;
        if (key === 'p') {
            // 手動でパーティクル数を増やす
            activeParticles = Math.min(maxParticles, activeParticles + 1000);
            activateParticles();
        }
        if (key === 'o') {
            // 手動でパーティクル数を減らす
            activeParticles = Math.max(1000, activeParticles - 1000);
            deactivateParticles();
        }

        // 保存
        if (key === 's') p.saveCanvas('flowfield', 'png');
    };

    // ウィンドウリサイズ対応
    p.windowResized = function () {
        p.resizeCanvas(p.windowWidth, p.windowHeight);

        // オフスクリーンバッファのリサイズ
        buffer = p.createGraphics(p.width, p.height, p.P2D);
        buffer.pixelDensity(window.devicePixelRatio > 1 ? 1 : 2);
        buffer.background(255);

        // ノイズバッファのリサイズ
        if (noiseBuffer) {
            noiseBuffer = p.createGraphics(p.width, p.height, p.P2D);
            noiseBuffer.pixelDensity(1);
            if (showNoiseMap) updateNoiseBuffer();
        }

        // パーティクルを再初期化
        initializeParticlesGrid();
    };

    // === パーティクルクラス ===
    class Particle {
        constructor(active = true, x = null, y = null) {
            if (x === null || y === null) {
                // WEBGL座標系（中心が原点）に合わせて初期位置を設定
                this.p = p.createVector(
                    p.random(-p.width / 2, p.width / 2),
                    p.random(-p.height / 2, p.height / 2)
                );
            } else {
                this.p = p.createVector(x, y);
            }
            this.pOld = p.createVector(this.p.x, this.p.y);
            this.stepSize = p.random(1, 5);
            this.active = active;
            this.lifespan = p.random(500, 1000);
            this.color = p.color(
                p.random(100, 200),
                p.random(100, 200),
                p.random(200, 255),
                255
            );
        }

        updateAndDraw(t) {
            if (!this.active) return;

            // this.lifespan--;

            // // 寿命が尽きたらリセット
            // if (this.lifespan <= 0) {
            //     this.reset();
            //     return;
            // }

            // WebGL座標をノイズ計算用に正規化
            let nx = this.p.x / noiseScale;
            let ny = this.p.y / noiseScale;

            let curl = curlNoiseTime(nx, ny, t);
            let mouseForce = calculateMouseMotionForce(this.p);

            this.p.x += (curl.x + mouseForce.x) * this.stepSize * 0.1;
            this.p.y += (curl.y + mouseForce.y) * this.stepSize * 0.1;

            // WebGL座標を2Dバッファ座標に変換して描画
            let x1 = this.pOld.x + p.width / 2;
            let y1 = this.pOld.y + p.height / 2;
            let x2 = this.p.x + p.width / 2;
            let y2 = this.p.y + p.height / 2;

            // オフスクリーンバッファに描画
            buffer.stroke(this.color);
            buffer.strokeWeight(strokeWidth * this.stepSize);
            buffer.line(x1, y1, x2, y2);

            // 画面外に出た場合リセット
            if (this.isOutsideScreen()) {
                this.reset();
            } else {
                // 前の位置を更新
                this.pOld.set(this.p);
            }
        }

        reset() {
            // WEBGL座標系に合わせてリセット
            this.p.x = p.random(-p.width / 2, p.width / 2);
            this.p.y = p.random(-p.height / 2, p.height / 2);
            this.pOld.set(this.p);
            // this.lifespan = p.random(500, 1000);
            // 色も更新
            this.color = p.color(
                p.random(100, 200),
                p.random(100, 200),
                p.random(200, 255),
                p.random(70, 100)
            );
        }

        isOutsideScreen() {
            // WEBGL座標系での画面外チェック
            return (this.p.x < -p.width / 2 - 10 || this.p.x > p.width / 2 + 10 ||
                this.p.y < -p.height / 2 - 10 || this.p.y > p.height / 2 + 10);
        }
    }
};

new p5(sketch);