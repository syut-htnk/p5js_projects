let sketch = function (p) {
    // 基本設定
    let agents = [];
    let agentsCount = 20000;
    let noiseScale = 1500;
    let noiseStrength = 5;
    let overlayAlpha = 20;
    let strokeWidth = 0.2;
    let drawMode = 3;
    let time = 0;
    let timeSpeed = 0.001;

    // ノイズマップ設定
    let showNoiseMap = false;
    let noiseMapMode = 3;
    let noiseGridSize = 10;
    let noiseMapAlpha = 100;

    // マウス相互作用設定
    let mouseForceStrength = 15;
    let mouseForceRadius = 128;
    let mouseForceActive = false;
    let mouseAttract = false; // true: 引力, false: 斥力
    let mousePos = { x: 0, y: 0 };
    let prevMousePos = { x: 0, y: 0 };
    let mouseVelocity = { x: 0, y: 0 };
    let mouseSpeedThreshold = 2; // マウス移動速度の閾値
    let mouseForceDecay = 0.95; // 外力の減衰率
    let mouseTrail = []; // マウスの軌跡
    let maxTrailLength = 10; // 軌跡の最大長

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

        // マウス位置の初期化
        mousePos = getMousePos();
        prevMousePos = { x: mousePos.x, y: mousePos.y };
    };

    p.draw = function () {
        time += timeSpeed;

        // マウス位置と速度の更新
        prevMousePos = { x: mousePos.x, y: mousePos.y };
        mousePos = getMousePos();

        // マウスの速度を計算
        mouseVelocity.x = mousePos.x - prevMousePos.x;
        mouseVelocity.y = mousePos.y - prevMousePos.y;

        // マウスの速度が閾値を超えたら外力を適用
        let mouseSpeed = Math.sqrt(mouseVelocity.x * mouseVelocity.x + mouseVelocity.y * mouseVelocity.y);
        if (mouseSpeed > mouseSpeedThreshold) {
            mouseForceActive = true;

            // マウスの軌跡を追加
            addToMouseTrail(mousePos.x, mousePos.y);
        } else {
            // 速度が閾値以下なら減衰
            mouseForceActive = mouseForceActive && (mouseTrail.length > 0);
        }

        // 軌跡の減衰
        updateMouseTrail();

        // 半透明の背景で軌跡を徐々にフェードアウト
        p.fill(255, overlayAlpha);
        p.noStroke();
        p.rect(0, 0, p.width, p.height);

        // マウス影響範囲の表示
        if (mouseForceActive) {
            drawMouseMotionForce();
        }

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
        if (showNoiseMap || mouseForceActive) {
            p.fill(0);
            p.noStroke();
            p.textSize(12);
            p.text("Mode: " + (drawMode === 1 ? "Curl" : (drawMode === 2 ? "Normal" : "Time Curl")) +
                ", Mouse Speed: " + mouseSpeed.toFixed(1) +
                ", Force: " + mouseForceStrength.toFixed(1), 10, 20);
            p.text("Controls: V: toggle map, 1-3: mode, +/-: adjust force", 10, 40);
        }
    };

    // マウスの軌跡を追加
    function addToMouseTrail(x, y) {
        mouseTrail.push({
            x: x,
            y: y,
            vx: mouseVelocity.x,
            vy: mouseVelocity.y,
            age: 1.0 // 新鮮度 (1.0 = 新しい、0.0 = 古い)
        });

        // 最大長を超えたら先頭を削除
        if (mouseTrail.length > maxTrailLength) {
            mouseTrail.shift();
        }
    }

    // マウスの軌跡を更新（古いポイントを減衰）
    function updateMouseTrail() {
        for (let i = mouseTrail.length - 1; i >= 0; i--) {
            mouseTrail[i].age *= mouseForceDecay;

            // 十分に古くなったら削除
            if (mouseTrail[i].age < 0.01) {
                mouseTrail.splice(i, 1);
            }
        }
    }

    // マウスの動きに基づく外力を描画
    function drawMouseMotionForce() {
        p.push();

        // マウスの軌跡を描画
        if (mouseTrail.length > 1) {
            p.noFill();
            p.strokeWeight(2);
            p.beginShape();

            for (let i = 0; i < mouseTrail.length; i++) {
                let point = mouseTrail[i];
                let alpha = Math.floor(point.age * 200);
                p.stroke(100, 100, 255, alpha);
                p.vertex(point.x, point.y);

                // 速度ベクトルを矢印として表示
                if (i % 2 === 0) {
                    let arrowLength = Math.sqrt(point.vx * point.vx + point.vy * point.vy) * 2;
                    if (arrowLength > 5) {
                        let angle = Math.atan2(point.vy, point.vx);
                        let arrowSize = arrowLength * 0.3;

                        let endX = point.x + Math.cos(angle) * arrowLength;
                        let endY = point.y + Math.sin(angle) * arrowLength;

                        p.line(point.x, point.y, endX, endY);

                        let arrowAngle1 = angle + Math.PI * 0.8;
                        let arrowAngle2 = angle - Math.PI * 0.8;

                        let arrowX1 = endX + Math.cos(arrowAngle1) * arrowSize;
                        let arrowY1 = endY + Math.sin(arrowAngle1) * arrowSize;
                        let arrowX2 = endX + Math.cos(arrowAngle2) * arrowSize;
                        let arrowY2 = endY + Math.sin(arrowAngle2) * arrowSize;

                        p.line(endX, endY, arrowX1, arrowY1);
                        p.line(endX, endY, arrowX2, arrowY2);
                    }
                }
            }

            p.endShape();
        }

        p.pop();
    }

    // ノイズマップを描画する関数
    function drawNoiseMap() {
        p.push();

        if (noiseMapMode === 1) {
            // 点でノイズマップを表示
            for (let x = 0; x < p.width; x += noiseGridSize) {
                for (let y = 0; y < p.height; y += noiseGridSize) {
                    let val;

                    if (drawMode === 1) {
                        let curl = curlNoise(x / noiseScale, y / noiseScale);
                        val = curl.mag();
                    } else if (drawMode === 2) {
                        val = p.noise(x / noiseScale, y / noiseScale) * noiseStrength;
                    } else {
                        let curl = curlNoiseTime(x / noiseScale, y / noiseScale, time);
                        val = curl.mag();
                    }

                    let brightness = p.map(val, 0, noiseStrength, 0, 255);
                    p.noStroke();
                    p.fill(brightness, noiseMapAlpha);
                    p.ellipse(x, y, 3, 3);
                }
            }
        } else if (noiseMapMode === 2) {
            // 線でノイズマップを表示
            p.strokeWeight(1);
            p.stroke(0, noiseMapAlpha);

            for (let x = 0; x < p.width; x += noiseGridSize * 2) {
                for (let y = 0; y < p.height; y += noiseGridSize * 2) {
                    let angle;

                    if (drawMode === 1) {
                        let curl = curlNoise(x / noiseScale, y / noiseScale);
                        angle = p.atan2(curl.y, curl.x);
                    } else if (drawMode === 2) {
                        angle = p.noise(x / noiseScale, y / noiseScale) * p.TWO_PI * 2;
                    } else {
                        let curl = curlNoiseTime(x / noiseScale, y / noiseScale, time);
                        angle = p.atan2(curl.y, curl.x);
                    }

                    let len = noiseGridSize * 0.8;
                    let endX = x + p.cos(angle) * len;
                    let endY = y + p.sin(angle) * len;

                    p.line(x, y, endX, endY);
                }
            }
        } else if (noiseMapMode === 3) {
            // 矢印でノイズマップを表示
            p.strokeWeight(1);

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
                    } else {
                        let curl = curlNoiseTime(x / noiseScale, y / noiseScale, time);
                        angle = p.atan2(curl.y, curl.x);
                        magnitude = curl.mag();
                    }

                    let brightness = p.map(magnitude, 0, noiseStrength, 50, 255);
                    p.stroke(brightness, noiseMapAlpha);

                    drawArrow(x, y, angle, noiseGridSize * 1.5);
                }
            }
        }

        p.pop();
    }

    // 矢印を描画する関数
    function drawArrow(x, y, angle, length) {

        p.stroke(0, 100);

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
        if (p.key === '3') drawMode = 3;  // 時間ベースカールノイズ
        if (p.key === ' ') p.noiseSeed(p.floor(p.random(100000)));  // 新しいノイズパターン
        if (p.keyCode === p.BACKSPACE) p.background(255);  // 画面クリア
        if (p.key === 's' || p.key === 'S') p.saveCanvas('flowfield', 'png');  // 保存

        // ノイズマップ表示制御
        if (p.key === 'v' || p.key === 'V') showNoiseMap = !showNoiseMap;  // 表示切替
        if (p.key === 'b' || p.key === 'B') noiseMapMode = (noiseMapMode % 3) + 1;  // モード切替
        if (p.key === 'g' || p.key === 'G') noiseGridSize = p.constrain(noiseGridSize + 2, 4, 50);  // グリッドサイズ増加
        if (p.key === 'h' || p.key === 'H') noiseGridSize = p.constrain(noiseGridSize - 2, 4, 50);  // グリッドサイズ減少

        // マウス力の設定
        if (p.key === '+') mouseForceStrength = p.constrain(mouseForceStrength + 0.5, 0, 20);  // 力の強さを増加
        if (p.key === '-') mouseForceStrength = p.constrain(mouseForceStrength - 0.5, 0, 20);  // 力の強さを減少
        if (p.key === '[') mouseForceRadius = p.constrain(mouseForceRadius - 10, 50, 500);  // 影響範囲を減少
        if (p.key === ']') mouseForceRadius = p.constrain(mouseForceRadius + 10, 50, 500);  // 影響範囲を増加
    };

    // マウスの動きによる外力を計算
    function calculateMouseMotionForce(pos) {
        if (!mouseForceActive || mouseTrail.length === 0) return p.createVector(0, 0);

        let totalForce = p.createVector(0, 0);

        // すべての軌跡ポイントからの影響を計算
        for (let i = 0; i < mouseTrail.length; i++) {
            let point = mouseTrail[i];
            let dx = pos.x - point.x;
            let dy = pos.y - point.y;
            let distance = p.sqrt(dx * dx + dy * dy);

            if (distance > mouseForceRadius || distance < 0.1) continue;

            // 距離に応じた力の強さ
            // Normalize distance to 0-1 range
            let normalizedDist = distance / mouseForceRadius;
            // Use exponential falloff for more extreme effect
            let falloff = Math.exp(-8 * normalizedDist);
            // Final strength with age factor
            let strength = mouseForceStrength * falloff * point.age;

            // 速度方向に力を適用
            let forceX = point.vx * strength / 10;
            let forceY = point.vy * strength / 10;

            totalForce.x += forceX;
            totalForce.y += forceY;
        }

        return totalForce;
    }

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
            // カールノイズ + マウスの動きによる外力
            let curl = curlNoise(this.p.x / noiseScale, this.p.y / noiseScale);
            let mouseForce = calculateMouseMotionForce(this.p);

            // 合成力を計算
            this.p.x += (curl.x + mouseForce.x) * this.stepSize * 0.1;
            this.p.y += (curl.y + mouseForce.y) * this.stepSize * 0.1;

            this.drawAndReset();
        }

        updateCurlTime(t) {
            // 時間を考慮したカールノイズ + マウスの動きによる外力
            let curl = curlNoiseTime(this.p.x / noiseScale, this.p.y / noiseScale, t);
            let mouseForce = calculateMouseMotionForce(this.p);

            // 合成力を計算
            this.p.x += (curl.x + mouseForce.x) * this.stepSize * 0.1;
            this.p.y += (curl.y + mouseForce.y) * this.stepSize * 0.1;

            this.drawAndReset();
        }

        updateNormal() {
            // 通常ノイズ + マウスの動きによる外力
            let angle = p.noise(this.p.x / noiseScale, this.p.y / noiseScale) * p.TWO_PI * 2;
            let curl = p.createVector(p.cos(angle), p.sin(angle)).mult(noiseStrength);
            let mouseForce = calculateMouseMotionForce(this.p);

            // 合成力を計算
            this.p.x += (curl.x + mouseForce.x) * this.stepSize * 0.1;
            this.p.y += (curl.y + mouseForce.y) * this.stepSize * 0.1;

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