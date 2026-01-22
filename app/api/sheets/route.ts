import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export const revalidate = 0; // Desabilita cache

// Função auxiliar para processar números (incluindo negativos)
function processarNumero(valor: string | undefined): number {
  if (!valor) return 0;
  
  const valorStr = valor.toString().trim();
  
  // Detectar se é negativo
  const isNegativo = valorStr.includes('-') || valorStr.startsWith('(');
  
  // Remover símbolos de moeda e espaços
  let numero = valorStr.replace(/[R$\s]/g, '');
  
  // No formato brasileiro: 93.451,02
  // Precisamos trocar . por nada (separador de milhar) e , por . (decimal)
  
  // Se tem vírgula E ponto, é formato brasileiro (93.451,02)
  if (numero.includes('.') && numero.includes(',')) {
    numero = numero.replace(/\./g, ''); // Remove pontos (milhares)
    numero = numero.replace(',', '.'); // Vírgula vira ponto (decimal)
  }
  // Se só tem vírgula, é formato brasileiro sem milhar (237,11)
  else if (numero.includes(',')) {
    numero = numero.replace(',', '.');
  }
  // Se só tem ponto, pode ser formato americano OU milhar sem decimal
  // Vamos assumir que é formato americano se tiver mais de 2 casas após o ponto
  
  // Converter para número
  let resultado = parseFloat(numero) || 0;
  
  // Aplicar sinal negativo se necessário
  if (isNegativo && resultado > 0) {
    resultado = -resultado;
  }
  
  return resultado;
}

export async function GET() {
  try {
    // Validar variáveis de ambiente
    if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || !process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
      throw new Error('Credenciais do Google não configuradas. Adicione GOOGLE_SHEETS_CLIENT_EMAIL e GOOGLE_SHEETS_PRIVATE_KEY no .env.local');
    }

    // Processar a chave privada corretamente
    let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    privateKey = privateKey.trim().replace(/^["']|["']$/g, '');

    console.log('Autenticando com Google Sheets...');

    // Configurar autenticação
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    console.log('Buscando dados da aba Sbrissa...');

    // Buscar totais da linha 3
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sbrissa!A3:P3', // Expandir para pegar todas as colunas
    });

    const headerRow = headerResponse.data.values?.[0] || [];
    
    // Extrair TODOS os valores da linha 3:
    // A3 = Nome/Sistema
    // B3 = ID Sistema  
    // C3 = Deal Player (40%)
    // D3 = Total de Jogos (9863)
    // E3 = Total de Presença Aula (259)
    // F3 = Total de Rake (56.803,18)
    // G3 = Rakeback Abaixo da Meta (25%)
    // H3 = Rakeback Acima da Meta (35%)
    // I3 = MakeUp Atual (-3.237,11)
    // J3 = Profit/Loss (93.451,02)
    
    const dealPlayer = headerRow[2]?.toString().trim() || '0%'; // C3
    const totalJogos = parseInt(headerRow[3]?.toString().replace(/\D/g, '')) || 0; // D3
    const totalPresencaAula = parseInt(headerRow[4]?.toString().replace(/\D/g, '')) || 0; // E3
    const totalRake = processarNumero(headerRow[5]); // F3
    const rakebackAbaixoMeta = headerRow[6]?.toString().trim() || '25%'; // G3
    const rakebackAcimaMeta = headerRow[7]?.toString().trim() || '35%'; // H3
    const makeupAtualHeader = processarNumero(headerRow[8]); // I3
    const profitLossHeader = processarNumero(headerRow[9]); // J3

    console.log(`Deal Player (C3): ${dealPlayer}`);
    console.log(`Total Jogos (D3): ${totalJogos}`);
    console.log(`Presença Aula (E3): ${totalPresencaAula}`);
    console.log(`Total Rake (F3): ${totalRake}`);
    console.log(`Makeup Atual (I3): ${makeupAtualHeader}`);
    console.log(`Profit/Loss (J3): ${profitLossHeader}`);

    // Buscar dados das sessões
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sbrissa!A7:I1000',
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhum dado encontrado na aba Sbrissa',
        dica: 'Verifique se a aba se chama exatamente "Sbrissa" e tem dados a partir da linha 7'
      }, { status: 404 });
    }

    console.log(`Processando ${rows.length} linhas de dados...`);

    // Processar sessões
    const sessoes: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      if (!row[0] || row[0].toString().trim() === '') continue;
      
      const data = row[0]?.toString().trim();
      const ganhosPerdas = processarNumero(row[2]); // Coluna C
      const jogos = parseInt(row[3]?.toString().replace(/\D/g, '')) || 0; // Coluna D
      const rake = processarNumero(row[5]); // Coluna F
      const rakebackMeta = row[6]?.toString().trim() || ''; // Coluna G (vazio ou valor)
      const rakebackAcima = row[7]?.toString().trim() || ''; // Coluna H (vazio ou valor)
      const saldoMakeup = processarNumero(row[8]); // Coluna I

      sessoes.push({
        Data: data,
        Ganhos: ganhosPerdas,
        Jogos: jogos,
        Rake: rake,
        RakebackAbaixo: rakebackMeta, // 25%
        RakebackAcima: rakebackAcima, // 35%
        Saldo: saldoMakeup,
      });
    }

    // Contar quantas vezes sacou cada tipo de rakeback
    const countRakeback25 = sessoes.filter(s => s.RakebackAbaixo && s.RakebackAbaixo !== '').length;
    const countRakeback35 = sessoes.filter(s => s.RakebackAcima && s.RakebackAcima !== '').length;

    console.log(`${sessoes.length} sessões processadas`);
    console.log(`Rakeback 25% sacado: ${countRakeback25} vezes`);
    console.log(`Rakeback 35% sacado: ${countRakeback35} vezes`);
    const data = {
      jogador: "Carlos Sbrissa",
      makeupAtual: makeupAtualHeader,
      profitBruto: profitLossHeader,
      totalRake: totalRake, // Valor correto da célula F3
      totalJogos: totalJogos, // Valor correto da célula D3
      presencaAula: totalPresencaAula, // Valor da célula E3
      dealPlayer: dealPlayer, // Valor da célula C3
      rakebackAbaixoMeta: rakebackAbaixoMeta, // 25%
      rakebackAcimaMeta: rakebackAcimaMeta, // 35%
      countRakeback25: countRakeback25, // Quantas vezes sacou 25%
      countRakeback35: countRakeback35, // Quantas vezes sacou 35%
      sessoes,
      totalSessoes: sessoes.length,
      ultimaAtualizacao: new Date().toISOString(),
    };

    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Erro ao buscar dados:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro ao buscar dados do Google Sheets',
        message: error.message,
        dicas: [
          '1. Verifique se as variáveis de ambiente estão configuradas',
          '2. Certifique-se que a planilha foi compartilhada com o service account',
          '3. Confirme que a aba se chama "Sbrissa"'
        ]
      },
      { status: 500 }
    );
  }
}