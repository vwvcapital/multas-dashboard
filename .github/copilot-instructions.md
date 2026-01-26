# Multas Dashboard - Comelli Transportes

## Projeto
Dashboard de gestão de multas para frota de caminhões desenvolvido com React.js, TypeScript e Tailwind CSS.

## Stack
- React 19 + TypeScript
- Vite (build tool)
- Tailwind CSS 4
- Supabase (database)
- Recharts (charts)
- Lucide React (icons)

## Comandos
- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Visualiza o build de produção

## Estrutura
- `/src/components/ui` - Componentes base reutilizáveis (Button, Card, Badge, etc.)
- `/src/components/dashboard` - Componentes específicos do dashboard
- `/src/components/layout` - Header e Sidebar
- `/src/hooks` - Custom hooks (useMultas)
- `/src/lib` - Utilitários e configuração do Supabase

## Banco de Dados
A conexão com Supabase está configurada em `.env`. A tabela `multas` deve conter:
- id, placa, motorista, data_infracao, tipo_infracao, valor, pontos, status, local, auto_infracao
