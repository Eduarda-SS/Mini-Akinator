"""
ui/terminal.py
Interface de usuário via terminal — exibe mensagens, coleta entradas.
Toda a lógica de I/O fica aqui, separada do motor do jogo.
"""

import os
import sys
from typing import Optional
from models.animal import Animal, Caracteristica


# ─── Cores ANSI ──────────────────────────────────────────────────────────────
class Cor:
    RESET   = "\033[0m"
    NEGRITO = "\033[1m"
    CIANO   = "\033[96m"
    VERDE   = "\033[92m"
    AMARELO = "\033[93m"
    VERMELHO= "\033[91m"
    MAGENTA = "\033[95m"
    CINZA   = "\033[90m"
    BRANCO  = "\033[97m"

def _suporta_cores() -> bool:
    return hasattr(sys.stdout, "isatty") and sys.stdout.isatty()

def _c(texto: str, cor: str) -> str:
    if _suporta_cores():
        return f"{cor}{texto}{Cor.RESET}"
    return texto


# ─── Banner ───────────────────────────────────────────────────────────────────
BANNER = r"""
  ╔═══════════════════════════════════════════════╗
  ║   🐾  A K I N A T O R   A N I M A L  🐾      ║
  ║   Pense num animal... eu vou adivinhar!        ║
  ╚═══════════════════════════════════════════════╝
"""


class TerminalUI:
    """Classe responsável por toda a interação com o usuário no terminal."""

    # ─── Utilitários ─────────────────────────────────────────────────────────

    @staticmethod
    def limpar():
        os.system("cls" if os.name == "nt" else "clear")

    @staticmethod
    def linha(char: str = "─", largura: int = 52):
        print(_c(char * largura, Cor.CINZA))

    @staticmethod
    def _input_limpo(prompt: str) -> str:
        try:
            return input(prompt).strip()
        except (EOFError, KeyboardInterrupt):
            print()
            return ""

    # ─── Telas ───────────────────────────────────────────────────────────────

    def exibir_banner(self):
        self.limpar()
        print(_c(BANNER, Cor.CIANO))

    def exibir_menu_inicial(self) -> str:
        """Exibe o menu inicial e retorna a opção escolhida."""
        self.linha()
        print(_c("  [1]", Cor.VERDE) + " Jogar")
        print(_c("  [2]", Cor.AMARELO) + " Ver animais no banco")
        print(_c("  [0]", Cor.VERMELHO) + " Sair")
        self.linha()
        return self._input_limpo("  Escolha: ")

    def exibir_animais(self, animais: list[Animal]):
        self.limpar()
        print(_c("\n  🐘 Animais conhecidos:\n", Cor.CIANO))
        for i, animal in enumerate(animais, 1):
            carac_count = len(animal.caracteristicas)
            print(f"  {i:>3}. {_c(animal.nome, Cor.BRANCO)}"
                  f" {_c(f'({carac_count} características)', Cor.CINZA)}")
        self.linha()
        self._input_limpo("  Pressione Enter para voltar...")

    # ─── Perguntas ────────────────────────────────────────────────────────────

    def fazer_pergunta(
        self,
        caracteristica: Caracteristica,
        numero: int,
        total_candidatos: int
    ) -> Optional[bool]:
        """
        Faz uma pergunta Sim/Não ao usuário.
        Retorna True (sim), False (não) ou None (não sei).
        """
        print()
        self.linha()
        print(
            f"  {_c(f'Pergunta #{numero}', Cor.MAGENTA)}"
            f"  {_c(f'[{total_candidatos} candidatos]', Cor.CINZA)}"
        )
        print(f"\n  {_c(caracteristica.pergunta, Cor.BRANCO)}\n")
        print(f"  {_c('[s]', Cor.VERDE)} Sim   "
              f"{_c('[n]', Cor.VERMELHO)} Não   "
              f"{_c('[?]', Cor.AMARELO)} Não sei")
        self.linha()

        while True:
            resp = self._input_limpo("  Resposta: ").lower()
            if resp in ("s", "sim", "y", "yes"):
                return True
            if resp in ("n", "não", "nao", "no"):
                return False
            if resp in ("?", "ns", "nsei", "não sei"):
                return None
            print(_c("  ⚠  Digite s, n ou ?", Cor.AMARELO))

    # ─── Adivinhação ─────────────────────────────────────────────────────────

    def exibir_tentativa(self, animal: Animal) -> bool:
        """Mostra a tentativa de adivinhação. Retorna True se acertou."""
        print()
        self.linha("═")
        print(f"\n  🎯  {_c('Acho que sei!', Cor.CIANO)}\n")
        print(f"  O animal é: {_c(animal.nome.upper(), Cor.VERDE + Cor.NEGRITO)}\n")
        self.linha("═")
        resp = self._input_limpo("  Acertei? [s/n]: ").lower()
        return resp in ("s", "sim", "y", "yes")

    def exibir_vitoria(self, animal: Animal):
        print()
        print(_c("  🎉  ACERTEI! Sou incrível!", Cor.VERDE + Cor.NEGRITO))
        print(_c(f"  O animal era: {animal.nome}", Cor.VERDE))

    # ─── Aprendizado ─────────────────────────────────────────────────────────

    def pedir_nome_animal(self) -> str:
        """Pede o nome do animal que o usuário estava pensando."""
        print()
        print(_c("  🤔  Não consegui adivinhar. Qual animal era?", Cor.AMARELO))
        self.linha()
        while True:
            nome = self._input_limpo("  Nome do animal: ").strip().title()
            if nome:
                return nome
            print(_c("  ⚠  Por favor, informe o nome do animal.", Cor.AMARELO))

    def confirmar_aprendizado(self, nome_animal: str) -> bool:
        """Pergunta se pode aprender o novo animal."""
        resp = self._input_limpo(
            f"  Posso aprender sobre '{_c(nome_animal, Cor.CIANO)}'? [s/n]: "
        ).lower()
        return resp in ("s", "sim", "y", "yes")

    def exibir_aprendizado_sucesso(self, nome_animal: str):
        print(_c(f"  ✅  Aprendi sobre '{nome_animal}'! Obrigado!", Cor.VERDE))

    def pedir_pergunta_diferenciadora(self, animal_errado: Animal, animal_certo: str) -> str:
        """
        Pede ao usuário uma pergunta que diferencie o animal certo do errado.
        """
        print()
        print(_c(
            f"  Qual pergunta diferenciaria '{animal_certo}' de '{animal_errado.nome}'?",
            Cor.AMARELO
        ))
        print(_c("  (Ex: 'O animal tem listras?')", Cor.CINZA))
        self.linha()
        while True:
            pergunta = self._input_limpo("  Pergunta: ").strip()
            if len(pergunta) > 5:
                return pergunta
            print(_c("  ⚠  Por favor, forneça uma pergunta válida.", Cor.AMARELO))

    # ─── Mensagens de sistema ────────────────────────────────────────────────

    def exibir_sem_candidatos(self):
        print()
        print(_c("  😵  Não tenho mais candidatos!", Cor.VERMELHO))

    def exibir_limite_perguntas(self):
        print()
        print(_c(
            f"  ⏰  Atingi o limite de perguntas, deixa eu tentar adivinhar...",
            Cor.AMARELO
        ))

    def exibir_erro_conexao(self):
        print(_c("\n  ❌  Erro de conexão com o banco de dados.", Cor.VERMELHO))
        print(_c(
            "  Verifique o arquivo config.py e se o MySQL está rodando.\n",
            Cor.CINZA
        ))

    def exibir_mensagem(self, msg: str, cor: str = ""):
        print(f"\n  {_c(msg, cor) if cor else msg}")

    def aguardar_enter(self, msg: str = "Pressione Enter para continuar..."):
        self._input_limpo(f"\n  {_c(msg, Cor.CINZA)}")

    def jogar_novamente(self) -> bool:
        resp = self._input_limpo(
            f"\n  {_c('Jogar novamente?', Cor.CIANO)} [s/n]: "
        ).lower()
        return resp in ("s", "sim", "y", "yes")
