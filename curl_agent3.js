let sketch = function (p) {
    // 基本設定
    let agents = [];
    let agentsCount = 5000;
    let noiseScale = 1000;
    let noiseStrength = 5;
    let overlayAlpha = 20;
    let strokeWidth = 0.2;
    let drawMode = 3;
    let time = 0;
    let timeSpeed = 0.001;

    // ノイズマップ設定
    let showNoiseMap = false;
    let noiseMapMode = 3;  // 1: 点, 2: 線, 3: 矢印
    let noiseGridSize = 10;
    let noiseMapAlpha = 100;

    p.setup = function () {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.background(255);
        p.smooth();
        p.frameRate(60);
        p.pixelDensity(2);

        // エージェントの初期化
        for (let i = 0; i < agentsCount; i++) {
            agents.push(new Agent());
        }
    };

    p.draw = function () {
        time += timeSpeed;

        // 半透明の背景で軌跡を徐々にフェードアウト
        p.fill(255, overlayAlpha);
        p.noStroke();
        p.rect(0, 0, p.width, p.height);

        // ノイズマップを表示
        if (showNoiseMap) {
            drawNoiseMap();
        }

        // エージェントの描画
        p.stroke(0, 100);
        for (let i = 0; i < agents.length; i++) {
            if (drawMode === 1) {
                agents[i].updateCurl();
            } else if (drawMode === 2) {
                agents[i].updateNormal();
            } else if (drawMode === 3) {
                agents[i].updateCurlTime(time);
            }
        }

        // 簡易情報表示
        if (showNoiseMap) {
            p.fill(0);
            p.noStroke();
            p.textSize(12);
            p.text("Mode: " + (drawMode === 1 ? "Curl" : "Normal") +
                ", Map: " + noiseMapMode +
                ", V: toggle map, B: change mode", 10, 20);
        }
    };

    // ノイズマップを描画する関数
    function drawNoiseMap() {
        p.push();
        p.strokeWeight(.5);

        for (let x = 0; x < p.width; x += noiseGridSize * 3) {
            for (let y = 0; y < p.height; y += noiseGridSize * 3) {
                let angle;
                let magnitude;

                if (drawMode === 1) {
                    let curl = curlNoise(x / noiseScale, y / noiseScale);
                    angle = p.atan2(curl.y, curl.x);
                    magnitude = curl.mag();
                } else if (drawMode === 2) {
                    angle = p.noise(x / noiseScale, y / noiseScale) * p.TWO_PI * 2;
                    magnitude = noiseStrength;
                } else if (drawMode === 3) {
                    let curl = curlNoiseTime(x / noiseScale, y / noiseScale, time);
                    angle = p.atan2(curl.y, curl.x);
                    magnitude = curl.mag();
                }

                let brightness = p.map(magnitude, 0, noiseStrength, 50, 255);
                p.stroke(brightness, noiseMapAlpha);

                drawArrow(x, y, angle, noiseGridSize * 1.5);
            }
        }

        p.pop();
    }

    // 矢印を描画する関数
    function drawArrow(x, y, angle, length) {
        // Set arrow color to red
        p.stroke(0, 0, 0, noiseMapAlpha);

        let endX = x + p.cos(angle) * length;
        let endY = y + p.sin(angle) * length;

        p.line(x, y, endX, endY);

        let arrowSize = length * 0.3;
        let backAngle = angle + p.PI;
        let arrow1X = endX + p.cos(backAngle + 0.2) * arrowSize;
        let arrow1Y = endY + p.sin(backAngle + 0.2) * arrowSize;
        let arrow2X = endX + p.cos(backAngle - 0.2) * arrowSize;
        let arrow2Y = endY + p.sin(backAngle - 0.2) * arrowSize;

        p.line(endX, endY, arrow1X, arrow1Y);
        p.line(endX, endY, arrow2X, arrow2Y);
    }

    // キーボード操作
    p.keyPressed = function () {
        if (p.key === '1') drawMode = 1;  // カールノイズモード
        if (p.key === '2') drawMode = 2;  // 通常ノイズモード
        if (p.key === ' ') p.noiseSeed(p.floor(p.random(100000)));  // 新しいノイズパターン
        if (p.keyCode === p.BACKSPACE) p.background(255);  // 画面クリア
        if (p.key === 's' || p.key === 'S') p.saveCanvas('flowfield', 'png');  // 保存

        // ノイズマップ表示制御
        if (p.key === 'v' || p.key === 'V') showNoiseMap = !showNoiseMap;  // 表示切替
        if (p.key === 'b' || p.key === 'B') noiseMapMode = (noiseMapMode % 3) + 1;  // モード切替
        if (p.key === 'g' || p.key === 'G') noiseGridSize = p.constrain(noiseGridSize + 2, 4, 50);  // グリッドサイズ増加
        if (p.key === 'h' || p.key === 'H') noiseGridSize = p.constrain(noiseGridSize - 2, 4, 50);  // グリッドサイズ減少
    };

    // カールノイズの生成
    function curlNoise(x, y) {
        let n = p.noise(x, y) * noiseStrength;
        let dx = p.noise((x + 0.01), y) * noiseStrength - n;
        let dy = p.noise(x, (y + 0.01)) * noiseStrength - n;
        let curl = p.createVector(dy, -dx);

        let length = curl.mag();
        if (length > 0) {
            curl.x /= length;
            curl.y /= length;
        }
        curl.mult(noiseStrength);

        return curl;
    }

    function curlNoiseTime(x, y, t) {
        let n = p.noise(x, y, t) * noiseStrength;
        let dx = p.noise((x + 0.01), y, t) * noiseStrength - n;
        let dy = p.noise(x, (y + 0.01), t) * noiseStrength - n;
        let curl = p.createVector(dy, -dx);

        let length = curl.mag();
        if (length > 0) {
            curl.x /= length;
            curl.y /= length;
        }
        curl.mult(noiseStrength);

        return curl;
    }

    function getMousePos() {
        let x = p.mouseX;
        let y = p.mouseY;

        if (x < 0) x = 0;
        if (x > p.width) x = p.width;
        if (y < 0) y = 0;
        if (y > p.height) y = p.height;

        return { x: x, y: y };
    }

    // エージェントクラス
    class Agent {
        constructor() {
            this.p = p.createVector(p.random(p.width), p.random(p.height));
            this.pOld = p.createVector(this.p.x, this.p.y);
            this.stepSize = p.random(1, 5);
        }

        updateCurl() {
            // カールノイズで更新
            let curl = curlNoise(this.p.x / noiseScale, this.p.y / noiseScale);
            this.p.x += curl.x * this.stepSize * 0.1;
            this.p.y += curl.y * this.stepSize * 0.1;

            this.drawAndReset();
        }

        updateCurlTime(t) {
            // 時間を考慮したカールノイズで更新
            let curl = curlNoiseTime(this.p.x / noiseScale, this.p.y / noiseScale, t);
            this.p.x += curl.x * this.stepSize * 0.1;
            this.p.y += curl.y * this.stepSize * 0.1;

            this.drawAndReset();
        }

        updateNormal() {
            // 通常ノイズで更新
            let angle = p.noise(this.p.x / noiseScale, this.p.y / noiseScale) * p.TWO_PI * 2;
            this.p.x += p.cos(angle) * this.stepSize;
            this.p.y += p.sin(angle) * this.stepSize;

            this.drawAndReset();
        }

        drawAndReset() {
            // 線を描画
            p.strokeWeight(strokeWidth * this.stepSize);
            p.line(this.pOld.x, this.pOld.y, this.p.x, this.p.y);

            // 画面外リセット
            if (this.isOutsideScreen()) {
                this.p.x = p.random(p.width);
                this.p.y = p.random(p.height);
            }

            // 前の位置を更新
            this.pOld.set(this.p);
        }

        isOutsideScreen() {
            return (this.p.x < -10 || this.p.x > p.width + 10 ||
                this.p.y < -10 || this.p.y > p.height + 10);
        }
    }
};

new p5(sketch);