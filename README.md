# 🚛 Multas Dashboard — Comelli Transportes

Dashboard completo para gestão de multas de trânsito da frota de caminhões da Comelli Transportes. Desenvolvido com React.js, TypeScript, Tailwind CSS e Supabase.

---

## 📋 Visão Geral

O sistema permite o gerenciamento centralizado de todas as multas de trânsito da frota, desde o cadastro da infração até a conclusão do processo de pagamento e desconto em folha. Conta com controle de acesso por perfis de usuário, rastreamento de ações (logs) e dashboards visuais com gráficos.

---

## 🔐 Autenticação e Perfis de Acesso

O sistema possui autenticação por usuário e senha, com três perfis de acesso:

### Administrador (`admin`)
- Acesso total ao sistema
- Pode criar, editar e excluir multas
- Pode marcar multas como pagas, concluir processos e desfazer ações
- Pode indicar real infrator e desfazer indicações
- Acessa boletos, consultas e comprovantes
- Visualiza todas as categorias de multas (pendentes, disponíveis, vencidas, etc.)

### Financeiro (`financeiro`)
- Visualiza multas a partir do status "Disponível" (não vê pendentes)
- Pode marcar boletos como pagos
- Acessa links de boletos e consultas
- Não pode criar, editar ou excluir multas
- Não pode concluir processos (desconto em folha)

### RH (`rh`)
- Visualiza apenas multas "À Descontar" e "Concluídas" de responsabilidade do motorista
- Pode marcar multas como concluídas (desconto aplicado)
- Não acessa links de boletos ou consultas
- Não pode criar, editar ou excluir multas

---

## 📊 Dashboard (Tela Inicial)

A tela principal exibe um painel com:

- **Cards de estatísticas**: total de multas, valor total das multas, valor dos boletos disponíveis e multas próximas ao vencimento
- **Gráfico de Responsabilidade**: distribuição entre multas da empresa e do motorista
- **Gráfico de Tipos de Infração**: infrações mais recorrentes
- **Gráfico de Status por Período**: evolução dos status ao longo do tempo
- **Gráfico por Veículo**: ranking dos veículos com mais multas (Top 10)
- **Gráfico de Linha Cronológica**: volume de multas por período

---

## 📝 Cadastro de Multas

O formulário de cadastro permite registrar uma nova multa com os seguintes dados:

- **Responsabilidade** (Empresa ou Motorista) — campo prioritário, exibido no topo
- **Motorista** — obrigatório quando a responsabilidade é do motorista; opcional quando é da empresa
- **Auto de Infração** — identificador único (o sistema impede duplicatas)
- **Código da Infração**
- **Veículo (Placa)**
- **Data e Hora do cometimento**
- **Estado (UF)**
- **Descrição da Infração**
- **Valor da Multa e Valor do Boleto**
- **Link do Boleto e Link de Consulta**
- **Vencimento do Boleto**
- **Notas/Observações**

### Status Automáticos
Os status são calculados automaticamente pelo sistema:

- **Status do Boleto**: `Pendente` → `Disponível` (quando há link do boleto) → `Pago` → `À Descontar` → `Concluído`. Também pode ser `Vencido` se a data do vencimento expirar
- **Status de Indicação** (apenas para responsabilidade do motorista): `Faltando Indicar` → `Indicado` ou `Indicação Expirada`

---

## 🔄 Fluxo de Status do Boleto

```
Pendente → Disponível → Pago (À Descontar) → Concluído
                ↓
             Vencido
```

1. **Pendente**: multa cadastrada sem link de boleto
2. **Disponível**: boleto disponível para pagamento (link cadastrado e não vencido)
3. **Pago / À Descontar**: financeiro marca como pago (com upload de comprovante) — aguardando desconto na folha do motorista
4. **Concluído**: RH confirma que o desconto foi aplicado
5. **Vencido**: boleto passou da data de vencimento sem pagamento

---

## 👤 Indicação de Real Infrator (SENATRAN)

Para multas de responsabilidade do motorista, o sistema controla o prazo de indicação do real infrator:

- **Faltando Indicar**: dentro do prazo, aguardando indicação
- **Indicado**: motorista foi indicado como real infrator
- **Indicação Expirada**: prazo de indicação venceu sem que fosse feita

O botão "Indicar" marca a multa como indicada, e é possível desfazer a indicação.

---

## 📋 Visualizações de Multas

O sistema organiza as multas em diferentes visualizações acessíveis pela barra lateral:

| Visualização | Descrição |
|---|---|
| **Dashboard** | Estatísticas e gráficos gerais |
| **Recentes** | Últimas 20 multas cadastradas |
| **Pendentes** | Multas sem boleto disponível |
| **Disponíveis** | Multas com boleto pronto para pagamento |
| **À Descontar** | Multas pagas aguardando desconto em folha |
| **Concluídas** | Multas com processo finalizado |
| **Vencidas** | Multas com boleto vencido |
| **Próx. Vencimento** | Multas que vencem nos próximos 7 dias |
| **Todas as Multas** | Lista completa com filtros avançados |

---

## 🔍 Filtros e Busca

Na visualização "Todas as Multas", o sistema oferece:

- **Busca por texto**: pesquisa por veículo, motorista, descrição, auto de infração ou código da infração
- **Filtro por Status do Boleto**: Pendente, Disponível, À Descontar, Concluído, Vencido
- **Filtro por Indicação**: Indicado, Não Indicado, Faltando Indicar, Indicação Expirada
- **Ordenação**: mais recentes, mais antigas, maior/menor valor, vencimento próximo, veículo (A-Z), motorista (A-Z)
- **Modo de exibição**: lista (tabela) ou cards

---

## ✏️ Edição e Exclusão

- Multas podem ser editadas a qualquer momento (por usuários com permissão)
- A exclusão exibe um diálogo de confirmação antes de remover a multa
- Ao editar, os status são recalculados automaticamente

---

## 💰 Pagamento de Multas

Ao marcar uma multa como paga:

1. O sistema solicita o link do comprovante de pagamento (Google Drive, Dropbox, etc.)
2. O status muda de "Disponível" para "À Descontar"
3. O comprovante fica acessível na tabela e nos detalhes da multa
4. É possível desfazer o pagamento (voltar para "Disponível")

---

## 📜 Histórico de Ações (Logs)

Todas as ações importantes são registradas com log:

- Criação, edição e exclusão de multas
- Marcação/desmarcação de pagamento
- Conclusão/desfazer conclusão
- Indicação/desfazer indicação de motorista

O histórico pode ser consultado por todos os usuários através do menu lateral ("Histórico").

---

## 📱 Design Responsivo

O sistema é totalmente responsivo:

- **Desktop**: sidebar fixa à esquerda com menu completo
- **Mobile**: menu lateral retrátil (drawer) com overlay
- Cards e tabelas adaptam-se ao tamanho da tela
- Botões e ações otimizados para toque em dispositivos móveis

---

## 🚀 Tecnologias

| Tecnologia | Uso |
|---|---|
| **React 19** | Framework de interface |
| **TypeScript** | Tipagem estática |
| **Vite** | Build tool |
| **Tailwind CSS 4** | Estilização |
| **Supabase** | Banco de dados (PostgreSQL) |
| **Recharts** | Gráficos interativos |
| **Lucide React** | Ícones |
| **class-variance-authority** | Variantes de componentes UI |

---

## ⚙️ Configuração e Execução

### Pré-requisitos
- Node.js 18+
- Conta no Supabase com as tabelas configuradas

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

### Comandos

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Visualizar build de produção
npm run preview
```

---

## 🗃️ Banco de Dados

### Tabela `Multas`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | integer (PK) | Identificador único |
| `Auto_Infracao` | text | Número do auto de infração (único) |
| `Veiculo` | text | Placa do veículo |
| `Motorista` | text | Nome do motorista |
| `Data_Cometimento` | text | Data da infração (DD/MM/AAAA) |
| `Hora_Cometimento` | text | Hora da infração (HH:MM) |
| `Descricao` | text | Descrição da infração |
| `Codigo_Infracao` | integer | Código da infração |
| `Valor` | text | Valor da multa (ex: R$ 260,32) |
| `Valor_Boleto` | text | Valor do boleto com desconto |
| `Estado` | text | UF onde ocorreu a infração |
| `Status_Boleto` | text | Status do boleto (Pendente, Disponível, Descontar, Concluído, Vencido) |
| `Boleto` | text | Link do boleto |
| `Consulta` | text | Link de consulta da infração |
| `Expiracao_Boleto` | text | Data de vencimento do boleto |
| `Resposabilidade` | text | Empresa ou Motorista |
| `Notas` | text | Observações adicionais |
| `Comprovante_Pagamento` | text | Link do comprovante de pagamento |
| `Status_Indicacao` | text | Status da indicação (Faltando Indicar, Indicado, Indicar Expirado) |
| `Expiracao_Indicacao` | text | Prazo para indicação do real infrator |

### Tabela `usuarios`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | integer (PK) | Identificador único |
| `nome` | text | Nome do usuário |
| `usuario` | text | Login do usuário |
| `senha` | text | Senha |
| `role` | text | Perfil (admin, financeiro, rh) |

---

© 2026 Comelli Transportes — Sistema de Gestão de Multas
