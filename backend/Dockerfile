# Estágio de compilação (Build Stage)
FROM maven:3.8.8-eclipse-temurin-17 AS builder
WORKDIR /app

# Copia apenas o pom.xml primeiro para cachear as dependências do Maven
COPY pom.xml .
RUN mvn dependency:go-offline

# Copia o código-fonte e compila gerando o .war
COPY src ./src
RUN mvn clean package -DskipTests

# Estágio de execução (Runtime Stage)
FROM tomcat:9.0-jre17-temurin

# Limpa a aplicação padrão do Tomcat
RUN rm -rf /usr/local/tomcat/webapps/ROOT

# Copia o WAR gerado no build e o renomeia para ROOT.war para responder em "/"
COPY --from=builder /app/target/*.war /usr/local/tomcat/webapps/ROOT.war

EXPOSE 8080
CMD ["catalina.sh", "run"]
