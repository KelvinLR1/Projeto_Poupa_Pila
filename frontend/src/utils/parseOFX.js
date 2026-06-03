/**
 * Parser de arquivos OFX (Open Financial Exchange)
 * Suporta o formato SGML (usado pela maioria dos bancos brasileiros:
 * Bradesco, Itaú, Banco do Brasil, Nubank, Santander, etc.)
 * e o formato XML (OFX 2.x)
 */

/**
 * Remove o cabeçalho de texto do OFX (linhas antes de <OFX>)
 * e retorna apenas o conteúdo SGML/XML.
 */
function stripOFXHeader(rawText) {
  // Normaliza quebras de linha
  const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const idx = text.indexOf('<OFX>');
  if (idx === -1) throw new Error('Arquivo OFX inválido: tag <OFX> não encontrada.');
  return text.substring(idx);
}

/**
 * Extrai o valor de uma tag SGML simples (sem filho).
 * Ex: <TRNAMT>-150.00  → "-150.00"
 */
function getTagValue(sgml, tag) {
  const regex = new RegExp(`<${tag}>([^<\n]*)`, 'i');
  const match = sgml.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Extrai todos os blocos de uma tag SGML composta.
 * Ex: todos os blocos <STMTTRN>...</STMTTRN>
 */
function getTagBlocks(sgml, tag) {
  const blocks = [];
  const openTag = `<${tag}>`;
  const closeTag = `</${tag}>`;
  let start = 0;
  while (true) {
    const begin = sgml.indexOf(openTag, start);
    if (begin === -1) break;
    const end = sgml.indexOf(closeTag, begin);
    if (end === -1) break;
    blocks.push(sgml.substring(begin + openTag.length, end));
    start = end + closeTag.length;
  }
  return blocks;
}

/**
 * Converte datas no formato OFX (20260601120000[-3:BRT] ou 20260601) 
 * para o formato ISO (YYYY-MM-DD).
 */
function parseOFXDate(dtStr) {
  if (!dtStr) return null;
  const clean = dtStr.substring(0, 8); // Pega apenas YYYYMMDD
  const year = clean.substring(0, 4);
  const month = clean.substring(4, 6);
  const day = clean.substring(6, 8);
  return `${year}-${month}-${day}`;
}

/**
 * Mapeia o tipo de transação OFX para o tipo do sistema.
 */
function mapTrnType(trnType) {
  const type = (trnType || '').toUpperCase();
  // Tipos que representam crédito (entrada de dinheiro)
  if (['CREDIT', 'DEP', 'INT', 'DIV', 'DIRECTDEP', 'XFER'].includes(type)) return 'income';
  // Tipos que representam débito (saída de dinheiro)
  return 'expense';
}

/**
 * Função principal: parseia o texto bruto de um arquivo OFX.
 * Retorna um objeto com as transações e o saldo disponível no arquivo.
 * 
 * @param {string} rawText - Conteúdo bruto do arquivo OFX
 * @returns {{ transactions: Array, balance: number|null, bankId: string|null }}
 */
export function parseOFX(rawText) {
  const sgml = stripOFXHeader(rawText);

  // Tenta extrair informações gerais
  const bankId = getTagValue(sgml, 'BANKID') || getTagValue(sgml, 'ORG') || 'Banco';
  const balanceStr = getTagValue(sgml, 'BALAMT');
  const balance = balanceStr ? parseFloat(balanceStr.replace(',', '.')) : null;

  // Extrai todos os blocos de transação
  const trnBlocks = getTagBlocks(sgml, 'STMTTRN');

  const transactions = trnBlocks.map((block) => {
    const amountStr = getTagValue(block, 'TRNAMT') || '0';
    const amount = parseFloat(amountStr.replace(',', '.'));
    const trnType = getTagValue(block, 'TRNTYPE') || '';

    // Se o valor é negativo, é despesa. Se positivo, é receita.
    // O TRNTYPE serve como fallback caso o valor seja 0.
    let type;
    if (amount < 0) {
      type = 'expense';
    } else if (amount > 0) {
      type = 'income';
    } else {
      type = mapTrnType(trnType);
    }

    return {
      fitId: getTagValue(block, 'FITID') || Math.random().toString(36).substr(2),
      type,
      amount: Math.abs(amount),
      description: getTagValue(block, 'MEMO') || getTagValue(block, 'NAME') || 'Sem descrição',
      date: parseOFXDate(getTagValue(block, 'DTPOSTED')),
      trnType: trnType.toUpperCase(),
      status: 'pending', // Todas as importadas iniciam como pendente de conciliação
    };
  });

  return { transactions, balance, bankId };
}
