const http = require('node:http');
const fs = require('node:fs');
const { formidable } = require('formidable');  // formidable v3 用 named import
require('dotenv').config(); // 💡 關鍵第一行：啟動環境變數讀取器

// ========== 任務一：讀取上傳設定 ==========
/**
 * 從 process.env 讀取上傳相關設定，回傳設定物件。
 *
 * 規則：
 *   - UPLOAD_DIR 未設定 → 預設 '/tmp'
 *   - MAX_FILE_SIZE_MB 未設定 → 預設 5（MB）
 *   - GYM_NAME 未設定 → 預設 '未命名健身房'
 *
 * 回傳物件：
 *   - uploadDir: 上傳目錄（字串）
 *   - maxFileSize: 最大檔案大小（bytes，= MB * 1024 * 1024）
 *   - gymName: 健身房名稱（字串）
 *
 * @returns {{uploadDir: string, maxFileSize: number, gymName: string}}
 *
 * @example
 *   process.env.UPLOAD_DIR = '/tmp/uploads';
 *   process.env.MAX_FILE_SIZE_MB = '10';
 *   process.env.GYM_NAME = 'FitClub';
 *   getUploadConfig();
 *   // { uploadDir: '/tmp/uploads', maxFileSize: 10485760, gymName: 'FitClub' }
 */
function getUploadConfig() {
  // TODO: 實作此函式
  // 提示：用 || 給預設值；MAX_FILE_SIZE_MB 是字串，記得先 Number() 轉型再換算 bytes
  // 1. 先把 MB 的數字抓出來（如果沒設定，就拿預設值 5）
  // 💡 提示說它是字串，所以我們用 Number() 把它包起來轉成數字
  const mbSize = Number(process.env.MAX_FILE_SIZE_MB || 5)
  console.log(mbSize)
  // 2. 回傳題目要求的物件格式
  return {
    uploadDir: process.env.UPLOAD_DIR || '/tmp',
    maxFileSize: mbSize * 1024 *1024, // 照題目規則：把 MB 換算成 bytes
    gymName: process.env.GYM_NAME  || '未命名健身房'
  }
}

// ========== 任務二：取副檔名 ==========
/**
 * 從檔名取副檔名，一律回小寫帶 `.`。
 *
 * 規則：
 *   - 'cat.jpg' → '.jpg'
 *   - 'PHOTO.JPG' → '.jpg'（一律小寫）
 *   - 'README' → ''（沒有副檔名）
 *   - 'archive.tar.gz' → '.gz'（只取最後一個）
 *
 * @param {string} filename
 * @returns {string}
 * @example
 *   getFileExtension('cat.jpg');     // '.jpg'
 *   getFileExtension('PHOTO.JPG');   // '.jpg'
 *   getFileExtension('README');      // ''
 */
function getFileExtension(filename) {
  // TODO: 實作此函式
  // 提示：用 lastIndexOf('.') 找最後一個 .，toLowerCase() 轉小寫
  // 1. 找到最後一個「.」在哪個位置（索引值）
  // .lastIndexOf('.') 是固定用法，「從後面往前找特定文字位置」的專用武器。如果找不到，它固定會回傳 -1，這也是世界通用的規定。
  const fileExtension = filename.lastIndexOf('.');
  
  // 2. 如果找不到「.」，lastIndexOf 會回傳 -1，這時候照規則回傳空字串 ''
  // === -1 是固定邏輯，用來抓「找不到點」的情況。
  if (fileExtension === -1) {
    return '';
  }
  // 3. 用 .slice() 固定用法，從點的位置一路切到字串最後面，然後用 .toLowerCase() 變成小寫
  return filename.slice(fileExtension).toLowerCase();
}
 
// ========== 任務三：解析檔案 metadata ==========
/**
 * 吃 formidable 解析後的 file 物件，回傳整理好的 metadata。
 *
 * formidable 的 file 物件至少有：
 *   - originalFilename: 原始檔名
 *   - size: 檔案 byte 數
 *
 * 回傳：
 *   - filename: 原始檔名
 *   - sizeKB: 檔案大小換成 KB（四捨五入，用 Math.round）
 *   - ext: 副檔名（用任務二的 getFileExtension）
 *
 * @param {{originalFilename: string, size: number}} file
 * @returns {{filename: string, sizeKB: number, ext: string}}
 *
 * @example
 *   parseFileMetadata({ originalFilename: 'leo.jpg', size: 250000 });
 *   // { filename: 'leo.jpg', sizeKB: 244, ext: '.jpg' }
 */
function parseFileMetadata(file) {
  // TODO: 實作此函式
  // 提示：呼叫 getFileExtension 取副檔名，Math.round(size / 1024) 算 KB
  // ❌ Math.round 是固定用法（四捨五入）
  // ❌ file.size (拿檔案大小）.size 這個是上傳套件 Formidable 固定用法
  // ⭕ kb 是我們自己取的變數名稱（你可以改成 apple 或 sizeInKb）
  const kb = Math.round(file.size / 1024);

  // 2. 取副檔名：呼叫你上一題寫好的 getFileExtension，把檔名丟給它
  // ❌ getFileExtension() 是呼叫函式的固定寫法
  // ❌ file.originalFilename 是點語法固定用法（拿檔名）
  // ⭕ extension 是我們自己取的變數名稱
  const extension = getFileExtension(file.originalFilename);
  return {
    filename: file.originalFilename, // 原始檔名
    sizeKB: kb,                      // 我們剛剛算好的 KB 數字
    ext: extension                   // 剛剛抓好的副檔名
  };
}

// ========== 任務四：產出 upload log 字串 ==========
/**
 * 吃 metadata + config，產出一行 log 字串。
 *
 * 格式：`[{gymName}] Uploaded {filename} ({sizeKB} KB) → {uploadDir}`
 *
 * @param {{filename: string, sizeKB: number}} meta
 * @param {{uploadDir: string, gymName: string}} config
 * @returns {string}
 *
 * @example
 *   formatUploadLog(
 *     { filename: 'leo.jpg', sizeKB: 245, ext: '.jpg' },
 *     { uploadDir: '/tmp/uploads', gymName: 'FitClub' }
 *   );
 *   // '[FitClub] Uploaded leo.jpg (245 KB) → /tmp/uploads'
 */
function formatUploadLog(meta, config) {
  // TODO: 實作此函式
  // 提示：用 template literal 組字串
  return `[${config.gymName}] Uploaded ${meta.filename} (${meta.sizeKB} KB) → ${config.uploadDir}`;
}

// ========== 任務五：路由分派 ==========
/**
 * 吃 HTTP request / response / config，依 method + url 分派到對應處理邏輯。
 *
 * 規格：
 *   - POST /coaches/avatar：
 *     * 用 formidable 解析 multipart/form-data
 *     * 成功 → 回 200 + JSON { filename, sizeKB, ext, savedPath }
 *     * formidable 解析錯誤（含超過 maxFileSize）→ 回 500 + JSON { error }
 *     * 沒 file 欄位 → 回 400 + JSON { error: 'No file uploaded' }
 *   - 其他路徑 → 回 404 + JSON { error: 'Not Found' }
 *
 * formidable 設定：
 *   - uploadDir / maxFileSize 從 config 取
 *   - keepExtensions: true
 *
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {{uploadDir: string, maxFileSize: number, gymName: string}} config
 * @returns {void} 直接操作 res 回寫、不 return 值
 *
 * @example
 *   // 在 createUploadServer 裡：
 *   http.createServer((req, res) => router(req, res, config))
 */
function router(req, res, config) {
  // TODO: 實作此函式
  // 建議（非強制）：
  //   - 拆出 handleUpload(req, res, config)：formidable 解析邏輯
  //   - 拆出 handleNotFound(req, res)：404 邏輯
  //   - router 只看 method + url、呼叫對應 handler
  // formidable 錯誤處理要點：
  //   - 錯誤解析（例如：maxFileSize）會進到 form.parse 的 callback err，因此錯誤回應（res）可撰寫在這個 callback
  //   - form.on('error', ...) 不需再處理 res 相關，避免產生回應兩次的錯誤。這個部分可用來紀錄 log、清理暫存檔、額外監控等等。目前可先有此概念即可，或者初步撰寫如下：
  //     form.on('error', (err) => {
  //       console.log(err); // 記錄 log、清理暫存檔、額外監控可以寫在這邊
  //     });  
  // 1. 條件分流：檢查是否為指定的 POST 路由
  if (req.method === 'POST' && req.url === '/coaches/avatar') {
    
    // 2. 初始化 formidable 機器人（設定從 config 來）
    const form = formidable({
      uploadDir: config.uploadDir,
      maxFileSize: config.maxFileSize,
      keepExtensions: true
    });

    // 3. 題目提示：初步撰寫錯誤監控 log
    form.on('error', (err) => {
      console.log(err); // 紀錄 log 專用，這裡不處理 res 喔！
    });

    // 4. 開始解析連線進來的請求 (req)
    form.parse(req, (err, fields, files) => {
      // 狀況 A：解析錯誤（如超過 maxFileSize）-> 回傳 500
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }

      // 狀況 B：檢查有沒有上傳檔案（相容陣列與物件格式） -> 回傳 400
      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No file uploaded' }));
        return;
      }

      // 狀況 C：成功大滿貫！ -> 加工資料、印出 Log、回傳 200
      // 💡 呼叫任務三的加工功能
      const meta = parseFileMetadata(file); 
      
      // 💡 呼叫任務四的字串組合功能並印在 Terminal
      const logStr = formatUploadLog(meta, config);
      console.log(logStr); 

      // 正式回信給前端瀏覽器
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        filename: meta.filename,
        sizeKB: meta.sizeKB,
        ext: meta.ext,
        savedPath: file.filepath // formidable 幫你存好檔案的硬碟路徑
      }));
    });

  } else {
    // 5. 其他任何不對的 Method 或網址 -> 一律回傳 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
}

// ========== 任務六：建立上傳 server ==========
/**
 * 建 http.Server、把每個 request 交給 router。
 *
 * 規格：
 *   - 如果 config.uploadDir 不存在，用 fs.mkdirSync(uploadDir, { recursive: true }) 自動建
 *   - http.createServer(...) 把 request 交給 router(req, res, config)
 *   - 回傳 server instance（不要 server.listen()，那是 app.js 的責任）
 *
 * @param {{uploadDir: string, maxFileSize: number}} config
 * @returns {http.Server}
 *
 * @example
 *   const server = createUploadServer({ uploadDir: '/tmp', maxFileSize: 5 * 1024 * 1024 });
 *   server.listen(3000);  // ← 這行由 app.js 呼叫
 */
function createUploadServer(config) {
  // TODO: 實作此函式
  // 提示：主邏輯都在 router 裡，這邊函式內容不多
  // 1. 安全檢查：如果硬碟裡「不存在」這個上傳資料夾
  if (!fs.existsSync(config.uploadDir)) {
    // 就自動在硬碟中建立它（recursive: true 代表如果父資料夾不存在也會一併建立）
    fs.mkdirSync(config.uploadDir, { recursive: true });
  }

  // 2. 建立 http 伺服器
  const server = http.createServer((req, res) => {
    // 💡 核心：把每一次進來的連線要求，通通轉交給任務五的 router 處理
    router(req, res, config);
  });

  // 3. 依照題目規格：直接回傳伺服器實例（不要在這裡寫 .listen 喔！）
  return server;
}

// ==========================================
// 測試開始
// ==========================================

console.log('--- 開始測試 ---');

// 任務一測試：
const result1 = getUploadConfig();
console.log('結果：', result1 || '任務1失敗');

// 任務二測試：
const result2 = getFileExtension;
console.log('結果：', result2 || '任務2失敗');

// 任務三測試：
const result3 = parseFileMetadata;
console.log('結果：', result3 || '任務3失敗');

// 任務四測試：
const result4 = formatUploadLog;
console.log('結果：', result4 || '任務4失敗');

// 任務五測試：
const result5 = router;
console.log('結果：', result5 || '任務5失敗');

// 任務六測試：
const result6 = createUploadServer;
console.log('結果：', result6 || '任務6失敗');

// ==========================================
// 測試結束
// ==========================================

module.exports = {
  getUploadConfig,
  getFileExtension,
  parseFileMetadata,
  formatUploadLog,
  router,
  createUploadServer,
};
