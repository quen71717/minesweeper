console.log('hello, world!')

// MARK:Gameクラス
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
    #field;  //  SAFE or BOMB が入ったフィールドの配列
    #aroundBombs;  // 周りに何個爆弾があるかを保存する配列
    #fieldStatus;  // 旗の有無を保存する配列
    #bombs;  // 生成された爆弾の個数
    #flags;  // 立てた旗の数
    #holds;  // ？を付けた数
    #opens;  // 開けたマスの数

    // 仮で操作してもらう
    #fieldDOM = document.querySelector('.grid-container');
    #messageDOM = document.getElementById('message');

    // MARK:コンストラクタ
    constructor() {
        // インスタンス変数の初期化
        this.#bombs = 0;
        this.#flags = 0;
        this.#holds = 0;
        this.#opens = 0;
        // フィールドのDOMを生成
        this.#generateFieldDOM();

        // フィールドの初期化
        this.#initField();

        // フィールドをセット
        this.#setField();

        // 爆弾のカウント
        this.#countAroundBombs();

        // ゲームを開始
        this.#gameState = Game.STATE_INGAME;

        // 初回描画
        this.#render();
    }

    // MARK:initField
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

    // MARK:setField
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

    // MARK:countAroundBombs
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

    // MARK:openAround
    // 周囲を開くメソッド
    #openAround(x, y) {

        // Noneでない時はなにもしない
        if (this.#fieldStatus[y][x] != Game.NONE) return;

        if (this.#aroundBombs[y - 1][x - 1] != 0) { //連鎖しないとき
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

    // MARK:drawCountToHTML
    #drawCountToHTML() {
        if (!this.#fieldDOM) return;

        for (const cell of this.#fieldDOM.childNodes) {
            // console.log(cell);
            const id = cell.getAttribute('id');
            // console.log(index)
            const y = Number(id.split('-')[0]);
            const x = Number(id.split('-')[1]);

            if (this.#fieldStatus[y + 1][x + 1] != Game.OPENED) continue;
            // console.log(`(y: ${y}, x: ${x})`);

            cell.innerText = (this.#aroundBombs[y][x] == 9) ? "💣" : this.#aroundBombs[y][x];


        }
    }

    // MARK:render
    // 画面描画の更新を行うメソッド
    #render() {
        for (let i = 0; i < Game.FIELD_SIZE; i++) {
            for (let j = 0; j < Game.FIELD_SIZE; j++) {
                // console.log(this.#fieldDOM.childNodes[i * Game.FIELD_SIZE + j])
                const cell = this.#fieldDOM.childNodes[i * Game.FIELD_SIZE + j];
                switch (this.#fieldStatus[i + 1][j + 1]) {
                    case Game.NONE:
                        cell.classList.remove('opened');
                        cell.classList.remove('flagged');
                        cell.classList.remove('hold');
                        cell.innerText = "";
                        break;
                    case Game.OPENED:
                        cell.classList.add('opened');
                        cell.classList.remove('flagged');
                        cell.classList.remove('hold');
                        cell.innerText = "";
                        break;
                    case Game.FLAGGED:
                        cell.classList.add('flagged');
                        cell.classList.remove('hold');
                        cell.innerText = "🚩";
                        break;
                    case Game.HOLD:
                        cell.classList.add('hold');
                        cell.classList.remove('flagged');
                        cell.innerText = "❓";
                        break;
                }
            }
        }
        this.#drawCountToHTML();
    }

    // MARK:generateFieldDOM
    // フィールドのDOMを生成するメソッド
    #generateFieldDOM() {
        

    // フィールドの親要素
    const gridContainer = document.querySelector('.grid-container');
    
    // 右クリックではコンテキストメニューが出るのでそれを防ぐ
    gridContainer.oncontextmenu = (event) => event.preventDefault();

    // フィールドの子要素を生成
    for (let i = 0; i < Game.FIELD_SIZE; i++) {
        for (let j = 0; j < Game.FIELD_SIZE; j++) {
            // divタグを作る
            const gridItem = document.createElement('div');
            // クラス付け
            gridItem.classList.add('grid-item');
            gridItem.setAttribute('id', `${i}-${j}`);
            gridItem.addEventListener(
                'mousedown', 
                this.#handleCellClick.bind(this, i, j)
            );
            // gridContainerの子要素に追加
            gridContainer.appendChild(gridItem);
            }
        }
    }

    // MARK:handleCellClick
    // マスをクリックしたときの処理
    #handleCellClick(i, j, event) {
        // ゲームの状態を確認
        if (this.#gameState != Game.STATE_INGAME) return;
        
        switch (event.button) {
            case 0://左クリックなら

                if (this.#fieldStatus[i + 1][j + 1] != Game.NONE) break;
                
                // マスを開ける
                this.#openAround(j + 1, i + 1);
                
                // クリア/ゲームオーバー判定
                this.#judgement();
                break;
            case 2://右クリックなら
            if (this.#fieldStatus[i + 1][j + 1] == Game.OPENED) break;
                // 旗１→？２→なし０
                this.#fieldStatus[i + 1][j + 1]++;
                this.#fieldStatus[i + 1][j + 1] %= 3;
                break;
        }


        // クリックされるたびに再描画
        this.#render();

        // 現在のフラグによってゲームの状態を判定
        this.#updateState();
    }

    // MARK:updateState
    // gameStateによってゲームの進行を変える
    #updateState() {
        switch(this.#gameState) {
            case Game.STATE_GAMEOVER:
                this.#messageDOM.innerText = "GAME OVER；；";
                break;
            case Game.STATE_GAMECLEAR:
                this.#messageDOM.innerText = "GAME CLEAR ＜３";
                break;
        }
    }

    // MARK:judgement
    // fieldの状態を見てgameStateのフラグを立てる
    #judgement() {
        // ゲームオーバーの判定
        for (let i = 1; i <= Game.FIELD_SIZE; i++) {
            for (let j = 1; j <= Game.FIELD_SIZE; j++){
                if (this.#field[i][j] == Game.BOMB && 
                    this.#fieldStatus[i][j] == Game.OPENED
                ) {
                    this.#gameState = Game.STATE_GAMEOVER;
                    return;
                }
            }
        }

        // ゲームクリアの判定
        const safeCellCount = (Game.FIELD_SIZE * Game.FIELD_SIZE) - this.#bombs;
        let opened = 0;

        for (let i = 1; i <= Game.FIELD_SIZE; i++) {
            for (let j = 1; j <= Game.FIELD_SIZE; j++){
                if (this.#fieldStatus[i][j] == Game.OPENED) {
                    opened++;
                }
            }
        }

        if (safeCellCount == opened) {
            this.#gameState = Game.STATE_GAMECLEAR;
        }
    }

    // MARK:gameover
    // ゲームオーバー
    // #gameover() {
    //     this.#gameState = Game.STATE_GAMEOVER;
    // }

    // MARK:gameclear
    // ゲームクリア
    // #gameclear() {
    //     this.#gameState = Game.STATE_GAMECLEAR;
    // }
}

const game = new Game();