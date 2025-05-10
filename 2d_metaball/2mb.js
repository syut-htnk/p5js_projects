let sketch = (p) => {

    let theShader; // シェーダーを保持する変数
    let graphics;  // シェーダーを適用するグラフィックスオブジェクト

    p.preload = function () {
        // シェーダーファイルの読み込み
        // シェーダーファイルはこのスクリプトと同じディレクトリにあるべき
        theShader = p.loadShader('shader.vert', 'shader.frag');
    }

    p.setup = function () {
        p.createCanvas(p.windowWidth, p.windowHeight, p.P2D);
        p.noStroke();

        // シェーダーを適用するためのグラフィックスオブジェクト（オフスクリーンバッファ）を作成
        graphics = p.createGraphics(p.windowWidth, p.windowHeight, p.WEBGL);
        graphics.noStroke();
    }

    p.draw = function () {
        // メインキャンバスをクリア
        p.background(220);

        // シェーダーを適用したグラフィックスオブジェクトを描画
        graphics.shader(theShader);

        // シェーダーのユニフォーム変数を設定
        let [w, h] = [graphics.width, graphics.height];
        theShader.setUniform('u_resolution', [w, h]); // 画面の解像度
        theShader.setUniform('u_time', p.millis() / 1000.0); // 経過時間

        // graphicsオブジェクトに四角形を描画 (シェーダーが適用される)
        graphics.rect(-w, -h, w * 2, h * 2);

        // シェーダーが適用されたgraphicsオブジェクトをメインのキャンバスに描画
        p.image(graphics, 0, 0);

        // (オプション) シェーダーを適用しない通常の描画
        p.fill(255, 100, 0);
        p.ellipse(50, 50, 50, 50);
    }

    p.windowResized = function () {
        // ウィンドウサイズが変更されたときにキャンバスのサイズを更新
        p.resizeCanvas(p.windowWidth, p.windowHeight);
        graphics.resizeCanvas(p.windowWidth, p.windowHeight);
    }
}

// スケッチを使用して新しいp5インスタンスを作成
new p5(sketch);