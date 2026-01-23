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
  retaAtual: number;
  rakebackAbaixoMeta: string;
  rakebackAcimaMeta: string;
  countRakeback25: number;
  countRakeback35: number;
  sessoesAtivas: number;
  sessoes: Sessao[];
  ultimaAtualizacao?: string;
}

export default function Dashboard() {
  const [dataFile, setDataFile] = useState<DataFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodoTabela, setPeriodoTabela] = useState('todos');
  const [periodoGrafico, setPeriodoGrafico] = useState('todos');

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
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const { jogador, makeupAtual, profitBruto, totalRake, totalJogos, presencaAula, dealPlayer, retaAtual, countRakeback25, countRakeback35, sessoesAtivas, sessoes, ultimaAtualizacao } = dataFile || {
    jogador: "Jogador",
    makeupAtual: 0,
    profitBruto: 0,
    totalRake: 0,
    totalJogos: 0,
    presencaAula: 0,
    dealPlayer: "0%",
    retaAtual: 0,
    rakebackAbaixoMeta: "25%",
    rakebackAcimaMeta: "35%",
    countRakeback25: 0,
    countRakeback35: 0,
    sessoesAtivas: 0,
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

  const sessoesPositivas = sessoes.filter(s => s.Ganhos > 0).length;
  const sessoesNegativas = sessoes.filter(s => s.Ganhos < 0).length;
  const winRate = sessoes.length > 0 ? (sessoesPositivas / sessoes.length * 100) : 0;
  
  const mediaPorJogo = totalJogos > 0 ? profitBruto / totalJogos : 0;
  const mediaPorSessao = sessoes.length > 0 ? profitBruto / sessoes.length : 0;
  
  const maiorGanho = Math.max(...sessoes.map(s => s.Ganhos), 0);
  const maiorPerda = Math.min(...sessoes.map(s => s.Ganhos), 0);
  
  const rakeBack = totalRake * 0.25;
  const roi = totalRake > 0 ? (profitBruto / totalRake) * 100 : 0;
  const diasJogados = new Set(sessoes.map(s => s.Data)).size;
  
  const mediaRakePorDia = diasJogados > 0 ? totalRake / diasJogados : 0;
  const ticketMedio = totalJogos > 0 ? totalRake / totalJogos : 0;
  
  const calcularMaiorStreak = () => {
    let maiorStreak = 0;
    let streakAtual = 0;
    
    for (let i = 0; i < sessoes.length; i++) {
      if (sessoes[i].Ganhos > 0) {
        streakAtual++;
        maiorStreak = Math.max(maiorStreak, streakAtual);
      } else if (sessoes[i].Ganhos < 0) {
        streakAtual = 0;
      }
    }
    
    return maiorStreak;
  };
  
  const maiorStreakPositivo = calcularMaiorStreak();

  const metaMensal = 10000;
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();
  
  const sessoesMesAtual = sessoes.filter(s => {
    const [dia, mes, ano] = s.Data.split('/');
    return parseInt(mes) - 1 === mesAtual && parseInt(ano) === anoAtual;
  });
  
  const profitMesAtual = sessoesMesAtual.reduce((acc, s) => acc + s.Ganhos, 0);
  const progressoMeta = metaMensal > 0 ? (profitMesAtual / metaMensal) * 100 : 0;
  const faltaParaMeta = metaMensal - profitMesAtual;
  const diasRestantesMes = new Date(anoAtual, mesAtual + 1, 0).getDate() - hoje.getDate();
  const mediaNecessariaDia = diasRestantesMes > 0 ? faltaParaMeta / diasRestantesMes : 0;
  
  const analisarVariancia = () => {
    let maiorUpswing = 0;
    let maiorDownswing = 0;
    let upswingAtual = 0;
    let downswingAtual = 0;
    
    for (let i = 0; i < sessoes.length; i++) {
      if (sessoes[i].Ganhos > 0) {
        upswingAtual += sessoes[i].Ganhos;
        maiorUpswing = Math.max(maiorUpswing, upswingAtual);
        downswingAtual = 0;
      } else if (sessoes[i].Ganhos < 0) {
        downswingAtual += Math.abs(sessoes[i].Ganhos);
        maiorDownswing = Math.max(maiorDownswing, downswingAtual);
        upswingAtual = 0;
      }
    }
    
    return { maiorUpswing, maiorDownswing };
  };
  
  const variancia = analisarVariancia();
  
  const compararMeses = useMemo(() => {
    const mesesData: any = {};
    
    sessoes.forEach(s => {
      const [dia, mes, ano] = s.Data.split('/');
      const chave = `${mes}/${ano}`;
      
      if (!mesesData[chave]) {
        mesesData[chave] = {
          mes: chave,
          profit: 0,
          jogos: 0,
          rake: 0,
          sessoes: 0,
          winRate: 0,
          sessoesPositivas: 0
        };
      }
      
      mesesData[chave].profit += s.Ganhos;
      mesesData[chave].jogos += s.Jogos;
      mesesData[chave].rake += s.Rake;
      mesesData[chave].sessoes += 1;
      if (s.Ganhos > 0) mesesData[chave].sessoesPositivas += 1;
    });
    
    Object.keys(mesesData).forEach(mes => {
      const data = mesesData[mes];
      data.winRate = data.sessoes > 0 ? (data.sessoesPositivas / data.sessoes) * 100 : 0;
    });
    
    const mesesArray = Object.values(mesesData).slice(-6);
    return mesesArray;
  }, [sessoes]);
  
  const gerarAlerts = () => {
    const alerts: any[] = [];
    
    const ultimas5 = sessoes.slice(-5);
    const todasNegativas = ultimas5.every(s => s.Ganhos < 0);
    if (todasNegativas && ultimas5.length === 5) {
      const perdaTotal = ultimas5.reduce((acc, s) => acc + s.Ganhos, 0);
      alerts.push({
        tipo: 'warning',
        titulo: '⚠️ Downswing Detectado',
        mensagem: `5 sessões negativas consecutivas (${fM(perdaTotal)})`,
        cor: '#ef4444'
      });
    }
    
    if (profitMesAtual >= metaMensal) {
      alerts.push({
        tipo: 'success',
        titulo: '🎉 Meta Atingida!',
        mensagem: `Parabéns! Você bateu a meta mensal de ${fM(metaMensal)}`,
        cor: '#10b981'
      });
    }
    
    const ultimos7Dias = sessoes.slice(-7);
    const rakeUltimos7 = ultimos7Dias.reduce((acc, s) => acc + s.Rake, 0);
    const profitUltimos7 = ultimos7Dias.reduce((acc, s) => acc + s.Ganhos, 0);
    const roiUltimos7 = rakeUltimos7 > 0 ? (profitUltimos7 / rakeUltimos7) * 100 : 0;
    
    if (roi > 0 && roiUltimos7 < roi * 0.7) {
      alerts.push({
        tipo: 'info',
        titulo: '📊 Atenção ao ROI',
        mensagem: `ROI dos últimos 7 dias (${roiUltimos7.toFixed(1)}%) está abaixo da média geral`,
        cor: '#3b82f6'
      });
    }
    
    const ultimas3 = sessoes.slice(-3);
    const todasPositivas = ultimas3.every(s => s.Ganhos > 0);
    if (todasPositivas && ultimas3.length === 3) {
      const ganhoTotal = ultimas3.reduce((acc, s) => acc + s.Ganhos, 0);
      alerts.push({
        tipo: 'success',
        titulo: '🔥 Upswing!',
        mensagem: `3 sessões positivas seguidas (+${fM(ganhoTotal)})`,
        cor: '#10b981'
      });
    }
    
    return alerts;
  };
  
  const alerts = gerarAlerts();

  const calcularStreak = () => {
    if (sessoes.length === 0) return { tipo: 'neutro', valor: 0, texto: 'Sem dados' };
    
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
    const meses: any = {};
    sessoes.forEach(s => {
      const [dia, mes, ano] = s.Data.split('/');
      const chave = `${mes}/${ano}`;
      if (!meses[chave]) meses[chave] = 0;
      meses[chave] += s.Ganhos;
    });
    let melhor = { mes: '-', valor: 0 };
    Object.entries(meses).forEach(([mes, valor]) => {
      if ((valor as number) > melhor.valor) melhor = { mes, valor: valor as number };
    });
    return melhor;
  }, [sessoes]);

  const dadosROI = useMemo(() => {
    let rakeAcumulado = 0;
    let ganhosAcumulados = 0;
    return sessoes.map(s => {
      rakeAcumulado += s.Rake;
      ganhosAcumulados += s.Ganhos;
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
    const meses: any = {};
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
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

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
      
      {/* 1. ALERTAS */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {alerts.map((alert, idx) => (
            <div key={idx} style={{ 
              background: 'var(--bg-card, #0a0a0a)', 
              border: `1px solid ${alert.cor}`, 
              borderLeft: `4px solid ${alert.cor}`,
              borderRadius: '12px', 
              padding: '15px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <div style={{ fontSize: '24px' }}>{alert.titulo.split(' ')[0]}</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, color: alert.cor, fontSize: '14px', fontWeight: 'bold' }}>
                  {alert.titulo.substring(alert.titulo.indexOf(' ') + 1)}
                </h4>
                <p style={{ margin: '5px 0 0 0', color: '#999', fontSize: '13px' }}>{alert.mensagem}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. HEADER */}
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

      {/* 3. CARDS PRINCIPAIS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <Card title="Profit Bruto" value={fM(profitBruto)} color={profitBruto >= 0 ? "#10b981" : "#ef4444"} />
        <Card title="Makeup Atual" value={fM(makeupAtual)} color={makeupAtual < 0 ? "#ef4444" : "#10b981"} />
        <Card title="Volume Total" value={`${totalJogos.toLocaleString('pt-BR')} Jogos`} color="#f59e0b" />
        <Card title="Rake Total" value={fM(totalRake)} color="#3b82f6" />
      </div>

      {/* 4. MINI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <MiniCard title="Win Rate" value={`${winRate.toFixed(1)}%`} color="#8b5cf6" subtitle="Taxa de vitória" />
        <MiniCard title="Média/Jogo" value={fM(mediaPorJogo)} color="#ec4899" subtitle="Profit por jogo" />
        <MiniCard title="Média/Sessão" value={fM(mediaPorSessao)} color="#06b6d4" subtitle="Profit por dia" />
        <MiniCard title="ROI" value={`${roi.toFixed(1)}%`} color={roi >= 0 ? "#10b981" : "#ef4444"} subtitle="Lucro/Rake" />
        <MiniCard title="Rake Back 25%" value={fM(rakeBack)} color="#84cc16" subtitle="25% do Rake" />
        <MiniCard title="Rake Back 35%" value={fM(totalRake * 0.35)} color="#22c55e" subtitle="35% do Rake" />
        <MiniCard title="Maior Ganho" value={fM(maiorGanho)} color="#10b981" subtitle="Melhor sessão" />
        <MiniCard title="Maior Perda" value={fM(maiorPerda)} color="#ef4444" subtitle="Pior sessão" />
        <MiniCard title="Últimas 7 Sessões" value={streak.texto} color={streak.tipo === 'positivo' ? "#10b981" : streak.tipo === 'negativo' ? "#ef4444" : "#666"} subtitle={streak.tipo === 'positivo' ? 'Tendência positiva' : streak.tipo === 'negativo' ? 'Tendência negativa' : 'Equilibrado'} />
        <MiniCard title="Dias Jogados" value={diasJogados.toString()} color="#3b82f6" subtitle="Dias únicos" />
        <MiniCard title="Rake/Dia" value={fM(mediaRakePorDia)} color="#3b82f6" subtitle="Intensidade média" />
        <MiniCard title="Ticket Médio" value={fM(ticketMedio)} color="#a855f7" subtitle="Buy-in médio" />
        <MiniCard title="Maior Streak +" value={`${maiorStreakPositivo} sessões`} color="#10b981" subtitle="Recorde de vitórias" />
        <MiniCard title="Melhor Mês" value={fM(melhorMes.valor)} color="#eab308" subtitle={melhorMes.mes} />
        <MiniCard title="Presença Aulas" value={presencaAula.toString()} color="#f97316" subtitle="Total de aulas" />
        <MiniCard title="Deal Player" value={dealPlayer} color="#06b6d4" subtitle="Porcentagem" />
        <MiniCard title="Reta Atual" value={retaAtual.toString()} color="#8b5cf6" subtitle="Status" />
        <MiniCard title="Rakeback 25%" value={`${countRakeback25}x`} color="#eab308" subtitle="Vezes sacado" />
        <MiniCard title="Rakeback 35%" value={`${countRakeback35}x`} color="#f59e0b" subtitle="Vezes sacado" />
        <MiniCard title="Sessões Ativas" value={sessoesAtivas.toString()} color="#10b981" subtitle="Dias jogados" />
      </div>

      {/* 5. GRÁFICO PRINCIPAL - CURVA DE PERFORMANCE */}
      <div style={{ background: 'var(--bg-card, #0a0a0a)', padding: '25px', borderRadius: '20px', border: '1px solid var(--border-color, #1a1a1a)', marginBottom: '30px' }}>
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

      {/* 6. GRÁFICOS COMPARATIVOS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {/* Ganhos por Mês */}
        <div style={{ background: 'var(--bg-card, #0a0a0a)', padding: '20px', borderRadius: '15px', border: '1px solid var(--border-color, #1a1a1a)' }}>
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

        {/* Evolução do ROI */}
        <div style={{ background: 'var(--bg-card, #0a0a0a)', padding: '20px', borderRadius: '15px', border: '1px solid var(--border-color, #1a1a1a)' }}>
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
          <p style={{ fontSize: '11px', color: '#666', marginTop: '10px', textAlign: 'center' }}>ROI = (Lucro ÷ Investimento) × 100</p>
        </div>
      </div>

      {/* 7. DISTRIBUIÇÕES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {/* Distribuição de Resultados */}
        <div style={{ background: 'var(--bg-card, #0a0a0a)', padding: '20px', borderRadius: '15px', border: '1px solid var(--border-color, #1a1a1a)' }}>
          <h3 style={{ color: '#444', fontSize: '12px', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '1px' }}>DISTRIBUIÇÃO DE RESULTADOS</h3>
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
          <p style={{ fontSize: '11px', color: '#666', marginTop: '10px', textAlign: 'center' }}>Faixas de resultado por sessão</p>
        </div>

        {/* Distribuição de Sessões */}
        <div style={{ background: 'var(--bg-card, #0a0a0a)', padding: '20px', borderRadius: '15px', border: '1px solid var(--border-color, #1a1a1a)' }}>
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

      {/* 8. VARIÂNCIA + HEATMAP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {/* Análise de Variância */}
        <div style={{ background: 'var(--bg-card, #0a0a0a)', padding: '25px', borderRadius: '20px', border: '1px solid var(--border-color, #1a1a1a)' }}>
          <h3 style={{ color: '#444', fontSize: '12px', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '1px' }}>
            📉📈 ANÁLISE DE VARIÂNCIA
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
              padding: '20px', 
              borderRadius: '12px',
              color: '#fff'
            }}>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>🚀 MAIOR UPSWING</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{fM(variancia.maiorUpswing)}</div>
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '5px' }}>Seu melhor momento</div>
            </div>
            <div style={{ 
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
              padding: '20px', 
              borderRadius: '12px',
              color: '#fff'
            }}>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>📉 MAIOR DOWNSWING</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{fM(variancia.maiorDownswing)}</div>
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '5px' }}>Momento mais difícil</div>
            </div>
            <div style={{ 
              background: 'var(--bg-hover, #0f0f0f)', 
              padding: '15px', 
              borderRadius: '10px',
              border: '1px solid var(--border-color, #1a1a1a)'
            }}>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>RELAÇÃO UPSWING/DOWNSWING</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  flex: 1, 
                  height: '8px', 
                  background: '#1a1a1a', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${variancia.maiorDownswing > 0 ? (variancia.maiorUpswing / (variancia.maiorUpswing + variancia.maiorDownswing)) * 100 : 100}%`,
                    background: 'linear-gradient(90deg, #10b981, #059669)',
                    transition: 'width 0.5s ease'
                  }}></div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>
                  {variancia.maiorDownswing > 0 ? (variancia.maiorUpswing / variancia.maiorDownswing).toFixed(1) : '∞'}x
                </div>
              </div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>
                {variancia.maiorDownswing > 0 && variancia.maiorUpswing > variancia.maiorDownswing 
                  ? '✓ Seu upswing é maior que o downswing' 
                  : 'Continue trabalhando para superar o downswing'}
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div style={{ background: 'var(--bg-card, #0a0a0a)', padding: '25px', borderRadius: '20px', border: '1px solid var(--border-color, #1a1a1a)' }}>
          <h3 style={{ color: '#444', fontSize: '12px', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '1px' }}>
            🗓️ HEATMAP - ÚLTIMOS 30 DIAS
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
            {(() => {
              const ultimos30Dias = [];
              const hojeDia = new Date();
              
              for (let i = 29; i >= 0; i--) {
                const data = new Date(hojeDia);
                data.setDate(hojeDia.getDate() - i);
                const dataStr = `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
                
                const sessaoDia = sessoes.find(s => s.Data === dataStr);
                const ganho = sessaoDia ? sessaoDia.Ganhos : 0;
                
                let cor = '#1a1a1a';
                let intensidade = 0;
                
                if (ganho > 0) {
                  intensidade = Math.min(ganho / 2000, 1);
                  cor = `rgba(16, 185, 129, ${0.3 + intensidade * 0.7})`;
                } else if (ganho < 0) {
                  intensidade = Math.min(Math.abs(ganho) / 2000, 1);
                  cor = `rgba(239, 68, 68, ${0.3 + intensidade * 0.7})`;
                }
                
                ultimos30Dias.push({ data: dataStr, ganho, cor, dia: data.getDate() });
              }
              
              return ultimos30Dias.map((dia, idx) => (
                <div 
                  key={idx}
                  title={`${dia.data}: ${fM(dia.ganho)}`}
                  style={{ 
                    background: dia.cor,
                    aspectRatio: '1',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    color: dia.ganho !== 0 ? '#fff' : '#666',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {dia.dia}
                </div>
              ));
            })()}
          </div>
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '10px', color: '#666' }}>Legenda:</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '15px', height: '15px', background: '#1a1a1a', borderRadius: '3px' }}></div>
                <span style={{ fontSize: '10px', color: '#666' }}>Sem dados</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '15px', height: '15px', background: '#10b981', borderRadius: '3px' }}></div>
                <span style={{ fontSize: '10px', color: '#666' }}>Lucro</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '15px', height: '15px', background: '#ef4444', borderRadius: '3px' }}></div>
                <span style={{ fontSize: '10px', color: '#666' }}>Prejuízo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 9. META MENSAL */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        padding: '30px', 
        borderRadius: '20px', 
        marginBottom: '30px',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>🎯 Meta Mensal</h3>
            <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
              {hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{progressoMeta.toFixed(1)}%</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>da meta</div>
          </div>
        </div>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.2)', 
          height: '30px', 
          borderRadius: '15px', 
          overflow: 'hidden',
          marginBottom: '20px'
        }}>
          <div style={{ 
            background: profitMesAtual >= metaMensal ? '#10b981' : '#fff',
            height: '100%', 
            width: `${Math.min(progressoMeta, 100)}%`,
            transition: 'width 0.5s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '10px',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            {progressoMeta > 10 && `${progressoMeta.toFixed(0)}%`}
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '5px' }}>META</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{fM(metaMensal)}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '5px' }}>ATUAL</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{fM(profitMesAtual)}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '5px' }}>FALTA</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: faltaParaMeta <= 0 ? '#10b981' : '#fff' }}>
              {faltaParaMeta > 0 ? fM(faltaParaMeta) : '✓ Bateu!'}
            </div>
          </div>
          {diasRestantesMes > 0 && faltaParaMeta > 0 && (
            <div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '5px' }}>NECESSÁRIO/DIA</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{fM(mediaNecessariaDia)}</div>
              <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>
                {diasRestantesMes} dias restantes
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 10. COMPARATIVO MENSAL */}
      <div style={{ background: 'var(--bg-card, #0a0a0a)', padding: '25px', borderRadius: '20px', border: '1px solid var(--border-color, #1a1a1a)', marginBottom: '30px' }}>
        <h3 style={{ color: '#444', fontSize: '12px', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '1px' }}>
          📊 COMPARATIVO MENSAL - ÚLTIMOS 6 MESES
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color, #1a1a1a)' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontSize: '11px', fontWeight: 'bold' }}>MÊS</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#666', fontSize: '11px', fontWeight: 'bold' }}>PROFIT</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#666', fontSize: '11px', fontWeight: 'bold' }}>JOGOS</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#666', fontSize: '11px', fontWeight: 'bold' }}>RAKE</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#666', fontSize: '11px', fontWeight: 'bold' }}>WIN RATE</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#666', fontSize: '11px', fontWeight: 'bold' }}>VARIAÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {compararMeses.map((mes: any, idx: number) => {
                const mesAnterior = idx > 0 ? compararMeses[idx - 1] : null;
                const variacao = mesAnterior ? ((mes.profit - mesAnterior.profit) / Math.abs(mesAnterior.profit)) * 100 : 0;
                
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-light, #0f0f0f)' }}>
                    <td style={{ padding: '15px', fontSize: '13px', fontWeight: '500' }}>{mes.mes}</td>
                    <td style={{ padding: '15px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold', color: mes.profit >= 0 ? '#10b981' : '#ef4444' }}>
                      {fM(mes.profit)}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'right', color: '#999' }}>{mes.jogos}</td>
                    <td style={{ padding: '15px', textAlign: 'right', color: '#3b82f6' }}>{fM(mes.rake)}</td>
                    <td style={{ padding: '15px', textAlign: 'right', color: '#8b5cf6' }}>{mes.winRate.toFixed(1)}%</td>
                    <td style={{ padding: '15px', textAlign: 'right' }}>
                      {mesAnterior ? (
                        <span style={{ 
                          color: variacao >= 0 ? '#10b981' : '#ef4444',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}>
                          {variacao >= 0 ? '↗' : '↘'} {Math.abs(variacao).toFixed(1)}%
                        </span>
                      ) : (
                        <span style={{ color: '#666', fontSize: '12px' }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {compararMeses.length >= 2 && (
          <div style={{ marginTop: '20px', padding: '15px', background: 'var(--bg-hover, #0f0f0f)', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>ANÁLISE</div>
            <div style={{ fontSize: '14px', color: '#fff' }}>
              {(() => {
                const mesAtualIdx = compararMeses.length - 1;
                const mesAtualData = compararMeses[mesAtualIdx];
                const mesAnteriorData = compararMeses[mesAtualIdx - 1];
                const melhoria = mesAtualData.profit > mesAnteriorData.profit;
                const diferenca = ((mesAtualData.profit - mesAnteriorData.profit) / Math.abs(mesAnteriorData.profit)) * 100;
                
                return (
                  <span>
                    {melhoria ? '📈' : '📉'} Você {melhoria ? 'melhorou' : 'caiu'}{' '}
                    <strong style={{ color: melhoria ? '#10b981' : '#ef4444' }}>
                      {Math.abs(diferenca).toFixed(1)}%
                    </strong>{' '}
                    em relação ao mês anterior
                  </span>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* 11. HISTÓRICO DETALHADO */}
      <div style={{ background: 'var(--bg-card, #0a0a0a)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border-color, #1a1a1a)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ color: '#444', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>HISTÓRICO DETALHADO</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
        <div style={{ marginTop: '15px', padding: '10px', background: 'var(--bg-footer, #0f0f0f)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary, #666)' }}>
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