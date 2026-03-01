import { agents } from '@/data/agents';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Bot } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
import Gallery from '@/components/Gallery';

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = agents.find((a) => a.id === id);

  if (!agent) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-zinc-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-200">
                <Image
                  src={`https://picsum.photos/seed/${agent.robotSeed}/100/100`}
                  alt={agent.name}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="font-semibold text-zinc-900 leading-tight">{agent.name}</h1>
                <p className="text-xs text-zinc-500">{agent.description}</p>
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-full text-xs font-medium text-zinc-600">
            <Bot className="w-4 h-4" />
            <span>{agent.type.toUpperCase()} AGENT</span>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <ChatInterface agent={agent} />
        </div>
        <div className="lg:col-span-1 h-[calc(100vh-8rem)] overflow-y-auto bg-white rounded-2xl shadow-sm border border-zinc-200 p-4">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4 sticky top-0 bg-white pb-2 z-10">
            Galeria de Exemplos
          </h2>
          <Gallery seed={agent.gallerySeed} count={30} />
        </div>
      </main>
    </div>
  );
}
