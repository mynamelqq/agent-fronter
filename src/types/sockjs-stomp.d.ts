declare module 'sockjs-client' {
  interface SockJSType {
    close: () => void
    onclose?: ((...args: any[]) => void) | null
  }

  interface SockJSFactory {
    new (url: string, _reserved?: unknown, _options?: unknown): SockJSType
  }

  const SockJS: SockJSFactory
  export default SockJS
}

declare module 'stompjs' {
  interface Subscription {
    unsubscribe: () => void
  }

  interface Client {
    connected?: boolean
    debug?: (...args: any[]) => void
    connect: (
      headers: Record<string, string>,
      onConnect: (...args: any[]) => void,
      onError?: (...args: any[]) => void
    ) => void
    disconnect: (onDisconnect?: () => void) => void
    subscribe: (destination: string, callback: (message: { body?: string }) => void) => Subscription
  }

  interface StompApi {
    over: (ws: any) => Client
  }

  const Stomp: StompApi
  export default Stomp
}

declare module 'stompjs/lib/stomp.js' {
  import Stomp from 'stompjs'
  export default Stomp
}
