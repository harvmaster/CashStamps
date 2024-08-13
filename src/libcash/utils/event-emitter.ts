export class EventEmitter<
  T extends Record<string, unknown>
> extends EventTarget {
  private listeners: Map<keyof T, Set<EventListener>> = new Map();

  constructor() {
    super();
  }

  on<K extends keyof T>(type: K, listener: (detail: T[K]) => void) {
    const wrappedListener = ((e: CustomEvent<T[K]>) =>
      listener(e.detail)) as EventListener;
    this.addEventListener(type as string, wrappedListener);

    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)?.add(wrappedListener);

    return wrappedListener;
  }

  off<K extends keyof T>(type: K, listener: EventListener) {
    this.removeEventListener(type as string, listener);
    this.listeners.get(type)?.delete(listener);
  }

  emit<K extends keyof T>(type: K, detail: T[K]) {
    const event = new CustomEvent(type as string, { detail });
    return this.dispatchEvent(event);
  }

  removeAllListeners() {
    this.listeners.forEach((listeners, type) => {
      listeners.forEach((listener) => {
        this.removeEventListener(type as string, listener);
      });
    });
    this.listeners.clear();
  }

  monitorProperty<T, K extends keyof T>(target: T, key: K, eventName: string) {
    let value = target[key];

    Object.defineProperty(target, key, {
      get: () => {
        return value;
      },
      set: (newValue) => {
        value = newValue;
        this.emit(eventName, newValue);
      },
      enumerable: true,
      configurable: true,
    });
  }
}
