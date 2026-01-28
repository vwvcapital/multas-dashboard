# Multas Dashboard - Comelli Transportes

Dashboard moderno para gestão de multas de frota de caminhões, desenvolvido com React.js, TypeScript e Tailwind CSS.

## 🚀 Tecnologias

- **React 19** - Framework JavaScript
- **TypeScript** - Tipagem estática
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS 4** - Estilização utilitária
- **Supabase** - Backend as a Service (banco de dados)
- **Recharts** - Gráficos interativos
- **Lucide React** - Ícones modernos

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🎨 Funcionalidades

- **Dashboard com estatísticas** - Visualize total de multas, valores e pontos
- **Gráficos interativos** - Status das multas e multas por veículo/período
- **Tabela de multas** - Lista completa com filtros e busca
- **Design responsivo** - Funciona em desktop e mobile
- **Theme Light** - Interface limpa e moderna

## 📊 Estrutura do Banco de Dados

A tabela `multas` no Supabase deve ter a seguinte estrutura:

```sql
CREATE TABLE multas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa VARCHAR(10) NOT NULL,
  motorista VARCHAR(100) NOT NULL,
  data_infracao DATE NOT NULL,
  tipo_infracao VARCHAR(200) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  pontos INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pendente', 'paga', 'recorrida', 'cancelada')),
  local VARCHAR(300),
  auto_infracao VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 Configuração

As variáveis de ambiente estão no arquivo `.env`:

```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── dashboard/
│   │   ├── MultasChart.tsx
│   │   ├── MultasTable.tsx
│   │   ├── StatsCard.tsx
│   │   └── StatusChart.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   └── ui/
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── skeleton.tsx
│       └── table.tsx
├── hooks/
│   └── useMultas.ts
├── lib/
│   ├── supabase.ts
│   └── utils.ts
├── App.tsx
├── index.css
└── main.tsx
```

## 🎯 Próximos Passos

- [ ] Adicionar autenticação
- [ ] Implementar CRUD de multas
- [ ] Exportação de relatórios em PDF
- [ ] Notificações de vencimento
- [ ] Dashboard de motoristas
