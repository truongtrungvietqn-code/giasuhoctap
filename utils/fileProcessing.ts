import mammoth from 'mammoth';

export interface ProcessedFile {
  type: 'text' | 'pdf_part';
  content: string; // HTML string for DOCX, or Base64 for PDF
  fileName: string;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove "data:*/*;base64," prefix to get raw base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const processUploadedFile = async (file: File): Promise<ProcessedFile> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  // Handle PDF
  if (extension === 'pdf') {
    try {
      const base64 = await fileToBase64(file);
      return {
        type: 'pdf_part',
        content: base64,
        fileName: file.name
      };
    } catch (e) {
      console.error("Lỗi đọc file PDF:", e);
      throw new Error("Không thể đọc file PDF. Vui lòng thử lại.");
    }
  }

  // Handle Word (DOCX)
  if (extension === 'docx') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Convert to HTML to preserve tables and structure better than raw text
      const result = await mammoth.convertToHtml({ arrayBuffer });
      if (!result || !result.value) {
          throw new Error("Không tìm thấy nội dung trong file Word.");
      }
      return {
        type: 'text',
        content: `\n\n--- NỘI DUNG TỪ FILE WORD (${file.name}) ---\n${result.value}\n--- HẾT NỘI DUNG FILE ---\n`,
        fileName: file.name
      };
    } catch (e) {
      console.error("Lỗi đọc file Word:", e);
      throw new Error("Không thể đọc file Word. Hãy đảm bảo file không bị hỏng.");
    }
  }

  // Handle Text/Other
  try {
    const text = await file.text();
    return {
      type: 'text',
      content: `\n\n--- NỘI DUNG FILE (${file.name}) ---\n${text}\n--- HẾT NỘI DUNG FILE ---\n`,
      fileName: file.name
    };
  } catch (e) {
     throw new Error("Không thể đọc định dạng file này.");
  }
};