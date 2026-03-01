import { agents } from '@/data/agents';
import Link from 'next/link';
import Image from 'next/image';
import { Bot } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-4">
            Multi-Agent AI Hub
          </h1>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            Escolha um dos nossos agentes especializados para ajudar você em suas tarefas diárias.
            De geração de textos a criação de imagens e análise de circuitos.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {agents.map((agent) => (
            <Link href={`/agent/${agent.id}`} key={agent.id}>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 hover:shadow-md hover:border-zinc-200 transition-all cursor-pointer group h-full flex flex-col">
                <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-4 bg-zinc-100">
                  <Image
                    src={`https://picsum.photos/seed/${agent.robotSeed}/400/400`}
                    alt={agent.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm">
                    <Bot className="w-5 h-5 text-zinc-700" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-zinc-900 mb-2">{agent.name}</h2>
                <p className="text-sm text-zinc-500 flex-grow">{agent.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
