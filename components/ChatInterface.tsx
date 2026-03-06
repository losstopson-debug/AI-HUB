'use client';

import { useState, useRef, useEffect } from 'react';
import { Agent } from '@/data/agents';
import { GoogleGenAI, Modality } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { Send, Image as ImageIcon, Loader2, Play, Pause, Bot } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
}

export default function ChatInterface({ agent }: { agent: Agent }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      imageUrl: imagePreview || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setImagePreview(null);
    setIsLoading(true);

    const executeWithRetry = async <T,>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
      let lastError: any;
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await operation();
        } catch (error: any) {
          lastError = error;
          // Check if it's a 503 error or rate limit
          if (error?.status === 503 || error?.message?.includes('503') || error?.message?.includes('high demand') || error?.status === 429) {
            console.warn(`API busy (attempt ${i + 1}/${maxRetries}). Retrying in ${Math.pow(2, i)}s...`);
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
            continue;
          }
          throw error; // If it's not a retryable error, throw immediately
        }
      }
      throw lastError;
    };

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        setMessages((prev) => [
          ...prev,
          { 
            id: (Date.now() + 1).toString(), 
            role: 'model', 
            text: '⚠️ **Erro de Configuração:** A chave da API não foi encontrada.\n\nComo você está hospedando na Vercel, você precisa configurar a variável de ambiente correta:\n1. Vá no painel do seu projeto na Vercel.\n2. Acesse **Settings** > **Environment Variables**.\n3. Adicione uma nova variável com o nome exato: `NEXT_PUBLIC_GEMINI_API_KEY` e cole sua chave do Google Gemini como valor.\n4. **Muito importante:** Após adicionar, você precisa fazer um novo deploy (Redeploy) para que a variável seja injetada no código.' 
          },
        ]);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      let responseMessage: Message = { id: (Date.now() + 1).toString(), role: 'model' };

      if (agent.type === 'text') {
        const response = await executeWithRetry(() => ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: userMessage.text || '',
          config: {
            systemInstruction: agent.systemInstruction,
          },
        }));
        responseMessage.text = response.text;
      } else if (agent.type === 'image-gen') {
        const response = await executeWithRetry(() => ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: userMessage.text || '' }],
          },
          config: {
            imageConfig: {
              aspectRatio: '1:1',
            },
          },
        }));

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            responseMessage.imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          } else if (part.text) {
            responseMessage.text = part.text;
          }
        }
      } else if (agent.type === 'image-edit' && selectedImage) {
        const base64Data = await fileToBase64(selectedImage);
        const response = await executeWithRetry(() => ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: selectedImage.type,
                },
              },
              {
                text: userMessage.text || 'Edite esta imagem.',
              },
            ],
          },
        }));

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            responseMessage.imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          } else if (part.text) {
            responseMessage.text = part.text;
          }
        }
      } else if (agent.type === 'tts') {
        const response = await executeWithRetry(() => ai.models.generateContent({
          model: 'gemini-2.5-flash-preview-tts',
          contents: [{ parts: [{ text: userMessage.text || '' }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        }));

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          responseMessage.audioUrl = `data:audio/wav;base64,${base64Audio}`;
          responseMessage.text = 'Áudio gerado com sucesso.';
        }
      }

      setMessages((prev) => [...prev, responseMessage]);
    } catch (error: any) {
      console.error('Error generating content:', error);
      let errorMessage = 'Ocorreu um erro ao processar sua solicitação.';
      
      if (error?.status === 503 || error?.message?.includes('503') || error?.message?.includes('high demand')) {
        errorMessage = '⚠️ **Serviço temporariamente indisponível:** O modelo de IA está com alta demanda no momento. Por favor, aguarde alguns instantes e tente novamente.';
      } else if (error.message) {
        errorMessage += `\n\n**Detalhes do erro:** ${error.message}`;
      }
      
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'model', text: errorMessage },
      ]);
    } finally {
      setIsLoading(false);
      setSelectedImage(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex-grow overflow-y-auto p-6 space-y-8">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400">
            <div className="w-20 h-20 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <Bot className="w-10 h-10 text-zinc-400" />
            </div>
            <p className="text-center max-w-md text-zinc-500 text-lg font-display">
              Olá! Sou o <span className="font-semibold text-zinc-700">{agent.name}</span>.
              <br />
              <span className="text-sm mt-2 block">Como posso ajudar você hoje?</span>
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-5 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-zinc-900 text-white rounded-br-sm'
                    : 'bg-white border border-zinc-200 text-zinc-800 rounded-bl-sm'
                }`}
              >
                {msg.imageUrl && (
                  <div className="relative rounded-xl overflow-hidden mb-4 border border-zinc-200/20 bg-zinc-100">
                    <img
                      src={msg.imageUrl}
                      alt="Uploaded or Generated"
                      className="w-full h-auto object-contain max-h-[400px]"
                    />
                  </div>
                )}
                {msg.text && (
                  <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : 'prose-zinc'}`}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                )}
                {msg.audioUrl && (
                  <audio controls className="mt-4 w-full max-w-sm rounded-full bg-zinc-100">
                    <source src={msg.audioUrl} type="audio/wav" />
                    Seu navegador não suporta o elemento de áudio.
                  </audio>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-zinc-200 rounded-2xl rounded-bl-sm p-4 flex items-center gap-3 text-zinc-500 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
              <span className="text-sm font-medium">Processando...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 sm:p-6 border-t border-zinc-100 bg-white/80 backdrop-blur-md">
        {imagePreview && (
          <div className="mb-4 relative inline-block">
            <div className="relative rounded-xl overflow-hidden border border-zinc-200 shadow-sm">
              <img src={imagePreview} alt="Preview" className="h-24 w-auto object-cover" />
            </div>
            <button
              onClick={() => {
                setImagePreview(null);
                setSelectedImage(null);
              }}
              className="absolute -top-2 -right-2 bg-zinc-900 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md hover:bg-zinc-800 transition-colors"
            >
              ×
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-end gap-3 max-w-4xl mx-auto">
          {agent.type === 'image-edit' && (
            <label className="cursor-pointer p-3.5 text-zinc-500 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 rounded-xl transition-colors shadow-sm">
              <ImageIcon className="w-5 h-5" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          )}
          <div className="flex-grow relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                agent.type === 'image-edit'
                  ? 'Descreva a edição ou anexe uma imagem...'
                  : agent.type === 'image-gen'
                  ? 'Descreva a imagem que deseja gerar...'
                  : agent.type === 'tts'
                  ? 'Digite o texto para ser narrado...'
                  : 'Digite sua mensagem...'
              }
              className="w-full bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-zinc-300 focus:ring-0 rounded-xl py-3.5 px-5 resize-none h-[52px] min-h-[52px] max-h-32 text-zinc-900 placeholder-zinc-400 shadow-sm transition-all"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !selectedImage)}
            className="p-3.5 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center min-w-[52px]"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
