// import React, { useState, useEffect, useRef } from 'react';
import './fonts.css'
import { useState, useRef, useEffect } from 'react';
import { Download, Save, FolderOpen, Type, Palette, Frame, Sun, AlertCircle } from 'lucide-react';

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
  const [fontSource, setFontSource] = useState<'preset' | 'local'>('preset');
  const [isLoadingFonts, setIsLoadingFonts] = useState(false);

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

  const [activeTab, setActiveTab] = useState('text');
  const [presets, setPresets] = useState<Preset[]>([
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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const downloadCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Local Font Access APIのサポート確認
  useEffect(() => {
    if ('queryLocalFonts' in window) {
      setLocalFontsAvailable(true);
    }
  }, []);

  // ローカルフォントの取得
  const loadLocalFonts = async () => {
    if (!('queryLocalFonts' in window)) return;

    setIsLoadingFonts(true);
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
      setFontSource('local');
      
      // 最初のローカルフォントを選択
      if (uniqueFonts.length > 0) {
        setFontFamily((uniqueFonts[0] as LocalFont).family);
      }
    } catch (error: any) {
      console.error('フォントアクセスエラー:', error);
      
      let errorMessage = 'フォントへのアクセスに失敗しました。';
      
      if (error.name === 'SecurityError') {
        errorMessage = 'この環境ではローカルフォント機能が制限されています。';
      } else if (error.name === 'NotAllowedError') {
        errorMessage = 'フォントへのアクセス権限が拒否されました。\nブラウザの設定で権限を許可してください。';
      }
      
      alert(errorMessage);
      setFontSource('preset');
    } finally {
      setIsLoadingFonts(false);
    }
  };

  // フォントソース切り替え
  const handleFontSourceChange = (source: 'preset' | 'local') => {
    if (source === 'local' && localFonts.length === 0) {
      loadLocalFonts();
    } else {
      setFontSource(source);
      if (source === 'preset') {
        setFontFamily(presetFonts[0].family);
      } else if (localFonts.length > 0) {
        setFontFamily(localFonts[0].family);
      }
    }
  };

  useEffect(() => {
    drawText();
  }, [text, fontSize, fontFamily, textColor, textColorType, textGradientStart,
    textGradientEnd, textGradientAngle, border1Color, border1Width,
    border2Color, border2Width, shadowEnabled, shadowOffsetX,
    shadowOffsetY, shadowBlur, shadowOpacity]);

  const drawText = async (targetCanvas = canvasRef.current) => {
    const canvas = targetCanvas;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // フォントが読み込まれるまで待つ
    try {
      await document.fonts.load(`${fontSize}px ${fontFamily}`);
    } catch (error) {
      console.warn('Font loading warning:', error);
    }

    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;

    const x = canvas.width / 2;
    const y = canvas.height / 2;

    // 影
    if (shadowEnabled) {
      ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`;
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = shadowOffsetX;
      ctx.shadowOffsetY = shadowOffsetY;
      ctx.fillStyle = 'black';
      ctx.fillText(text, x, y);

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // 外側の縁（border2）
    if (border2Width > 0) {
      ctx.strokeStyle = border2Color;
      ctx.lineWidth = border2Width * 2;
      ctx.strokeText(text, x, y);
    }

    // 内側の縁（border1）
    if (border1Width > 0) {
      ctx.strokeStyle = border1Color;
      ctx.lineWidth = border1Width * 2;
      ctx.strokeText(text, x, y);
    }

    // テキスト本体（グラデーション対応）
    if (textColorType === 'gradient') {
      const metrics = ctx.measureText(text);
      const textHeight = fontSize;
      const textWidth = metrics.width;

      const angleRad = (textGradientAngle * Math.PI) / 180;
      const x1 = x - (textWidth / 2) * Math.cos(angleRad);
      const y1 = y - (textHeight / 2) * Math.sin(angleRad);
      const x2 = x + (textWidth / 2) * Math.cos(angleRad);
      const y2 = y + (textHeight / 2) * Math.sin(angleRad);

      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, textGradientStart);
      gradient.addColorStop(1, textGradientEnd);
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = textColor;
    }
    ctx.fillText(text, x, y);
  };

  const downloadImage = () => {
    const downloadCanvas = downloadCanvasRef.current;
    if (!downloadCanvas) return;

    const ctx = downloadCanvas.getContext('2d');
    if (!ctx) return;

    if (!canvasRef.current) return;

    ctx.clearRect(0, 0, downloadCanvas.width, downloadCanvas.height);

    const scale = downloadCanvas.width / canvasRef.current.width;

    ctx.font = `${fontSize * scale}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;

    const x = downloadCanvas.width / 2;
    const y = downloadCanvas.height / 2;

    if (shadowEnabled) {
      ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`;
      ctx.shadowBlur = shadowBlur * scale;
      ctx.shadowOffsetX = shadowOffsetX * scale;
      ctx.shadowOffsetY = shadowOffsetY * scale;
      ctx.fillStyle = 'black';
      ctx.fillText(text, x, y);

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    if (border2Width > 0) {
      ctx.strokeStyle = border2Color;
      ctx.lineWidth = border2Width * 2 * scale;
      ctx.strokeText(text, x, y);
    }

    if (border1Width > 0) {
      ctx.strokeStyle = border1Color;
      ctx.lineWidth = border1Width * 2 * scale;
      ctx.strokeText(text, x, y);
    }

    if (textColorType === 'gradient') {
      const metrics = ctx.measureText(text);
      const textHeight = fontSize * scale;
      const textWidth = metrics.width;

      const angleRad = (textGradientAngle * Math.PI) / 180;
      const x1 = x - (textWidth / 2) * Math.cos(angleRad);
      const y1 = y - (textHeight / 2) * Math.sin(angleRad);
      const x2 = x + (textWidth / 2) * Math.cos(angleRad);
      const y2 = y + (textHeight / 2) * Math.sin(angleRad);

      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, textGradientStart);
      gradient.addColorStop(1, textGradientEnd);
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = textColor;
    }
    ctx.fillText(text, x, y);

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
    const name = prompt('プリセット名を入力してください:');
    if (!name) return;

    const config: PresetConfig = {
      textColor,
      textColorType,
      textGradientStart,
      textGradientEnd,
      textGradientAngle,
      border1Color,
      border1Width,
      border2Color,
      border2Width,
      shadowEnabled,
      shadowOffsetX,
      shadowOffsetY,
      shadowBlur,
      shadowOpacity,
    };

    setPresets([...presets, { name, config }]);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-1 flex items-center justify-center gap-2">
            <Type className="w-8 h-8" />
            装飾文字ジェネレーター
          </h1>
          <p className="text-slate-400 text-sm">テキストを変更すると全ての効果が自動追従</p>
        </div>

        {/* Local Font API未対応の警告 */}
        {!localFontsAvailable && (
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-300 mb-1">💡 ローカルフォント機能について</p>
              <p className="text-blue-200">
                Chrome/Edge 103以降では、お使いのPC内のフォントを直接使用できます。
                現在のブラウザでは未対応のため、プリセットフォントのみ利用可能です。
              </p>
            </div>
          </div>
        )}

        {/* プリセット選択 */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              プリセット
            </h3>
            <button
              onClick={savePreset}
              className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded flex items-center gap-1 transition"
            >
              <Save className="w-3 h-3" />
              現在の設定を保存
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => loadPreset(preset)}
                className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-sm transition"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-4">
          {/* プレビュー */}
          <div className="lg:col-span-3 bg-slate-800 rounded-lg p-4 shadow-xl">
            <h2 className="text-lg font-semibold mb-3">プレビュー</h2>
            <div className="bg-slate-700 rounded-lg p-4 flex items-center justify-center mb-4" style={{ minHeight: '300px' }}>
              <canvas
                ref={canvasRef}
                width={800}
                height={450}
                className="max-w-full h-auto border-2 border-slate-600 rounded"
                style={{ backgroundColor: 'transparent' }}
              />
            </div>

            {/* テキスト入力 */}
            <div className="mb-3">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-4 py-3 text-white text-lg"
                placeholder="テキストを入力"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-1">フォント</label>
                
                {/* フォントソース選択（Local Font API対応時のみ表示） */}
                {localFontsAvailable && (
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => handleFontSourceChange('preset')}
                      className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-colors ${
                        fontSource === 'preset'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      プリセット
                    </button>
                    <button
                      onClick={() => handleFontSourceChange('local')}
                      disabled={isLoadingFonts}
                      className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-colors ${
                        fontSource === 'local'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoadingFonts ? '読込中...' : `ローカル${localFonts.length > 0 ? ` (${localFonts.length})` : ''}`}
                    </button>
                  </div>
                )}

                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                  disabled={isLoadingFonts}
                >
                  {fontSource === 'preset' ? (
                    presetFonts.map(font => (
                      <option key={font.label} value={font.family}>
                        {font.label}
                      </option>
                    ))
                  ) : (
                    localFonts.map(font => (
                      <option key={font.postscriptName} value={font.family}>
                        {font.family}
                      </option>
                    ))
                  )}
                </select>
              </div>
              
              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-1">
                  サイズ: {fontSize}px
                </label>
                <input
                  type="range"
                  min="40"
                  max="300"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
            </div>

            <button
              onClick={downloadImage}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <Download className="w-5 h-5" />
              PNG出力（1920×1080）
            </button>
          </div>

          {/* 設定パネル（タブ切り替え） */}
          <div className="lg:col-span-2 space-y-4">
            {/* タブボタン */}
            <div className="bg-slate-800 rounded-lg p-2 shadow-xl flex gap-1">
              <button
                onClick={() => setActiveTab('text')}
                className={`flex-1 py-2 px-3 rounded flex items-center justify-center gap-2 text-sm transition ${
                  activeTab === 'text' ? 'bg-slate-600' : 'bg-slate-700 hover:bg-slate-650'
                }`}
              >
                <Palette className="w-4 h-4" />
                テキスト
              </button>
              <button
                onClick={() => setActiveTab('border')}
                className={`flex-1 py-2 px-3 rounded flex items-center justify-center gap-2 text-sm transition ${
                  activeTab === 'border' ? 'bg-slate-600' : 'bg-slate-700 hover:bg-slate-650'
                }`}
              >
                <Frame className="w-4 h-4" />
                縁取り
              </button>
              <button
                onClick={() => setActiveTab('shadow')}
                className={`flex-1 py-2 px-3 rounded flex items-center justify-center gap-2 text-sm transition ${
                  activeTab === 'shadow' ? 'bg-slate-600' : 'bg-slate-700 hover:bg-slate-650'
                }`}
              >
                <Sun className="w-4 h-4" />
                影
              </button>
            </div>

            {/* タブコンテンツ */}
            <div className="bg-slate-800 rounded-lg p-4 shadow-xl">
              {activeTab === 'text' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-3">テキストカラー</h3>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setTextColorType('solid')}
                      className={`flex-1 py-2 px-3 rounded text-sm transition ${
                        textColorType === 'solid' ? 'bg-slate-600' : 'bg-slate-700 hover:bg-slate-650'
                      }`}
                    >
                      単色
                    </button>
                    <button
                      onClick={() => setTextColorType('gradient')}
                      className={`flex-1 py-2 px-3 rounded text-sm transition ${
                        textColorType === 'gradient' ? 'bg-slate-600' : 'bg-slate-700 hover:bg-slate-650'
                      }`}
                    >
                      グラデーション
                    </button>
                  </div>

                  {textColorType === 'solid' ? (
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-16 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-xs text-slate-400 mb-1">開始色</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={textGradientStart}
                              onChange={(e) => setTextGradientStart(e.target.value)}
                              className="w-12 h-8 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={textGradientStart}
                              onChange={(e) => setTextGradientStart(e.target.value)}
                              className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-slate-400 mb-1">終了色</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={textGradientEnd}
                              onChange={(e) => setTextGradientEnd(e.target.value)}
                              className="w-12 h-8 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={textGradientEnd}
                              onChange={(e) => setTextGradientEnd(e.target.value)}
                              className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          角度: {textGradientAngle}°
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={textGradientAngle}
                          onChange={(e) => setTextGradientAngle(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'border' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-3">縁取り設定</h3>

                  <div>
                    <label className="block text-sm font-medium mb-2">内側の縁（1本目）</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="color"
                        value={border1Color}
                        onChange={(e) => setBorder1Color(e.target.value)}
                        className="w-14 h-9 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={border1Color}
                        onChange={(e) => setBorder1Color(e.target.value)}
                        className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                      />
                    </div>
                    <label className="block text-xs text-slate-400 mb-1">
                      幅: {border1Width}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={border1Width}
                      onChange={(e) => setBorder1Width(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">外側の縁（2本目）</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="color"
                        value={border2Color}
                        onChange={(e) => setBorder2Color(e.target.value)}
                        className="w-14 h-9 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={border2Color}
                        onChange={(e) => setBorder2Color(e.target.value)}
                        className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                      />
                    </div>
                    <label className="block text-xs text-slate-400 mb-1">
                      幅: {border2Width}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={border2Width}
                      onChange={(e) => setBorder2Width(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'shadow' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">影設定</h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shadowEnabled}
                        onChange={(e) => setShadowEnabled(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">有効</span>
                    </label>
                  </div>

                  {shadowEnabled && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          X方向: {shadowOffsetX}px
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="30"
                          value={shadowOffsetX}
                          onChange={(e) => setShadowOffsetX(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          Y方向: {shadowOffsetY}px
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="30"
                          value={shadowOffsetY}
                          onChange={(e) => setShadowOffsetY(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          ぼかし: {shadowBlur}px
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="30"
                          value={shadowBlur}
                          onChange={(e) => setShadowBlur(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          不透明度: {Math.round(shadowOpacity * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={shadowOpacity}
                          onChange={(e) => setShadowOpacity(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <canvas
          ref={downloadCanvasRef}
          width={1920}
          height={1080}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}