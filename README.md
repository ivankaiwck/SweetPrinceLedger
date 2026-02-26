# SweetPrinceLedger（王子甜甜帳）

SweetPrinceLedger 是一個以瀏覽器為核心的個人資產管理工具，支援多幣別資產/負債追蹤、投資與保險管理、現金流規則自動套用、主題切換與 PDF 報表匯出。

## 線上試用

- 立即試用：https://ivankaiwck.github.io/SweetPrinceLedger/

## 專案特色

- 零後端即可使用：預設資料保存在瀏覽器 `localStorage`
- 可選雲端同步：支援 Google 登入 + Firestore 手動上傳/下載
- 多語系介面：繁中 / English / 日本語
- 多主題切換：內建多套主題 token
- 報表輸出：一鍵匯出 PDF 供存檔與檢視

## 主要功能

### 1) 資產與負債管理

- 分類管理：流動資金、投資、保險、固定資產、應收款、負債
- 分層檢視：分類 / 帳戶 / 項目
- 詳細清單：桌面表格 + 手機卡片雙模式

### 2) 投資與保險追蹤

- 投資商品：股票、基金、加密貨幣等
- 投資型保單：支援保單基金子項目管理
- 派息模式：
  - 現金入帳（cash）
  - 積存生息（accumulate）
  - 再投資（reinvest）
- 派息比率支援年化語義：
  - 月派：年化比率 ÷ 12
  - 年派：使用年化比率

### 3) 現金流規則與自動套用

- 規則類型：收入 / 支出 / 轉帳
- 排程：單次、每日、每週、每月、每年
- 規則可綁定流動資金帳戶，自動入帳/扣款
- 新增規則時可選「今天若符合則立即套用」或「從下一次觸發日開始」
- 新增規則不會回補歷史月份，避免中途啟用時一次補入多月資料
- 具備去重機制，避免同日重複套用

### 4) 匯率與行情更新

- 匯率換算支援多種常見幣別
- 可更新市場價格與匯率後即時反映資產總值

### 5) 報表與總覽

- 總覽 KPI（含資產、負債、淨值等）
- 資產明細與分類占比
- 現金流統計
- PDF 匯出（摘要 + 明細）

## 技術棧

- React 18（UMD）
- Tailwind CSS（CDN）
- Babel Standalone
- Firebase Web SDK（compat）
- jsPDF / html2canvas / html2pdf

## 專案結構（主要檔案）

- `index.html`：應用入口與核心狀態管理
- `asset-modal-view.js`：資產表單與輸入邏輯
- `asset-detail-list-view.js`：資產詳細列表與保單基金管理
- `cashflow-apply.js`：現金流自動套用引擎
- `report-export.js`：PDF 報表輸出
- `overview-section-view.js`：總覽區塊

## 如何使用（本機）

### 方式 A：直接開啟

1. 下載或複製專案
2. 直接用瀏覽器開啟 `index.html`

### 方式 B：使用靜態伺服器（建議）

若瀏覽器限制 `file://` 行為，建議使用 VS Code Live Server 或其他靜態伺服器啟動。

## 資料儲存與備份

- 預設儲存在瀏覽器 `localStorage`
- 建議定期透過應用內匯出功能做備份
- 若啟用雲端同步，下載資料可能覆蓋本機狀態，操作前建議先備份

## Firebase 雲端同步（可選）

1. 建立 Firebase 專案
2. 啟用 Authentication（Google）
3. 建立 Firestore
4. 在專案設定中填入 Firebase Config

建議 Firestore 規則：

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /assetTrackerUsers/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 更新日誌（Recent Updates）

版本格式採用 `MAJOR.MINOR.PATCH`：

- `MAJOR`：有破壞性變更（不相容舊資料或舊操作流程）
- `MINOR`：向下相容的新功能（例如新增欄位、功能模式）
- `PATCH`：向下相容的修正（例如計算修正、錯誤修復）

### v1.3.0（2026-02-25）

- 新增基金/投資型保單派息開關（派息 / 不派息），未啟用派息時自動隱藏與清空相關欄位
- 派息流程擴充為三模式：現金入帳（cash）、積存生息（accumulate）、再投資（reinvest）
- 再投資模式可於自動套用時，以派息金額按當期價格回購單位
- 積存生息模式支援累積餘額與複利計算，並納入總覽與報表顯示
- 派息比率改為年化語義：月派按年化比率除以 12，年派按年化比率直接計算

### v1.3.1（2026-02-26）

- 現金流規則新增「新增時套用」選項：
  - 今天若符合則立即套用
  - 從下一次觸發日開始
- 修正新增固定規則時的歷史回補行為：不再從開始日期一路補到今天
- 更新現金流成功提示文案，使建立選項與結果訊息一致

## 注意事項

- 匯率/行情資料依賴第三方來源，可能受 API 可用性影響
- 本工具用途為個人財務整理，不構成投資建議

## 授權

目前專案尚未附授權條款；若要對外開源，建議新增 `LICENSE`（例如 MIT）。
