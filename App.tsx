import React, { useState, useEffect } from 'react';
import { TabOption, GenerationState } from './types';
import TabCreate from './components/TabCreate';
import TabEnhance from './components/TabEnhance';
import LessonRenderer from './components/LessonRenderer';
import ApiKeyModal from './components/ApiKeyModal';
import { BookOpen, FileCode, Loader2, Info, Settings, Key } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<TabOption>(TabOption.CREATE);
  const [apiKey, setApiKey] = useState<string>('');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  
  const [genState, setGenState] = useState<GenerationState>({
    isLoading: false,
    result: null,
    error: null
  });

  // Load Key from LocalStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('GEMINI_API_KEY');
    // If process.env.API_KEY exists (e.g. build time), use it as fallback
    const envKey = process.env.API_KEY;
    
    if (storedKey) {
      setApiKey(storedKey);
    } else if (envKey) {
      setApiKey(envKey);
    } else {
      // Open modal if no key found
      setIsKeyModalOpen(true);
    }
  }, []);

  const handleSaveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('GEMINI_API_KEY', key);
  };

  const handleResult = (result: string) => {
    setGenState({ isLoading: false, result, error: null });
  };

  const handleError = (error: string) => {
    if (!error) {
        setGenState(prev => ({ ...prev, error: null }));
        return;
    }
    setGenState({ isLoading: false, result: null, error });
  };

  const setLoading = (isLoading: boolean) => {
    setGenState(prev => ({ ...prev, isLoading }));
  };

  return (
    <div className="min-h-screen bg-slate-100/50 text-slate-800 font-sans selection:bg-blue-100">
      
      <ApiKeyModal 
        isOpen={isKeyModalOpen} 
        onClose={() => setIsKeyModalOpen(false)} 
        onSave={handleSaveKey}
        currentKey={apiKey}
      />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 py-3">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2.5 rounded-xl shadow-lg shadow-blue-200">
                <BookOpen className="text-white h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">Trợ Lý Giáo Viên 4.0</h1>
                <p className="text-xs text-slate-500 font-medium">Tích hợp Năng lực số chuẩn TT 02/2025</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                  <span className="flex items-center gap-1.5"><Info size={14} className="text-blue-500"/> CV 5512</span>
                  <span className="w-px h-3 bg-slate-300"></span>
                  <span className="flex items-center gap-1.5"><Info size={14} className="text-blue-500"/> TT 02/2025</span>
               </div>
               
               <button 
                onClick={() => setIsKeyModalOpen(true)}
                className={`p-2 rounded-full transition-all ${apiKey ? 'text-slate-400 hover:text-blue-600 hover:bg-blue-50' : 'text-red-500 bg-red-50 animate-pulse'}`}
                title="Cấu hình API Key"
               >
                 {apiKey ? <Settings size={22} /> : <Key size={22} />}
               </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Input Form */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Tab Switcher */}
            <div className="bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 flex">
              <button
                onClick={() => setActiveTab(TabOption.CREATE)}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === TabOption.CREATE
                    ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                Tạo KHBD Mới
              </button>
              <button
                onClick={() => setActiveTab(TabOption.ENHANCE)}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === TabOption.ENHANCE
                    ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                Xử lý File có sẵn
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 md:p-8">
              {activeTab === TabOption.CREATE ? (
                <TabCreate 
                  onResult={handleResult} 
                  onError={handleError} 
                  setLoading={setLoading}
                  apiKey={apiKey}
                />
              ) : (
                <TabEnhance 
                  onResult={handleResult} 
                  onError={handleError} 
                  setLoading={setLoading}
                  apiKey={apiKey}
                />
              )}
            </div>

            {genState.error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-200 flex items-start gap-3 shadow-sm">
                    <Info className="shrink-0 mt-0.5" size={16}/>
                    <div>
                      <strong className="block mb-1">Đã xảy ra lỗi:</strong> 
                      {genState.error}
                    </div>
                </div>
            )}
            
            {/* Intro / Helper Text */}
            {!genState.result && !genState.isLoading && (
              <div className="hidden lg:block bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 shadow-sm">
                <div className="bg-white p-4 rounded-full inline-block shadow-sm mb-4">
                  <FileCode className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-1">Hỗ trợ soạn giáo án thông minh</h3>
                <p className="text-sm leading-relaxed max-w-xs mx-auto text-slate-500">
                  Nhập thông tin hoặc tải file giáo án lên để AI tự động chuẩn hoá theo mẫu 5512 và gợi ý mã NLS phù hợp nhất.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-7">
            {genState.isLoading ? (
              <div className="h-[600px] flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10"></div>
                
                {/* Decorative background elements */}
                <div className="absolute top-10 left-10 w-20 h-20 bg-blue-100 rounded-full blur-3xl opacity-50 animate-pulse"></div>
                <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-100 rounded-full blur-3xl opacity-50 animate-pulse delay-700"></div>

                <div className="z-20 flex flex-col items-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-ping"></div>
                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin relative z-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mt-6 mb-2">Đang xử lý dữ liệu...</h3>
                  <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                      Hệ thống đang phân tích nội dung, tra cứu bảng mã NLS và soạn thảo kế hoạch bài dạy chi tiết.
                  </p>
                </div>
              </div>
            ) : genState.result ? (
              <div className="h-[calc(100vh-140px)] sticky top-24">
                 <LessonRenderer content={genState.result} />
              </div>
            ) : (
              <div className="h-[600px] flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 p-8">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 border border-slate-100">
                  <BookOpen size={32} className="text-slate-300"/>
                </div>
                <p className="font-medium text-lg text-slate-500">Kết quả sẽ hiển thị tại đây</p>
                <p className="text-sm text-slate-400 mt-2">Vui lòng nhập nội dung ở cột bên trái</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;