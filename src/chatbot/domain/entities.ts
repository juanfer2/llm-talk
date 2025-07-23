export interface DocumentMetadata {
  source: string;
  type?: string;
  [key: string]: any;
}

export interface ChatDocument {
  pageContent: string;
  metadata: DocumentMetadata;
}

export interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
