"""
models/animal.py
Modelo de domínio para Animal e Característica.
"""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Caracteristica:
    """Representa uma pergunta/característica que pode ser feita ao usuário."""
    id: int
    pergunta: str

    def __str__(self) -> str:
        return self.pergunta


@dataclass
class Animal:
    """Representa um animal com suas características conhecidas."""
    id: int
    nome: str
    caracteristicas: dict[int, bool] = field(default_factory=dict)
    # {caracteristica_id: resposta_bool}

    def adicionar_caracteristica(self, carac_id: int, resposta: bool):
        self.caracteristicas[carac_id] = resposta

    def compativel_com(self, respostas: dict[int, bool]) -> bool:
        """
        Verifica se o animal é compatível com o conjunto de respostas já dadas.
        Retorna True se nenhuma resposta contradiz o perfil do animal.
        """
        for carac_id, resposta in respostas.items():
            if carac_id in self.caracteristicas:
                if self.caracteristicas[carac_id] != resposta:
                    return False
        return True

    def score_compatibilidade(self, respostas: dict[int, bool]) -> float:
        """
        Calcula um score de compatibilidade (0.0 a 1.0).
        Usado quando não há candidato único.
        """
        if not self.caracteristicas:
            return 0.0
        acertos = sum(
            1 for cid, r in respostas.items()
            if cid in self.caracteristicas and self.caracteristicas[cid] == r
        )
        total = sum(1 for cid in respostas if cid in self.caracteristicas)
        return acertos / total if total > 0 else 0.0

    def __str__(self) -> str:
        return self.nome


@dataclass
class Caminho:
    """
    Representa o "caminho" de perguntas e respostas que leva a um animal.
    Usado para aprender novos animais.
    """
    animal_nome: str
    respostas: dict[int, bool] = field(default_factory=dict)
    # {caracteristica_id: resposta_bool}

    def adicionar_resposta(self, carac_id: int, resposta: bool):
        self.respostas[carac_id] = resposta

    def __repr__(self) -> str:
        return f"Caminho(animal={self.animal_nome}, respostas={self.respostas})"
