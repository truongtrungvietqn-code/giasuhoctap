import { GoogleGenAI } from "@google/genai";

// Năng lực số Reference Data (Condensed for Context)
export const NLS_CONTEXT_REF = `
TÀI LIỆU THAM CHIẾU (BẮT BUỘC DÙNG):
1. KHUNG NĂNG LỰC SỐ (TT 02/2025):
- Lĩnh vực 1: Khai thác dữ liệu & thông tin (1.1: Dữ liệu, 1.2: Đánh giá, 1.3: Quản lý).
- Lĩnh vực 2: Giao tiếp & Hợp tác (2.1: Tương tác, 2.2: Chia sẻ, 2.3: Công dân số, 2.4: Hợp tác, 2.5: Ứng xử).
- Lĩnh vực 3: Sáng tạo nội dung số (3.1: Phát triển ND, 3.2: Hiệu chỉnh, 3.3: Bản quyền, 3.4: Lập trình).
- Lĩnh vực 4: An toàn (4.1: Thiết bị, 4.2: Dữ liệu, 4.3: Sức khoẻ, 4.4: Môi trường).
- Lĩnh vực 5: Giải quyết vấn đề (5.1: Kỹ thuật, 5.2: Nhu cầu, 5.3: Sáng tạo, 5.4: Lỗ hổng).
- Lĩnh vực 6: Ứng dụng AI (6.1: Dữ liệu AI, 6.2: Sử dụng AI, 6.3: Đạo đức AI).

2. BẬC NĂNG LỰC (CV 3456):
- CB1, CB2 (Cơ bản)
- TC1, TC2 (Trung cấp)
- NC1 (Nâng cao)

QUY TẮC MÃ: [Lĩnh vực].[Thành phần].[Bậc]. Ví dụ: 1.1.CB1, 6.2.TC1.
`;

const SYSTEM_INSTRUCTION = `
Bạn là chuyên gia số hóa tài liệu giáo dục và tích hợp năng lực số chuẩn 5512.

QUY TẮC SỐNG CÒN (BẮT BUỘC TUÂN THỦ 100%):

1. KHÔNG ĐƯỢC CẮT BỚT NỘI DUNG (CRITICAL):
   - Bạn phải đóng vai một máy OCR (Quét văn bản) thông minh.
   - Nhiệm vụ: Tái tạo lại CHÍNH XÁC và ĐẦY ĐỦ nội dung từ file gốc vào định dạng Markdown.
   - TUYỆT ĐỐI KHÔNG dùng các cụm từ: "Tương tự như trên", "Các bước tiếp theo...", "Nội dung còn lại...".
   - Nếu file gốc có 10 trang, bạn phải xử lý đủ 10 trang. Nếu bảng có 50 dòng, phải viết đủ 50 dòng.

2. ƯU TIÊN TUYỆT ĐỐI CHO BẢNG TIẾN TRÌNH (PHẦN III):
   - Đây là phần quan trọng nhất. Dù nội dung dài đến đâu, Bảng Tiến Trình Dạy Học (Cột Hoạt động & Cột Sản phẩm) KHÔNG ĐƯỢC PHÉP THIẾU DÒNG NÀO.
   - Nếu sắp hết giới hạn từ (token), hãy viết ngắn gọn phần I, II, IV, nhưng PHẦN III PHẢI FULL.

3. ĐỊNH DẠNG BẢNG (MARKDOWN TABLE) CHUẨN:
   - Chỉ kẻ bảng cho phần "III. TIẾN TRÌNH DẠY HỌC".
   - Cấu trúc 2 cột cứng:
     | HOẠT ĐỘNG CỦA GV - HS | DỰ KIẾN SẢN PHẨM |
     | :--- | :--- |
     | <b>Hoạt động 1: ...</b><br>- GV: ...<br>- HS: ... | - Sản phẩm A...<br>- Sản phẩm B... |
   - XUỐNG DÒNG TRONG Ô: Bắt buộc dùng thẻ <br>. Không dùng phím Enter.

4. TÍCH HỢP MÃ NLS:
   - Chèn mã (VD: **[NLS: 1.1.CB1]**) vào cuối dòng tương ứng trong bảng hoặc mục tiêu.

5. NỐI TRANG:
   - File input thường là PDF/Ảnh bị ngắt trang. Bạn phải tự động NỐI LIỀN nội dung các trang lại. Không được để bảng bị đứt quãng giữa chừng.
`;

// Helper to parse multiple keys
const parseKeys = (apiKeyString: string): string[] => {
  if (!apiKeyString) return [];
  // Split by newline or comma, trim, and filter out empty strings
  return apiKeyString
    .split(/[\n,]+/)
    .map(k => k.trim())
    .filter(k => k.length > 0 && k.startsWith('AIza'));
};

const callGeminiWithKey = async (
  key: string,
  modelId: string,
  contents: any[]
) => {
  const client = new GoogleGenAI({ apiKey: key });
  const response = await client.models.generateContent({
    model: modelId,
    contents: contents.length > 1 ? { parts: contents } : contents[0].text,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.2, // Low temp for precision
    },
  });
  return response;
};

export const generateLessonPlan = async (
  prompt: string, 
  pdfPart?: { mimeType: string; data: string },
  apiKeyRaw?: string
) => {
  // 1. Prepare Keys
  const keySource = apiKeyRaw || process.env.API_KEY || "";
  const keys = parseKeys(keySource);

  if (keys.length === 0) {
    throw new Error("Vui lòng nhập ít nhất một API Key hợp lệ (bắt đầu bằng AIza...) trong phần Cấu hình.");
  }

  // 2. Prepare Content
  const contents = [];
  if (pdfPart) {
    contents.push({
      inlineData: {
        mimeType: pdfPart.mimeType,
        data: pdfPart.data
      }
    });
  }
  contents.push({ text: prompt });

  // 3. Model Selection
  const modelId = "gemini-2.5-flash"; 

  // 4. Retry Loop
  let lastError: any = null;

  for (let i = 0; i < keys.length; i++) {
    const currentKey = keys[i];
    console.log(`Trying API Key ${i + 1}/${keys.length} (${currentKey.slice(0, 8)}...)`);

    try {
      const response = await callGeminiWithKey(currentKey, modelId, contents);
      
      if (!response.text) {
         throw new Error("AI trả về kết quả rỗng.");
      }
      
      // If successful, return immediately
      return response.text;

    } catch (error: any) {
      console.warn(`Key ${i + 1} failed:`, error.message);
      lastError = error;

      // Analyze error to decide if we should continue
      const isRetryable = 
        error.message?.includes('429') || // Quota exceeded
        error.message?.includes('500') || // Server error
        error.message?.includes('503') || // Service unavailable
        error.message?.includes('403') || // Permission denied
        error.message?.includes('fetch failed'); // Network blip

      if (isRetryable && i < keys.length - 1) {
        // Wait a short bit before trying next key to avoid rapid-fire issues
        await new Promise(r => setTimeout(r, 500));
        continue; // Try next key
      }
      
      // If it's the last key, or a non-retryable error (like 400 Bad Request), logic continues below
    }
  }

  // 5. Handle Final Failure
  console.error("All keys failed. Last error:", lastError);
  
  if (lastError?.message?.includes('429')) {
       throw new Error(`Tất cả ${keys.length} API Key đều đang bị quá tải (429). Vui lòng đợi 1 phút hoặc thêm Key mới.`);
  }
  if (lastError?.message?.includes('404')) {
      throw new Error("Model AI không khả dụng. Vui lòng kiểm tra lại cấu hình Key.");
  }
  
  throw new Error(lastError?.message || "Đã có lỗi xảy ra. Vui lòng kiểm tra kết nối mạng và API Key.");
};