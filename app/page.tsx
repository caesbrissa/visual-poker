"use client"
import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { ThemeToggle } from '@/components/theme-toggle';

interface Sessao {
  Data: string;
  Ganhos: number;
  Jogos: number;
  Rake: number;
  Saldo: number;
}

interface DataFile {
  jogador: string;
  makeupAtual: number;
  profitBruto: number;
  totalRake: number;
  totalJogos: number;
  presencaAula: number;
  dealPlayer: string;
  rakebackAbaixoMeta: string;
  rakebackAcimaMeta: string;
  countRakeback25: number;
  countRakeback35: number;
  sessoes: Sessao[];
  ultimaAtualizacao?: string;
}

interface MesesMap {
  [key: string]: number;
}

interface GanhosPorMes {
  mes: string;
  ganhos: number;
  jogos: number;
  rake: number;
}

interface MesesGanhosMap {
  [key: string]: GanhosPorMes;
}

export default function Dashboard() {
  const [dataFile, setDataFile] = useState<DataFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodoTabela, setPeriodoTabela] = useState('todos');
  const [periodoGrafico, setPeriodoGrafico] = useState('todos');

  // Buscar dados da API
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch('/api/sheets');
        
        if (!response.ok) {
          throw new Error('Erro ao carregar dados');
        }
        
        const data = await response.json();
        setDataFile(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        console.error('Erro ao buscar dados:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Garantir que sempre temos dados válidos (mesmo que vazios) para manter hooks consistentes
  const { jogador, makeupAtual, profitBruto, totalRake, totalJogos, presencaAula, dealPlayer, rakebackAbaixoMeta, rakebackAcimaMeta, countRakeback25, countRakeback35, sessoes, ultimaAtualizacao } = dataFile || {
    jogador: "Jogador",
    makeupAtual: 0,
    profitBruto: 0,
    totalRake: 0,
    totalJogos: 0,
    presencaAula: 0,
    dealPlayer: "0%",
    rakebackAbaixoMeta: "25%",
    rakebackAcimaMeta: "35%",
    countRakeback25: 0,
    countRakeback35: 0,
    sessoes: [],
    ultimaAtualizacao: new Date().toISOString()
  };

  const filtrarPorPeriodo = (sessoes: Sessao[], periodo: string): Sessao[] => {
    if (periodo === 'todos') return sessoes;
    const hoje = new Date();
    const dataLimite = new Date();
    if (periodo === 'semana') {
      dataLimite.setDate(hoje.getDate() - 7);
    } else if (periodo === 'mes') {
      dataLimite.setMonth(hoje.getMonth() - 1);
    } else if (periodo === 'ano') {
      dataLimite.setFullYear(hoje.getFullYear() - 1);
    }
    return sessoes.filter(s => {
      const [dia, mes, ano] = s.Data.split('/');
      const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
      return data >= dataLimite;
    });
  };

  const sessoesFiltradas = useMemo(() => filtrarPorPeriodo(sessoes, periodoGrafico), [sessoes, periodoGrafico]);
  const sessoesTabela = useMemo(() => filtrarPorPeriodo(sessoes, periodoTabela), [sessoes, periodoTabela]);

  // Usar valores corretos da planilha (célula da linha 3)
  const totalGanhos = profitBruto; // J3
  const totalJogosReal = totalJogos; // D3 - valor correto da planilha
  const totalRakeReal = totalRake; // F3 - valor correto da planilha
  const saldoFinal = makeupAtual; // I3
  
  const sessoesPositivas = sessoes.filter(s => s.Ganhos > 0).length;
  const sessoesNegativas = sessoes.filter(s => s.Ganhos < 0).length;
  const winRate = sessoes.length > 0 ? (sessoesPositivas / sessoes.length * 100) : 0;
  
  // Média por jogo: Profit Bruto / Total de Jogos
  const mediaPorJogo = totalJogosReal > 0 ? totalGanhos / totalJogosReal : 0;
  
  // Média por sessão: Profit Bruto / Total de Sessões
  const mediaPorSessao = sessoes.length > 0 ? totalGanhos / sessoes.length : 0;
  
  const maiorGanho = Math.max(...sessoes.map(s => s.Ganhos), 0);
  const maiorPerda = Math.min(...sessoes.map(s => s.Ganhos), 0);
  
  // Rakeback = 25% do rake total
  const rakeBack = totalRakeReal * 0.25;
  
  // ROI correto do poker: (Profit / Rake) × 100
  // Representa quanto você ganhou em relação ao que pagou de rake
  const roi = totalRakeReal > 0 ? (totalGanhos / totalRakeReal) * 100 : 0;
  
  // Dias jogados = contar datas únicas nas sessões
  const diasJogados = new Set(sessoes.map(s => s.Data)).size;

  const calcularStreak = () => {
    if (sessoes.length === 0) return { tipo: 'neutro', valor: 0, texto: 'Sem dados' };
    
    // Pegar últimas 7 sessões (ou menos se não tiver 7)
    const ultimas7 = sessoes.slice(-7);
    const positivas = ultimas7.filter(s => s.Ganhos > 0).length;
    const negativas = ultimas7.filter(s => s.Ganhos < 0).length;
    
    let tipo: 'neutro' | 'positivo' | 'negativo' = 'neutro';
    let texto = '';
    
    if (positivas > negativas) {
      tipo = 'positivo';
      texto = `${positivas}W-${negativas}L`;
    } else if (negativas > positivas) {
      tipo = 'negativo';
      texto = `${positivas}W-${negativas}L`;
    } else {
      texto = `${positivas}W-${negativas}L`;
    }
    
    return { tipo, valor: positivas - negativas, texto };
  };

  const streak = calcularStreak();

  const melhorMes = useMemo(() => {
    const meses: MesesMap = {};
    sessoes.forEach(s => {
      const [dia, mes, ano] = s.Data.split('/');
      const chave = `${mes}/${ano}`;
      if (!meses[chave]) meses[chave] = 0;
      meses[chave] += s.Ganhos;
    });
    let melhor = { mes: '-', valor: 0 };
    Object.entries(meses).forEach(([mes, valor]) => {
      if (valor > melhor.valor) melhor = { mes, valor: valor as number };
    });
    return melhor;
  }, [sessoes]);

  const dadosROI = useMemo(() => {
    let rakeAcumulado = 0;
    let ganhosAcumulados = 0;
    return sessoes.map(s => {
      rakeAcumulado += s.Rake;
      ganhosAcumulados += s.Ganhos;
      // ROI do poker: (Lucro / Investimento) × 100
      const roiAtual = rakeAcumulado > 0 ? (ganhosAcumulados / rakeAcumulado) * 100 : 0;
      return { Data: s.Data, ROI: roiAtual };
    });
  }, [sessoes]);

  const distribuicaoGanhos = useMemo(() => {
    const faixas = [
      { nome: '< -R$1000', min: -Infinity, max: -1000, count: 0, cor: '#dc2626' },
      { nome: '-R$1000 a -R$500', min: -1000, max: -500, count: 0, cor: '#ef4444' },
      { nome: '-R$500 a -R$200', min: -500, max: -200, count: 0, cor: '#f87171' },
      { nome: '-R$200 a R$0', min: -200, max: 0, count: 0, cor: '#fca5a5' },
      { nome: 'R$0 a R$200', min: 0, max: 200, count: 0, cor: '#86efac' },
      { nome: 'R$200 a R$500', min: 200, max: 500, count: 0, cor: '#4ade80' },
      { nome: 'R$500 a R$1000', min: 500, max: 1000, count: 0, cor: '#22c55e' },
      { nome: '> R$1000', min: 1000, max: Infinity, count: 0, cor: '#16a34a' },
    ];
    sessoes.forEach(s => {
      for (let faixa of faixas) {
        if (s.Ganhos >= faixa.min && s.Ganhos < faixa.max) {
          faixa.count++;
          break;
        }
      }
    });
    return faixas;
  }, [sessoes]);

  const pieData = [
    { name: 'Sessões Positivas', value: sessoesPositivas, color: '#10b981' },
    { name: 'Sessões Negativas', value: sessoesNegativas, color: '#ef4444' }
  ];

  const ganhosPorMes = useMemo(() => {
    const meses: MesesGanhosMap = {};
    sessoes.forEach(s => {
      const [dia, mes, ano] = s.Data.split('/');
      const chave = `${mes}/${ano}`;
      if (!meses[chave]) {
        meses[chave] = { mes: chave, ganhos: 0, jogos: 0, rake: 0 };
      }
      meses[chave].ganhos += s.Ganhos;
      meses[chave].jogos += s.Jogos;
      meses[chave].rake += s.Rake;
    });
    return Object.values(meses).slice(-12);
  }, [sessoes]);

  const fM = (n: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(n);
  };

  const formatYAxis = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) return `R$${(value / 1000000).toFixed(1)}M`;
    else if (absValue >= 1000) return `R$${(value / 1000).toFixed(0)}k`;
    return `R$${Math.round(value)}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ background: '#000', border: '1px solid #333', borderRadius: '8px', padding: '12px', fontSize: '13px' }}>
          <p style={{ margin: '0 0 8px 0', color: '#999' }}>{data.Data || data.mes || data.nome}</p>
          {data.Jogos !== undefined && <p style={{ margin: '4px 0', color: '#f59e0b' }}><strong>Jogos:</strong> {data.Jogos || data.jogos}</p>}
          {data.Ganhos !== undefined && <p style={{ margin: '4px 0', color: data.Ganhos >= 0 ? '#10b981' : '#ef4444' }}><strong>Ganhos:</strong> {fM(data.Ganhos || data.ganhos)}</p>}
          {data.Saldo !== undefined && <p style={{ margin: '4px 0', color: '#3b82f6' }}><strong>Saldo:</strong> {fM(data.Saldo)}</p>}
          {data.ROI !== undefined && <p style={{ margin: '4px 0', color: '#8b5cf6' }}><strong>ROI:</strong> {data.ROI.toFixed(2)}%</p>}
          {data.count !== undefined && <p style={{ margin: '4px 0', color: '#fff' }}><strong>Sessões:</strong> {data.count}</p>}
        </div>
      );
    }
    return null;
  };

  // Mostrar loading APÓS todos os hooks
  if (loading) {
    return (
      <div style={{ 
        backgroundColor: '#050505', 
        color: '#fff', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'system-ui'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '3px solid #333', 
            borderTop: '3px solid #3b82f6', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#666' }}>Carregando dados...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Mostrar erro APÓS todos os hooks
  if (error) {
    return (
      <div style={{ 
        backgroundColor: '#050505', 
        color: '#fff', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'system-ui'
      }}>
        <div style={{ 
          background: '#1a1a1a', 
          padding: '30px', 
          borderRadius: '15px', 
          border: '1px solid #ef4444',
          maxWidth: '500px'
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: '10px' }}>⚠️ Erro ao Carregar Dados</h2>
          <p style={{ color: '#999' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              marginTop: '20px', 
              background: '#3b82f6', 
              color: '#fff', 
              border: 'none', 
              padding: '10px 20px', 
              borderRadius: '8px', 
              cursor: 'pointer' 
            }}
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-primary, #050505)', color: 'var(--text-primary, #fff)', minHeight: '100vh', padding: '40px', fontFamily: 'system-ui', transition: 'background-color 0.3s ease, color 0.3s ease' }}>
      <ThemeToggle />
      <header style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>{jogador}</h1>
            <p style={{ color: 'var(--text-secondary, #666)', fontSize: '14px' }}>Dashboard de Performance - Poker</p>
          </div>
          {ultimaAtualizacao && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#666', fontSize: '11px' }}>Última atualização:</p>
              <p style={{ color: '#999', fontSize: '12px' }}>
                {new Date(ultimaAtualizacao).toLocaleString('pt-BR')}
              </p>
            </div>
          )}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <Card title="Profit Bruto" value={fM(totalGanhos)} color={totalGanhos >= 0 ? "#10b981" : "#ef4444"} />
        <Card title="Volume Total" value={`${totalJogosReal.toLocaleString('pt-BR')} Jogos`} color="#f59e0b" />
        <Card title="Rake Total" value={fM(totalRakeReal)} color="#3b82f6" />
        <Card title="Makeup Atual" value={fM(saldoFinal)} color={saldoFinal < 0 ? "#ef4444" : "#10b981"} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <MiniCard title="Win Rate" value={`${winRate.toFixed(1)}%`} color="#8b5cf6" />
        <MiniCard title="Média/Jogo" value={fM(mediaPorJogo)} color="#ec4899" />
        <MiniCard title="Média/Sessão" value={fM(mediaPorSessao)} color="#06b6d4" />
        <MiniCard title="Rake Back 25%" value={fM(rakeBack)} color="#84cc16" subtitle={`${totalRakeReal > 0 ? '25% do Rake' : ''}`} />
        <MiniCard title="Presença Aulas" value={presencaAula.toString()} color="#f97316" subtitle="Total de aulas" />
        <MiniCard title="Deal Player" value={dealPlayer} color="#06b6d4" subtitle="Porcentagem" />
        <MiniCard title="Maior Ganho" value={fM(maiorGanho)} color="#10b981" />
        <MiniCard title="Maior Perda" value={fM(maiorPerda)} color="#ef4444" />
        <MiniCard title="ROI" value={`${roi.toFixed(1)}%`} color={roi >= 0 ? "#10b981" : "#ef4444"} subtitle="Lucro/Rake" />
        <MiniCard title="Últimas 7 Sessões" value={streak.texto} color={streak.tipo === 'positivo' ? "#10b981" : streak.tipo === 'negativo' ? "#ef4444" : "#666"} subtitle={streak.tipo === 'positivo' ? 'Tendência positiva' : streak.tipo === 'negativo' ? 'Tendência negativa' : 'Equilibrado'} />
        <MiniCard title="Rakeback 25%" value={`${countRakeback25}x`} color="#eab308" subtitle="Vezes sacado" />
        <MiniCard title="Rakeback 35%" value={`${countRakeback35}x`} color="#f59e0b" subtitle="Vezes sacado" />
        <MiniCard title="Melhor Mês" value={fM(melhorMes.valor)} color="#eab308" subtitle={melhorMes.mes} />
        <MiniCard title="Dias Jogados" value={diasJogados.toString()} color="#3b82f6" subtitle="Dias únicos" />
      </div>

      <div style={{ background: 'var(--bg-card, #0a0a0a)', padding: '25px', borderRadius: '20px', border: '1px solid var(--border-color, #1a1a1a)', marginBottom: '30px', transition: 'all 0.3s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: '#444', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>CURVA DE PERFORMANCE</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['semana', 'mes', 'ano', 'todos'].map(p => (
              <button key={p} onClick={() => setPeriodoGrafico(p)} style={{ background: periodoGrafico === p ? '#3b82f6' : 'var(--bg-button, #1a1a1a)', color: periodoGrafico === p ? '#fff' : 'var(--text-secondary, #666)', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s' }}>
                {p === 'todos' ? 'Tudo' : p === 'semana' ? '7 dias' : p === 'mes' ? '30 dias' : '1 ano'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={sessoesFiltradas}>
              <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
              <XAxis dataKey="Data" hide />
              <YAxis stroke="#444" fontSize={12} tickFormatter={formatYAxis} domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Saldo" stroke="#3b82f6" fill="#3b82f622" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'var(--bg-card, #0a0a0a)', padding: '20px', borderRadius: '15px', border: '1px solid var(--border-color, #1a1a1a)', transition: 'all 0.3s ease' }}>
          <h3 style={{ color: '#444', fontSize: '12px', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '1px' }}>EVOLUÇÃO DO ROI</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dadosROI}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                <XAxis dataKey="Data" hide />
                <YAxis stroke="#444" fontSize={11} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="ROI" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p style={{ fontSize: '11px', color: '#666', marginTop: '10px', textAlign: 'center' }}>ROI = (Lucro ÷ Investimento) × 100 | Retorno sobre investimento total</p>
        </div>

        <div style={{ background: 'var(--bg-card, #0a0a0a)', padding: '20px', borderRadius: '15px', border: '1px solid var(--border-color, #1a1a1a)', transition: 'all 0.3s ease' }}>
          <h3 style={{ color: '#444', fontSize: '12px', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '1px' }}>DISTRIBUIÇÃO DE RESULTADOS POR SESSÃO</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribuicaoGanhos} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#111" horizontal={false} />
                <XAxis type="number" stroke="#444" fontSize={10} />
                <YAxis type="category" dataKey="nome" stroke="#444" fontSize={9} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {distribuicaoGanhos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p style={{ fontSize: '11px', color: '#666', marginTop: '10px', textAlign: 'center' }}>Faixas de resultado | Identifica onde você "vive" mais</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'var(--bg-card, #0a0a0a)', padding: '20px', borderRadius: '15px', border: '1px solid var(--border-color, #1a1a1a)', transition: 'all 0.3s ease' }}>
          <h3 style={{ color: '#444', fontSize: '12px', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '1px' }}>GANHOS POR MÊS</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ganhosPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                <XAxis dataKey="mes" stroke="#444" fontSize={11} />
                <YAxis stroke="#444" fontSize={11} tickFormatter={formatYAxis} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="ganhos" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card, #0a0a0a)', padding: '20px', borderRadius: '15px', border: '1px solid var(--border-color, #1a1a1a)', transition: 'all 0.3s ease' }}>
          <h3 style={{ color: '#444', fontSize: '12px', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '1px' }}>DISTRIBUIÇÃO DE SESSÕES</h3>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0];
                    return (
                      <div style={{ background: '#000', border: '1px solid #333', borderRadius: '8px', padding: '12px', fontSize: '13px' }}>
                        <p style={{ margin: 0, color: data.payload.color, fontWeight: 'bold' }}>{data.name}</p>
                        <p style={{ margin: '5px 0 0 0', color: '#999' }}>{data.value} sessões ({((data.value / sessoes.length) * 100).toFixed(1)}%)</p>
                      </div>
                    );
                  }
                  return null;
                }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card, #0a0a0a)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-color, #1a1a1a)', transition: 'all 0.3s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ color: '#444', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>HISTÓRICO DETALHADO</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['semana', 'mes', 'ano', 'todos'].map(p => (
              <button key={p} onClick={() => setPeriodoTabela(p)} style={{ background: periodoTabela === p ? '#3b82f6' : 'var(--bg-button, #1a1a1a)', color: periodoTabela === p ? '#fff' : 'var(--text-secondary, #666)', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s' }}>
                {p === 'todos' ? 'Tudo' : p === 'semana' ? 'Última Semana' : p === 'mes' ? 'Último Mês' : 'Último Ano'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card, #0a0a0a)', zIndex: 1 }}>
              <tr style={{ color: '#444', fontSize: '12px', textAlign: 'left', borderBottom: '2px solid var(--border-color, #1a1a1a)' }}>
                <th style={{ padding: '12px' }}>DATA</th>
                <th style={{ padding: '12px' }}>GANHOS</th>
                <th style={{ padding: '12px' }}>JOGOS</th>
                <th style={{ padding: '12px' }}>RAKE</th>
                <th style={{ padding: '12px' }}>SALDO ACUM.</th>
              </tr>
            </thead>
            <tbody>
              {sessoesTabela.slice().reverse().map((s, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-light, #0f0f0f)', fontSize: '13px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover, #0f0f0f)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px', color: 'var(--text-secondary, #666)' }}>{s.Data}</td>
                  <td style={{ padding: '12px', color: s.Ganhos >= 0 ? '#10b981' : '#ef4444', fontWeight: '500' }}>{fM(s.Ganhos)}</td>
                  <td style={{ padding: '12px' }}>{s.Jogos}</td>
                  <td style={{ padding: '12px', color: '#3b82f6' }}>{fM(s.Rake)}</td>
                  <td style={{ padding: '12px', color: s.Saldo >= 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>{fM(s.Saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '15px', padding: '10px', background: 'var(--bg-footer, #0f0f0f)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary, #666)', transition: 'all 0.3s ease' }}>
          Mostrando {sessoesTabela.length} de {sessoes.length} sessões
        </div>
      </div>
    </div>
  );
}

interface CardProps {
  title: string;
  value: string;
  color: string;
}

function Card({ title, value, color }: CardProps) {
  return (
    <div style={{ background: 'var(--bg-card, #0a0a0a)', padding: '20px', borderRadius: '15px', border: '1px solid var(--border-color, #1a1a1a)', transition: 'transform 0.2s, border-color 0.2s, background 0.3s ease', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#2a2a2a'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color, #1a1a1a)'; }}>
      <p style={{ color: '#444', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', margin: 0, letterSpacing: '1px' }}>{title}</p>
      <p style={{ fontSize: '24px', fontWeight: 'bold', color: color, margin: '8px 0 0 0' }}>{value}</p>
    </div>
  );
}

interface MiniCardProps {
  title: string;
  value: string;
  color: string;
  subtitle?: string;
}

function MiniCard({ title, value, color, subtitle }: MiniCardProps) {
  return (
    <div style={{ background: 'var(--bg-card, #0a0a0a)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color, #1a1a1a)', transition: 'all 0.3s ease' }}>
      <p style={{ color: '#555', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>{title}</p>
      <p style={{ fontSize: '18px', fontWeight: 'bold', color: color, margin: '6px 0 0 0' }}>{value}</p>
      {subtitle && <p style={{ fontSize: '10px', color: '#666', margin: '4px 0 0 0' }}>{subtitle}</p>}
    </div>
  );
}