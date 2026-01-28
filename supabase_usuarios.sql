-- =============================================
-- SQL para criar a tabela de usuários no Supabase
-- Execute este SQL no Editor SQL do Supabase
-- =============================================

-- 1. Criar a tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    usuario VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'financeiro', 'rh')),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índice para busca por usuario
CREATE INDEX IF NOT EXISTS idx_usuarios_usuario ON usuarios(usuario);

-- 3. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Inserir usuários de exemplo (ALTERE AS SENHAS!)
-- ATENÇÃO: Em produção, use senhas mais seguras e considere usar bcrypt/hash
INSERT INTO usuarios (nome, usuario, senha, role) VALUES
    ('Administrador', 'admin', 'admin123', 'admin'),
    ('Financeiro', 'financeiro', 'fin123', 'financeiro'),
    ('RH', 'rh', 'rh123', 'rh')
ON CONFLICT (usuario) DO NOTHING;

-- 6. Habilitar Row Level Security (RLS)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- 7. Criar política para permitir leitura de todos os usuários autenticados
-- (você pode ajustar conforme necessidade)
CREATE POLICY "Permitir select para todos" ON usuarios
    FOR SELECT
    USING (true);

-- 8. Verificar os usuários criados
SELECT id, nome, usuario, role, ativo, created_at FROM usuarios;

-- =============================================
-- NOTAS IMPORTANTES:
-- 
-- 1. Este SQL usa senhas em texto simples para simplicidade.
--    Em produção, considere usar:
--    - Supabase Auth (recomendado)
--    - Hash de senhas com pgcrypto
--
-- 2. Permissões por role:
--    - admin: Acesso total (criar, editar, excluir, marcar pago, concluir, boleto, consulta)
--    - financeiro: Visualizar, acessar boleto, marcar como pago
--    - rh: Visualizar multas pagas do motorista, marcar como concluído
--
-- 3. Status_Boleto na tabela Multas:
--    - Pendente: Boleto ainda não disponível
--    - Disponível: Boleto disponível para pagamento
--    - Pago: Financeiro pagou (aguardando RH para multas do motorista)
--    - Concluído: Processo finalizado (empresa já paga OU motorista descontado)
--    - Vencido: Boleto passou da data de vencimento
--
-- 4. Fluxo de trabalho:
--    a) Financeiro marca como "Pago"
--    b) Se responsabilidade = Empresa: automaticamente vira "Concluído"
--    c) Se responsabilidade = Motorista: fica como "Pago", RH vê e marca "Concluído" após desconto
--
-- 5. Para usar com Supabase Auth no futuro:
--    - Integre com auth.users
--    - Use auth.uid() nas políticas RLS
-- =============================================
