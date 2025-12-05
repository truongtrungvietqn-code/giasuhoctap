import React, { useState, useEffect } from 'react';
import { Key, Save, ExternalLink, X, List, CheckCircle2 } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  currentKey: string;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, currentKey }) => {
  const [keyInput, setKeyInput] = useState(currentKey);
  const [validCount, setValidCount] = useState(0);

  useEffect(() => {
    setKeyInput(currentKey);
  }, [currentKey]);

  useEffect(() => {
    // Count valid keys (starting with AIza)
    const count = keyInput
        .split(/[\n,]+/)
        .map(k => k.trim())
        .filter(k => k.startsWith('AIza'))
        .length;
    setValidCount(count);
  }, [keyInput]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyInput.trim()) {
      onSave(keyInput.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 m-4 transform transition-all scale-100 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-5 shrink-0">
          <div className="flex items-center gap-3 text-slate-800">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Key className="w-6 h-6 text-blue-600" />
            </div>
            <div>
                <h2 className="text-xl font-bold">Cấu hình API Key</h2>
                <p className="text-xs text-slate-500">Hỗ trợ nhiều Key để chạy liên tục</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 flex flex-col flex-1 min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
            <label className="block text-sm font-medium text-slate-700 mb-2 flex justify-between">
              <span>Danh sách Google Gemini API Key</span>
              {validCount > 0 && (
                  <span className="text-green-600 flex items-center gap-1 text-xs font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      <CheckCircle2 size={12}/> Đã tìm thấy {validCount} Key hợp lệ
                  </span>
              )}
            </label>
            <textarea
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Nhập API Key của bạn tại đây...&#10;Mỗi dòng một Key (AIzaSy...)"
              className="w-full flex-1 min-h-[150px] px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-slate-800 font-mono text-sm resize-none custom-scrollbar"
              autoFocus
              spellCheck={false}
            />
            <p className="text-xs text-slate-500 mt-2">
              <strong>Mẹo:</strong> Nhập nhiều Key (mỗi dòng 1 key). Nếu Key đầu bị lỗi giới hạn, hệ thống sẽ tự động chuyển sang Key tiếp theo.
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shrink-0">
            <p className="text-sm text-blue-800 mb-2 flex items-center gap-2">
              <ExternalLink size={14} />
              <strong>Chưa có Key?</strong>
            </p>
            <p className="text-sm text-blue-700">
              Truy cập <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-blue-900">Google AI Studio</a> để lấy key miễn phí.
            </p>
          </div>

          <button
            type="submit"
            disabled={validCount === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Save size={20} />
            Lưu {validCount} Key & Sẵn Sàng
          </button>
        </form>
      </div>
    </div>
  );
};

export default ApiKeyModal;