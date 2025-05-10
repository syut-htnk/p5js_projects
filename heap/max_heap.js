let sketch = (p) => {

    let array = [];
    let element_num = 16;
    let current_heap_size = 0;

    // ソート処理の状態管理
    let is_sorting = false;
    let sort_state = "idle"; // "idle", "building", "sorting"
    let sort_index = 0;
    let last_step_time = 0;
    let step_delay = 1000; // ミリ秒単位でのステップ間の遅延（初期値を早めに）

    // 現在処理中のノードを追跡
    let active_nodes = [];
    let comparison_nodes = [];
    let swapping_nodes = [];
    
    // 詳細説明用のテキスト
    let explanation_text = "";

    p.setup = function () {
        p.createCanvas(1024, 768, p.P2D);
        p.noStroke();

        p.initialize_array();
        
        // スタートボタンを追加
        let button = p.createButton('ソート開始');
        button.position(p.width/2 - 170, p.height - 50);
        button.mousePressed(p.start_sort);
        
        // リセットボタンの追加
        let resetButton = p.createButton('リセット');
        resetButton.position(p.width/2 + 120, p.height - 50);
        resetButton.mousePressed(p.reset_sort);
        
        // 一時停止/再開ボタン
        let pauseButton = p.createButton('一時停止/再開');
        pauseButton.position(p.width/2 - 50, p.height - 50);
        pauseButton.mousePressed(() => { is_sorting = !is_sorting; });
        
        // 1ステップ進むボタン
        let stepButton = p.createButton('1ステップ');
        stepButton.position(p.width/2 + 30, p.height - 50);
        stepButton.mousePressed(() => { 
            if (!is_sorting) {
                p.process_next_sort_step();
                last_step_time = p.millis();
            }
        });
        
        // 速度調整スライダー
        let speedLabel = p.createDiv('速度:');
        speedLabel.position(p.width/2 - 170, p.height - 80);
        let speedSlider = p.createSlider(50, 1000, step_delay, 50);
        speedSlider.position(p.width/2 - 130, p.height - 80);
        speedSlider.style('width', '300px');
        speedSlider.input(() => { step_delay = 1050 - speedSlider.value(); });
    }

    p.draw = function () {
        p.background(20);
        p.show_array_state();
        p.show_binary_tree();
        p.show_explanation();
        
        // ソート中の場合、次のステップを実行
        if (is_sorting && p.millis() - last_step_time > step_delay) {
            p.process_next_sort_step();
            last_step_time = p.millis();
        }
    }

    // 詳細説明を表示
    p.show_explanation = function() {
        p.fill(200, 200, 255);
        p.textSize(14);
        p.textAlign(p.LEFT, p.TOP);
        p.text(explanation_text, 30, p.height - 150, p.width - 60, 80);
    }

    // ソート開始関数
    p.start_sort = function() {
        if (!is_sorting && sort_state === "idle") {
            is_sorting = true;
            sort_state = "building";
            sort_index = p.floor(element_num / 2) - 1;
            current_heap_size = element_num;
            last_step_time = p.millis();
            explanation_text = "ヒープ構築を開始します。葉ノード以外から始めて、最大ヒープを構築していきます。";
        }
    }
    
    // リセット関数
    p.reset_sort = function() {
        is_sorting = false;
        sort_state = "idle";
        p.initialize_array();
        current_heap_size = element_num;
        active_nodes = [];
        comparison_nodes = [];
        swapping_nodes = [];
        explanation_text = "リセットしました。「ソート開始」ボタンを押すとヒープソートを開始します。";
    }

    // ソートの次のステップを処理
    p.process_next_sort_step = function() {
        // ハイライト情報をリセット
        active_nodes = [];
        comparison_nodes = [];
        swapping_nodes = [];
        
        if (sort_state === "building") {
            // ヒープ構築フェーズ
            if (sort_index >= 0) {
                active_nodes = [sort_index];
                explanation_text = `インデックス ${sort_index} のノードからmax_heapifyを実行中。子ノードと比較して大きい値を親に持ってきます。`;
                p.max_heapify_step(sort_index);
                sort_index--;
            } else {
                // ヒープ構築完了、ソートフェーズへ
                sort_state = "sorting";
                sort_index = element_num - 1;
                explanation_text = "最大ヒープの構築が完了しました。ルートノード（最大値）と末尾要素を交換し、ヒープサイズを縮小しながらソートを進めます。";
            }
        } else if (sort_state === "sorting") {
            // ソートフェーズ
            if (sort_index > 0) {
                swapping_nodes = [0, sort_index];
                explanation_text = `ルートノード（最大値: ${array[0]}）とインデックス ${sort_index} の要素（${array[sort_index]}）を交換し、ヒープサイズを${current_heap_size}から${current_heap_size-1}に縮小します。`;
                p.swap(0, sort_index);
                current_heap_size--;
                active_nodes = [0];
                p.max_heapify_step(0);
                sort_index--;
            } else {
                // ソート完了
                is_sorting = false;
                sort_state = "idle";
                explanation_text = "ソートが完了しました。配列は昇順にソートされています。";
            }
        }
    }

    p.get_left_child = function (i) { return 2 * i + 1; }
    p.get_right_child = function (i) { return 2 * i + 2; }
    p.get_parent = function (i) { return p.floor((i - 1) / 2); }
    p.swap = function (i, j) {
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }

    // 非再帰的なmax_heapify関数（ステップ単位で実行可能）
    p.max_heapify_step = function (i) {
        let left_child = p.get_left_child(i);
        let right_child = p.get_right_child(i);
        let largest = i;

        // 比較ノードを記録
        comparison_nodes = [];
        if (left_child < current_heap_size) {
            comparison_nodes.push(left_child);
        }
        if (right_child < current_heap_size) {
            comparison_nodes.push(right_child);
        }

        if (left_child < current_heap_size && array[left_child] > array[largest]) {
            largest = left_child;
        }

        if (right_child < current_heap_size && array[right_child] > array[largest]) {
            largest = right_child;
        }

        if (largest != i) {
            swapping_nodes = [i, largest];
            p.swap(i, largest);
            // 次のステップで子ノードを処理
            active_nodes = [largest];
            if (largest < current_heap_size) {
                p.max_heapify_step(largest);
            }
        }
    }

    // 以下の関数は変更なし
    p.max_heapify = function (i) {
        // ...existing code...
    }

    p.build_max_heap = function () {
        // ...existing code...
    }

    p.heap_sort = function () {
        // ...existing code...
    }

    // show array state - 棒グラフ表示を追加
    p.show_array_state = function () {
        p.fill(255);
        p.textFont("Courier New");
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(24);
        p.text("Max Heap Visualization", p.width / 2, 30);

        // ソート状態の表示
        p.textSize(16);
        let stateText = "";
        if (sort_state === "building") {
            stateText = "ヒープを構築中...";
        } else if (sort_state === "sorting") {
            stateText = "ソート中...";
        } else if (is_sorting === false && sort_state === "idle") {
            stateText = "ソート完了";
        } else {
            stateText = "初期状態";
        }
        p.text(stateText, p.width / 2, 60);
        p.text("Heap Size: " + current_heap_size, p.width / 2, 80);

        // 棒グラフとして配列要素を表示
        let bar_width = p.width * 0.8 / element_num;
        for (let i = 0; i < element_num; i++) {
            // 色の設定 - アクティブ、比較中、交換中のノードを強調
            if (swapping_nodes.includes(i)) {
                p.fill(255, 150, 0); // 交換中は橙色
            } else if (active_nodes.includes(i)) {
                p.fill(255, 0, 0); // アクティブは赤色
            } else if (comparison_nodes.includes(i)) {
                p.fill(0, 150, 255); // 比較中は青色
            } else if (sort_state === "sorting" && i >= current_heap_size) {
                p.fill(0, 255, 0); // ソート済み部分は緑色
            } else {
                p.fill(200, 200, 200); // 通常は白色
            }
            
            let x = i * bar_width + p.width * 0.1;
            let y = p.height - 120;
            let bar_height = -array[i] * 2; // 高さは値に比例
            
            // 棒グラフを描画
            p.rect(x, y, bar_width - 2, bar_height);
            
            // 値を表示
            p.fill(255);
            p.text(array[i], x + bar_width / 2, y + bar_height - 15);

            // インデックスを表示
            p.fill(255, 200, 200);
            p.text(i, x + bar_width / 2, y + 15);
        }
    }

    // show binary tree - ノードの強調表示を追加
    p.show_binary_tree = function () {
        // Tree visualization parameters
        let y_start = 130;
        let level_height = 70;
        let max_width = p.width * 0.8;
        let x_start = p.width * 0.1; 
        
        // For each node in the heap
        for (let i = 0; i < element_num; i++) {
            // 現在のヒープ外のノードは薄く表示
            let is_in_heap = i < current_heap_size;
            
            // Calculate level (0-indexed) and position within level
            let level = Math.floor(Math.log2(i + 1));
            let nodes_in_level = Math.pow(2, level);
            let position_in_level = i - (Math.pow(2, level) - 1);
            
            // Calculate x and y coordinates
            let x_spacing = max_width / nodes_in_level;
            let x = x_start + x_spacing * (position_in_level + 0.5);
            let y = y_start + level * level_height;
            
            // Draw connection to parent (if not root)
            if (i > 0 && is_in_heap) {
                let parent_index = p.get_parent(i);
                let parent_level = Math.floor(Math.log2(parent_index + 1));
                let parent_position = parent_index - (Math.pow(2, parent_level) - 1);
                
                let parent_x_spacing = max_width / Math.pow(2, parent_level);
                let parent_x = x_start + parent_x_spacing * (parent_position + 0.5);
                let parent_y = y_start + parent_level * level_height;
                
                // 親子関係の線の色を設定
                if ((swapping_nodes.includes(i) && swapping_nodes.includes(parent_index)) ||
                    (comparison_nodes.includes(i) && active_nodes.includes(parent_index))) {
                    p.stroke(255, 150, 0, 200); // 交換/比較中の線は橙色
                    p.strokeWeight(2);
                } else {
                    p.stroke(150, 150, 150, is_in_heap ? 200 : 100);
                    p.strokeWeight(1);
                }
                p.line(x, y - 15, parent_x, parent_y + 15);
            }
            
            // ノードの色を設定
            if (!is_in_heap) {
                p.fill(100, 100, 100, 150); // ヒープ外は薄いグレー
            } else if (swapping_nodes.includes(i)) {
                p.fill(255, 150, 0); // 交換中は橙色
            } else if (active_nodes.includes(i)) {
                p.fill(255, 50, 50); // アクティブは赤色
            } else if (comparison_nodes.includes(i)) {
                p.fill(50, 150, 255); // 比較中は青色
            } else if (sort_state === "sorting" && i >= current_heap_size) {
                p.fill(50, 200, 50); // ソート済みは緑色
            } else {
                p.fill(220, 220, 220); // 通常は白色
            }
            
            // Draw node
            p.noStroke();
            let node_size = is_in_heap ? 35 : 25;
            p.ellipse(x, y, node_size, node_size);
            
            // Draw node value
            p.fill(0);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(is_in_heap ? 14 : 10);
            p.text(array[i], x, y);
        }
        p.noStroke();
    }

    // initialize array
    p.initialize_array = function () {
        array = [];
        for (let i = 0; i < element_num; i++) {
            array[i] = p.floor(p.random(1, 100));
        }
        explanation_text = "配列が初期化されました。「ソート開始」ボタンを押すとヒープソートを開始します。";
    }
}

new p5(sketch);