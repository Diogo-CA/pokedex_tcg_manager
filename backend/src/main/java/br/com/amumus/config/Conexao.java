package br.com.amumus.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class Conexao {
    private static final String URL = System.getenv("DB_URL") != null && !System.getenv("DB_URL").trim().isEmpty()
            ? System.getenv("DB_URL")
            : "jdbc:mysql://158.23.57.190:3306/db_projeto?useTimezone=true&serverTimezone=UTC";
    private static final String USUARIO = System.getenv("DB_USER") != null && !System.getenv("DB_USER").trim().isEmpty()
            ? System.getenv("DB_USER")
            : "devuser";
    private static final String SENHA = System.getenv("DB_PASSWORD") != null && !System.getenv("DB_PASSWORD").trim().isEmpty()
            ? System.getenv("DB_PASSWORD")
            : "OvO123@@";

    public static Connection getConexao() {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");

            return DriverManager.getConnection(URL, USUARIO, SENHA);

        } catch (ClassNotFoundException e) {
            throw new RuntimeException("Driver do banco de dados não encontrado.", e);
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao conectar com o banco de dados.", e);
        }
    }
}
