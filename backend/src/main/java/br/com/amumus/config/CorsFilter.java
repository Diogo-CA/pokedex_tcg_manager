package br.com.amumus.config;

import javax.servlet.*;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebFilter("/*") // O asterisco garante que intercepta TODAS as rotas da sua API
public class CorsFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        // Autoriza o seu Front-end (ajuste a porta se o seu front estiver rodando em outra)
        res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");

        // Autoriza os métodos que vocês estão usando
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

        // Autoriza o envio de JSON no corpo da requisição
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

        // O Pulo do Gato: Se o navegador estiver só fazendo o "voo de reconhecimento" (OPTIONS)
        // Nós devolvemos um OK (200) imediatamente, sem nem incomodar os Controllers.
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            res.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        // Se for uma requisição normal, deixa o fluxo seguir para o Controller
        chain.doFilter(request, response);
    }

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {}

    @Override
    public void destroy() {}
}