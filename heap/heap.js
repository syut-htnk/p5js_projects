let sketch = (p) => {

    let array = []; // 配列
    let element_num = 16; // 要素数
    let current_heap_size = 0; // 現在のヒープサイズ

    // アニメーション用の状態変数
    let sort_phase = 0; // 0:初期状態、1:ヒープ構築中、2:ソート中、3:完了
    let current_index = 0; // 現在処理中のインデックス
    let highlight_indices = []; // 強調表示するインデックス
    let current_function = ""; // 現在実行中の関数名
    let current_operation = ""; // 現在の操作の詳細説明

    // swap用のアニメーション変数
    let is_swapping = false;
    let swap_from_index = -1;
    let swap_to_index = -1;
    let swap_progress = 0;  // 0から1までの値でアニメーションの進行度を表す
    let swap_speed = 0.5;   // swap速度（1フレームあたりの進行度）

    // 次のステップに進む準備ができたかを示すフラグ
    let ready_for_next_step = true;

    // ヒープ構造更新のための一時退避変数（max_heapify再実行用）
    let pending_heapify_index = -1;
    let pending_heap_size_update = false;
    let pending_phase_update = false;

    p.setup = function () {
        p.createCanvas(p.windowWidth, p.windowHeight, p.P2D);
        p.noStroke();

        p.initialize_array();
        p.textSize(16);
        p.textAlign(p.CENTER, p.CENTER);
        p.textFont('Arial');
        p.textStyle(p.NORMAL);
        p.fill(255);

        p.frameRate(1); // アニメーションの速度を調整（swapをなめらかに表示するため速くする）

        // アニメーション初期化
        sort_phase = 1; // ヒープ構築フェーズを開始
        current_heap_size = array.length;
        current_index = Math.floor(current_heap_size / 2) - 1; // 最後の親ノードから開始
    }

    p.draw = function () {
        p.background(20);

        // swapアニメーション更新
        if (is_swapping) {
            swap_progress += swap_speed;

            // アニメーション完了したらswap実行
            if (swap_progress >= 1) {
                p.do_swap(array, swap_from_index, swap_to_index);

                // 保留されていたヒープ更新を実行
                if (pending_heap_size_update) {
                    current_heap_size--;
                    pending_heap_size_update = false;
                }

                // 保留されていたheapify実行
                if (pending_heapify_index >= 0) {
                    p.max_heapify(array, pending_heapify_index);
                    pending_heapify_index = -1;
                }

                // フェーズ更新が保留されていれば実行
                if (pending_phase_update) {
                    sort_phase++;
                    current_index = array.length - 1;
                    current_function = "";
                    current_operation = "ヒープ構築完了";
                    pending_phase_update = false;
                }

                ready_for_next_step = true;
            }
        }
        // アニメーション中でなければ次のステップを実行
        else if (ready_for_next_step) {
            if (sort_phase === 1) {
                // ヒープ構築フェーズ
                if (current_index >= 0) {
                    highlight_indices = [current_index];
                    current_function = "max_heapify";
                    current_operation = `ノード${current_index}をmax-heapify中`;

                    // 親子関係を強調表示するための追加処理
                    let left = p.left(current_index);
                    let right = p.right(current_index);
                    if (left < current_heap_size) highlight_indices.push(left);
                    if (right < current_heap_size) highlight_indices.push(right);

                    // max_heapifyが値を交換するかを確認
                    let left_child = p.left(current_index);
                    let right_child = p.right(current_index);
                    let largest = current_index;

                    if (left_child < current_heap_size && array[left_child] > array[largest]) {
                        largest = left_child;
                    }

                    if (right_child < current_heap_size && array[right_child] > array[largest]) {
                        largest = right_child;
                    }

                    if (largest != current_index) {
                        // 交換が発生する場合、アニメーション開始
                        p.start_swap_animation(current_index, largest);
                        pending_heapify_index = largest; // 交換後にheapifyを続行
                        ready_for_next_step = false;
                    } else {
                        // 交換が発生しない場合はインデックスを進める
                        current_index--;
                    }
                } else {
                    // ヒープ構築完了、ソートフェーズへ
                    if (!is_swapping) {
                        // スワップ中でなければ直接フェーズを更新
                        sort_phase++;
                        current_index = array.length - 1;
                        current_function = "";
                        current_operation = "ヒープ構築完了";
                    } else {
                        // スワップ中なら更新を保留
                        pending_phase_update = true;
                    }
                }

            } else if (sort_phase === 2) {
                // ソートフェーズ
                if (current_index > 0) {
                    highlight_indices = [0, current_index];
                    current_function = "heap_sort";
                    current_operation = `ルートとノード${current_index}を交換開始`;

                    // swap開始（アニメーション）
                    p.start_swap_animation(0, current_index);
                    pending_heap_size_update = true; // ヒープサイズを減らす処理は交換後
                    pending_heapify_index = 0;      // 交換後にheapifyを実行
                    ready_for_next_step = false;

                    // インデックスは交換後に減らす
                    current_index--;
                } else {
                    // ソート完了
                    sort_phase = 3;
                    highlight_indices = [];
                    current_function = "";
                    current_operation = "ソート完了";
                }
            }
        }

        // レイアウト調整：左側に配列、右側に木構造
        p.push();
        p.translate(p.width * 0.25, p.height * 0.5);
        p.draw_array();
        p.pop();

        p.push();
        p.translate(p.width * 0.7, p.height * 0.2);
        p.draw_heap_tree();
        p.pop();

        // フェーズ表示を中央上部に表示
        let phase_text = "初期化中";
        if (sort_phase === 1) phase_text = "ヒープ構築中";
        else if (sort_phase === 2) phase_text = "ソート中";
        else if (sort_phase === 3) phase_text = "ソート完了";

        p.fill(255);
        p.text('ヒープソート: ' + phase_text, p.width / 2, 30);

        // 現在の処理内容を表示
        if (current_function || current_operation) {
            p.text(`現在の処理: ${current_function}`, p.width / 2, 60);
            p.text(`操作: ${current_operation}`, p.width / 2, 85);
        }

        // swapアニメーション中の表示
        if (is_swapping) {
            p.text(`要素 ${array[swap_to_index]} と ${array[swap_from_index]} を交換中 (${Math.round(swap_progress * 100)}%)`, p.width / 2, 110);
        }
    }

    // 木構造の描画
    p.draw_heap_tree = function () {
        // 最大深さを計算
        let depth = Math.ceil(Math.log2(element_num + 1));
        let horizontalSpacing = 40; // 水平方向の間隔
        let verticalSpacing = 60;   // 垂直方向の間隔

        // ノードサイズ
        let nodeSize = 30;

        // 接続線の描画（スワップ中の線は描画しない）
        for (let i = 0; i < element_num; i++) {
            if (i >= array.length) break;

            // スワップ中の場合はこのノードの接続線は描画しない
            if (is_swapping && (i === swap_from_index || i === swap_to_index)) {
                continue;
            }

            // ノードの位置計算
            let level = Math.floor(Math.log2(i + 1));
            let positionInLevel = i - (Math.pow(2, level) - 1);
            let nodesInLevel = Math.pow(2, level);
            let levelWidth = horizontalSpacing * (Math.pow(2, depth - 1));
            let x = (positionInLevel + 0.5) * (levelWidth / nodesInLevel) - levelWidth / 2;
            let y = level * verticalSpacing;

            // 親への接続線を描画
            if (i > 0) {
                let parentIndex = p.parent(i);

                // 親がスワップ中の場合は線を描画しない
                if (is_swapping && (parentIndex === swap_from_index || parentIndex === swap_to_index)) {
                    continue;
                }

                let parentLevel = Math.floor(Math.log2(parentIndex + 1));
                let parentPositionInLevel = parentIndex - (Math.pow(2, parentLevel) - 1);
                let parentX = (parentPositionInLevel + 0.5) * (levelWidth / Math.pow(2, parentLevel)) - levelWidth / 2;
                let parentY = parentLevel * verticalSpacing;

                // ヒープに含まれるノード間の接続のみ描画
                if (i < current_heap_size) {
                    p.stroke(150);
                    p.strokeWeight(1);
                    p.line(x, y, parentX, parentY);
                    p.noStroke();
                }
            }
        }

        // ノードの描画
        for (let i = 0; i < element_num; i++) {
            if (i >= array.length) break;

            // ノードのレベル（深さ）と位置を計算
            let level = Math.floor(Math.log2(i + 1));
            let positionInLevel = i - (Math.pow(2, level) - 1);
            let nodesInLevel = Math.pow(2, level);
            let levelWidth = horizontalSpacing * (Math.pow(2, depth - 1));

            // 通常の位置計算
            let x = (positionInLevel + 0.5) * (levelWidth / nodesInLevel) - levelWidth / 2;
            let y = level * verticalSpacing;

            // swapアニメーション中の特別処理
            if (is_swapping && (i === swap_from_index || i === swap_to_index)) {
                if (i === swap_from_index) {
                    // 交換元ノードの位置計算（目標位置）
                    let targetLevel = Math.floor(Math.log2(swap_to_index + 1));
                    let targetPositionInLevel = swap_to_index - (Math.pow(2, targetLevel) - 1);
                    let targetX = (targetPositionInLevel + 0.5) * (levelWidth / Math.pow(2, targetLevel)) - levelWidth / 2;
                    let targetY = targetLevel * verticalSpacing;

                    // 補間処理
                    x = p.lerp(x, targetX, swap_progress);
                    y = p.lerp(y, targetY, swap_progress);

                    p.fill(255, 100, 100, 230); // 交換中は赤く表示
                } else if (i === swap_to_index) {
                    // 交換先ノードの位置計算（目標位置）
                    let targetLevel = Math.floor(Math.log2(swap_from_index + 1));
                    let targetPositionInLevel = swap_from_index - (Math.pow(2, targetLevel) - 1);
                    let targetX = (targetPositionInLevel + 0.5) * (levelWidth / Math.pow(2, targetLevel)) - levelWidth / 2;
                    let targetY = targetLevel * verticalSpacing;

                    // 補間処理
                    x = p.lerp(x, targetX, swap_progress);
                    y = p.lerp(y, targetY, swap_progress);

                    p.fill(255, 100, 100, 230); // 交換中は赤く表示
                }
            } else {
                // 通常の描画色ロジック
                if (i < current_heap_size) {
                    // ヒープに含まれるノード
                    if (highlight_indices.includes(i)) {
                        p.fill(255, 255, 0, 200); // 処理中のノードは黄色
                    } else {
                        p.fill(50, 180, 50, 150); // ヒープ部分は緑色
                    }
                } else {
                    // ソート済みノード
                    p.fill(180, 50, 50, 150); // ソート済み部分は赤色
                }
            }

            p.ellipse(x, y, nodeSize, nodeSize);

            // ノード内のテキスト (値を表示)
            p.fill(255);
            p.text(array[i], x, y);

            // ノード番号を表示 (小さく右下に)
            p.textSize(12);
            p.text(i, x + nodeSize / 2 - 8, y + nodeSize / 2 - 8);
            p.textSize(16); // テキストサイズを元に戻す
        }
    }

    // 配列の描画
    p.draw_array = function () {
        for (let i = 0; i < element_num; i++) {
            if (i >= array.length) break;

            // 通常の位置計算
            let x = 0;
            let y = i * 30;

            // swapアニメーション中の特別処理
            if (is_swapping && (i === swap_from_index || i === swap_to_index)) {
                if (i === swap_from_index) {
                    // 移動元は目的地に向かって移動
                    let target_y = swap_to_index * 30;
                    y = p.lerp(y, target_y, swap_progress);
                    p.fill(255, 100, 100, 230); // 交換中は赤く表示
                } else if (i === swap_to_index) {
                    // 移動先は元の位置に向かって移動
                    let target_y = swap_from_index * 30;
                    y = p.lerp(y, target_y, swap_progress);
                    p.fill(255, 100, 100, 230); // 交換中は赤く表示
                }
            } else {
                // 通常の配色ロジック
                if (i < current_heap_size) {
                    p.fill(50, 180, 50, 150); // ヒープ部分は緑色
                } else {
                    p.fill(180, 50, 50, 150); // ソート済み部分は赤色
                }

                // 強調表示
                if (highlight_indices.includes(i)) {
                    p.fill(255, 255, 0, 200); // 処理中の要素は黄色
                }
            }

            p.rect(-50, y - 12, 100, 20);

            p.fill(255);
            p.text(array[i], x, y);
        }
    }

    // swapアニメーションを開始する関数
    p.start_swap_animation = function (i, j) {
        is_swapping = true;
        swap_from_index = i;
        swap_to_index = j;
        swap_progress = 0;
        current_operation = `要素 ${array[i]} と ${array[j]} を交換中`;
    }

    // 実際のswap実行関数（アニメーション後に呼ばれる）
    p.do_swap = function (array, i, j) {
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
        is_swapping = false;
        swap_progress = 0;
    }

    // 補助関数を一度だけ定義
    p.left = function (i) { return 2 * i + 1; }
    p.right = function (i) { return 2 * i + 2; }
    p.parent = function (i) { return Math.floor((i - 1) / 2); }

    // 現在はアニメーション開始のみを行うswap関数
    p.swap = function (array, i, j) {
        p.start_swap_animation(i, j);
    }

    // 直接配列を操作するmax_heapify関数（再帰呼び出しを避けるために修正）
    p.max_heapify = function (array, i) {
        let left_child = p.left(i);
        let right_child = p.right(i);
        let largest = i;

        if (left_child < current_heap_size && array[left_child] > array[largest]) {
            largest = left_child;
        }

        if (right_child < current_heap_size && array[right_child] > array[largest]) {
            largest = right_child;
        }

        if (largest != i) {
            // 再帰的max_heapifyをやめて、アニメーションに任せる
            p.swap(array, i, largest);
            pending_heapify_index = largest;
            ready_for_next_step = false;
        }
    }

    // ヒープソートアルゴリズム（参照用、実際の処理はdraw関数内で行う）
    p.heap_sort = function (array) {
        current_heap_size = array.length;
        p.build_max_heap(array);

        for (let i = array.length - 1; i > 0; i--) {
            p.swap(array, 0, i);
            current_heap_size--;
            p.max_heapify(array, 0);
        }
        return array;
    }

    p.build_max_heap = function (array) {
        current_heap_size = array.length;
        for (let i = Math.floor(current_heap_size / 2) - 1; i >= 0; i--) {
            p.max_heapify(array, i);
        }
    }

    // 配列の初期化
    p.initialize_array = function () {
        array = []; // 配列を初期化
        for (let i = 0; i < element_num; i++) {
            let randomValue = Math.floor(Math.random() * 100);
            array.push(randomValue);
        }
    }

    // ウィンドウサイズ変更時の処理
    p.windowResized = function () {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    }
}

new p5(sketch);