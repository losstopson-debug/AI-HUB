import { agents } from '@/data/agents';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Bot, Sparkles } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
import Gallery from '@/components/Gallery';

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = agents.find((a) => a.id === id);

  if (!agent) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </Link>
            <div className="h-6 w-px bg-zinc-200 hidden sm:block"></div>
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-zinc-200 shadow-sm">
                <Image
                  src={`https://picsum.photos/seed/${agent.robotSeed}/100/100`}
                  alt={agent.name}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="font-display font-semibold text-zinc-900 leading-none">{agent.name}</h1>
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-md text-[11px] font-mono uppercase tracking-wider text-zinc-600 border border-zinc-200">
            <Sparkles className="w-3 h-3" />
            <span>{agent.type} Engine</span>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-[1600px] mx-auto w-full p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 flex flex-col h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <ChatInterface agent={agent} />
        </div>
        <div className="lg:col-span-1 h-[calc(100vh-8rem)] flex flex-col bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="p-5 border-b border-zinc-100 bg-zinc-50/50">
            <h2 className="text-sm font-display font-semibold text-zinc-900">Sobre o Agente</h2>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{agent.description}</p>
          </div>
          <div className="flex-grow overflow-y-auto p-5">
            <h3 className="text-xs font-semibold text-zinc-900 mb-4 uppercase tracking-wider">Galeria de Exemplos</h3>
            <Gallery seed={agent.gallerySeed} count={30} />
          </div>
        </div>
      </main>
    </div>
  );
}
