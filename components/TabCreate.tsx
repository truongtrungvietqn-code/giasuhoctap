import React, { useState, useRef } from 'react';
import { Subject, LessonPlanInput } from '../types';
import { Upload, Sparkles, FileText, X, AlertCircle } from 'lucide-react';
import { generateLessonPlan, NLS_CONTEXT_REF } from '../services/geminiService';
import { processUploadedFile, ProcessedFile } from '../utils/fileProcessing';

interface TabCreateProps {
  onResult: (result: string) => void;
  onError: (error: string) => void;
  setLoading: (loading: boolean) => void;
  apiKey: string;
}

const TabCreate: React.FC<TabCreateProps> = ({ onResult, onError, setLoading, apiKey }) => {
  const [formData, setFormData] = useState<LessonPlanInput>({
    subject: Subject.MATH,
    grade: '10',
    textbook: 'Kết nối tri thức với cuộc sống',
    duration: '1 tiết (45 phút)',
    lessonName: '',
    content: ''
  });

  const [fileName, setFileName] = useState<string | null>(null);
  const [pdfPart, setPdfPart] = useState<{mimeType: string, data: string} | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setFileName("Đang xử lý file...");
      const processed: ProcessedFile = await processUploadedFile(file);

      if (processed.type === 'pdf_part') {
        setPdfPart({ mimeType: 'application/pdf', data: processed.content });
        setFileName(`${processed.fileName}`);
        // PDF content is handled via Vision
      } else {
        // Word text
        setFormData(prev => ({ 
            ...prev, 
            content: prev.content + processed.content 
        }));
        setPdfPart(undefined);
        setFileName(`${processed.fileName}`);
      }
    } catch (err: any) {
      onError(err.message);
      setFileName(null);
    }
  };

  const clearFile = () => {
      setFileName(null);
      setPdfPart(undefined);
      if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey) {
        onError("Vui lòng nhập API Key trong phần Cấu hình (biểu tượng bánh răng ở góc trên bên phải) để tiếp tục.");
        return;
    }

    setLoading(true);
    onError("");

    const prompt = `
      Hãy tạo PHỤ LỤC 4 – KẾ HOẠCH BÀI DẠY (GIÁO ÁN) theo Công văn 5512 
      và tích hợp Năng lực số theo Thông tư 02/2025 + Công văn 3456 
      cho môn ${formData.subject}, lớp ${formData.grade}, bài "${formData.lessonName}", thời lượng ${formData.duration}, 
      bộ sách ${formData.textbook}.

      YÊU CẦU ĐẶC BIỆT: VIẾT ĐẦY ĐỦ, CHI TIẾT, KHÔNG TÓM TẮT.
      1. TRÌNH BÀY DẠNG BẢNG (MARKDOWN TABLE): Riêng phần Tiến trình dạy học phải được kẻ bảng 2 cột (| Hoạt động | Sản phẩm |).
      2. KHÔNG ĐƯỢC DÙNG DẤU "...": Phải viết đầy đủ nội dung bài học, nhiệm vụ học tập, lời giảng của GV.
      3. ĐỌC KỸ FILE ĐÍNH KÈM (Nếu có): Hãy lấy toàn bộ nội dung trong file để điền vào giáo án, không bỏ sót chi tiết nào.

      CẤU TRÚC BẮT BUỘC:
      I. MỤC TIÊU (Có mục tiêu NLS + Mã)
      II. THIẾT BỊ DẠY HỌC (Dạng liệt kê, không bảng)
      III. TIẾN TRÌNH DẠY HỌC (Dạng Bảng, nội dung đầy đủ)
      IV. ĐÁNH GIÁ

      DỮ LIỆU ĐẦU VÀO (Mô tả chi tiết / Nội dung file):
      """
      ${formData.content}
      """

      DỮ LIỆU THAM CHIẾU (NLS):
      """
      ${NLS_CONTEXT_REF}
      """
    `;

    try {
      const result = await generateLessonPlan(prompt, pdfPart, apiKey);
      if (result) {
        onResult(result);
      } else {
        onError("Không nhận được phản hồi từ AI. Vui lòng thử lại.");
      }
    } catch (err: any) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      {!apiKey && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg flex items-center gap-2 text-sm">
           <AlertCircle size={16}/>
           <span>Bạn chưa nhập API Key. Vui lòng nhấn vào biểu tượng chìa khoá/bánh răng để nhập.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subject */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Môn học</label>
          <div className="relative">
            <select
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-2.5 border outline-none transition-all appearance-none"
            >
                {Object.values(Subject).map((subj) => (
                <option key={subj} value={subj}>{subj}</option>
                ))}
            </select>
            <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        {/* Grade */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Lớp</label>
           <div className="relative">
            <select
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
                className="w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-2.5 border outline-none transition-all appearance-none"
            >
                {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                <option key={g} value={g}>Lớp {g}</option>
                ))}
            </select>
            <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        {/* Textbook */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bộ sách</label>
          <input
            type="text"
            name="textbook"
            value={formData.textbook}
            onChange={handleInputChange}
            placeholder="VD: Kết nối tri thức..."
            className="w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-2.5 border outline-none transition-all"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thời lượng</label>
          <input
            type="text"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            placeholder="VD: 2 tiết"
            className="w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-2.5 border outline-none transition-all"
          />
        </div>
      </div>

      {/* Lesson Name */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên bài học</label>
        <input
          type="text"
          name="lessonName"
          required
          value={formData.lessonName}
          onChange={handleInputChange}
          placeholder="Nhập tên bài học..."
          className="w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-2.5 border outline-none transition-all font-medium"
        />
      </div>

      {/* Content Area */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Nội dung bài học / File đính kèm
        </label>
        
        {/* Upload Button */}
        <div className="mb-3">
            <input
               type="file"
               ref={fileInputRef}
               onChange={handleFileChange}
               accept=".doc,.docx,.pdf"
               className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-blue-300 text-sm shadow-sm font-medium transition-all w-full justify-center group"
            >
              <div className="bg-blue-50 p-1.5 rounded-lg group-hover:bg-blue-100 transition-colors">
                <Upload size={16} className="text-blue-600"/>
              </div>
              {fileName ? 'Đổi file khác' : 'Tải lên file Word/PDF bài học'}
            </button>
        </div>

        {fileName && (
          <div className="mb-3 flex items-center justify-between gap-2 text-sm text-blue-700 bg-blue-50 p-2 px-3 rounded-lg border border-blue-100 shadow-sm animate-fade-in">
             <span className="flex items-center gap-2 truncate">
               <FileText size={16} className="shrink-0"/> 
               <span className="truncate font-medium">{fileName}</span>
             </span>
             <button type="button" onClick={clearFile} className="text-blue-400 hover:text-red-500 p-1 rounded-md hover:bg-white transition-colors">
               <X size={16} />
             </button>
          </div>
        )}

        <textarea
            name="content"
            rows={4}
            value={formData.content}
            onChange={handleInputChange}
            placeholder="Hoặc nhập/dán nội dung bài học chi tiết tại đây..."
            className="w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 border outline-none transition-all text-sm"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={!apiKey}
          className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles size={20} />
          TẠO KẾ HOẠCH BÀI DẠY
        </button>
      </div>
    </form>
  );
};

export default TabCreate;