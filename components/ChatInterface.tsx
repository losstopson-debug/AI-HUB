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

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      let responseMessage: Message = { id: (Date.now() + 1).toString(), role: 'model' };

      if (agent.type === 'text') {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: input,
          config: {
            systemInstruction: agent.systemInstruction,
          },
        });
        responseMessage.text = response.text;
      } else if (agent.type === 'image-gen') {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: {
            parts: [{ text: input }],
          },
          config: {
            imageConfig: {
              aspectRatio: '1:1',
              imageSize: '1K',
            },
          },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            responseMessage.imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          } else if (part.text) {
            responseMessage.text = part.text;
          }
        }
      } else if (agent.type === 'image-edit' && selectedImage) {
        const base64Data = await fileToBase64(selectedImage);
        const response = await ai.models.generateContent({
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
                text: input || 'Edite esta imagem.',
              },
            ],
          },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            responseMessage.imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          } else if (part.text) {
            responseMessage.text = part.text;
          }
        }
      } else if (agent.type === 'tts') {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-preview-tts',
          contents: [{ parts: [{ text: input }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          responseMessage.audioUrl = `data:audio/wav;base64,${base64Audio}`;
          responseMessage.text = 'Áudio gerado com sucesso.';
        }
      }

      setMessages((prev) => [...prev, responseMessage]);
    } catch (error) {
      console.error('Error generating content:', error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'model', text: 'Ocorreu um erro ao processar sua solicitação.' },
      ]);
    } finally {
      setIsLoading(false);
      setSelectedImage(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-grow overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-zinc-500" />
            </div>
            <p className="text-center max-w-sm">
              Olá! Sou o {agent.name}. Como posso ajudar você hoje?
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.role === 'user'
                    ? 'bg-zinc-900 text-white rounded-br-sm'
                    : 'bg-zinc-100 text-zinc-900 rounded-bl-sm'
                }`}
              >
                {msg.imageUrl && (
                  <img
                    src={msg.imageUrl}
                    alt="Uploaded or Generated"
                    className="max-w-full rounded-xl mb-3 border border-zinc-200"
                  />
                )}
                {msg.text && (
                  <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : ''}`}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                )}
                {msg.audioUrl && (
                  <audio controls className="mt-3 w-full max-w-xs">
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
            <div className="bg-zinc-100 rounded-2xl rounded-bl-sm p-4 flex items-center gap-2 text-zinc-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Processando...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-zinc-200 bg-white">
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border border-zinc-200" />
            <button
              onClick={() => {
                setImagePreview(null);
                setSelectedImage(null);
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
            >
              ×
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          {agent.type === 'image-edit' && (
            <label className="cursor-pointer p-3 text-zinc-500 hover:bg-zinc-100 rounded-xl transition-colors">
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
              className="w-full bg-zinc-100 border-transparent focus:bg-white focus:border-zinc-300 focus:ring-0 rounded-2xl py-3 px-4 resize-none h-12 min-h-[48px] max-h-32 text-zinc-900 placeholder-zinc-500"
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
            className="p-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
