import React, { useState, useRef } from 'react';
import { generateLessonPlan, NLS_CONTEXT_REF } from '../services/geminiService';
import { Upload, FileUp, Sparkles, ArrowRight, FileText, X, AlertCircle } from 'lucide-react';
import { processUploadedFile, ProcessedFile } from '../utils/fileProcessing';

interface TabEnhanceProps {
  onResult: (result: string) => void;
  onError: (error: string) => void;
  setLoading: (loading: boolean) => void;
  apiKey: string;
}

const TabEnhance: React.FC<TabEnhanceProps> = ({ onResult, onError, setLoading, apiKey }) => {
  const [content, setContent] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'word' | 'text' | null>(null);
  const [pdfPart, setPdfPart] = useState<{mimeType: string, data: string} | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setFileName("Đang xử lý file...");
      const processed: ProcessedFile = await processUploadedFile(file);

      if (processed.type === 'pdf_part') {
         setPdfPart({ mimeType: 'application/pdf', data: processed.content });
         setFileName(`${processed.fileName}`);
         setFileType('pdf');
         setContent(`(Đã tải lên file PDF: ${processed.fileName}. Hệ thống sẽ đọc toàn bộ các trang.)`);
      } else {
         setPdfPart(undefined);
         // If word, we set the content to the HTML/Text extracted
         setContent(processed.content);
         setFileName(`${processed.fileName}`);
         setFileType('word');
      }
    } catch (err: any) {
      onError(err.message);
      setFileName(null);
      setFileType(null);
    }
  };

  const clearFile = () => {
      setFileName(null);
      setFileType(null);
      setPdfPart(undefined);
      setContent('');
      if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const handleSubmit = async () => {
    if (!apiKey) {
        onError("Vui lòng nhập API Key trong phần Cấu hình để tiếp tục.");
        return;
    }
    
    if (!content.trim() && !pdfPart) {
      onError("Vui lòng dán nội dung giáo án hoặc tải file lên.");
      return;
    }

    setLoading(true);
    onError("");

    const prompt = `
      NHIỆM VỤ TỐI MẬT: TÁI TẠO LẠI HOÀN TOÀN BỘ GIÁO ÁN VÀ THÊM NLS.
      
      TÔI RA LỆNH CHO BẠN: KHÔNG ĐƯỢC DỪNG LẠI CHO ĐẾN KHI HẾT BÀI.
      - Bạn phải đọc hết TẤT CẢ CÁC TRANG của file đính kèm.
      - Nếu file có Hoạt động 1, 2, 3, 4, 5... bạn phải liệt kê đủ cả 5. Không được dừng ở Hoạt động 2.
      - Nếu bảng "Tiến trình dạy học" dài qua nhiều trang, hãy nối nó lại thành 1 bảng duy nhất.

      CẤU TRÚC BẮT BUỘC:
      1. Mục tiêu (Text danh sách)
      2. Thiết bị dạy học (Text danh sách)
      3. TIẾN TRÌNH DẠY HỌC (Bảng Markdown 2 cột - QUAN TRỌNG NHẤT - KHÔNG ĐƯỢC CẮT BỚT):
         | HOẠT ĐỘNG CỦA GV - HS | DỰ KIẾN SẢN PHẨM |
         | :--- | :--- |
         | (Nội dung chi tiết...) | (Nội dung chi tiết...) |
      4. Đánh giá (Text)

      HÃY VIẾT LIÊN TỤC, ĐỪNG DỪNG LẠI.

      DỮ LIỆU ĐẦU VÀO:
      """
      ${content}
      """

      THAM CHIẾU NLS:
      """
      ${NLS_CONTEXT_REF}
      """
    `;

    try {
      const result = await generateLessonPlan(prompt, pdfPart, apiKey);
      if (result) {
        onResult(result);
      } else {
        onError("AI không trả về kết quả.");
      }
    } catch (err: any) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {!apiKey && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg flex items-center gap-2 text-sm">
           <AlertCircle size={16}/>
           <span>Bạn chưa nhập API Key. Vui lòng nhấn vào biểu tượng chìa khoá/bánh răng để nhập.</span>
        </div>
      )}

      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900 shadow-sm">
        <h3 className="font-bold flex items-center gap-2 mb-2 uppercase text-blue-700">
            <div className="bg-blue-100 p-1.5 rounded-lg">
                <FileUp size={16} />
            </div>
            CHẾ ĐỘ XỬ LÝ TOÀN VĂN:
        </h3>
        <ul className="list-disc list-inside space-y-1.5 ml-1 text-slate-700">
            <li>Tự động <strong>đọc và nối</strong> các trang PDF thành một bài hoàn chỉnh.</li>
            <li>Giữ nguyên định dạng bảng biểu và cấu trúc gốc.</li>
            <li>Tích hợp mã Năng lực số chuẩn xác vào từng hoạt động.</li>
        </ul>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Tải lên Giáo án gốc (Word/PDF)
        </label>
        <div className="relative">
            <div className="min-h-[160px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-6 hover:bg-slate-50 hover:border-blue-400 transition-all bg-slate-50/30 group">
                {fileName ? (
                    <div className="text-center w-full">
                         <div className="flex items-center justify-center gap-3 text-blue-700 bg-blue-50 p-3 rounded-xl border border-blue-200 mb-3 mx-auto max-w-md shadow-sm">
                            <FileText size={24} className="shrink-0"/> 
                            <span className="truncate font-medium">{fileName}</span>
                            <button type="button" onClick={clearFile} className="text-slate-400 hover:text-red-500 ml-2 p-1 hover:bg-white rounded-md transition-colors">
                                <X size={20} />
                            </button>
                         </div>
                         <p className="text-sm text-slate-500 flex items-center justify-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Đã nhận file. Sẵn sàng xử lý.
                         </p>
                    </div>
                ) : (
                    <div className="text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="bg-white p-3 rounded-full shadow-sm inline-block mb-3 border border-slate-100 group-hover:scale-110 transition-transform">
                            <Upload size={28} className="text-blue-500" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">Nhấn để tải lên file Word (.docx) hoặc PDF (.pdf)</p>
                        <p className="text-xs text-slate-500 mt-1">Hỗ trợ file dài, nhiều trang</p>
                    </div>
                )}
            </div>
            
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".docx,.pdf" 
            />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={(!content && !pdfPart) || !apiKey}
        className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Sparkles size={20} />
        XỬ LÝ ĐẦY ĐỦ KHÔNG DỪNG
        <ArrowRight size={20} />
      </button>
    </div>
  );
};

export default TabEnhance;