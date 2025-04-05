let sketch = function (p) {
    // ------ エージェントの設定 ------
    let agents = [];  // エージェントの配列
    let agentsCount = 4000;  // 表示するエージェントの数
    let noiseScale = 300;  // ノイズのスケール
    let noiseStrength = 10;  // ノイズの強さ
    let overlayAlpha = 10;  // 背景の透明度
    let agentsAlpha = 90;  // エージェントの透明度
    let strokeWidth = 0.3;  // 線の太さ
    let drawMode = 1;  // 描画モード（1または2）

    // ノイズマップの表示設定
    let showNoiseMap = false;  // ノイズマップの表示/非表示
    let noiseMapAlpha = 100;  // ノイズマップの透明度
    let noiseGridSize = 20;   // ノイズマップのグリッドサイズ
    let noiseMapMode = 1;     // ノイズマップの表示モード（1: 点, 2: 線, 3: 矢印）

    // GUIパラメータ
    let showGUI = false;  // GUIの表示/非表示

    p.setup = function () {
        p.createCanvas(p.windowWidth, p.windowHeight);

        // エージェントの初期化
        for (let i = 0; i < agentsCount; i++) {
            agents.push(new Agent());
        }
    };

    p.draw = function () {
        // 半透明の背景で軌跡を徐々にフェードアウト
        p.fill(255, overlayAlpha);
        p.noStroke();
        p.rect(0, 0, p.width, p.height);

        // ノイズマップを表示
        if (showNoiseMap) {
            drawNoiseMap();
        }

        // エージェントの描画
        p.stroke(0, agentsAlpha);

        if (drawMode === 1) {
            for (let i = 0; i < agentsCount; i++) {
                agents[i].update1();
            }
        } else {
            for (let i = 0; i < agentsCount; i++) {
                agents[i].update2();
            }
        }

        // 情報表示
        displayInfo();
    };

    // ノイズマップを描画する関数
    function drawNoiseMap() {
        p.push(); // 現在の描画状態を保存
        
        if (noiseMapMode === 1) {
            // 点でノイズマップを表示
            for (let x = 0; x < p.width; x += noiseGridSize) {
                for (let y = 0; y < p.height; y += noiseGridSize) {
                    let noiseVal;
                    if (drawMode === 1) {
                        noiseVal = p.noise(x / noiseScale, y / noiseScale) * noiseStrength;
                    } else {
                        noiseVal = p.noise(x / noiseScale, y / noiseScale) * 24;
                        noiseVal = (noiseVal - Math.floor(noiseVal)) * noiseStrength;
                    }
                    
                    // ノイズ値を色に変換
                    let hue = p.map(noiseVal, 0, noiseStrength, 0, 360) % 360;
                    p.colorMode(p.HSB, 360, 100, 100, 255);
                    p.noStroke();
                    p.fill(hue, 80, 80, noiseMapAlpha);
                    p.ellipse(x, y, 4, 4);
                }
            }
        } else if (noiseMapMode === 2) {
            // 線でノイズマップを表示（ベクトル場）
            p.strokeWeight(1);
            p.stroke(100, noiseMapAlpha);
            
            for (let x = 0; x < p.width; x += noiseGridSize * 2) {
                for (let y = 0; y < p.height; y += noiseGridSize * 2) {
                    let noiseVal;
                    if (drawMode === 1) {
                        noiseVal = p.noise(x / noiseScale, y / noiseScale) * noiseStrength;
                    } else {
                        noiseVal = p.noise(x / noiseScale, y / noiseScale) * 24;
                        noiseVal = (noiseVal - Math.floor(noiseVal)) * noiseStrength;
                    }
                    
                    let len = noiseGridSize * 0.8;
                    let endX = x + p.cos(noiseVal) * len;
                    let endY = y + p.sin(noiseVal) * len;
                    
                    p.line(x, y, endX, endY);
                }
            }
        } else if (noiseMapMode === 3) {
            // 矢印でノイズマップを表示
            p.strokeWeight(1);
            
            for (let x = 0; x < p.width; x += noiseGridSize * 3) {
                for (let y = 0; y < p.height; y += noiseGridSize * 3) {
                    let noiseVal;
                    if (drawMode === 1) {
                        noiseVal = p.noise(x / noiseScale, y / noiseScale) * noiseStrength;
                    } else {
                        noiseVal = p.noise(x / noiseScale, y / noiseScale) * 24;
                        noiseVal = (noiseVal - Math.floor(noiseVal)) * noiseStrength;
                    }
                    
                    let hue = p.map(noiseVal, 0, noiseStrength, 0, 360) % 360;
                    p.colorMode(p.HSB, 360, 100, 100, 255);
                    p.stroke(hue, 80, 80, noiseMapAlpha);
                    
                    drawArrow(x, y, noiseVal, noiseGridSize * 1.5);
                }
            }
        }
        
        p.colorMode(p.RGB, 255); // 元のカラーモードに戻す
        p.pop(); // 保存した描画状態に戻す
    }
    
    // 矢印を描画する関数
    function drawArrow(x, y, angle, length) {
        let endX = x + p.cos(angle) * length;
        let endY = y + p.sin(angle) * length;
        
        p.line(x, y, endX, endY);
        
        // 矢印の先端
        let arrowSize = length * 0.3;
        let backAngle = angle + p.PI;
        let arrow1X = endX + p.cos(backAngle + 0.3) * arrowSize;
        let arrow1Y = endY + p.sin(backAngle + 0.3) * arrowSize;
        let arrow2X = endX + p.cos(backAngle - 0.3) * arrowSize;
        let arrow2Y = endY + p.sin(backAngle - 0.3) * arrowSize;
        
        p.line(endX, endY, arrow1X, arrow1Y);
        p.line(endX, endY, arrow2X, arrow2Y);
    }

    // キーボード入力の処理
    p.keyPressed = function () {
        if (p.key === 'm' || p.key === 'M') {
            showGUI = !showGUI;
        }

        if (p.key === '1') drawMode = 1;
        if (p.key === '2') drawMode = 2;

        if (p.key === 's' || p.key === 'S') {
            p.saveCanvas('perlin_' + timestamp(), 'png');
        }

        if (p.key === ' ') {
            // 新しいノイズシードを設定
            let newNoiseSeed = p.floor(p.random(100000));
            console.log("newNoiseSeed: " + newNoiseSeed);
            p.noiseSeed(newNoiseSeed);
        }

        if (p.keyCode === p.DELETE || p.keyCode === p.BACKSPACE) {
            p.background(255); // 画面をクリア
        }

        // 追加のコントロール
        if (p.key === '+') {
            agentsCount = Math.min(agentsCount + 100, agents.length);
        }
        if (p.key === '-') {
            agentsCount = Math.max(agentsCount - 100, 1);
        }
        if (p.key === 'n' || p.key === 'N') {
            noiseScale = p.constrain(noiseScale + 10, 10, 1000);
        }
        if (p.key === 'k' || p.key === 'K') {
            noiseScale = p.constrain(noiseScale - 10, 10, 1000);
        }
        if (p.key === '[') {
            noiseStrength = p.constrain(noiseStrength - 0.5, 0, 100);
        }
        if (p.key === ']') {
            noiseStrength = p.constrain(noiseStrength + 0.5, 0, 100);
        }
        
        // ノイズマップの表示制御
        if (p.key === 'v' || p.key === 'V') {
            showNoiseMap = !showNoiseMap;
        }
        if (p.key === 'b' || p.key === 'B') {
            noiseMapMode = (noiseMapMode % 3) + 1;
        }
        if (p.key === 'g' || p.key === 'G') {
            noiseGridSize = p.constrain(noiseGridSize + 2, 4, 50);
        }
        if (p.key === 'h' || p.key === 'H') {
            noiseGridSize = p.constrain(noiseGridSize - 2, 4, 50);
        }
    };

    // 情報表示関数
    function displayInfo() {
        if (showGUI) {
            p.fill(0, 150);
            p.noStroke();
            p.rect(10, 10, 250, 280, 5);

            p.fill(255);
            p.textSize(14);
            p.text("Agent Count: " + agentsCount, 20, 35);
            p.text("Noise Scale: " + noiseScale.toFixed(0), 20, 55);
            p.text("Noise Strength: " + noiseStrength.toFixed(1), 20, 75);
            p.text("Draw Mode: " + drawMode, 20, 95);
            p.text("Show Noise Map: " + (showNoiseMap ? "ON" : "OFF"), 20, 115);
            p.text("Noise Map Mode: " + noiseMapMode, 20, 135);
            p.text("Grid Size: " + noiseGridSize, 20, 155);

            p.text("Controls:", 20, 185);
            p.text("1/2 - Change mode, SPACE - New noise seed", 20, 205);
            p.text("V - Toggle noise map, B - Change map mode", 20, 225);
            p.text("G/H - Adjust grid size", 20, 245);
            p.text("M - Toggle GUI, S - Save PNG", 20, 265);
            p.text("BACKSPACE - Clear screen", 20, 285);
        }
    }

  // Agent クラス
  class Agent {
    constructor() {
      this.p = p.createVector(p.random(p.width), p.random(p.height));
      this.pOld = p.createVector(this.p.x, this.p.y);
      this.stepSize = p.random(1, 5);
      this.isOutside = false;
    }
    
    update1() {
      // ノイズベースの角度計算（モード1）
      this.angle = p.noise(this.p.x / noiseScale, this.p.y / noiseScale) * noiseStrength;
      
      // 位置の更新
      this.p.x += p.cos(this.angle) * this.stepSize;
      this.p.y += p.sin(this.angle) * this.stepSize;
      
      // 画面外チェック
      this.checkEdges();
      
      // 線を描画
      p.strokeWeight(strokeWidth * this.stepSize);
      p.line(this.pOld.x, this.pOld.y, this.p.x, this.p.y);
      
      // 前の位置を更新
      this.pOld.set(this.p);
      
      this.isOutside = false;
    }
    
    update2() {
      // ノイズベースの角度計算（モード2）
      this.angle = p.noise(this.p.x / noiseScale, this.p.y / noiseScale) * 24;
      this.angle = (this.angle - Math.floor(this.angle)) * noiseStrength;
      
      // 位置の更新
      this.p.x += p.cos(this.angle) * this.stepSize;
      this.p.y += p.sin(this.angle) * this.stepSize;
      
      // 画面外チェック
      this.checkEdges();
      
      // 線を描画
      p.strokeWeight(strokeWidth * this.stepSize);
      p.line(this.pOld.x, this.pOld.y, this.p.x, this.p.y);
      
      // 前の位置を更新
      this.pOld.set(this.p);
      
      this.isOutside = false;
    }
    
    checkEdges() {
      if (this.p.x < -10) this.isOutside = true;
      else if (this.p.x > p.width + 10) this.isOutside = true;
      else if (this.p.y < -10) this.isOutside = true;
      else if (this.p.y > p.height + 10) this.isOutside = true;
      
      if (this.isOutside) {
        this.p.x = p.random(p.width);
        this.p.y = p.random(p.height);
        this.pOld.set(this.p);
      }
    }
  }
};

// P5.jsのインスタンスを作成して実行
new p5(sketch);