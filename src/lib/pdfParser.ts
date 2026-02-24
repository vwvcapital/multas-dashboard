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
}

/**
 * Extrai texto de um arquivo PDF
 */
async function extrairTextoPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let textoCompleto = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    textoCompleto += pageText + '\n'
  }

  return textoCompleto
}

/**
 * UFs brasileiras válidas
 */
const UFS_VALIDAS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SE', 'SP', 'TO',
]

/**
 * Faz o parse do texto extraído do PDF e tenta encontrar os dados da multa.
 * Adaptado para PDFs de Notificação de Autuação do SENATRAN / órgãos de trânsito.
 */
function parsearDadosMulta(texto: string): DadosMultaPDF {
  const dados: DadosMultaPDF = {}

  // Normalizar espaços múltiplos
  const t = texto.replace(/\s+/g, ' ')

  // --- Auto de Infração ---
  // Padrões comuns: "Auto de Infração: XXXXX", "Nº Auto: XXXXX", "AIT: XXXXX"
  const autoPatterns = [
    /auto\s*(?:de)?\s*(?:infra[çc][ãa]o)\s*[:\-–]?\s*([A-Z0-9]{5,20})/i,
    /(?:n[ºo°]?\s*)?(?:auto|ait)\s*[:\-–]?\s*([A-Z0-9]{5,20})/i,
    /(?:AIT|auto)\s+([A-Z]{1,3}\d{5,})/i,
  ]
  for (const pattern of autoPatterns) {
    const match = t.match(pattern)
    if (match) {
      dados.Auto_Infracao = match[1].trim()
      break
    }
  }

  // --- Placa do Veículo ---
  // Formatos: ABC1234 ou ABC1D23 (Mercosul)
  const placaPatterns = [
    /(?:placa|ve[ií]culo)\s*[:\-–]?\s*([A-Z]{3}\s*[-]?\s*\d[A-Z0-9]\d{2})/i,
    /\b([A-Z]{3}\s*[-]?\s*\d[A-Z0-9]\d{2})\b/i,
  ]
  for (const pattern of placaPatterns) {
    const match = t.match(pattern)
    if (match) {
      dados.Veiculo = match[1].replace(/[\s-]/g, '').toUpperCase()
      break
    }
  }

  // --- Data do Cometimento ---
  const dataPatterns = [
    /(?:data\s*(?:da)?\s*(?:infra[çc][ãa]o|cometimento|ocorr[êe]ncia))\s*[:\-–]?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i,
    /(?:data)\s*[:\-–]?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i,
  ]
  for (const pattern of dataPatterns) {
    const match = t.match(pattern)
    if (match) {
      dados.Data_Cometimento = match[1].replace(/[\-\.]/g, '/')
      break
    }
  }

  // --- Hora do Cometimento ---
  const horaPatterns = [
    /(?:hora|hor[áa]rio)\s*(?:da\s*(?:infra[çc][ãa]o))?\s*[:\-–]?\s*(\d{2}[:\-]\d{2})/i,
    /(\d{2}:\d{2})\s*(?:h|hs|hrs)/i,
  ]
  for (const pattern of horaPatterns) {
    const match = t.match(pattern)
    if (match) {
      dados.Hora_Cometimento = match[1].replace('-', ':')
      break
    }
  }

  // --- Código da Infração ---
  const codigoPatterns = [
    /(?:c[óo]d(?:igo)?\.?\s*(?:da)?\s*(?:infra[çc][ãa]o)?|enquadramento|amparo\s*legal)\s*[:\-–]?\s*(\d{3,5}(?:\s*[-\/]\s*\d{1,2})?)/i,
    /(?:art(?:igo)?\.?\s*\d+|infra[çc][ãa]o)\s*[:\-–]?\s*(\d{3,5})/i,
  ]
  for (const pattern of codigoPatterns) {
    const match = t.match(pattern)
    if (match) {
      // Pegar apenas os dígitos principais
      dados.Codigo_Infracao = match[1].replace(/\D/g, '').slice(0, 5)
      break
    }
  }

  // --- Descrição da Infração ---
  const descPatterns = [
    /(?:descri[çc][ãa]o\s*(?:da)?\s*(?:infra[çc][ãa]o)?)\s*[:\-–]?\s*(.{10,200}?)(?=\s*(?:local|valor|c[óo]d|enquadramento|amparo|medida|observ|penalidade|artigo|art\.))/i,
    /(?:infra[çc][ãa]o\s*cometida)\s*[:\-–]?\s*(.{10,200}?)(?=\s*(?:local|valor|c[óo]d|enquadramento))/i,
  ]
  for (const pattern of descPatterns) {
    const match = t.match(pattern)
    if (match) {
      dados.Descricao = match[1].trim()
      break
    }
  }

  // --- Valor da Multa ---
  const valorPatterns = [
    /(?:valor\s*(?:da)?\s*(?:multa|infra[çc][ãa]o|auto)?)\s*[:\-–]?\s*R?\$?\s*([\d.,]+)/i,
    /R\$\s*([\d.,]+)/i,
  ]
  for (const pattern of valorPatterns) {
    const match = t.match(pattern)
    if (match) {
      // Formatar como "R$ xxx,xx"
      let valor = match[1].trim()
      // Se tem ponto como milhar e vírgula como decimal: 1.234,56
      if (valor.includes('.') && valor.includes(',')) {
        // Já formatado
      } else if (valor.includes(',')) {
        // Apenas vírgula decimal: 234,56
      } else if (valor.includes('.')) {
        // Ponto como decimal (raro em PT-BR, mas possível)
        valor = valor.replace('.', ',')
      }
      dados.Valor = `R$ ${valor}`
      break
    }
  }

  // --- Estado / UF ---
  const ufPatterns = [
    /(?:UF|estado|unidade\s*federativa)\s*[:\-–]?\s*([A-Z]{2})\b/i,
    /\b([A-Z]{2})\s*[-–]\s*\d{3,}/,
  ]
  for (const pattern of ufPatterns) {
    const match = t.match(pattern)
    if (match) {
      const uf = match[1].toUpperCase()
      if (UFS_VALIDAS.includes(uf)) {
        dados.Estado = uf
        break
      }
    }
  }

  // Se não encontrou UF nos padrões acima, procura menção no texto
  if (!dados.Estado) {
    for (const uf of UFS_VALIDAS) {
      const ufRegex = new RegExp(`\\b${uf}\\b`)
      if (ufRegex.test(t)) {
        dados.Estado = uf
        break
      }
    }
  }

  return dados
}

/**
 * Função principal: recebe um arquivo PDF e retorna os dados extraídos
 */
export async function extrairDadosMultaPDF(file: File): Promise<DadosMultaPDF> {
  const texto = await extrairTextoPDF(file)
  console.log('[PDF Parser] Texto extraído:', texto)
  return parsearDadosMulta(texto)
}
