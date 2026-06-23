# Estágio de compilação (Build Stage)
FROM node:20-alpine AS builder
WORKDIR /app

# Copia pacotes e dependências primeiro para cachear
COPY package*.json tsconfig.json ./
RUN npm ci

# Copia a pasta de código-fonte e executa a compilação do TypeScript
COPY src ./src
RUN npx tsc

# Estágio de execução (Runtime Stage)
FROM nginx:alpine

# Copia os arquivos estáticos estruturados
COPY src/index.html /usr/share/nginx/html/index.html
COPY src/styles /usr/share/nginx/html/styles
COPY src/assets /usr/share/nginx/html/assets

# Copia o código JavaScript compilado pelo TypeScript
COPY --from=builder /app/dist /usr/share/nginx/html/dist

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
