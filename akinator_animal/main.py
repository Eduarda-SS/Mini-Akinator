"""
main.py
Ponto de entrada da aplicação — orquestra UI, motor de jogo e repositório.
"""

import sys
from database.conexao import Conexao
from engine.jogo import Jogo
from ui.terminal import TerminalUI, Cor
from repositories.animal_repository import AnimalRepository


class Aplicacao:
    """Controlador principal que une UI, motor e banco de dados."""

    def __init__(self):
        self._ui = TerminalUI()
        self._jogo = Jogo()
        self._repo = AnimalRepository()

    # ─── Inicialização ────────────────────────────────────────────────────────

    def iniciar(self):
        """Ponto de entrada principal."""
        self._ui.exibir_banner()

        # Testa conexão com o banco
        db = Conexao()
        if not db.conectar():
            self._ui.exibir_erro_conexao()
            sys.exit(1)

        self._ui.exibir_mensagem("✅  Conectado ao banco de dados!", Cor.VERDE)
        self._ui.aguardar_enter()

        # Loop do menu principal
        while True:
            self._ui.exibir_banner()
            opcao = self._ui.exibir_menu_inicial()

            if opcao == "1":
                self._executar_rodada()
            elif opcao == "2":
                self._exibir_animais()
            elif opcao == "0":
                self._ui.exibir_mensagem("Até logo! 🐾", Cor.CIANO)
                break
            else:
                self._ui.exibir_mensagem("Opção inválida.", Cor.AMARELO)

        db.desconectar()

    # ─── Rodada ───────────────────────────────────────────────────────────────

    def _executar_rodada(self):
        """Executa uma rodada completa do jogo."""
        self._jogo.reiniciar()
        self._ui.exibir_banner()
        self._ui.exibir_mensagem(
            "Pense em um animal e responda as perguntas com s (sim) / n (não) / ? (não sei)",
            Cor.CIANO
        )
        self._ui.aguardar_enter("Pressione Enter quando estiver pronto...")

        # Carrega candidatos iniciais
        candidatos = self._jogo.iniciar()
        if not candidatos:
            self._ui.exibir_mensagem(
                "Banco de dados vazio! Execute o schema.sql primeiro.", Cor.VERMELHO
            )
            self._ui.aguardar_enter()
            return

        # ── Loop de perguntas ─────────────────────────────────────────────────
        while True:
            # Verifica condições de parada
            if self._jogo.sem_candidatos():
                self._ui.exibir_sem_candidatos()
                self._fluxo_aprendizado(nenhum_candidato=True)
                break

            candidato_unico = self._jogo.tentar_adivinhar()

            if candidato_unico:
                # Tentativa de adivinhação
                acertou = self._ui.exibir_tentativa(candidato_unico)
                if acertou:
                    self._ui.exibir_vitoria(candidato_unico)
                else:
                    self._fluxo_aprendizado(animal_errado=candidato_unico)
                break

            # Próxima pergunta
            prox = self._jogo.proxima_pergunta()
            if prox is None:
                # Limite atingido — faz último chute
                self._ui.exibir_limite_perguntas()
                chute = self._jogo.tentar_adivinhar()
                if chute:
                    acertou = self._ui.exibir_tentativa(chute)
                    if acertou:
                        self._ui.exibir_vitoria(chute)
                    else:
                        self._fluxo_aprendizado(animal_errado=chute)
                else:
                    self._ui.exibir_sem_candidatos()
                    self._fluxo_aprendizado(nenhum_candidato=True)
                break

            # Faz a pergunta ao usuário
            resposta = self._ui.fazer_pergunta(
                prox,
                self._jogo.perguntas_feitas + 1,
                len(self._jogo.candidatos)
            )

            if resposta is None:
                # "Não sei" — ignora a pergunta mas não regista no histórico
                continue

            self._jogo.registrar_resposta(prox, resposta)

        # Pergunta se quer jogar de novo
        if self._ui.jogar_novamente():
            self._executar_rodada()

    # ─── Fluxo de aprendizado ─────────────────────────────────────────────────

    def _fluxo_aprendizado(self, animal_errado=None, nenhum_candidato: bool = False):
        """
        Gerencia o aprendizado de um novo animal ou enriquecimento de um existente.
        """
        nome_correto = self._ui.pedir_nome_animal()

        if not self._ui.confirmar_aprendizado(nome_correto):
            return

        # Verifica se o animal já existe no banco
        animal_existente = self._jogo.buscar_animal_por_nome(nome_correto)

        if animal_existente:
            # Animal já existe mas o sistema errou — adiciona característica diferenciadora
            if animal_errado and animal_errado.id != animal_existente.id:
                pergunta_dif = self._ui.pedir_pergunta_diferenciadora(
                    animal_errado, nome_correto
                )
                self._jogo.enriquecer_animal_existente(animal_existente, pergunta_dif)
                self._ui.exibir_aprendizado_sucesso(nome_correto)
            else:
                self._ui.exibir_mensagem(
                    f"'{nome_correto}' já está no banco. Obrigado!", Cor.CIANO
                )
        else:
            # Animal novo — salva com o caminho completo
            try:
                self._jogo.aprender_novo_animal(nome_correto)
                self._ui.exibir_aprendizado_sucesso(nome_correto)
            except Exception as e:
                self._ui.exibir_mensagem(
                    f"Erro ao salvar: {e}", Cor.VERMELHO
                )

    # ─── Telas auxiliares ────────────────────────────────────────────────────

    def _exibir_animais(self):
        animais = self._repo.buscar_todos_animais()
        self._ui.exibir_animais(animais)


# ─── Entry point ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app = Aplicacao()
    app.iniciar()
