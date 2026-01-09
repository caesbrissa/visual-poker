import pandas as pd
import json
import re
from datetime import datetime

def limpar_valor(valor):
    """Converte valores para float"""
    if pd.isna(valor) or valor == "" or valor == 0:
        return 0.0
    try:
        return float(valor)
    except:
        s = str(valor).strip()
        s = re.sub(r'[^\d,.\-]', '', s)
        s = s.replace(',', '.')
        try:
            return float(s)
        except:
            return 0.0

def processar_excel():
    try:
        print("=" * 70)
        print("📊 PROCESSADOR DE DADOS POKER - ESTRUTURA DETECTADA")
        print("=" * 70)
        
        arquivo = 'Planilha1.xlsx'
        print(f"\n📂 Lendo: {arquivo}")
        
        # Lê o Excel completo
        df_completo = pd.read_excel(arquivo, sheet_name=0, header=None)
        
        # Nome do jogador está na linha 3, coluna A
        nome = str(df_completo.iloc[2, 0]).strip()
        print(f"👤 Jogador: {nome}")
        
        # Makeup Atual está na célula I3 (linha 2, coluna 8)
        makeup_atual = limpar_valor(df_completo.iloc[2, 8])
        print(f"💰 Makeup Atual (I3): R$ {makeup_atual:,.2f}")
        
        # Os dados começam na linha 8 (índice 7)
        # Estrutura baseada no print:
        # Coluna A (0) = Data
        # Coluna B (1) = MakeUp Inicial
        # Coluna C (2) = Ganhos/Perdas
        # Coluna D (3) = Qtd. de Jogos Semanais
        # Coluna E (4) = Presença Aula Semanal
        # Coluna F (5) = Rake Gerado
        # Coluna I (8) = Saldo MakeUp
        
        print(f"\n📋 ESTRUTURA DA PLANILHA:")
        print(f"   Coluna A (0) → Data")
        print(f"   Coluna C (2) → Ganhos/Perdas")
        print(f"   Coluna D (3) → Qtd. de Jogos")
        print(f"   Coluna F (5) → Rake Gerado")
        print(f"   Coluna I (8) → Saldo MakeUp")
        
        # Lê os dados a partir da linha 8 (índice 7)
        df = pd.read_excel(arquivo, sheet_name=0, skiprows=7, header=None)
        
        print(f"\n🔄 Processando sessões...")
        
        sessoes = []
        linhas_validas = 0
        
        for idx, row in df.iterrows():
            # Coluna 0 = Data
            data_valor = row[0]
            
            if pd.isna(data_valor):
                continue
            
            # Converte data
            try:
                if isinstance(data_valor, datetime):
                    data = data_valor.strftime('%d/%m/%Y')
                else:
                    data_str = str(data_valor).strip()
                    if not re.match(r'\d{2}/\d{2}/\d{4}', data_str):
                        continue
                    data = data_str
            except:
                continue
            
            # Extrai valores das colunas corretas
            ganhos = limpar_valor(row[2])   # Coluna C
            jogos = int(limpar_valor(row[3]))   # Coluna D
            rake = limpar_valor(row[5])     # Coluna F
            saldo = limpar_valor(row[8])    # Coluna I
            
            sessoes.append({
                "Data": data,
                "Ganhos": ganhos,
                "Jogos": jogos,
                "Rake": rake,
                "Saldo": saldo
            })
            
            linhas_validas += 1
            
            # Debug primeiras 5 linhas
            if linhas_validas <= 5:
                print(f"\n  📅 Sessão {linhas_validas}: {data}")
                print(f"     💰 Ganhos: R$ {ganhos:,.2f}")
                print(f"     🎮 Jogos: {jogos}")
                print(f"     💸 Rake: R$ {rake:,.2f}")
                print(f"     📊 Saldo: R$ {saldo:,.2f}")
        
        if len(sessoes) == 0:
            raise Exception("Nenhuma sessão válida encontrada!")
        
        # Calcula totais
        total_ganhos = sum(s['Ganhos'] for s in sessoes)
        total_jogos = sum(s['Jogos'] for s in sessoes)
        total_rake = sum(s['Rake'] for s in sessoes)
        # Usa o Makeup Atual da célula I3 ao invés da última sessão
        saldo_final = makeup_atual
        
        print("\n" + "=" * 70)
        print("✅ PROCESSAMENTO CONCLUÍDO COM SUCESSO!")
        print("=" * 70)
        print(f"\n📊 RESUMO FINAL:")
        print(f"   • Total de Sessões: {len(sessoes)}")
        print(f"   • Profit Bruto: R$ {total_ganhos:,.2f}")
        print(f"   • Total de Jogos: {total_jogos:,}")
        print(f"   • Rake Total: R$ {total_rake:,.2f}")
        print(f"   • Makeup Atual: R$ {saldo_final:,.2f}")
        
        # Estatísticas extras
        sessoes_positivas = len([s for s in sessoes if s['Ganhos'] > 0])
        win_rate = (sessoes_positivas / len(sessoes) * 100) if sessoes else 0
        
        print(f"\n📈 ESTATÍSTICAS:")
        print(f"   • Sessões Positivas: {sessoes_positivas} ({win_rate:.1f}%)")
        print(f"   • Média por Jogo: R$ {(total_ganhos / total_jogos if total_jogos > 0 else 0):,.2f}")
        print(f"   • Média por Sessão: R$ {(total_ganhos / len(sessoes)):,.2f}")
        
        # Validação
        print(f"\n🔍 VALIDAÇÃO DOS DADOS:")
        
        erros = []
        
        if total_jogos == 0:
            erros.append("   ❌ Total de Jogos = 0 (coluna pode estar errada)")
        else:
            print(f"   ✅ Total de Jogos: {total_jogos:,} (OK!)")
            
        if total_rake < 100:
            erros.append("   ❌ Rake muito baixo (coluna pode estar errada)")
        else:
            print(f"   ✅ Rake Total: R$ {total_rake:,.2f} (OK!)")
            
        if abs(total_ganhos) > 1000000:
            erros.append("   ❌ Profit muito alto (verifique os valores)")
        else:
            print(f"   ✅ Profit: R$ {total_ganhos:,.2f} (OK!)")
        
        if erros:
            print("\n⚠️  AVISOS:")
            for erro in erros:
                print(erro)
        
        print("=" * 70)
        
        # Pergunta se quer salvar
        resposta = input("\n💾 Os dados estão corretos? Salvar data.json? (s/n): ")
        
        if resposta.lower() == 's':
            output = {
                "jogador": nome,
                "makeupAtual": makeup_atual,  # Adiciona o makeup correto
                "sessoes": sessoes
            }
            
            # Salva na pasta app/
            caminho = 'app/data.json'
            with open(caminho, 'w', encoding='utf-8') as f:
                json.dump(output, f, indent=2, ensure_ascii=False)
            
            print(f"\n✅ Arquivo '{caminho}' criado com sucesso!")
            print("\n🚀 Próximo passo:")
            print("   Execute: npm run dev")
            print("\n   Depois acesse: http://localhost:3000")
        else:
            print("\n❌ Processamento cancelado.")
            print("   Se os valores estão errados, me avise!")
        
        print("=" * 70 + "\n")
        
    except FileNotFoundError:
        print("\n❌ ERRO: Arquivo 'Planilha1.xlsx' não encontrado!")
        print("   Certifique-se de que está na pasta correta:")
        print("   C:\\Users\\Poker-PC\\Desktop\\visual-poker\\")
    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Instala openpyxl se necessário
    try:
        import openpyxl
    except ImportError:
        print("📦 Instalando biblioteca openpyxl...")
        import subprocess
        subprocess.check_call(['pip', 'install', 'openpyxl'])
        print("✅ openpyxl instalado com sucesso!\n")
    
    processar_excel()