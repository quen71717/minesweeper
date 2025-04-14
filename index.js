console.log('hello, world!')

class Game {
    // クラス定数
    static FIELD_SIZE = 9;

    static STATE_TITLE = 0;
    static STATE_INGAME = 1;
    static STATE_GAMEOVER = 2;
    static STATE_GAMECLEAR = 3;

    static SAFE = 0;
    static BOMB = 1;

    static BOMB_THRESHOLD = 0.1;

    static NONE = 0;
    static FLAGGED = 1;
    static HOLD = 2;
    static OPENED = 3;
    static BORDER = -1;

    // インスタンス変数
    #gameState = Game.STATE_TITLE;
    //  SAFE or BOMB が入ったフィールドの配列
    #field;
    // 周りに何個爆弾があるかを保存する配列
    #aroundBombs;
    // 旗の有無を保存する配列
    #fieldStatus;
    // 生成された爆弾の個数
    #bombs;
    // 立てた旗の数
    #flags;
    // ？を付けた数
    #holds;
    // 開けたマスの数
    #opens;

    // 仮で操作してもらう
    #fieldDOM = document.querySelector('.grid-container')

    constructor() {
        // フィールドのDOMを生成
        this.#generateFieldDOM();

        // フィールドの初期化
        this.#initField();

        // フィールドをセット
        this.#setField();

        // 爆弾のカウント
        this.#countAroundBombs();

        this.#flags = 0;
        this.#holds = 0;
        this.#opens = 0;

        this.#gameState = Game.STATE_INGAME;

        this.#drawCountToHTML();
        this.#render();
    }

    // フィールドを初期化するメソッド
    #initField() {
        // 空の二次元配列を作る
        this.#field = new Array(Game.FIELD_SIZE + 2);
        this.#fieldStatus = new Array(Game.FIELD_SIZE + 2);
        for (let i = 0; i < Game.FIELD_SIZE + 2; i++) {
            this.#field[i] = new Array(Game.FIELD_SIZE + 2);
            this.#fieldStatus[i] = new Array(Game.FIELD_SIZE + 2);
        }
        // console.table(this.#fieldStatus)
    } 

    // フィールドをセットするメソッド
    #setField() {
        for(let i = 0; i < Game.FIELD_SIZE + 2; i++) {
            for(let j = 0; j < Game.FIELD_SIZE + 2; j++) {
                if (
                    i == 0 ||
                    j == 0 || 
                    i == this.#field.length - 1 || 
                    j == this.#field.length - 1
                ) {
                    this.#field[i][j] = Game.BORDER;
                    this.#fieldStatus[i][j] = Game.NONE;
                    continue;
                }

                const rand = Math.random();

                if (rand < Game.BOMB_THRESHOLD) {
                    this.#field[i][j] = Game.BOMB;
                    this.#bombs++;
                } else {
                    this.#field[i][j] = Game.SAFE;
                }

                // 全てのマスを閉じた状態にする
                this.#fieldStatus[i][j] = Game.NONE
                // this.#field[i][j] = rand < 0.3 ? Game.BOMB :Game.SAFE;
            }
        }
    // console.table(this.#field);
    }

    // 周囲の爆弾の個数を記録するメソッド
    #countAroundBombs() {
        this.#aroundBombs = new Array(Game.FIELD_SIZE);
        for (let i = 0; i < Game.FIELD_SIZE; i++) {
            this.#aroundBombs[i] = new Array(Game.FIELD_SIZE);
        }
        // BORDERを除いた各マスに対して
        for (let i = 1; i <= Game.FIELD_SIZE; i++){
            for (let j = 1; j <= Game.FIELD_SIZE; j++) {
                let count = 0;

                if (this.#field[i][j] == Game.BOMB) {
                    this.#aroundBombs[i - 1][j - 1] = 9;
                    continue;
                }

                //　周囲八マスを探索 
                for (let k = -1; k <= 1; k++) {
                    for (let l = -1; l <= 1; l++) {
                        if (k == 0 && l == 0) continue;
                        if (this.#field[i+k][j+l] == Game.BOMB) {
                            count++;
                        }
                    }
                }

                // カウントした個数を記録
                this.#aroundBombs[i - 1][j - 1] = count;
            }
        }
        // console.table(this.#aroundBombs);
    }

    // 周囲を開くメソッド
    #openAround(x, y) {

        // 既に開かれたマスの時はなにもしない
        if (this.#fieldStatus[y][x] == Game.OPENED) return;

        if (this.#aroundBombs[y][x] != 0) { //連鎖しないとき
            if (this.#fieldStatus[y][x] == Game.FLAGGED) return;
            this.#fieldStatus[y][x] = Game.OPENED;
            return;
        }

        // 連鎖が起こるとき
        this.#fieldStatus[y][x] = Game.OPENED;

        // 深さ優先探索
        for ( let i = -1; i <= 1; i++) {
            for (let j =-1; j <= 1; j++) {
                if (i == 0 && j == 0) continue;

                // 見ているマスが範囲内の時のみ
                if (
                    0 < i + y && 
                    0 < j + x && 
                    i + y <= Game.FIELD_SIZE && 
                    j + x <= Game.FIELD_SIZE
                ) {
                    this.#openAround(x + j, y + i);
                }
            }
        }
        return;
    }

    #drawCountToHTML() {
        if (!this.#fieldDOM) return;

        for (const cell of this.#fieldDOM.childNodes) {
            // console.log(cell);
            const id = cell.getAttribute('id');
            // console.log(index)
            const y = id.split('-')[0];
            const x = id.split('-')[1];
            console.log(`(y: ${y}, x: ${x})`);

            cell.innerText = this.#aroundBombs[y][x];

        }
    }

    // 画面描画の更新を行うメソッド
    #render() {
        for (let i = 0; i < Game.FIELD_SIZE; i++) {
            for (let j = 0; j < Game.FIELD_SIZE; j++) {
                // console.log(this.#fieldDOM.childNodes[i * Game.FIELD_SIZE + j])
                const cell = this.#fieldDOM.childNodes[i * Game.FIELD_SIZE + j];
                switch (this.#fieldStatus[i + 1][j + 1]) {
                    case Game.OPENED:
                        cell.classList.add('opened');
                        break;
                    case Game.FLAGGED:
                        cell.classList.add('flagged');
                        break;
                    case Game.HOLD:
                        cell.classList.add('hold');
                        break;
                }
            }
        }
    }

    // フィールドのDOMを生成するメソッド
    #generateFieldDOM() {
        

    // フィールドの親要素
    const gridContainer = document.querySelector('.grid-container');
    // フィールドの子要素を生成
    for (let i = 0; i < Game.FIELD_SIZE; i++) {
        for (let j = 0; j < Game.FIELD_SIZE; j++) {
            // divタグを作る
            const gridItem = document.createElement('div');
            // クラス付け
            gridItem.classList.add('grid-item');
            gridItem.setAttribute('id', `${i}-${j}`);
            gridItem.addEventListener(
                'click', 
                this.#handleCellClick.bind(this, i, j)
            );
            // 右クリックではコンテキストメニューが出るのでそれを防ぐ
            gridItem.oncontextmenu = (event) => event.preventDefault();
            // gridContainerの子要素に追加
            gridContainer.appendChild(gridItem);
            }
        }
    }

    // マスをクリックしたときの処理
    #handleCellClick(i, j, event) {
        // ゲームの状態を確認
        if (this.#gameState != Game.STATE_INGAME) return;
        if (this.#field[i+1][j+1] == Game.BOMB) {
            this.#gameover();
        }

        switch (event.button) {
            case 0://左クリックなら
            // マスを開ける
                this.#openAround(j, i);
                break;
            case 2://右クリックなら
                // 旗１→？２→なし０
                this.#fieldStatus[i + 1][j + 1]++;
                this.#fieldStatus[i + 1][j + 1] %= 3;
                break;
        }


        // クリックされるたびに再描画
        this.#render();
    }

    // ゲームオーバー
    #gameover() {
        this.#gameState = Game.STATE_GAMEOVER;
        alert('がめおべら')
    }

    // ゲームクリア
    #gameclear() {
        this.#gameState = Game.STATE_GAMECLEAR;
    }
}

const game = new Game();