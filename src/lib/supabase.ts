import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipo baseado na estrutura real da tabela Multas
export type Multa = {
  id: number
  Auto_Infracao: string
  Veiculo: string
  Motorista: string
  Data_Cometimento: string
  Hora_Cometimento: string
  Descricao: string
  Codigo_Infracao: number
  Valor: string
  Valor_Boleto: string
  Estado: string
  Status_Boleto: string
  Boleto: string
  Consulta: string
  Expiracao_Boleto: string
  Resposabilidade: string
  Notas: string
}
