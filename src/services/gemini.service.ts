
import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, Chat } from '@google/genai';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    try {
      this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } catch (error) {
      console.error("Failed to initialize GoogleGenAI:", error);
    }
  }

  createChat(): Chat | null {
    if (!this.ai) return null;
    
    const systemInstruction = `You are 'Gia Sư 4.0', an expert AI tutor. Your mission is to help users understand complex topics with simple, clear, and encouraging explanations. 
      - Break down difficult concepts into small, easy-to-digest pieces.
      - Use analogies and real-world examples.
      - Maintain a friendly, patient, and positive tone.
      - If asked, create simple quizzes to test the user's understanding.
      - Always respond in the language of the user's query.
      - Format your responses using markdown for better readability (e.g., use lists, bold text).`;

    return this.ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
      },
    });
  }

  async sendMessage(chat: Chat, message: string): Promise<string> {
    try {
      const result = await chat.sendMessage({ message });
      return result.text;
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      return 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.';
    }
  }
}
