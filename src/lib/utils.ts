import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date))
}

/**
 * Calcula automaticamente o Status_Boleto baseado nas regras:
 * - Concluído: quando finalizado (empresa paga ou RH descontou do motorista)
 * - Pago: quando marcado como pago (aguardando RH para motorista)
 * - Vencido: quando passa da data de vencimento e não foi pago
 * - Disponível: quando o link do boleto foi informado
 * - Pendente: quando não tem link do boleto
 */
export function calcularStatusBoleto(params: {
  pago: boolean
  concluido: boolean
  linkBoleto: string
  dataVencimento: string
}): 'Pendente' | 'Disponível' | 'Pago' | 'Vencido' | 'Concluído' {
  const { pago, concluido, linkBoleto, dataVencimento } = params

  // Se foi marcado como concluído, retorna Concluído
  if (concluido) {
    return 'Concluído'
  }

  // Se foi marcado como pago, retorna Pago
  if (pago) {
    return 'Pago'
  }

  // Se tem data de vencimento, verifica se está vencido
  if (dataVencimento && dataVencimento.trim() !== '') {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    // Tenta parsear a data no formato DD/MM/AAAA
    const partes = dataVencimento.split('/')
    if (partes.length === 3) {
      const [dia, mes, ano] = partes.map(p => parseInt(p, 10))
      const dataVenc = new Date(ano, mes - 1, dia)
      dataVenc.setHours(0, 0, 0, 0)
      
      if (dataVenc < hoje) {
        return 'Vencido'
      }
    }
  }

  // Se tem link do boleto, está disponível
  if (linkBoleto && linkBoleto.trim() !== '') {
    return 'Disponível'
  }

  // Caso contrário, pendente
  return 'Pendente'
}
