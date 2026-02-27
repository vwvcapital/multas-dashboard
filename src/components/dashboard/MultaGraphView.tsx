import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import type { Multa } from '@/lib/supabase'
import { Search, ZoomIn, ZoomOut, Maximize2, X, Eye, Pencil } from 'lucide-react'

// ───────── Tipos ─────────

interface GraphNode {
  id: string
  label: string
  type: 'multa' | 'motorista' | 'veiculo' | 'descricao' | 'estado'
  multa?: Multa
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  connections: number
}

interface GraphEdge {
  source: string
  target: string
  attribute: string
}

// ───────── Cores e helpers ─────────

const TYPE_COLORS: Record<string, string> = {
  multa: '#64748b',
  motorista: '#3b82f6',
  veiculo: '#10b981',
  descricao: '#f59e0b',
  estado: '#8b5cf6',
}

const TYPE_LABELS: Record<string, string> = {
  motorista: 'Motorista',
  veiculo: 'Veículo',
  descricao: 'Descrição',
  estado: 'Estado',
}

type GroupBy = 'motorista' | 'veiculo' | 'descricao' | 'estado'

function getAttrValue(multa: Multa, group: GroupBy): string {
  switch (group) {
    case 'motorista': return (multa.Motorista || '').trim()
    case 'veiculo': return (multa.Veiculo || '').trim()
    case 'descricao': return (multa.Descricao || '').trim()
    case 'estado': return (multa.Estado || '').trim()
  }
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val))
}

// ───────── Construir grafo ─────────

function buildGraph(multas: Multa[], groupBy: GroupBy, searchTerm: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const nodeMap = new Map<string, GraphNode>()
  const attrCounts = new Map<string, number>()
  const term = searchTerm.trim().toLowerCase()

  // Contar quantas multas cada atributo tem
  for (const m of multas) {
    const val = getAttrValue(m, groupBy)
    if (val) attrCounts.set(val, (attrCounts.get(val) || 0) + 1)
  }

  // Criar nós de atributo (somente com ≥ 1 multa)
  for (const [attr, count] of attrCounts) {
    if (count < 1) continue
    const id = `attr:${attr}`
    const node: GraphNode = {
      id,
      label: attr,
      type: groupBy,
      x: Math.random() * 800 - 400,
      y: Math.random() * 600 - 300,
      vx: 0, vy: 0,
      radius: clamp(12 + count * 3, 14, 40),
      color: TYPE_COLORS[groupBy],
      connections: count,
    }
    nodeMap.set(id, node)
    nodes.push(node)
  }

  // Criar nós de multa e edges
  for (const m of multas) {
    const val = getAttrValue(m, groupBy)
    if (!val) continue
    const attrId = `attr:${val}`
    if (!nodeMap.has(attrId)) continue

    const mId = `multa:${m.id}`
    const multaLabel = `${m.Veiculo || ''} • ${m.Auto_Infracao || ''}`

    const multaNode: GraphNode = {
      id: mId,
      label: multaLabel,
      type: 'multa',
      multa: m,
      x: (nodeMap.get(attrId)!.x) + (Math.random() - 0.5) * 200,
      y: (nodeMap.get(attrId)!.y) + (Math.random() - 0.5) * 200,
      vx: 0, vy: 0,
      radius: 6,
      color: statusColor(m.Status_Boleto),
      connections: 1,
    }
    nodeMap.set(mId, multaNode)
    nodes.push(multaNode)
    edges.push({ source: mId, target: attrId, attribute: groupBy })
  }

  // Filtrar pela pesquisa
  if (term) {
    const matchingIds = new Set<string>()
    for (const n of nodes) {
      if (n.label.toLowerCase().includes(term)) {
        matchingIds.add(n.id)
      }
    }
    // Incluir vizinhos
    for (const e of edges) {
      if (matchingIds.has(e.source)) matchingIds.add(e.target)
      if (matchingIds.has(e.target)) matchingIds.add(e.source)
    }
    const filteredNodes = nodes.filter(n => matchingIds.has(n.id))
    const filteredEdges = edges.filter(e => matchingIds.has(e.source) && matchingIds.has(e.target))
    return { nodes: filteredNodes, edges: filteredEdges }
  }

  return { nodes, edges }
}

function statusColor(status: string): string {
  switch (status) {
    case 'Vencido': return '#ef4444'
    case 'Pendente': return '#f59e0b'
    case 'Disponível': return '#3b82f6'
    case 'Concluído': return '#10b981'
    default: return '#94a3b8'
  }
}

// ───────── Simulação de forças ─────────

const SIMULATION_STEPS = 300
const ALPHA_DECAY = 0.98

function simulate(nodes: GraphNode[], edges: GraphEdge[], _width: number, _height: number) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  let alpha = 1

  for (let step = 0; step < SIMULATION_STEPS; step++) {
    alpha *= ALPHA_DECAY
    if (alpha < 0.001) break

    // Repulsão entre todos os nós
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j]
        let dx = b.x - a.x
        let dy = b.y - a.y
        let dist = Math.sqrt(dx * dx + dy * dy) || 1
        const repulse = (300 * alpha) / dist
        const fx = (dx / dist) * repulse
        const fy = (dy / dist) * repulse
        a.vx -= fx; a.vy -= fy
        b.vx += fx; b.vy += fy
      }
    }

    // Atração das arestas
    for (const e of edges) {
      const a = nodeMap.get(e.source)
      const b = nodeMap.get(e.target)
      if (!a || !b) continue
      let dx = b.x - a.x
      let dy = b.y - a.y
      let dist = Math.sqrt(dx * dx + dy * dy) || 1
      const attract = (dist - 80) * 0.02 * alpha
      const fx = (dx / dist) * attract
      const fy = (dy / dist) * attract
      a.vx += fx; a.vy += fy
      b.vx -= fx; b.vy -= fy
    }

    // Centralização suave
    for (const n of nodes) {
      n.vx -= n.x * 0.001 * alpha
      n.vy -= n.y * 0.001 * alpha
    }

    // Aplicar velocidades com damping
    for (const n of nodes) {
      n.vx *= 0.8
      n.vy *= 0.8
      n.x += n.vx
      n.y += n.vy
    }
  }
}

// ───────── Componente principal ─────────

interface MultaGraphViewProps {
  multas: Multa[]
  onViewDetails?: (multa: Multa) => void
  onEdit?: (multa: Multa) => void
}

export function MultaGraphView({ multas, onViewDetails, onEdit }: MultaGraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [groupBy, setGroupBy] = useState<GroupBy>('motorista')
  const [searchTerm, setSearchTerm] = useState('')
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 })

  // Estados de drag
  const isPanning = useRef(false)
  const panStart = useRef({ x: 0, y: 0 })
  const offsetStart = useRef({ x: 0, y: 0 })

  const graph = useMemo(() => {
    const g = buildGraph(multas, groupBy, searchTerm)
    simulate(g.nodes, g.edges, canvasSize.w, canvasSize.h)
    return g
  }, [multas, groupBy, searchTerm, canvasSize.w, canvasSize.h])

  // Resize observer
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        setCanvasSize({ w: e.contentRect.width, h: e.contentRect.height })
      }
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  // Centralize at start
  useEffect(() => {
    setOffset({ x: canvasSize.w / 2, y: canvasSize.h / 2 })
    setZoom(1)
  }, [graph, canvasSize.w, canvasSize.h])

  // Draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = canvasSize.w * dpr
    canvas.height = canvasSize.h * dpr
    canvas.style.width = `${canvasSize.w}px`
    canvas.style.height = `${canvasSize.h}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Fundo
    const isDark = document.documentElement.classList.contains('dark')
    ctx.fillStyle = isDark ? '#0a0a0a' : '#f8fafc'
    ctx.fillRect(0, 0, canvasSize.w, canvasSize.h)

    ctx.save()
    ctx.translate(offset.x, offset.y)
    ctx.scale(zoom, zoom)

    const nodeMap = new Map<string, GraphNode>(graph.nodes.map((n: GraphNode) => [n.id, n]))

    // Edges
    for (const e of graph.edges) {
      const a = nodeMap.get(e.source)
      const b = nodeMap.get(e.target)
      if (!a || !b) continue

      const isHighlighted = hoveredNode && (hoveredNode.id === a.id || hoveredNode.id === b.id)
      const isSelectedEdge = selectedNode && (selectedNode.id === a.id || selectedNode.id === b.id)

      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.strokeStyle = isHighlighted || isSelectedEdge
        ? (isDark ? 'rgba(147, 197, 253, 0.6)' : 'rgba(59, 130, 246, 0.5)')
        : (isDark ? 'rgba(64, 64, 64, 0.3)' : 'rgba(148, 163, 184, 0.2)')
      ctx.lineWidth = isHighlighted || isSelectedEdge ? 1.5 : 0.5
      ctx.stroke()
    }

    // Nodes
    for (const n of graph.nodes) {
      const isHovered = hoveredNode?.id === n.id
      const isSelected = selectedNode?.id === n.id
      const isNeighborOfSelected = selectedNode && graph.edges.some(
        (e: GraphEdge) => (e.source === selectedNode.id && e.target === n.id) || (e.target === selectedNode.id && e.source === n.id)
      )

      // Glow effect
      if (isHovered || isSelected) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.radius + 6, 0, Math.PI * 2)
        ctx.fillStyle = n.color + '30'
        ctx.fill()
      }

      ctx.beginPath()
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2)

      if (selectedNode && !isSelected && !isNeighborOfSelected) {
        ctx.fillStyle = isDark ? '#252525' : '#e2e8f0'
        ctx.globalAlpha = 0.3
      } else {
        ctx.fillStyle = n.color
        ctx.globalAlpha = isHovered ? 1 : 0.85
      }
      ctx.fill()
      ctx.globalAlpha = 1

      // Border
      if (isSelected) {
        ctx.strokeStyle = isDark ? '#fff' : '#1e293b'
        ctx.lineWidth = 2.5
        ctx.stroke()
      } else if (isHovered) {
        ctx.strokeStyle = isDark ? '#a5b4fc' : '#3b82f6'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Label para nós de atributo (centrais)
      if (n.type !== 'multa') {
        const fontSize = clamp(10 + n.connections * 0.5, 11, 16)
        ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        // Text bg
        const metrics = ctx.measureText(n.label)
        const textW = metrics.width + 12
        const textH = fontSize + 8
        ctx.fillStyle = isDark ? 'rgba(10, 10, 10, 0.85)' : 'rgba(255, 255, 255, 0.9)'
        ctx.beginPath()
        ctx.roundRect(n.x - textW / 2, n.y + n.radius + 4, textW, textH, 4)
        ctx.fill()

        ctx.fillStyle = isDark ? '#e5e7eb' : '#1e293b'
        ctx.fillText(n.label, n.x, n.y + n.radius + 4 + textH / 2)

        // Count badge inside
        ctx.font = `bold ${Math.max(10, n.radius * 0.7)}px Inter, system-ui, sans-serif`
        ctx.fillStyle = '#fff'
        ctx.fillText(String(n.connections), n.x, n.y)
      }
    }

    ctx.restore()

    // Tooltip
    if (hoveredNode && hoveredNode.type === 'multa' && hoveredNode.multa) {
      const m = hoveredNode.multa
      const sx = hoveredNode.x * zoom + offset.x
      const sy = hoveredNode.y * zoom + offset.y
      const tw = 260
      const th = 110
      const tx = clamp(sx + 15, 5, canvasSize.w - tw - 5)
      const ty = clamp(sy - th / 2, 5, canvasSize.h - th - 5)

      ctx.fillStyle = isDark ? '#171717' : '#ffffff'
      ctx.shadowColor = 'rgba(0,0,0,0.15)'
      ctx.shadowBlur = 12
      ctx.beginPath()
      ctx.roundRect(tx, ty, tw, th, 8)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.strokeStyle = isDark ? '#333' : '#e2e8f0'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.fillStyle = isDark ? '#f1f5f9' : '#1e293b'
      ctx.font = 'bold 12px Inter, system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(m.Veiculo || '', tx + 12, ty + 12)

      ctx.font = '11px Inter, system-ui, sans-serif'
      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b'
      ctx.fillText(`Auto: ${m.Auto_Infracao || ''}`, tx + 12, ty + 30)
      ctx.fillText(`Motorista: ${m.Motorista || ''}`, tx + 12, ty + 48)
      ctx.fillText(`Status: ${m.Status_Boleto || ''}`, tx + 12, ty + 66)
      ctx.fillText(`Valor: ${m.Valor_Boleto || m.Valor || ''}`, tx + 12, ty + 84)
    }
  }, [graph, canvasSize, zoom, offset, hoveredNode, selectedNode])

  useEffect(() => {
    const id = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(id)
  }, [draw])

  // ───────── Interação ─────────

  const toWorldPos = useCallback((cx: number, cy: number) => ({
    x: (cx - offset.x) / zoom,
    y: (cy - offset.y) / zoom,
  }), [zoom, offset])

  const findNodeAt = useCallback((cx: number, cy: number): GraphNode | null => {
    const wp = toWorldPos(cx, cy)
    for (let i = graph.nodes.length - 1; i >= 0; i--) {
      const n = graph.nodes[i]
      const dx = wp.x - n.x
      const dy = wp.y - n.y
      const hitRadius = n.type === 'multa' ? n.radius + 4 : n.radius + 2
      if (dx * dx + dy * dy <= hitRadius * hitRadius) return n
    }
    return null
  }, [graph.nodes, toWorldPos])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top

    if (isPanning.current) {
      setOffset({
        x: offsetStart.current.x + (e.clientX - panStart.current.x),
        y: offsetStart.current.y + (e.clientY - panStart.current.y),
      })
      return
    }

    setHoveredNode(findNodeAt(cx, cy))
  }, [findNodeAt])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const node = findNodeAt(cx, cy)

    if (node) {
      setSelectedNode((prev: GraphNode | null) => prev?.id === node.id ? null : node)
    } else {
      isPanning.current = true
      panStart.current = { x: e.clientX, y: e.clientY }
      offsetStart.current = { ...offset }
      setSelectedNode(null)
    }
  }, [findNodeAt, offset])

  const handleMouseUp = useCallback(() => {
    isPanning.current = false
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top

    const factor = e.deltaY < 0 ? 1.1 : 0.9
    const newZoom = clamp(zoom * factor, 0.1, 5)
    const ratio = newZoom / zoom

    setZoom(newZoom)
    setOffset({
      x: cx - (cx - offset.x) * ratio,
      y: cy - (cy - offset.y) * ratio,
    })
  }, [zoom, offset])

  const handleResetZoom = () => {
    setOffset({ x: canvasSize.w / 2, y: canvasSize.h / 2 })
    setZoom(1)
  }

  // Stats do agrupamento selecionado
  const groupStats = useMemo(() => {
    const attrNodes = graph.nodes.filter((n: GraphNode) => n.type !== 'multa')
    const multaNodes = graph.nodes.filter((n: GraphNode) => n.type === 'multa')
    return { groups: attrNodes.length, multas: multaNodes.length, edges: graph.edges.length }
  }, [graph])

  // Multas conectadas ao nó selecionado
  const connectedMultas = useMemo(() => {
    if (!selectedNode) return []
    if (selectedNode.type === 'multa') {
      return selectedNode.multa ? [selectedNode.multa] : []
    }
    const connectedIds = new Set<string>()
    for (const e of graph.edges) {
      if (e.source === selectedNode.id) connectedIds.add(e.target)
      if (e.target === selectedNode.id) connectedIds.add(e.source)
    }
    return graph.nodes
      .filter((n: GraphNode) => connectedIds.has(n.id) && n.multa)
      .map((n: GraphNode) => n.multa!)
  }, [selectedNode, graph])

  const groupOptions = [
    { value: 'motorista', label: 'Motorista' },
    { value: 'veiculo', label: 'Veículo' },
    { value: 'descricao', label: 'Descrição' },
    { value: 'estado', label: 'Estado' },
  ]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-600 dark:text-neutral-400 whitespace-nowrap">Agrupar por:</span>
          <Select
            options={groupOptions}
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="w-40"
          />
        </div>

        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar motorista, placa, descrição..."
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setZoom(z => clamp(z * 1.2, 0.1, 5))} title="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setZoom(z => clamp(z * 0.8, 0.1, 5))} title="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleResetZoom} title="Reset view">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span><strong className="text-slate-700 dark:text-neutral-300">{groupStats.groups}</strong> {TYPE_LABELS[groupBy]}s</span>
        <span><strong className="text-slate-700 dark:text-neutral-300">{groupStats.multas}</strong> multas</span>
        <span><strong className="text-slate-700 dark:text-neutral-300">{groupStats.edges}</strong> conexões</span>
        <div className="ml-auto flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: TYPE_COLORS[groupBy] }} />{TYPE_LABELS[groupBy]}</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />Vencido</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />Pendente</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" />Disponível</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Concluído</span>
        </div>
      </div>

      {/* Canvas + Side panel */}
      <div className="flex gap-4" style={{ height: 'calc(100vh - 320px)', minHeight: '400px' }}>
        {/* Graph Canvas */}
        <div ref={containerRef} className="flex-1 rounded-2xl border-2 border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950 overflow-hidden relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { isPanning.current = false; setHoveredNode(null) }}
            onWheel={handleWheel}
          />

          {/* Zoom indicator */}
          <div className="absolute bottom-3 left-3 text-xs px-2 py-1 rounded-lg bg-white/90 dark:bg-neutral-900/90 border border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 font-mono">
            {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Side panel — multas conectadas ao nó selecionado */}
        {selectedNode && (
          <div className="w-80 shrink-0 rounded-2xl border-2 border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col overflow-hidden">
            {/* Panel header */}
            <div className="p-3 border-b border-slate-200 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: selectedNode.color }} />
                  <span className="text-sm font-bold text-slate-900 dark:text-neutral-100 truncate">
                    {selectedNode.type !== 'multa' ? selectedNode.label : (selectedNode.multa?.Veiculo || '')}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="h-6 w-6 flex items-center justify-center rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedNode.type !== 'multa'
                  ? `${connectedMultas.length} multa${connectedMultas.length !== 1 ? 's' : ''} conectada${connectedMultas.length !== 1 ? 's' : ''}`
                  : `Multa #${selectedNode.multa?.id}`
                }
              </p>
            </div>

            {/* Multa list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {connectedMultas.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-slate-200 dark:border-neutral-800 p-3 bg-slate-50/80 dark:bg-neutral-900/60 hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-neutral-100 truncate">{m.Veiculo}</span>
                    <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      m.Status_Boleto === 'Vencido' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800' :
                      m.Status_Boleto === 'Pendente' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' :
                      m.Status_Boleto === 'Disponível' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800' :
                      m.Status_Boleto === 'Concluído' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' :
                      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700'
                    }`}>
                      {m.Status_Boleto}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">{m.Auto_Infracao}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{m.Motorista}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{m.Valor_Boleto || m.Valor}</span>
                    <div className="flex items-center gap-1">
                      {onViewDetails && (
                        <button
                          onClick={() => onViewDetails(m)}
                          className="h-6 w-6 rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors inline-flex items-center justify-center"
                          title="Ver detalhes"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(m)}
                          className="h-6 w-6 rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors inline-flex items-center justify-center"
                          title="Editar"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
