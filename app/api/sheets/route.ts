import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export const revalidate = 0; // Desabilita cache

export async function GET() {
  try {
    // Validar variáveis de ambiente
    if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL || !process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
      throw new Error('Credenciais do Google não configuradas. Adicione GOOGLE_SHEETS_CLIENT_EMAIL e GOOGLE_SHEETS_PRIVATE_KEY no .env.local');
    }

    // Processar a chave privada corretamente
    let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    
    // Se a chave vier com \\n literal, substituir por quebras de linha reais
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    // Remover espaços extras e aspas duplas/simples das pontas
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

    // Primeiro, buscar os totais da linha 3 (cabeçalho)
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sbrissa!A3:J3', // Linha 3 com os totais
    });

    const headerRow = headerResponse.data.values?.[0] || [];
    
    // Extrair valores da linha 3:
    // I3 = MakeUp Atual (índice 8)
    // J3 = Profit/Loss (índice 9)
    const makeupAtualHeader = parseFloat(headerRow[8]?.toString().replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
    const profitLossHeader = parseFloat(headerRow[9]?.toString().replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;

    console.log(`Makeup Atual (I3): ${makeupAtualHeader}`);
    console.log(`Profit/Loss (J3): ${profitLossHeader}`);

    // Agora buscar dados das sessões (a partir da linha 7)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sbrissa!A7:J1000', // Pegar até linha 1000 para garantir todos os dados
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhum dado encontrado na aba Sbrissa',
        dica: 'Verifique se a aba se chama exatamente "Sbrissa" e tem dados a partir da linha 7'
      }, { status: 404 });
    }

    console.log(`Processando ${rows.length} linhas de dados...`);

    // Processar dados das sessões
    const sessoes: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      // Pular linhas vazias (sem data)
      if (!row[0] || row[0].toString().trim() === '') continue;
      
      const data = row[0]?.toString().trim();
      
      // Mapear as colunas corretamente:
      // A (índice 0): Data
      // B (índice 1): MakeUp Inicial  
      // C (índice 2): Ganhos/Perdas Individual
      // D (índice 3): Total de Jogos
      // E (índice 4): Presença Aula
      // F (índice 5): Total de Rake
      // G (índice 6): Rakeback
      // H (índice 7): Total Ganhos
      // I (índice 8): Saldo MakeUp
      
      const ganhosPerdas = parseFloat(row[2]?.toString().replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
      const jogos = parseInt(row[3]?.toString().replace(/\D/g, '')) || 0;
      const rake = parseFloat(row[5]?.toString().replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
      const saldoMakeup = parseFloat(row[8]?.toString().replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;

      sessoes.push({
        Data: data,
        Ganhos: ganhosPerdas,
        Jogos: jogos,
        Rake: rake,
        Saldo: saldoMakeup,
      });
    }

    console.log(`${sessoes.length} sessões processadas com sucesso`);
    console.log(`Usando Makeup Atual da célula I3: ${makeupAtualHeader}`);
    console.log(`Usando Profit/Loss da célula J3: ${profitLossHeader}`);

    const data = {
      jogador: "Carlos Sbrissa",
      makeupAtual: makeupAtualHeader, // Usar I3
      profitBruto: profitLossHeader,  // Usar J3 (Profit/Loss)
      sessoes,
      totalSessoes: sessoes.length,
      ultimaAtualizacao: new Date().toISOString(),
    };

    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('Erro detalhado ao buscar dados do Google Sheets:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro ao buscar dados do Google Sheets',
        message: error.message,
        details: error.stack,
        dicas: [
          '1. Verifique se as variáveis de ambiente estão configuradas corretamente',
          '2. Certifique-se que a planilha foi compartilhada com o email da service account',
          '3. Confirme que a aba se chama exatamente "Sbrissa"',
          '4. Verifique se a chave privada está no formato correto (com \\n para quebras de linha)'
        ]
      },
      { status: 500 }
    );
  }
}