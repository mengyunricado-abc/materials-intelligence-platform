/**
 * @vibe-intent 轻量级跨组件事件总线，用于解耦 AI 助手 ActionCard 与主工作区的端到端状态传递。
 * @vibe-model Gemini 3 Flash
 * @vibe-ref intents.md#2026-04-28
 */

type EventCallback = (data: any) => void;

class EventBus {
  private events: Record<string, EventCallback[]> = {};

  on(event: string, callback: EventCallback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: EventCallback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event: string, data?: any) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(data));
  }
}

export const eventBus = new EventBus();
