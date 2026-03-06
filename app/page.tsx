import { agents } from '@/data/agents';
import Link from 'next/link';
import Image from 'next/image';
import { Bot, Sparkles, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-zinc-200">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Plataforma de Inteligência Artificial</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-zinc-900 mb-6 leading-[1.1]">
              Multi-Agent <br />
              <span className="text-zinc-500">AI Workspace.</span>
            </h1>
            <p className="text-xl text-zinc-600 max-w-2xl leading-relaxed mb-10">
              Acesse uma suíte completa de agentes especializados. Desde a geração de textos e imagens até análise de circuitos e consultoria financeira.
            </p>
          </div>
        </div>
      </section>

      {/* Agents Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-2xl font-display font-semibold text-zinc-900">Nossos Agentes</h2>
          <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider">{agents.length} DISPONÍVEIS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {agents.map((agent) => (
            <Link href={`/agent/${agent.id}`} key={agent.id} className="group block h-full">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-200 hover:shadow-md hover:border-zinc-300 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ArrowRight className="w-5 h-5 text-zinc-400" />
                </div>
                
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden mb-6 bg-zinc-100 border border-zinc-200 shadow-sm">
                  <Image
                    src={`https://picsum.photos/seed/${agent.robotSeed}/150/150`}
                    alt={agent.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 bg-zinc-100 text-zinc-600 rounded-md">
                    {agent.type}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-zinc-900 mb-2 font-display">{agent.name}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed flex-grow">{agent.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
