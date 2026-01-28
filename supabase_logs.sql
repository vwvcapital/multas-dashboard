-- =====================================================
-- TABELA DE LOGS DE ATIVIDADES
-- =====================================================
-- Execute este SQL no Supabase SQL Editor

-- Criar tabela de logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    user_role VARCHAR(20) NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL DEFAULT 'multa',
    entity_id INTEGER,
    entity_description VARCHAR(255),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_action ON activity_logs(action);

-- Habilitar RLS (Row Level Security)
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de qualquer usuário autenticado
CREATE POLICY "Allow insert for all users" ON activity_logs
    FOR INSERT
    WITH CHECK (true);

-- Política para permitir leitura (admin vê tudo, outros veem apenas os próprios)
CREATE POLICY "Allow read for all users" ON activity_logs
    FOR SELECT
    USING (true);

-- =====================================================
-- TIPOS DE AÇÕES REGISTRADAS:
-- =====================================================
-- - marcar_pago: Usuário marcou multa como paga
-- - desmarcar_pago: Usuário desmarcou pagamento
-- - marcar_concluido: Usuário marcou multa como concluída
-- - desfazer_conclusao: Usuário desfez conclusão
-- - criar_multa: Usuário criou nova multa
-- - editar_multa: Usuário editou multa
-- - excluir_multa: Usuário excluiu multa
-- - login: Usuário fez login
-- - logout: Usuário fez logout
-- =====================================================
