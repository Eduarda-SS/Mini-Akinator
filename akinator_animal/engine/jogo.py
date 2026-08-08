"""
engine/jogo.py
Motor do jogo — orquestra perguntas, candidatos e aprendizado.
"""

from typing import Optional
from models.animal import Animal, Caracteristica, Caminho
from repositories.animal_repository import AnimalRepository
from config import MAX_PERGUNTAS


class Jogo:
    """
    Motor principal do Akinator Animal.
    Gerencia o fluxo de perguntas e o processo de dedução.
    """

    def __init__(self):
        self._repo = AnimalRepository()
        self._respostas: dict[int, bool] = {}       # {carac_id: bool}
        self._candidatos: list[Animal] = []
        self._perguntas_feitas: int = 0
        self._historico: list[tuple[Caracteristica, bool]] = []  # para aprendizado

    # ─── Estado ───────────────────────────────────────────────────────────────

    def reiniciar(self):
        """Reinicia o estado do jogo para uma nova rodada."""
        self._respostas = {}
        self._candidatos = []
        self._perguntas_feitas = 0
        self._historico = []

    @property
    def perguntas_feitas(self) -> int:
        return self._perguntas_feitas

    @property
    def candidatos(self) -> list[Animal]:
        return self._candidatos

    # ─── Fluxo principal ──────────────────────────────────────────────────────

    def iniciar(self) -> list[Animal]:
        """Carrega os candidatos iniciais (todos os animais)."""
        self._candidatos = self._repo.buscar_todos_animais()
        return self._candidatos

    def proxima_pergunta(self) -> Optional[Caracteristica]:
        """Retorna a próxima pergunta mais informativa ou None se encerrado."""
        if self._perguntas_feitas >= MAX_PERGUNTAS:
            return None
        if len(self._candidatos) <= 1:
            return None
        return self._repo.buscar_proxima_caracteristica(
            self._respostas, self._candidatos
        )

    def registrar_resposta(self, caracteristica: Caracteristica, resposta: bool):
        """
        Registra a resposta do usuário e filtra os candidatos.
        """
        self._respostas[caracteristica.id] = resposta
        self._historico.append((caracteristica, resposta))
        self._perguntas_feitas += 1

        # Filtra candidatos incompatíveis
        self._candidatos = [
            a for a in self._candidatos
            if a.compativel_com(self._respostas)
        ]

    def tentar_adivinhar(self) -> Optional[Animal]:
        """
        Retorna o melhor candidato se houver apenas um,
        ou o de maior score se o limite de perguntas foi atingido.
        """
        if len(self._candidatos) == 1:
            return self._candidatos[0]

        if self._perguntas_feitas >= MAX_PERGUNTAS and self._candidatos:
            # Escolhe o mais compatível com as respostas
            return max(
                self._candidatos,
                key=lambda a: a.score_compatibilidade(self._respostas)
            )

        return None

    def sem_candidatos(self) -> bool:
        """Verifica se não há mais candidatos."""
        return len(self._candidatos) == 0

    # ─── Aprendizado ─────────────────────────────────────────────────────────

    def aprender_novo_animal(self, nome_animal: str) -> Animal:
        """
        Aprende um novo animal a partir do histórico da partida atual.
        Salva o animal e seu caminho no banco de dados.
        """
        caminho = Caminho(animal_nome=nome_animal)
        for carac, resposta in self._historico:
            caminho.adicionar_resposta(carac.id, resposta)

        return self._repo.salvar_novo_animal(caminho)

    def enriquecer_animal_existente(self, animal: Animal, pergunta_diferenciadora: str):
        """
        Quando o sistema erra, pede uma nova pergunta para diferenciar
        o animal correto e salva essa característica no banco.
        """
        nova_carac = self._repo.buscar_ou_criar_caracteristica(pergunta_diferenciadora)
        # O animal correto responderia "sim" à nova característica
        self._repo.adicionar_caracteristica_ao_animal(animal.id, nova_carac.id, True)
        return nova_carac

    def buscar_animal_por_nome(self, nome: str) -> Optional[Animal]:
        return self._repo.buscar_animal_por_nome(nome)
