"""
config.py
Configurações globais da aplicação.
"""

# ─── Banco de Dados ────────────────────────────────────────────────────────────
DB_CONFIG = {
    "host":     "localhost",
    "port":     3306,
    "user":     "root",          # Altere para o seu usuário MySQL
    "password": "Duds@3175",     # Altere para a sua senha MySQL
    "database": "akinator_animal",
    "charset":  "utf8mb4",
}

# ─── Configurações do Jogo ─────────────────────────────────────────────────────
MAX_PERGUNTAS = 15          # Limite de perguntas por rodada
MIN_RESPOSTAS_APRENDER = 2  # Respostas mínimas para salvar novo animal
