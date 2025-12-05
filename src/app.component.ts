
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { GeminiService } from './services/gemini.service';
import { ChatMessage } from './models/chat.model';
import { Chat } from '@google/genai';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  private geminiService = inject(GeminiService);

  chatHistory = signal<ChatMessage[]>([]);
  currentMessage = signal<string>('');
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  private chatSession: Chat | null = null;
  private shouldScrollDown = false;

  suggestedTopics: string[] = [
    'Giải thích về Lượng tử bất định',
    'Lịch sử Việt Nam thời nhà Trần',
    'Angular signals là gì?',
    'Viết một bài thơ về Hà Nội',
  ];

  ngOnInit(): void {
    this.chatSession = this.geminiService.createChat();
    if (this.chatSession) {
      this.chatHistory.set([
        {
          role: 'model',
          content: 'Xin chào! Tôi là Gia sư 4.0. Bạn muốn học về chủ đề gì hôm nay?',
        },
      ]);
    } else {
      this.error.set('Không thể khởi tạo dịch vụ AI. Vui lòng kiểm tra API key và thử lại.');
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollDown) {
      this.scrollToBottom();
      this.shouldScrollDown = false;
    }
  }

  async sendMessage(prompt?: string): Promise<void> {
    const messageToSend = prompt || this.currentMessage().trim();
    if (!messageToSend || this.isLoading() || !this.chatSession) {
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.chatHistory.update(history => [...history, { role: 'user', content: messageToSend }]);
    this.currentMessage.set('');
    this.shouldScrollDown = true;

    // Add a placeholder for the model's response
    this.chatHistory.update(history => [...history, { role: 'model', content: '...' }]);
    this.shouldScrollDown = true;

    try {
      const response = await this.geminiService.sendMessage(this.chatSession, messageToSend);
      this.chatHistory.update(history => {
          const lastMessage = history[history.length - 1];
          if (lastMessage.role === 'model') {
              lastMessage.content = response;
          }
          return [...history];
      });
    } catch (err) {
      const errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
      this.error.set(errorMessage);
       this.chatHistory.update(history => {
          const lastMessage = history[history.length - 1];
          if (lastMessage.role === 'model') {
              lastMessage.content = errorMessage;
          }
          return [...history];
      });
    } finally {
      this.isLoading.set(false);
      this.shouldScrollDown = true;
    }
  }

  onInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.currentMessage.set(textarea.value);
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }
  
  private scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error("Could not scroll to bottom:", err);
    }
  }
}
