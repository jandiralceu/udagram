# Udagram - Roadmap & Improvements

Este documento lista os pontos de melhoria identificados para o projeto Udagram.

---

## 📋 Status Atual

| Aspecto                                       | Status          |
| --------------------------------------------- | --------------- |
| Arquitetura Monorepo                          | ✅ Implementado |
| Separação de Microsserviços                   | ✅ Implementado |
| Comunicação entre Serviços (Connect Protocol) | ✅ Implementado |
| Code Quality (ESLint, Prettier, Husky)        | ✅ Implementado |
| Packages Compartilhados                       | ✅ Implementado |
| Validação com Zod                             | ✅ Implementado |
| Autenticação JWT (RS256)                      | ✅ Implementado |
| Database (Drizzle ORM)                        | ✅ Implementado |
| Docker Multi-stage                            | ✅ Implementado |

---

## 🚀 Melhorias Pendentes

### 1. Testes

**Prioridade:** Alta

Atualmente o projeto não possui testes automatizados.

**Ações:**

- [ ] Configurar Vitest ou Jest no monorepo
- [ ] Adicionar testes unitários para services
- [ ] Adicionar testes de integração com Supertest para APIs
- [ ] Adicionar testes para gRPC handlers
- [ ] Configurar coverage reports

**Ferramentas sugeridas:**

- [Vitest](https://vitest.dev/) - Test runner moderno e rápido
- [Supertest](https://github.com/ladjs/supertest) - Testes HTTP
- [@connectrpc/connect](https://connectrpc.com/docs/node/testing) - Guia de testes para Connect

---

### 2. CI/CD Pipeline

**Prioridade:** Alta

Não existe pipeline de integração contínua configurado.

**Ações:**

- [ ] Criar `.github/workflows/ci.yml` para GitHub Actions
- [ ] Configurar jobs: lint → test → build
- [ ] Adicionar build e push de Docker images
- [ ] Configurar deploy automático para staging
- [ ] Adicionar badges de status no README

**Exemplo de pipeline:**

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

---

### 3. Observabilidade

**Prioridade:** Média

O projeto tem logging básico, mas falta observabilidade completa.

**Ações:**

- [ ] Integrar OpenTelemetry para tracing distribuído
- [ ] Adicionar métricas (Prometheus/Grafana)
- [ ] Melhorar health checks para Kubernetes
  - [ ] Endpoint `/health/ready` (readiness probe)
  - [ ] Endpoint `/health/live` (liveness probe)
- [ ] Adicionar correlation IDs nos logs entre serviços

**Ferramentas sugeridas:**

- [OpenTelemetry](https://opentelemetry.io/docs/languages/js/)
- [@opentelemetry/auto-instrumentations-node](https://www.npmjs.com/package/@opentelemetry/auto-instrumentations-node)

---

### 4. Documentação de API

**Prioridade:** Média

APIs REST não possuem documentação formal.

**Ações:**

- [ ] Gerar OpenAPI spec a partir dos schemas Zod
- [ ] Configurar Swagger UI em `/docs`
- [ ] Documentar endpoints gRPC (já definidos em .proto)

**Ferramentas sugeridas:**

- [fastify-swagger](https://github.com/fastify/fastify-swagger)
- [fastify-swagger-ui](https://github.com/fastify/fastify-swagger-ui)
- [zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi)

---

### 5. Error Handling Global

**Prioridade:** Média

Erros não seguem um formato padronizado.

**Ações:**

- [ ] Criar error handler global no Fastify
- [ ] Padronizar formato de erro (RFC 7807 Problem Details)
- [ ] Mapear erros de Zod para respostas amigáveis
- [ ] Mapear erros de Connect/gRPC para HTTP

**Exemplo de formato RFC 7807:**

```json
{
  "type": "https://api.udagram.com/errors/validation",
  "title": "Validation Error",
  "status": 400,
  "detail": "The 'email' field must be a valid email address",
  "instance": "/api/v1/auth/register"
}
```

---

### 6. Secrets Management

**Prioridade:** Alta (para produção)

Secrets estão em arquivos `.env` em texto plano.

**Ações:**

- [ ] Migrar secrets para Kubernetes Secrets em produção
- [ ] Considerar HashiCorp Vault ou AWS Secrets Manager
- [ ] Rotacionar `GRPC_INTERNAL_TOKEN` periodicamente
- [ ] Nunca commitar `.env` com valores reais (usar `.env.example`)

---

### 7. Rate Limiting & Security

**Prioridade:** Média

Proteções de segurança adicionais.

**Ações:**

- [ ] Adicionar rate limiting (`@fastify/rate-limit`)
- [ ] Configurar CORS adequadamente (`@fastify/cors`)
- [ ] Adicionar helmet para headers de segurança (`@fastify/helmet`)
- [ ] Implementar refresh token rotation
- [ ] Adicionar blacklist de tokens revogados

---

### 8. Frontend

**Prioridade:** Baixa (depende do escopo)

**Ações:**

- [ ] Configurar variáveis de ambiente para API URLs
- [ ] Implementar autenticação no frontend
- [ ] Adicionar tratamento de erros global
- [ ] Configurar PWA (opcional)

---

## 📊 Priorização Sugerida

| Fase       | Itens                 | Estimativa  |
| ---------- | --------------------- | ----------- |
| **Fase 1** | Testes + CI/CD        | 1-2 semanas |
| **Fase 2** | Error Handling + Docs | 3-5 dias    |
| **Fase 3** | Observabilidade       | 1 semana    |
| **Fase 4** | Security + Secrets    | 3-5 dias    |

---

## 📝 Notas

- Este documento deve ser atualizado conforme os itens são completados
- Cada item pode ter sua própria issue/PR no GitHub
- Prioridades podem mudar baseado em requisitos do nanodegree

---

_Última atualização: 2026-02-09_
