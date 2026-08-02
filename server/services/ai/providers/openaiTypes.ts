export interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenAIChatRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  response_format?: {
    type: "json_object";
  };
}

export interface OpenAIChatChoice {
  message: {
    role: string;
    content: string;
  };
}

export interface OpenAIChatResponse {
  id: string;
  choices: OpenAIChatChoice[];
}
