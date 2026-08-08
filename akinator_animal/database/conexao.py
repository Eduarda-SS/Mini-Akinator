"""
database/conexao.py
Módulo responsável pela conexão com o banco de dados MySQL.
"""

import mysql.connector
from mysql.connector import Error
from config import DB_CONFIG


class Conexao:
    """Gerencia a conexão com o banco de dados MySQL."""

    _instancia = None  # Singleton

    def __new__(cls):
        if cls._instancia is None:
            cls._instancia = super().__new__(cls)
            cls._instancia._conexao = None
        return cls._instancia

    def conectar(self) -> bool:
        """Estabelece a conexão com o banco de dados."""
        try:
            self._conexao = mysql.connector.connect(**DB_CONFIG)
            if self._conexao.is_connected():
                return True
        except Error as e:
            print(f"\n[ERRO] Não foi possível conectar ao banco de dados: {e}")
            print("Verifique as configurações em config.py e se o MySQL está rodando.\n")
        return False

    def desconectar(self):
        """Fecha a conexão com o banco de dados."""
        if self._conexao and self._conexao.is_connected():
            self._conexao.close()

    def cursor(self, dictionary: bool = True):
        """Retorna um cursor novo."""
        if not self._conexao or not self._conexao.is_connected():
            self.conectar()
        return self._conexao.cursor(dictionary=dictionary)

    def commit(self):
        """Confirma a transação atual."""
        if self._conexao:
            self._conexao.commit()

    def rollback(self):
        """Desfaz a transação atual."""
        if self._conexao:
            self._conexao.rollback()

    @property
    def esta_conectado(self) -> bool:
        return bool(self._conexao and self._conexao.is_connected())
