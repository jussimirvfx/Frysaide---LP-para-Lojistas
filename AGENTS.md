# Formulários de landing pages

Sempre que houver campo CNPJ:
- Validar localmente antes do envio, sem consulta cadastral ou API externa.
- Remover caracteres não numéricos, limitar a 14 dígitos e usar máscara 00.000.000/0000-00.
- Calcular os dois dígitos verificadores somente com 14 dígitos; rejeitar sequências repetidas.
- Bloquear CNPJ incompleto ou inválido com “CNPJ inválido. Confira os números digitados.”
- Enviar `cnpj` formatado e `cnpj_validation_status: "checksum_valid"` apenas após validação.
- Preservar tracking, pontuação, webhook e demais comportamentos; consultas cadastrais cabem ao n8n.
- Não afirmar que a empresa existe, está ativa ou aprovada.
- Testar CNPJ 60887522000189 válido, 60887522000188 inválido, zeros, incompletos, bloqueio de webhook e payload válido com mocks, sem leads reais.
- Executar testes, lint, typecheck e build após alterações.
