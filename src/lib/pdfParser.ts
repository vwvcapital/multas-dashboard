import * as pdfjsLib from 'pdfjs-dist'

// Configure the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString()

export interface DadosMultaPDF {
  Auto_Infracao?: string
  Veiculo?: string
  Data_Cometimento?: string
  Hora_Cometimento?: string
  Descricao?: string
  Codigo_Infracao?: string
  Valor?: string
  Estado?: string
  Motorista?: string
  Expiracao_Indicacao?: string
}

/**
 * Extrai os itens de texto do PDF como array de strings (cada item de texto separado).
 * PDFs do SENATRAN possuem labels e valores em itens separados, então
 * a busca é feita por label → próximo item com conteúdo = valor.
 */
async function extrairItensPDF(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const allItems: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    for (const item of textContent.items) {
      if ('str' in item) {
        allItems.push(item.str)
      }
    }
  }

  return allItems
}

/**
 * Dado um array de itens de texto, encontra o valor que vem logo após o label informado.
 * Pula itens vazios entre o label e o valor.
 * Se `multiLine` for true, concatena linhas subsequentes não-vazias (para descrições longas).
 */
function encontrarValorAposLabel(
  items: string[],
  labelPattern: RegExp,
  options: { multiLine?: boolean; stopPatterns?: RegExp[] } = {}
): string | undefined {
  for (let i = 0; i < items.length; i++) {
    if (labelPattern.test(items[i])) {
      // Encontrou o label, agora pega o próximo item não-vazio
      let j = i + 1
      while (j < items.length && items[j].trim() === '') {
        j++
      }
      if (j >= items.length) return undefined

      if (options.multiLine) {
        // Concatena linhas até encontrar um stop pattern ou item vazio longo
        const lines: string[] = []
        while (j < items.length) {
          const val = items[j].trim()
          if (!val) break
          // Verifica se é um novo label (stop pattern)
          if (options.stopPatterns?.some(p => p.test(val))) break
          lines.push(val)
          j++
        }
        return lines.join(' ').trim() || undefined
      }

      return items[j].trim() || undefined
    }
  }
  return undefined
}

/**
 * Faz o parse dos itens de texto do PDF do SENATRAN.
 * Estrutura real: labels em um item, valores no item seguinte.
 *
 * Exemplo de sequência de itens:
 *   "IDENTIFICAÇÃO DO AUTO DE INFRAÇÃO (Número do AIT)"
 *   "N003735317"
 *   "PLACA"
 *   "SCA2D30"
 *   "DATA"
 *   "18/02/2026"
 *   "HORA"
 *   "06:23"
 *   etc.
 */
function parsearDadosMulta(items: string[]): DadosMultaPDF {
  const dados: DadosMultaPDF = {}

  // Stop patterns comuns (labels que indicam início de outro campo)
  const stopLabels = [
    /^MEDI[CÇ][AÃ]O\s*REALIZADA/i,
    /^VALOR\s*CONSIDERADO/i,
    /^LIMITE\s*REGULAMENTADO/i,
    /^N[UÚ]MERO\s*RENAINF/i,
    /^OBSERVA[CÇ][OÕ]ES/i,
    /^LOCAL/i,
    /^IDENTIFICA[CÇ][AÃ]O/i,
  ]

  // --- Auto de Infração (Número do AIT) ---
  dados.Auto_Infracao = encontrarValorAposLabel(
    items,
    /IDENTIFICA[CÇ][AÃ]O\s*DO\s*AUTO\s*DE\s*INFRA[CÇ][AÃ]O/i
  )

  // --- Placa ---
  dados.Veiculo = encontrarValorAposLabel(items, /^PLACA$/i)

  // --- Data do cometimento (na seção LOCAL, DATA E HORA) ---
  // Procuro especificamente o "DATA" que vem depois de "LOCAL DA INFRAÇÃO"
  // Para evitar pegar outras datas (notificação, limite defesa, etc.)
  const localIdx = items.findIndex(it => /LOCAL\s*DA\s*INFRA[CÇ][AÃ]O/i.test(it))
  if (localIdx >= 0) {
    // Dentro da seção de local, procura DATA e HORA
    for (let i = localIdx; i < Math.min(localIdx + 20, items.length); i++) {
      if (/^DATA$/i.test(items[i].trim())) {
        // Próximo item não-vazio é o valor
        let j = i + 1
        while (j < items.length && items[j].trim() === '') j++
        if (j < items.length && /\d{2}\/\d{2}\/\d{4}/.test(items[j])) {
          dados.Data_Cometimento = items[j].trim()
        }
      }
      if (/^HORA$/i.test(items[i].trim())) {
        let j = i + 1
        while (j < items.length && items[j].trim() === '') j++
        if (j < items.length && /\d{2}:\d{2}/.test(items[j])) {
          dados.Hora_Cometimento = items[j].trim()
        }
      }
    }
  }

  // --- Código da Infração ---
  dados.Codigo_Infracao = encontrarValorAposLabel(
    items,
    /^C[OÓ]DIGO\s*DA\s*INFRA[CÇ][AÃ]O$/i
  )

  // --- Valor da Multa ---
  const valorRaw = encontrarValorAposLabel(items, /^VALOR\s*DA\s*MULTA$/i)
  if (valorRaw) {
    dados.Valor = valorRaw
  }

  // --- Descrição da Infração (pode ocupar múltiplas linhas) ---
  const descricao = encontrarValorAposLabel(
    items,
    /^DESCRI[CÇ][AÃ]O\s*DA\s*INFRA[CÇ][AÃ]O$/i,
    { multiLine: true, stopPatterns: stopLabels }
  )
  if (descricao) {
    dados.Descricao = descricao
  }

  // --- UF (na seção de local da infração) ---
  // Procura "UF" após a seção de local
  if (localIdx >= 0) {
    for (let i = localIdx; i < Math.min(localIdx + 30, items.length); i++) {
      if (/^UF$/i.test(items[i].trim())) {
        let j = i + 1
        while (j < items.length && items[j].trim() === '') j++
        if (j < items.length) {
          const uf = items[j].trim().toUpperCase()
          if (/^[A-Z]{2}$/.test(uf)) {
            dados.Estado = uf
          }
        }
        break
      }
    }
  }

  // Fallback UF: tenta extrair do LOCAL DA INFRAÇÃO (ex: "MT - BR 158 - KM 571.00")
  if (!dados.Estado) {
    const localVal = encontrarValorAposLabel(items, /^LOCAL\s*DA\s*INFRA[CÇ][AÃ]O$/i)
    if (localVal) {
      const ufMatch = localVal.match(/^([A-Z]{2})\s*[-–]/)
      if (ufMatch) {
        dados.Estado = ufMatch[1]
      }
    }
  }

  // --- Motorista / Condutor ---
  // Na seção IDENTIFICAÇÃO DO CONDUTOR, procura NOME
  const condutorIdx = items.findIndex(it => /IDENTIFICA[CÇ][AÃ]O\s*DO\s*CONDUTOR/i.test(it))
  if (condutorIdx >= 0) {
    for (let i = condutorIdx; i < Math.min(condutorIdx + 10, items.length); i++) {
      if (/^NOME$/i.test(items[i].trim())) {
        let j = i + 1
        while (j < items.length && items[j].trim() === '') j++
        if (j < items.length) {
          const nome = items[j].trim()
          if (nome && !/n[ãa]o\s*dispon[ií]vel/i.test(nome)) {
            dados.Motorista = nome
          }
        }
        break
      }
    }
  }

  // --- Data limite para indicação do condutor infrator ---
  dados.Expiracao_Indicacao = encontrarValorAposLabel(
    items,
    /DATA\s*LIMITE\s*PARA\s*IDENTIFICA[CÇ][AÃ]O\s*DO\s*CONDUTOR/i
  )

  // --- Observações: pode conter descrição complementar ---
  // As observações no PDF do SENATRAN muitas vezes trazem detalhes extras da infração
  // Se a descrição parecer incompleta, complementamos com as observações
  const obsIdx = items.findIndex(it => /^OBSERVA[CÇ][OÕ]ES$/i.test(it.trim()))
  if (obsIdx >= 0) {
    const obsLines: string[] = []
    let j = obsIdx + 1
    while (j < items.length) {
      const val = items[j].trim()
      if (!val) break
      // Parar se encontrar outro label de seção
      if (/^EMBARCADOR|^IDENTIFICA[CÇ][AÃ]O|^N[UÚ]MERO|^REGISTRO/i.test(val)) break
      obsLines.push(val)
      j++
    }
    if (obsLines.length > 0 && dados.Descricao) {
      dados.Descricao = dados.Descricao + ' - ' + obsLines.join(' ')
    }
  }

  return dados
}

/**
 * Função principal: recebe um arquivo PDF e retorna os dados extraídos.
 * Otimizado para PDFs de Notificação de Autuação do SENATRAN.
 */
export async function extrairDadosMultaPDF(file: File): Promise<DadosMultaPDF> {
  const items = await extrairItensPDF(file)
  console.log('[PDF Parser] Itens extraídos:', items.filter(i => i.trim()))
  const dados = parsearDadosMulta(items)
  console.log('[PDF Parser] Dados parseados:', dados)
  return dados
}
