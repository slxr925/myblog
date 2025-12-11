// Simple event emitter for cross-component communication
type EventCallback = (...args: any[]) => void;

class EventEmitter {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      return;
    }
    const callbacks = this.events.get(event)!;
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event: string, ...args: any[]) {
    if (!this.events.has(event)) {
      return;
    }
    this.events.get(event)!.forEach(callback => {
      callback(...args);
    });
  }
}

// Create a singleton instance
export const eventEmitter = new EventEmitter();

// Define event constants
export const EVENTS = {
  FOLDER_DATA_CHANGED: 'folder_data_changed',
  COLLECTION_ADDED: 'collection_added',
  COLLECTION_REMOVED: 'collection_removed',
  COLLECTION_MOVED: 'collection_moved',
} as const;