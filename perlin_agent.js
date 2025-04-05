let sketch = function (p) {
    // 設定パラメータ
    let backgroundColor = 15; // 暗い背景色
    let fadeAmount = 50; // 背景の透明度（低いほど軌跡が長く残る）
    let agents = [];
    let num_agents = 500;
    let step_size = 2;
    let agent_color = [200, 100, 0];
    let trail_color = [0, 255, 100, 150]; // 軌跡に透明度を追加
    let noise_scale = 0.01; // Perlinノイズのスケール
    let fadeEnabled = true; // フェード効果の切り替え

    // ノイズマップの最適化パラメータ
    let gridSize = 2; // グリッドの間隔（高いほど粗いが速い）
    let timeSpeed = 0.0005; // 時間の経過速度（高いほど速く変化）
    let noiseMap = [];
    let showNoiseMap = true; // ノイズマップの表示切替

    p.setup = function () {
        p.createCanvas(window.innerWidth, window.innerHeight);
        p.background(backgroundColor);
        createAgents();
        p.frameRate(60);
        // 初期ノイズマップ生成
        noiseMap = createNoiseMap();
    }

    p.draw = function () {
        // 半透明の背景を描画して軌跡を徐々にフェードアウト
        if (fadeEnabled) {
            p.background(backgroundColor, fadeAmount);
        }

        // 毎フレーム時間ベースでノイズマップを更新
        noiseMap = createNoiseMap();

        // ノイズマップを描画（表示設定がオンの場合のみ）
        if (showNoiseMap) {
            drawNoiseMap(noiseMap);
        }

        // エージェントを更新して表示
        updateAndDisplayAgents();

        // 情報表示
        displayInfo();
    }

    p.keyPressed = function () {
        if (p.key === 'r' || p.key === 'R') {
            resetAgents();
            p.background(backgroundColor); // 軌跡も完全にリセット
        } else if (p.key === '+') {
            step_size = Math.min(step_size + 0.5, 10);
        } else if (p.key === '-') {
            step_size = Math.max(step_size - 0.5, 0.5);
        } else if (p.key === 'f' || p.key === 'F') {
            fadeEnabled = !fadeEnabled;
        } else if (p.key === '[') {
            fadeAmount = Math.max(fadeAmount - 2, 1);
        } else if (p.key === ']') {
            fadeAmount = Math.min(fadeAmount + 2, 50);
        } else if (p.key === 'c' || p.key === 'C') {
            p.background(backgroundColor); // 軌跡をクリア
        } else if (p.key === 'n' || p.key === 'N') {
            noise_scale = p.constrain(noise_scale + 0.002, 0.001, 0.1);
        } else if (p.key === 'm' || p.key === 'M') {
            noise_scale = p.constrain(noise_scale - 0.002, 0.001, 0.1);
        } else if (p.key === 'g' || p.key === 'G') {
            // グリッドサイズを調整（間引き具合を調整）
            gridSize = p.constrain(gridSize + 2, 2, 30);
        } else if (p.key === 'h' || p.key === 'H') {
            gridSize = p.constrain(gridSize - 2, 2, 30);
        } else if (p.key === 't' || p.key === 'T') {
            // 時間速度を上げる
            timeSpeed = p.constrain(timeSpeed * 1.2, 0.0001, 0.01);
        } else if (p.key === 'y' || p.key === 'Y') {
            // 時間速度を下げる
            timeSpeed = p.constrain(timeSpeed / 1.2, 0.0001, 0.01);
        } else if (p.key === 'd' || p.key === 'D') {
            // ノイズマップの表示/非表示を切り替え
            showNoiseMap = !showNoiseMap;
        }
    }

    function createAgents() {
        agents = [];
        for (let i = 0; i < num_agents; i++) {
            let x = p.random(p.width);
            let y = p.random(p.height);
            agents.push(new Agent(x, y, step_size, agent_color, trail_color));
        }
    }

    function resetAgents() {
        for (let agent of agents) {
            agent.reset();
        }
    }

    function updateAndDisplayAgents() {
        for (let i = 0; i < agents.length; i++) {
            agents[i].update();
            agents[i].show();
        }
        agents = agents.filter(agent => !agent.is_dead);

        // すべてのエージェントが死んだら新しいエージェントを作成
        if (agents.length === 0) {
            createAgents();
        }
    }

    function displayInfo() {
        p.fill(255);
        p.noStroke();
        p.textSize(14);

        // 背景を半透明にして読みやすくする
        p.fill(0, 150);
        p.rect(5, 5, 220, 305, 5);

        p.fill(255);
        p.text('Agents: ' + agents.length, 15, 30);
        p.text('Step Size: ' + step_size.toFixed(1), 15, 50);
        p.text('Fade Amount: ' + fadeAmount, 15, 70);
        p.text('Fade Effect: ' + (fadeEnabled ? 'ON' : 'OFF'), 15, 90);
        p.text('Noise Scale: ' + noise_scale.toFixed(3), 15, 110);
        p.text('Grid Size: ' + gridSize, 15, 130);
        p.text('Time Speed: ' + timeSpeed.toFixed(5), 15, 150);
        p.text('Show Noise: ' + (showNoiseMap ? 'ON' : 'OFF'), 15, 170);

        p.text('Controls:', 15, 200);
        p.text('R - Reset agents', 15, 220);
        p.text('F - Toggle fade effect', 15, 240);
        p.text('[ / ] - Adjust fade amount', 15, 260);
        p.text('N / M - Adjust noise scale', 15, 280);
        p.text('T / Y - Adjust time speed', 15, 300);
    }

    function createNoiseMap() {
        // 時間ベースのノイズマップ生成
        let map = [];
        // 現在の時間を取得して滑らかな変化を作る
        let timeOffset = p.millis() * timeSpeed;
        
        // 縦横をgridSizeごとに間引いてノイズを計算
        for (let x = 0; x < p.width; x += gridSize) {
            map[x] = [];
            for (let y = 0; y < p.height; y += gridSize) {
                // 第3引数に時間を追加して動的に変化させる
                map[x][y] = p.noise(x * noise_scale, y * noise_scale, timeOffset);
            }
        }
        return map;
    }

    function drawNoiseMap(noiseMap) {
        p.strokeWeight(gridSize * 0.8); // グリッドサイズに応じた点の大きさ

        // ノイズマップの間引かれた点のみを描画
        for (let x = 0; x < p.width; x += gridSize) {
            if (!noiseMap[x]) continue;

            for (let y = 0; y < p.height; y += gridSize) {
                if (!noiseMap[x][y]) continue;

                let brightness = p.map(noiseMap[x][y], 0, 1, 0, 255);
                p.stroke(brightness);
                p.point(x, y);
            }
        }

        p.strokeWeight(1); // 元に戻す
    }

    class Agent {
        constructor(x, y, step_size, agent_color, trail_color) {
            this.pos = p.createVector(x, y);
            this.pos_old = p.createVector(x, y);
            this.is_dead = false;
            this.step_size = step_size;
            this.angle = 0;
            this.agent_color = agent_color;
            this.trail_color = trail_color;
            this.size = 3;
        }

        update() {
            // 時間ベースのPerlinノイズでより滑らかな動きを生成
            // エージェントの動きにも時間要素を取り入れる
            let timeOffset = p.millis() * timeSpeed * 0.1;
            this.angle = p.map(p.noise(this.pos.x * noise_scale, this.pos.y * noise_scale, timeOffset), 0, 1, 0, p.TWO_PI * 2);
            
            // 古い位置を保存
            this.pos_old.x = this.pos.x;
            this.pos_old.y = this.pos.y;
            
            // 位置を更新
            this.pos.x += this.step_size * p.cos(this.angle);
            this.pos.y += this.step_size * p.sin(this.angle);

            // 画面外に出たら死亡フラグを立てる
            this.check_edges();
        }

        show() {
            // 線を描画
            p.stroke(this.trail_color);
            p.strokeWeight(1.5);
            p.line(this.pos.x, this.pos.y, this.pos_old.x, this.pos_old.y);
            
            // エージェントを描画
            p.noStroke();
            p.fill(this.agent_color);
            p.ellipse(this.pos.x, this.pos.y, this.size, this.size);
        }

        check_edges() {
            if (this.pos.x > p.width || this.pos.x < 0 || 
                this.pos.y > p.height || this.pos.y < 0) {
                this.is_dead = true;
                // 画面外に出た場合、エージェントをリセット
                this.reset();
            }
        }

        reset() {
            this.pos.x = p.random(p.width);
            this.pos.y = p.random(p.height);
            this.pos_old.x = this.pos.x;
            this.pos_old.y = this.pos.y;
            this.is_dead = false;
        }

        set_position(x, y) {
            this.pos.x = x;
            this.pos.y = y;
            this.pos_old.x = x;
            this.pos_old.y = y;
        }
    }
};

new p5(sketch);Ï