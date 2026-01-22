import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('=== DIAGNÓSTICO GOOGLE SHEETS ===');
    
    // 1. Verificar variáveis de ambiente
    console.log('1. Verificando variáveis de ambiente...');
    const hasEmail = !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const hasKey = !!process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    const hasId = !!process.env.GOOGLE_SPREADSHEET_ID;
    
    console.log(`   - CLIENT_EMAIL: ${hasEmail ? '✓ Configurado' : '✗ Faltando'}`);
    console.log(`   - PRIVATE_KEY: ${hasKey ? '✓ Configurado' : '✗ Faltando'}`);
    console.log(`   - SPREADSHEET_ID: ${hasId ? '✓ Configurado' : '✗ Faltando'}`);
    
    if (!hasEmail || !hasKey || !hasId) {
      return NextResponse.json({
        error: 'Credenciais incompletas',
        hasEmail,
        hasKey,
        hasId,
      });
    }

    // 2. Processar chave privada
    console.log('2. Processando chave privada...');
    let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY!;
    
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    privateKey = privateKey.trim().replace(/^["']|["']$/g, '');
    
    const keyStart = privateKey.substring(0, 50);
    console.log(`   - Início da chave: ${keyStart}...`);

    // 3. Autenticar
    console.log('3. Autenticando com Google...');
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    console.log(`   - Spreadsheet ID: ${spreadsheetId}`);
    console.log(`   - Email usado: ${process.env.GOOGLE_SHEETS_CLIENT_EMAIL}`);

    // 4. Buscar informações da planilha
    console.log('4. Buscando informações da planilha...');
    
    try {
      const metadata = await sheets.spreadsheets.get({
        spreadsheetId,
      });

      console.log(`   - Título da planilha: ${metadata.data.properties?.title}`);
      console.log(`   - Número de abas: ${metadata.data.sheets?.length}`);
      
      const sheetNames = metadata.data.sheets?.map(s => s.properties?.title) || [];
      console.log(`   - Nomes das abas: ${sheetNames.join(', ')}`);

      // 5. Testar leitura de cada aba
      console.log('5. Testando leitura das abas...');
      const testeAbas: any = {};
      
      for (const sheetName of sheetNames) {
        try {
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A1:J10`,
          });
          
          const rowCount = response.data.values?.length || 0;
          testeAbas[sheetName!] = {
            status: 'OK',
            linhas: rowCount,
            primeirasLinhas: response.data.values?.slice(0, 3),
          };
          console.log(`   - ${sheetName}: ✓ ${rowCount} linhas`);
        } catch (err: any) {
          testeAbas[sheetName!] = {
            status: 'ERRO',
            erro: err.message,
          };
          console.log(`   - ${sheetName}: ✗ ${err.message}`);
        }
      }

      return NextResponse.json({
        status: 'Sucesso! ✓',
        planilha: {
          titulo: metadata.data.properties?.title,
          url: metadata.data.spreadsheetUrl,
          abas: sheetNames,
        },
        testeAbas,
        instrucoes: {
          proximoPasso: 'Se você vê isso, a autenticação está funcionando!',
          abaCorreta: sheetNames.find(name => 
            name?.toLowerCase().includes('sbrissa') || 
            name?.toLowerCase().includes('brissa')
          ) || sheetNames[0],
        }
      });

    } catch (err: any) {
      console.error('Erro ao acessar planilha:', err);
      
      if (err.code === 404) {
        return NextResponse.json({
          error: 'Planilha não encontrada (404)',
          possiveisCausas: [
            '1. O ID da planilha está incorreto',
            '2. A planilha NÃO foi compartilhada com o service account email',
            '3. O email usado foi: ' + process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
          ],
          acao: `Vá na planilha e compartilhe com: ${process.env.GOOGLE_SHEETS_CLIENT_EMAIL}`,
          spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
        }, { status: 404 });
      }

      return NextResponse.json({
        error: 'Erro ao acessar planilha',
        code: err.code,
        message: err.message,
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Erro geral:', error);
    return NextResponse.json({
      error: 'Erro geral no diagnóstico',
      message: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}