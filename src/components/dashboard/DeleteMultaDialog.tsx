import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase, type Multa } from '@/lib/supabase'
import { X, Trash2, Loader2, AlertTriangle } from 'lucide-react'

interface DeleteMultaDialogProps {
  multa: Multa
  onClose: () => void
  onSuccess: () => void
}

export function DeleteMultaDialog({ multa, onClose, onSuccess }: DeleteMultaDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error: supabaseError } = await supabase
        .from('Multas')
        .delete()
        .eq('id', multa.id)

      if (supabaseError) {
        throw supabaseError
      }

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error deleting multa:', err)
      setError('Erro ao excluir multa. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Handle click on backdrop to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
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
          <CardTitle className="flex items-center gap-3 text-red-600">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100">
              <AlertTriangle className="h-5 w-5" />
            </div>
            Confirmar Exclusão
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir esta multa? Esta ação não pode ser desfeita.
          </p>

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
              <span className="text-muted-foreground">Valor:</span>
              <span className="font-medium text-slate-700">{multa.Valor}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Multa
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
