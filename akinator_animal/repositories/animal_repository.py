"""
repositories/animal_repository.py
Camada de acesso a dados — toda SQL fica aqui.
"""

from typing import Optional
from database.conexao import Conexao
from models.animal import Animal, Caracteristica, Caminho


class AnimalRepository:
    """Repositório para operações CRUD de animais e características."""

    def __init__(self):
        self._db = Conexao()

    # ─── Características ───────────────────────────────────────────────────────

    def buscar_todas_caracteristicas(self) -> list[Caracteristica]:
        """Retorna todas as características cadastradas."""
        cur = self._db.cursor()
        cur.execute("SELECT id, pergunta FROM caracteristicas ORDER BY id")
        rows = cur.fetchall()
        cur.close()
        return [Caracteristica(id=r["id"], pergunta=r["pergunta"]) for r in rows]

    def buscar_ou_criar_caracteristica(self, pergunta: str) -> Caracteristica:
        """Retorna a característica existente ou cria uma nova."""
        cur = self._db.cursor()
        cur.execute(
            "SELECT id, pergunta FROM caracteristicas WHERE pergunta = %s",
            (pergunta,)
        )
        row = cur.fetchone()
        if row:
            cur.close()
            return Caracteristica(id=row["id"], pergunta=row["pergunta"])

        cur.execute(
            "INSERT INTO caracteristicas (pergunta) VALUES (%s)",
            (pergunta,)
        )
        self._db.commit()
        novo_id = cur.lastrowid
        cur.close()
        return Caracteristica(id=novo_id, pergunta=pergunta)

    # ─── Animais ──────────────────────────────────────────────────────────────

    def buscar_todos_animais(self) -> list[Animal]:
        """Retorna todos os animais com suas características."""
        cur = self._db.cursor()

        cur.execute("SELECT id, nome FROM animais ORDER BY nome")
        animais_rows = cur.fetchall()

        animais = []
        for row in animais_rows:
            animal = Animal(id=row["id"], nome=row["nome"])

            cur.execute(
                """
                SELECT ac.caracteristica_id, ac.resposta
                FROM animal_caracteristica ac
                WHERE ac.animal_id = %s
                """,
                (animal.id,)
            )
            for carac in cur.fetchall():
                animal.adicionar_caracteristica(
                    carac["caracteristica_id"],
                    bool(carac["resposta"])
                )
            animais.append(animal)

        cur.close()
        return animais

    def buscar_animal_por_nome(self, nome: str) -> Optional[Animal]:
        """Busca um animal pelo nome (case-insensitive)."""
        cur = self._db.cursor()
        cur.execute(
            "SELECT id, nome FROM animais WHERE LOWER(nome) = LOWER(%s)",
            (nome,)
        )
        row = cur.fetchone()
        cur.close()
        if not row:
            return None
        return Animal(id=row["id"], nome=row["nome"])

    def salvar_novo_animal(self, caminho: Caminho) -> Animal:
        """
        Salva um novo animal e seu caminho (conjunto de respostas) no banco.
        Retorna o Animal criado.
        """
        cur = self._db.cursor()
        try:
            # 1. Insere o animal
            cur.execute(
                "INSERT INTO animais (nome) VALUES (%s)",
                (caminho.animal_nome,)
            )
            animal_id = cur.lastrowid

            # 2. Insere as respostas do caminho
            for carac_id, resposta in caminho.respostas.items():
                cur.execute(
                    """
                    INSERT IGNORE INTO animal_caracteristica
                        (animal_id, caracteristica_id, resposta)
                    VALUES (%s, %s, %s)
                    """,
                    (animal_id, carac_id, int(resposta))
                )

            self._db.commit()
            cur.close()
            return Animal(id=animal_id, nome=caminho.animal_nome)

        except Exception as e:
            self._db.rollback()
            cur.close()
            raise e

    def adicionar_caracteristica_ao_animal(
        self,
        animal_id: int,
        carac_id: int,
        resposta: bool
    ):
        """Adiciona ou atualiza uma característica de um animal existente."""
        cur = self._db.cursor()
        cur.execute(
            """
            INSERT INTO animal_caracteristica (animal_id, caracteristica_id, resposta)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE resposta = VALUES(resposta)
            """,
            (animal_id, carac_id, int(resposta))
        )
        self._db.commit()
        cur.close()

    # ─── Candidatos ───────────────────────────────────────────────────────────

    def buscar_candidatos(self, respostas: dict[int, bool]) -> list[Animal]:
        """
        Retorna animais compatíveis com o conjunto de respostas fornecido.
        Um animal é compatível se nenhuma de suas características contradiz as respostas.
        """
        todos = self.buscar_todos_animais()
        return [a for a in todos if a.compativel_com(respostas)]

    def buscar_proxima_caracteristica(
        self,
        respostas_dadas: dict[int, bool],
        candidatos: list[Animal]
    ) -> Optional[Caracteristica]:
        """
        Escolhe a próxima característica a perguntar usando entropia:
        prefere a pergunta que mais divide os candidatos ao meio.
        """
        todas = self.buscar_todas_caracteristicas()
        nao_perguntadas = [c for c in todas if c.id not in respostas_dadas]

        if not nao_perguntadas or not candidatos:
            return None

        melhor: Optional[Caracteristica] = None
        melhor_score = float("inf")  # queremos o mais próximo de 0

        total = len(candidatos)
        for carac in nao_perguntadas:
            sim = sum(
                1 for a in candidatos
                if a.caracteristicas.get(carac.id) is True
            )
            nao = total - sim
            # Score = distância do equilíbrio perfeito (50/50)
            desequilibrio = abs(sim - nao)
            if desequilibrio < melhor_score:
                melhor_score = desequilibrio
                melhor = carac

        return melhor
