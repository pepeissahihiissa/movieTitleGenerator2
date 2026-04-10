// import React, { useState, useEffect, useRef } from 'react';
import './fonts.css'
import { useState, useRef, useEffect } from 'react';
import { Download, Save, Palette, Sun } from 'lucide-react';
import { Trash2 } from 'lucide-react';

type PresetConfig = {
  textColor?: string;
  textColorType: 'solid' | 'gradient';
  textGradientStart?: string;
  textGradientEnd?: string;
  textGradientAngle?: number;
  border1Color: string;
  border1Width: number;
  border2Color: string;
  border2Width: number;
  shadowEnabled?: boolean;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
  shadowOpacity?: number;
};

type Preset = {
  name: string;
  config: PresetConfig;
};

type FontItem = {
  label: string;        // UI 表示名
  family: string;       // ctx.font に渡す font-family
};

type LocalFont = {
  family: string;
  fullName: string;
  postscriptName: string;
  style: string;
};

// TypeScript用のグローバル型拡張
declare global {
  interface Window {
    queryLocalFonts?: () => Promise<any[]>;
  }
}

const presetFonts: FontItem[] = [
  {
    label: 'Noto Sans JP',
    family: "MyNotoJP, 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif",
  },
  {
    label: 'BIZ UDPゴシック',
    family: "MyBIZUDPGothic, 'BIZ UDPGothic', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif",
  },
  {
    label: 'Source Han Sans JP',
    family: "MySourceHanSansJP, 'Source Han Sans JP', 'Hiragino Kaku Gothic ProN', Meiryo, sans-serif",
  },
  {
    label: 'Arial Black',
    family: 'Arial Black',
  },
  {
    label: 'Impact',
    family: 'Impact',
  },
  {
    label: 'Arial',
    family: 'Arial',
  },
  {
    label: 'Times New Roman',
    family: 'Times New Roman',
  },
  {
    label: 'Courier New',
    family: 'Courier New',
  },
  {
    label: 'Comic Sans MS',
    family: 'Comic Sans MS',
  },
];


export default function TextDecoratorApp() {
  const [text, setText] = useState('サンプル');
  const [fontSize, setFontSize] = useState(120);
  const [fontFamily, setFontFamily] = useState(presetFonts[0].family);

  // ローカルフォント関連
  const [localFontsAvailable, setLocalFontsAvailable] = useState(false);
  const [localFonts, setLocalFonts] = useState<LocalFont[]>([]);
  // const [fontSource, setFontSource] = useState<'preset' | 'local'>('preset');
  // const [isLoadingFonts, setIsLoadingFonts] = useState(false);

  // テキスト色（グラデーション対応）
  const [textColorType, setTextColorType] = useState<'solid' | 'gradient'>('solid');
  const [textColor, setTextColor] = useState('#FF0000');
  const [textGradientStart, setTextGradientStart] = useState('#FF0000');
  const [textGradientEnd, setTextGradientEnd] = useState('#FF6600');
  const [textGradientAngle, setTextGradientAngle] = useState(90);

  const [border1Color, setBorder1Color] = useState('#FFFFFF');
  const [border1Width, setBorder1Width] = useState(8);
  const [border2Color, setBorder2Color] = useState('#000000');
  const [border2Width, setBorder2Width] = useState(18);
  const [shadowEnabled, setShadowEnabled] = useState(true);
  const [shadowOffsetX, setShadowOffsetX] = useState(8);
  const [shadowOffsetY, setShadowOffsetY] = useState(8);
  const [shadowBlur, setShadowBlur] = useState(10);
  const [shadowOpacity, setShadowOpacity] = useState(0.6);

  // canvasベース座標
  // const [textPos, setTextPos] = useState({ x: 0, y: 0 }); // offset（ズレ）を管理
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const textPosRef = useRef({ x: 0, y: 0 });

  // 行間
  const [lineHeight, setLineHeight] = useState(1.2);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    // クリックした瞬間のマウス座標を記録
    setDragStart({ x: e.clientX, y: e.clientY });
  };

const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
  if (!isDragging) return;

  const dx = e.clientX - dragStart.x;
  const dy = e.clientY - dragStart.y;

  // ref の座標を直接書き換え
  textPosRef.current = {
    x: textPosRef.current.x + dx,
    y: textPosRef.current.y + dy
  };

  // 次の比較用に dragStart 更新
  setDragStart({ x: e.clientX, y: e.clientY });

  // ★ 即時描画 ★
  drawText();
};

const handleMouseUp = () => {
  setIsDragging(false);
  // setTextPos(textPosRef.current); // 状態同期したい場合のみ
};

  // const [activeTab, setActiveTab] = useState('text');
  const DEFAULT_PRESETS: Preset[] =([
    {
      name: 'YouTube風', config: {
        textColor: '#FF0000', border1Color: '#FFFFFF', border1Width: 8,
        border2Color: '#000000', border2Width: 18, textColorType: 'solid'
      }
    },
    {
      name: 'ゲーム実況風', config: {
        textColorType: 'gradient', textGradientStart: '#FFD700', textGradientEnd: '#FF8C00',
        border1Color: '#000000', border1Width: 10, border2Color: '#FFFFFF', border2Width: 2
      }
    },
    {
      name: 'シンプル白', config: {
        textColor: '#FFFFFF', border1Color: '#000000', border1Width: 6,
        border2Color: '#333333', border2Width: 0, textColorType: 'solid'
      }
    },
    {
      name: 'ネオン風', config: {
        textColorType: 'gradient', textGradientStart: '#00FFFF', textGradientEnd: '#FF00FF',
        border1Color: '#FFFFFF', border1Width: 4, border2Color: '#000000', border2Width: 12
      }
    },
  ]);

  const [presets, setPresets] = useState<Preset[]>(() => {
  if (typeof window === 'undefined') return DEFAULT_PRESETS; // サーバーサイドレンダリング対策

  const saved = localStorage.getItem('text-decorator-presets');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // 保存されたデータが空配列でなければ、それを返す
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.error("読み込み失敗:", e);
    }
  }
  // 保存データがない、またはエラーの場合はデフォルト値を返す
  return DEFAULT_PRESETS;
});

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const downloadCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Local Font Access APIのサポート確認
  useEffect(() => {
    if ('queryLocalFonts' in window) {
      setLocalFontsAvailable(true);
    }
  }, []);

  const deletePreset = (indexToDelete: number) => {
    // WinFormsの MessageBox.Show 的な確認
    if (!window.confirm(`プリセット「${presets[indexToDelete].name}」を削除してもよろしいですか？`)) {
      return;
    }

    const updatedPresets = presets.filter((_, index) => index !== indexToDelete);
    setPresets(updatedPresets);
    
    // 保存も更新
    localStorage.setItem('text-decorator-presets', JSON.stringify(updatedPresets));
  };

  // ローカルフォントの取得
  const loadLocalFonts = async () => {
    if (!('queryLocalFonts' in window)) return;

    // setIsLoadingFonts(true);
    try {
      const availableFonts = await window.queryLocalFonts!();
      
      // 重複を除去してソート
      const uniqueFonts = Array.from(
        new Map(
          availableFonts.map((font: any) => [font.family, {
            family: font.family,
            fullName: font.fullName,
            postscriptName: font.postscriptName,
            style: font.style
          }])
        ).values()
      ).sort((a: any, b: any) => a.family.localeCompare(b.family));

      setLocalFonts(uniqueFonts as LocalFont[]);
      // setFontSource('local');
      setLocalFonts(uniqueFonts as LocalFont[]);
      // 最初のローカルフォントを選択
      //if (uniqueFonts.length > 0) {
      //  setFontFamily((uniqueFonts[0] as LocalFont).family);
      //}
    } catch (error: any) {
      console.error('フォントアクセスエラー:', error);
      
      let errorMessage = 'フォントへのアクセスに失敗しました。';
      
      if (error.name === 'SecurityError') {
        errorMessage = 'この環境ではローカルフォント機能が制限されています。';
      } else if (error.name === 'NotAllowedError') {
        errorMessage = 'フォントへのアクセス権限が拒否されました。\nブラウザの設定で権限を許可してください。';
      }
      
      alert(errorMessage);
      // setFontSource('preset');
    } finally {
      // setIsLoadingFonts(false);
    }
  };

  /*
  // フォントソース切り替え
  const handleFontSourceChange = (source: 'preset' | 'local') => {
    if (source === 'local' && localFonts.length === 0) {
      loadLocalFonts();
    } else {
      // setFontSource(source);
      if (source === 'preset') {
        setFontFamily(presetFonts[0].family);
      } else if (localFonts.length > 0) {
        setFontFamily(localFonts[0].family);
      }
    }
  };
  */

  const containerRef = useRef(null); // 親要素の参照を追加

  // サイズを自動調整するuseEffect
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && canvasRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        // キャンバスの描画解像度を親要素に合わせる（WPFのStretchに近い動作）
        canvasRef.current.width = clientWidth - 40; // padding分を引く
        canvasRef.current.height = clientHeight - 40;
        drawText(); // サイズが変わったら再描画
      }
    };

    window.addEventListener('resize', updateSize);
    updateSize(); // 初回実行
    return () => window.removeEventListener('resize', updateSize);
  }, [text, fontSize, lineHeight, fontFamily, textColor, textColorType, textGradientStart,
    textGradientEnd, textGradientAngle, border1Color, border1Width,
    border2Color, border2Width, shadowEnabled, shadowOffsetX,
    shadowOffsetY, shadowBlur, shadowOpacity]); // 依存配列にdrawTextで使う変数を追加

  useEffect(() => {
    drawText();
  }, [text, fontSize, lineHeight, fontFamily, textColor, textColorType, textGradientStart,
    textGradientEnd, textGradientAngle, border1Color, border1Width,
    border2Color, border2Width, shadowEnabled, shadowOffsetX,
    shadowOffsetY, shadowBlur, shadowOpacity]);

  // drawText 関数の修正案
const drawText = async (targetCanvas = canvasRef.current) => {
    const canvas = targetCanvas;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
      await document.fonts.load(`${fontSize}px ${fontFamily}`);
    } catch (error) {
      console.warn('Font loading warning:', error);
    }

    const lines = text.split('\n');
    const _lineHeight = fontSize * lineHeight;
    const lineHeightPx = fontSize * lineHeight;
    
    // 全行の高さ
    const totalHeight = lines.length * lineHeightPx;

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    
    // 【修正ポイント1】基準を「中央」から「中央のベースライン」に変更
    // これにより、1行目が常にキャンバスの真ん中に座るようになります
    ctx.textBaseline = 'middle'; 
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;

    const x = canvas.width / 2;

    const { x: offsetX, y: offsetY } = textPosRef.current;

    // textPos.x/y をそのまま「中心からのズレ」として使います
    // const centerX = (canvas.width / 2) + textPos.x;
    // 1行目のベースライン位置を計算
    // テキスト全体の中央位置を固定
    // const startY = (canvas.height / 2) - (totalHeight / 2) + (lineHeightPx / 2) + textPos.y;

    // 中央からのズレとして使用
    const startY = (canvas.height / 2) - (totalHeight / 2) + (lineHeightPx / 2) + offsetY;
    const centerX = (canvas.width / 2) + offsetX;

    lines.forEach((line, index) => {
      // index=0（1行目）のときは currentY = startY となり動きません
      // index=1以降、行間（_lineHeight）が加算されて下に配置されます
      const currentY = startY + (index * _lineHeight);

      // 1. 影
      if (shadowEnabled) {
        ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = shadowOffsetX;
        ctx.shadowOffsetY = shadowOffsetY;
        ctx.fillStyle = 'black';
        ctx.fillText(line, centerX, currentY);

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      // 2. 外側の縁（border2）
      if (border2Width > 0) {
        ctx.strokeStyle = border2Color;
        ctx.lineWidth = border2Width * 2;
        ctx.strokeText(line, centerX, currentY);
      }

      // 3. 内側の縁（border1）
      if (border1Width > 0) {
        ctx.strokeStyle = border1Color;
        ctx.lineWidth = border1Width * 2;
        ctx.strokeText(line, centerX, currentY);
      }

      // 4. テキスト本体
      if (textColorType === 'gradient') {
        const metrics = ctx.measureText(line);
        const textWidth = metrics.width;
        const textHeight = fontSize;

        const angleRad = (textGradientAngle * Math.PI) / 180;
        const x1 = x - (textWidth / 2) * Math.cos(angleRad);
        const y1 = currentY - (textHeight / 2) * Math.sin(angleRad);
        const x2 = x + (textWidth / 2) * Math.cos(angleRad);
        const y2 = currentY + (textHeight / 2) * Math.sin(angleRad);

        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, textGradientStart);
        gradient.addColorStop(1, textGradientEnd);
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = textColor;
      }
      ctx.fillText(line, centerX, currentY);
    });
  };
  
  const downloadImage =  async() => {
    await document.fonts.load(`${fontSize}px ${fontFamily}`);
    const downloadCanvas = downloadCanvasRef.current;
    if (!downloadCanvas) return;

    const ctx = downloadCanvas.getContext('2d');
    if (!ctx) return;

    if (!canvasRef.current) return;

    // 1. キャンバスの初期化
    ctx.clearRect(0, 0, downloadCanvas.width, downloadCanvas.height);

    // 2. スケール（プレビュー用キャンバスとダウンロード用キャンバスの比率）の計算
    const scale = downloadCanvas.width / canvasRef.current.width;
    const scaledFontSize = fontSize * scale;
    const lines = text.split('\n');
    const scaledLineHeight = scaledFontSize * lineHeight; // 行間

    // 3. 基本設定の適用
    ctx.font = `${scaledFontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;

    const x = downloadCanvas.width / 2;
    // 全行の合計高さを計算し、垂直方向の中央位置を割り出す
    const totalHeight = lines.length * scaledLineHeight;
    let startY = (downloadCanvas.height / 2) - (totalHeight / 2) + (lineHeight / 2);

    // 4. 各行をループして描画
    lines.forEach((line, index) => {
      const currentY = startY + (index * scaledLineHeight);

      // --- 影の描画 ---
      if (shadowEnabled) {
        ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`;
        ctx.shadowBlur = shadowBlur * scale;
        ctx.shadowOffsetX = shadowOffsetX * scale;
        ctx.shadowOffsetY = shadowOffsetY * scale;
        ctx.fillStyle = 'black';
        ctx.fillText(line, x, currentY);

        // 影設定をリセット（縁取りに影響させないため）
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      // --- 外側の縁（border2） ---
      if (border2Width > 0) {
        ctx.strokeStyle = border2Color;
        ctx.lineWidth = border2Width * 2 * scale;
        ctx.strokeText(line, x, currentY);
      }

      // --- 内側の縁（border1） ---
      if (border1Width > 0) {
        ctx.strokeStyle = border1Color;
        ctx.lineWidth = border1Width * 2 * scale;
        ctx.strokeText(line, x, currentY);
      }

      // --- テキスト本体（グラデーション/塗りつぶし） ---
      if (textColorType === 'gradient') {
        const metrics = ctx.measureText(line);
        const textWidth = metrics.width;
        const textHeight = scaledFontSize;

        const angleRad = (textGradientAngle * Math.PI) / 180;
        const x1 = x - (textWidth / 2) * Math.cos(angleRad);
        const y1 = currentY - (textHeight / 2) * Math.sin(angleRad);
        const x2 = x + (textWidth / 2) * Math.cos(angleRad);
        const y2 = currentY + (textHeight / 2) * Math.sin(angleRad);

        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, textGradientStart);
        gradient.addColorStop(1, textGradientEnd);
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = textColor;
      }
      ctx.fillText(line, x, currentY);
    });

    // 5. 画像として書き出し
    downloadCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `decorated-text-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const savePreset = () => {
    const presetName = prompt("プリセットの名前を入力してください", `Preset ${presets.length + 1}`);
    if (!presetName) return;

    const newPreset = {
      name: presetName,
      config: {
        fontFamily,
        fontSize,
        lineHeight,
        textColor,
        textColorType,
        textGradientStart,
        textGradientEnd,
        textGradientAngle,
        border1Color,
        border1Width,
        border2Color,
        border2Width
        // ...その他保存したいパラメータ
      }
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);

    // localStorageに保存 (JSON形式の文字列にする)
    localStorage.setItem('text-decorator-presets', JSON.stringify(updatedPresets));
  };

  const loadPreset = (preset: Preset) => {
    const c = preset.config;
    if (c.textColor !== undefined) setTextColor(c.textColor);
    if (c.textColorType !== undefined) setTextColorType(c.textColorType);
    if (c.textGradientStart !== undefined) setTextGradientStart(c.textGradientStart);
    if (c.textGradientEnd !== undefined) setTextGradientEnd(c.textGradientEnd);
    if (c.textGradientAngle !== undefined) setTextGradientAngle(c.textGradientAngle);
    if (c.border1Color !== undefined) setBorder1Color(c.border1Color);
    if (c.border1Width !== undefined) setBorder1Width(c.border1Width);
    if (c.border2Color !== undefined) setBorder2Color(c.border2Color);
    if (c.border2Width !== undefined) setBorder2Width(c.border2Width);
    if (c.shadowEnabled !== undefined) setShadowEnabled(c.shadowEnabled);
    if (c.shadowOffsetX !== undefined) setShadowOffsetX(c.shadowOffsetX);
    if (c.shadowOffsetY !== undefined) setShadowOffsetY(c.shadowOffsetY);
    if (c.shadowBlur !== undefined) setShadowBlur(c.shadowBlur);
    if (c.shadowOpacity !== undefined) setShadowOpacity(c.shadowOpacity);
  };

//  const currentFonts = fontSource === 'preset' ? presetFonts : localFonts;

  return (
  /* w-screen h-screen で画面全体を強制的に占有し、flex で横並びにします */
  <div className="flex flex-row w-screen h-screen bg-slate-900 text-white overflow-hidden">
    
{/* 左カラム：Preset Panel */}
<aside className="w-64 flex-shrink-0 border-r border-slate-700 bg-slate-800 p-4 flex flex-col overflow-hidden">
  <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
    <Sun size={20} className="text-yellow-400" /> Presets
  </h2>

  {/* スクロール可能なエリア */}
<div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
  {presets.map((preset, index) => (
    /* 外側を button から div に変更 */
    <div
      key={index}
      className="group relative w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-900 transition-all hover:border-blue-500 hover:ring-1 hover:ring-blue-500 cursor-pointer"
      onClick={() => loadPreset(preset)}
    >
      <div className="p-3"> {/* 余白用の中敷き */}
        {/* プリセット名 */}
        <span className="text-sm font-medium text-slate-200 block mb-2">{preset.name}</span>
        
        {/* 小さなプレビュー表示 */}
        <div 
          className="w-full h-1.5 rounded-full" 
          style={{ 
            background: preset.config.textColorType === 'gradient' 
              ? `linear-gradient(90deg, ${preset.config.textGradientStart}, ${preset.config.textGradientEnd})`
              : (preset.config.textColor || '#FFFFFF') /* null対策 */
          }}
        />
      </div>

      {/* ゴミ箱ボタン：divの中であればOK */}
      <button
        onClick={(e) => {
          e.stopPropagation(); 
          deletePreset(index);
        }}
        className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
        title="削除"
      >
        <Trash2 size={14} />
      </button>
    </div>
  ))}
</div>

  {/* 下部に現在の設定を保存するボタン（右側にもありますが、ここにあると便利） */}
  {/*
  <button 
    onClick={savePreset}
    className="mt-4 flex items-center justify-center gap-2 rounded-md bg-slate-700 py-2 text-xs font-bold text-white hover:bg-slate-600"
  >
    <Save size={14} /> New Preset
  </button>
  */}
</aside>
    {/* 中央カラム：Main Editor (flex-1 = 残りの幅をすべて使う) */}
    <main className="flex-1 min-w-0 flex flex-col p-6 bg-slate-900">
      <div className="mb-4">
        <label className="block text-sm text-slate-400 mb-1">Text Input</label>
        <textarea 
          className="w-full h-32 bg-slate-800 border border-slate-700 rounded p-3 text-white"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      
      {/* プレビューエリア：flex-1 で余った下のスペースをすべて埋める */}
        <div ref={containerRef} min-w-0="true" min-h-0="true" className="flex-1 flex items-center justify-center bg-black border border-slate-800 rounded-lg relative overflow-hidden">
          <canvas ref={canvasRef} 
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp} // 枠外に出たらドラッグ終了
            style={{             
            /* 格子模様のインライン指定 */
            backgroundColor: '#f8f8f8',
            backgroundImage: `
              linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee), 
              linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee)
            `,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 10px 10px',maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            className={`max-w-full max-h-full shadow-2xl ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`} />

            {/* ダウンロード用（ユーザーには見えない） */}
            <canvas 
              ref={downloadCanvasRef} 
              width={1920} // 保存したい解像度
              height={1080} 
              className="hidden" 
            />
      </div>
    </main>

    {/* 右カラム：Property (固定幅 w-80 = 320px) */}
{/* 右カラム：Property Panel */}
<aside className="w-80 flex-shrink-0 border-l border-slate-700 bg-slate-800 p-4 flex flex-col gap-6 overflow-y-auto">
  
  {/* ヘッダー：Exportボタン */}
  <div className="flex justify-between items-center border-b border-slate-700 pb-4">
    <h2 className="text-xl font-bold flex items-center gap-2">
      <Palette size={20} className="text-blue-400" /> Style
    </h2>
    <button 
      onClick={downloadImage}
      className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-bold transition-colors"
    >
      <Download size={16} /> Export PNG
    </button>
  </div>

{/* TYPOGRAPHY SECTION */}
<section className="space-y-4">
  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Typography</h3>
  
  {/* Font Family Label & Action Button */}
  <div className="space-y-2">
    <div className="flex justify-between items-end">
      <label className="text-xs text-slate-400">Font Family</label>
      
      {/* サポート状況に応じた表示の切り替え */}
      {localFontsAvailable ? (
        localFonts.length === 0 && (
          <button 
            onClick={loadLocalFonts} 
            className="text-[10px] px-2 py-1 bg-slate-700 hover:bg-slate-600 text-blue-400 rounded border border-slate-600 transition-colors"
          >
            Load System Fonts
          </button>
        )
      ) : (
        <span className="text-[10px] text-amber-500/50">System fonts not supported</span>
      )}
    </div>

    {/* Select Box */}
    <select 
      value={fontFamily}
      onChange={(e) => setFontFamily(e.target.value)}
      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm focus:outline-none focus:border-blue-500 text-white cursor-pointer"
    >
      <optgroup label="Standard Fonts" className="bg-slate-800 text-slate-400">
        {presetFonts.map(f => (
          <option key={f.family} value={f.family} className="text-white bg-slate-900">
            {f.label}
          </option>
        ))}
      </optgroup>

      {localFonts.length > 0 && (
        <optgroup label="System Fonts" className="bg-slate-800 text-slate-400">
          {localFonts.map(f => (
            <option key={f.postscriptName} value={f.family} className="text-white bg-slate-900">
              {f.fullName}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  </div>
    {/* Size & Spacing */}
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-1">
      <label className="text-[10px] text-slate-500 uppercase font-bold">Size</label>
      <input 
        type="number" 
        value={fontSize}
        onChange={(e) => setFontSize(Number(e.target.value))}
        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
      />
    </div>
    <div className="space-y-1">
      <label className="text-[10px] text-slate-500 uppercase font-bold">Line Spacing</label>
      <div className="flex items-center gap-2">
        <input 
          type="range" min="0.5" max="2.5" step="0.1"
          value={lineHeight}
          onChange={(e) => setLineHeight(parseFloat(e.target.value))}
          className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <span className="text-[10px] font-mono text-blue-400 w-6 text-right">
          {lineHeight}
        </span>
      </div>
    </div>
  </div>
  </section>

  {/* FILL SECTION (Main Color) */}
  <section className="space-y-4 border-t border-slate-700 pt-4">
    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fill</h3>
    
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400">Type</span>
<div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
  <button 
    onClick={() => setTextColorType('solid')}
    className={`flex-1 px-3 py-1.5 text-xs rounded-md transition-all duration-200 ${
      textColorType === 'solid' 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'bg-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900'
    }`}
  >
    Solid
  </button>
  <button 
    onClick={() => setTextColorType('gradient')}
    className={`flex-1 px-3 py-1.5 text-xs rounded-md transition-all duration-200 ${
      textColorType === 'gradient' 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'bg-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900'
    }`}
  >
    Gradient
  </button>
</div>    </div>

    {textColorType === 'solid' ? (
      <div className="flex items-center gap-3">
        <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer" />
        <span className="text-xs font-mono text-slate-300">{textColor.toUpperCase()}</span>
      </div>
    ) : (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input type="color" value={textGradientStart} onChange={(e) => setTextGradientStart(e.target.value)} className="w-8 h-8 rounded bg-transparent" />
          <span className="text-slate-500">→</span>
          <input type="color" value={textGradientEnd} onChange={(e) => setTextGradientEnd(e.target.value)} className="w-8 h-8 rounded bg-transparent" />
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-400">
          <span>Angle</span>
          <span>{textGradientAngle}</span>
        </div>
        <input 
          type="range" min="0" max="360" value={textGradientAngle} 
          onChange={(e) => setTextGradientAngle(Number(e.target.value))}
          className="w-full h-1 bg-slate-700 accent-blue-500" 
        />
      </div>
    )}
  </section>

  {/* BORDER SECTION */}
  <section className="space-y-4 border-t border-slate-700 pt-4">
    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Borders</h3>
    
    {/* Inner Border */}
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[10px] text-slate-400">
        <span>Inner Frame</span>
        <span>{border1Width}px</span>
      </div>
      <div className="flex items-center gap-3">
        <input type="color" value={border1Color} onChange={(e) => setBorder1Color(e.target.value)} className="w-6 h-6 rounded bg-transparent" />
        <input 
          type="range" min="0" max="40" value={border1Width} 
          onChange={(e) => setBorder1Width(Number(e.target.value))}
          className="flex-1 h-1 bg-slate-700 accent-blue-500" 
        />
      </div>
    </div>

    {/* Outer Border */}
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[10px] text-slate-400">
        <span>Outer Frame</span>
        <span>{border2Width}px</span>
      </div>
      <div className="flex items-center gap-3">
        <input type="color" value={border2Color} onChange={(e) => setBorder2Color(e.target.value)} className="w-6 h-6 rounded bg-transparent" />
        <input 
          type="range" min="0" max="60" value={border2Width} 
          onChange={(e) => setBorder2Width(Number(e.target.value))}
          className="flex-1 h-1 bg-slate-700 accent-blue-500" 
        />
      </div>
    </div>
  </section>

  {/* 保存ボタン：プリセットへの保存 */}
  <button 
    onClick={savePreset}
    className="mt-6 w-full group border border-slate-600 bg-transparent hover:bg-slate-700 text-slate-300 hover:text-white py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
  >
    <Save size={16} className="text-slate-400 group-hover:text-white transition-colors" />
    <span>Save to Preset</span>
  </button>
</aside>
  </div>
  );
}