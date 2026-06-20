# 📖 Índice de Documentação

## 🎯 Por Onde Começar?

### Sou Novo no Projeto
1. **[README.md](./README.md)** - Visão geral e features
2. **[SETUP.md](./SETUP.md)** - Como instalar e rodar
3. **[ARQUITETURA.md](./ARQUITETURA.md)** - Entender a estrutura

### Quero Desenvolver
1. **[DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md)** - Guia para devs
2. **[COMPONENTES.md](./COMPONENTES.md)** - Componentes React
3. **[API.md](./API.md)** - Endpoints disponíveis

### Preciso Entender os Dados
1. **[BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md)** - Schema e tabelas
2. **[FUNCIONALIDADES.md](./FUNCIONALIDADES.md)** - O que cada recurso faz

---

## 📚 Documentação Completa

| Arquivo | Descrição | Para Quem |
|---------|-----------|----------|
| **README.md** | Visão geral do projeto e features principais | Todos |
| **SETUP.md** | Como instalar e rodar o projeto | Devs, QA, DevOps |
| **ARQUITETURA.md** | Estrutura técnica da aplicação | Devs, Arquitetos |
| **FUNCIONALIDADES.md** | Features e como usar | PMs, Usuários, QA |
| **BANCO_DE_DADOS.md** | Schema, tabelas e relacionamentos | Devs, DBAs |
| **API.md** | Endpoints, request/response | Devs frontend/backend |
| **COMPONENTES.md** | Componentes React e Context API | Devs frontend |
| **DESENVOLVIMENTO.md** | Guia para desenvolvedores | Devs |
| **TROUBLESHOOTING.md** | Problemas comuns e soluções | Devs, QA, Ops |
| **INDICE.md** | Este arquivo | Todos |

---

## 🗺️ Mapa Mental

```
Poupa Pila
├── Frontend (React + Vite)
│   ├── Páginas (9 páginas principais)
│   ├── Componentes (modais, cards, inputs)
│   ├── Context API (Auth, Finance, Vault)
│   └── Estilos (CSS + Design Tokens)
├── Backend (Node.js + Express)
│   ├── Rotas de API
│   ├── Autenticação
│   ├── Banco de Dados (SQLite)
│   └── Lógica de Negócio
├── Banco de Dados (10+ tabelas)
└── Documentação (7 arquivos)
```

---

## 🔍 Procurando por algo específico?

### Como integrar com outro sistema?
→ Veja [API.md](./API.md)

### Quais são todas as funcionalidades?
→ Veja [FUNCIONALIDADES.md](./FUNCIONALIDADES.md)

### Como adicionar um novo campo?
→ Veja [DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md)

### Qual é o schema do banco?
→ Veja [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md)

### Como criar um novo componente?
→ Veja [COMPONENTES.md](./COMPONENTES.md)

### O que fazer quando algo não funciona?
→ Veja [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### Como preparar o ambiente?
→ Veja [SETUP.md](./SETUP.md)

---

## 🎓 Aprenda por Tópico

### Autenticação
- [SETUP.md](./SETUP.md#primeiro-acesso) - Como fazer login
- [ARQUITETURA.md](./ARQUITETURA.md#fluxo-de-autenticação) - Como funciona
- [API.md](./API.md#autenticação) - Endpoints de auth

### Transações
- [FUNCIONALIDADES.md](./FUNCIONALIDADES.md#transações) - Como usar
- [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md#4-transactions) - Schema
- [API.md](./API.md#transações) - Endpoints

### Empréstimos
- [FUNCIONALIDADES.md](./FUNCIONALIDADES.md#empréstimos) - Como usar
- [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md#5-loans) - Schema
- [API.md](./API.md#empréstimos) - Endpoints

### Compartilhamento
- [FUNCIONALIDADES.md](./FUNCIONALIDADES.md#acesso-compartilhado) - Como usar
- [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md#10-user_access) - Schema
- [API.md](./API.md#acesso-compartilhado) - Endpoints

---

## 📊 Quick Reference

### Pastas Principais
- `backend/` - Servidor Node.js
- `frontend/src/` - Código React
  - `pages/` - Páginas principais
  - `components/` - Componentes reutilizáveis
  - `context/` - Estado global
  - `utils/` - Funções utilitárias
- `docs/` - Documentação (aqui!)

### Arquivos Importantes
- `backend/server.js` - Todo o backend em um arquivo
- `backend/db.js` - Banco de dados
- `backend/crypto.js` - Criptografia
- `frontend/src/App.jsx` - App principal
- `frontend/src/main.jsx` - Entrada

### Portas
- Backend: `3001`
- Frontend: `5173` (Vite)

### Banco de Dados
- Arquivo: `backend/poupa_pila.db`
- Tipo: SQLite

---

## 🚀 Workflows Comuns

### Adicionar Nova Feature
1. Criar endpoint no backend
2. Criar Context/Hook no frontend
3. Criar componente/página
4. Adicionar rota
5. Testar
6. Documentar

→ Detalhes em [DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md#workflow-de-desenvolvimento)

### Fazer Deploy
1. Rodar build do frontend
2. Copiar `dist/` para servidor
3. Copiar backend para servidor
4. Instalar dependências
5. Rodar backend em produção

→ Detalhes em [DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md#build-e-deploy)

### Debugar Issue
1. Verificar logs do backend
2. Verificar console do navegador
3. Verificar Network tab
4. Consultar banco de dados
5. Revisar código

→ Detalhes em [DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md#debugging)

---

## 📞 Convenções

### Nomeação
- **Arquivos**: camelCase para JS, PascalCase para React
- **Variáveis**: camelCase
- **Constantes**: UPPERCASE
- **Classes/Componentes**: PascalCase

### Formatação
- Indentação: 2 espaços
- ESLint configurado
- Prettier recomendado

### Commits (recomendado)
- `feat: nova funcionalidade`
- `fix: correção de bug`
- `docs: atualização de documentação`
- `refactor: refatoração de código`

---

## 🔗 Links Úteis

### Dependências
- [React](https://react.dev)
- [Express](https://expressjs.com)
- [SQLite](https://www.sqlite.org)
- [Vite](https://vitejs.dev)
- [Lucide React (ícones)](https://lucide.dev)

### Ferramentas
- [VS Code](https://code.visualstudio.com/)
- [Postman](https://www.postman.com/)
- [Git](https://git-scm.com/)

### Recursos
- [MDN Web Docs](https://developer.mozilla.org/)
- [JavaScript.info](https://javascript.info)
- [React Router](https://reactrouter.com)

---

## ✅ Checklist para Novo Dev

- [ ] Ler README.md
- [ ] Executar SETUP.md
- [ ] Ler ARQUITETURA.md
- [ ] Ler DESENVOLVIMENTO.md
- [ ] Explorar código do backend
- [ ] Explorar código do frontend
- [ ] Rodar seed de dados de teste
- [ ] Fazer login e explorar UI
- [ ] Adicionar uma pequena feature
- [ ] Consultar documentação quando duvidar

---

## 📝 Atualizar Documentação

Se fizer mudanças na arquitetura ou features:
1. Atualizar arquivo relevante
2. Atualizar README.md se for mudança maior
3. Atualizar este índice se necessário

---

**Última atualização**: Junho 2024

**Próxima leitura**: Comece por [README.md](./README.md) se for novo no projeto.
