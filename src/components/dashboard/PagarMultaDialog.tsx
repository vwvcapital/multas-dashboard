import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Multa } from '@/lib/supabase'
import { X, CheckCircle, Loader2, Link, AlertTriangle } from 'lucide-react'

interface PagarMultaDialogProps {
  multa: Multa
  onClose: () => void
  onConfirm: (multa: Multa, comprovante: string) => Promise<void>
}

export function PagarMultaDialog({ multa, onClose, onConfirm }: PagarMultaDialogProps) {
  const [comprovante, setComprovante] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!comprovante.trim()) {
      setError('O link do comprovante é obrigatório')
      return
    }

    // Validação básica de URL
    try {
      new URL(comprovante)
    } catch {
      setError('Por favor, insira um link válido')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onConfirm(multa, comprovante.trim())
      onClose()
    } catch (err) {
      console.error('Error marking as paid:', err)
      setError('Erro ao registrar pagamento. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Handle click on backdrop to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in-0 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-md shadow-2xl border-0 animate-in zoom-in-95 slide-in-from-bottom-4 my-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-3 text-emerald-600">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100">
              <CheckCircle className="h-5 w-5" />
            </div>
            Registrar Pagamento
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={loading} className="rounded-xl">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Informações da Multa */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Auto de Infração:</span>
                <span className="font-mono font-medium text-slate-700">{multa.Auto_Infracao}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Veículo:</span>
                <span className="font-semibold text-blue-600">{multa.Veiculo}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Motorista:</span>
                <span className="text-slate-700">{multa.Motorista}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Valor Boleto:</span>
                <span className="font-bold text-emerald-600">{multa.Valor_Boleto}</span>
              </div>
            </div>

            {/* Campo do Comprovante */}
            <div className="space-y-2">
              <label htmlFor="comprovante" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Link className="h-4 w-4" />
                Link do Comprovante de Pagamento *
              </label>
              <Input
                id="comprovante"
                type="url"
                placeholder="https://drive.google.com/..."
                value={comprovante}
                onChange={(e) => setComprovante(e.target.value)}
                disabled={loading}
                className="w-full"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Insira o link do arquivo do comprovante (Google Drive, Dropbox, etc.)
              </p>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !comprovante.trim()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar Pagamento
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
