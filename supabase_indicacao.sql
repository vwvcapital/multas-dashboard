-- Adicionar colunas para controle de indicação de real infrator (SENATRAN)
-- Status_Indicacao: 'Faltando Indicar', 'Indicado', 'Indicar Expirado' ou NULL
-- Expiracao_Indicacao: data limite para realizar a indicação (formato DD/MM/AAAA como texto)

ALTER TABLE "Multas"
ADD COLUMN IF NOT EXISTS "Status_Indicacao" TEXT DEFAULT NULL;

ALTER TABLE "Multas"
ADD COLUMN IF NOT EXISTS "Expiracao_Indicacao" TEXT DEFAULT NULL;

-- Comentários nas colunas
COMMENT ON COLUMN "Multas"."Status_Indicacao" IS 'Status da indicação do real infrator no SENATRAN: Faltando Indicar, Indicado, Indicar Expirado';
COMMENT ON COLUMN "Multas"."Expiracao_Indicacao" IS 'Data limite para indicar o real infrator (formato DD/MM/AAAA)';
