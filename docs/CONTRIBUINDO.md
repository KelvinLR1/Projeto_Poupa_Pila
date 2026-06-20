# 🎯 Guia de Contribuição

## Bem-vindo!

Obrigado por considerar contribuir para o Poupa Pila! Todas as contribuições são bem-vindas.

---

## 📋 Antes de Começar

1. **Leia a documentação**
   - [README.md](./README.md) - Visão geral
   - [ARQUITETURA.md](./ARQUITETURA.md) - Estrutura
   - [DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md) - Guia dev

2. **Configure o ambiente**
   - Siga [SETUP.md](./SETUP.md)
   - Rodar backend e frontend localmente

3. **Explore o código**
   - Entenda a estrutura
   - Rode o seed de dados
   - Teste as funcionalidades existentes

---

## 🔍 Tipos de Contribuição

### 🐛 Bug Fixes
Encontrou um bug?

1. **Abrir issue** (se não existir)
   - Descrever o problema
   - Como reproduzir
   - Comportamento esperado

2. **Criar branch**:
   ```bash
   git checkout -b fix/descricao-do-bug
   ```

3. **Fazer fix**:
   - Escrever código
   - Testar localmente
   - Adicionar testes (se necessário)

4. **Commit e push**:
   ```bash
   git add .
   git commit -m "fix: descricao do bug"
   git push origin fix/descricao-do-bug
   ```

5. **Abrir Pull Request**
   - Descrever alterações
   - Referencing issue

### ✨ Novas Features
Quer adicionar funcionalidade?

1. **Discutir primeiro**
   - Abrir issue e descrever feature
   - Obter feedback
   - Alinhar com maintainers

2. **Implementar**:
   - Siga [DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md#workflow-de-desenvolvimento)
   - Escrever testes
   - Atualizar documentação

3. **Documentar**
   - Atualizar [FUNCIONALIDADES.md](./FUNCIONALIDADES.md)
   - Atualizar [API.md](./API.md) se necessário
   - Adicionar exemplos

### 📚 Documentação
Melhorar documentação?

1. **Corrigir erros**
   - Encontrou typo?
   - Siga padrão de documentação
   - Teste exemplos

2. **Adicionar conteúdo**
   - Guias
   - Exemplos
   - Clarificações

3. **Melhorar formatação**
   - Markdown consistente
   - Links corretos
   - Imagens quando útil

---

## 🔧 Workflow de Desenvolvimento

### 1. Fork e Clone

```bash
git clone https://github.com/SEU_USUARIO/Projeto_Poupa_Pila.git
cd Projeto_Poupa_Pila
```

### 2. Criar Branch

```bash
# Usar padrão descritivo
git checkout -b feature/nova-funcionalidade
git checkout -b fix/corrige-bug
git checkout -b docs/melhor-readme
```

### 3. Fazer Alterações

```bash
# Editar arquivos
# Testar localmente

# Instalar/usar as devtools
npm install
npm run dev
npm run lint
```

### 4. Commit

```bash
# Commit com mensagem clara
git add .
git commit -m "feat: descricao clara da alteracao"
```

**Convenção de commit**:
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `refactor:` - Refatoração sem mudança de feature
- `test:` - Testes
- `chore:` - Dependências, setup, etc

### 5. Push

```bash
git push origin feature/nova-funcionalidade
```

### 6. Pull Request

1. Ir ao GitHub
2. Clique em "New Pull Request"
3. Descreva suas alterações
4. Aguarde feedback

---

## 📐 Padrões de Código

### Backend (Node.js)

```javascript
// ✅ Bom
function handleGetAccounts(req, res) {
  try {
    const userId = req.user.id;
    const query = db.prepare('SELECT * FROM accounts WHERE user_id = ?');
    const accounts = query.all(userId);
    res.json(accounts);
  } catch (error) {
    console.error('Erro ao buscar contas:', error);
    res.status(500).json({ error: 'Erro ao buscar contas' });
  }
}

// ❌ Ruim
app.get('/api/accounts', (req, res) => {
  let result = db.prepare('SELECT * FROM accounts').all();
  res.json(result);
});
```

### Frontend (React)

```jsx
// ✅ Bom
export function AccountCard({ account, onEdit }) {
  const handleClick = () => onEdit(account.id);
  
  return (
    <div className="account-card" onClick={handleClick}>
      <h3>{account.name}</h3>
      <p>R$ {account.balance.toFixed(2)}</p>
    </div>
  );
}

// ❌ Ruim
function AccountCard({acc, edit}) {
  return <div onClick={() => edit(acc.id)}>{acc.name} {acc.balance}</div>;
}
```

### Convenções

- **Indentação**: 2 espaços
- **Aspas**: Duplas em JS, simples em strings internas
- **Ponto-e-vírgula**: Sempre use
- **Nomes**: Descritivos e em inglês
- **Comentários**: Apenas para lógica complexa

---

## ✅ Checklist Antes de PR

- [ ] Código segue os padrões do projeto
- [ ] Sem console.log() desnecessário
- [ ] Erro handling implementado
- [ ] Testado localmente
- [ ] Documentação atualizada
- [ ] Commits com mensagens claras
- [ ] Branch atualizado com main

---

## 🧪 Teste Local

Antes de fazer PR:

```bash
# 1. Instalar dependências
npm install

# 2. Rodar lint
npm run lint

# 3. Testar funcionalidade
npm run dev

# 4. Verificar no navegador
# http://localhost:5173
```

---

## 📝 Atualizar Documentação

Quando adiciona feature, atualize:

1. **[FUNCIONALIDADES.md](./FUNCIONALIDADES.md)** - Como usar
2. **[API.md](./API.md)** - Novos endpoints
3. **[BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md)** - Se adiciona tabelas
4. **[COMPONENTES.md](./COMPONENTES.md)** - Novo componentes
5. **[README.md](./README.md)** - Se for mudança importante

---

## 🚀 Tips para PR ser Aceito Rápido

1. ✅ PR pequeno e focado
   - Uma feature por PR
   - Não misturar bug fixes com refactoring

2. ✅ Descrição clara
   - O que foi feito?
   - Por quê?
   - Como testar?

3. ✅ Código limpo
   - Sem TODO comentários
   - Sem debug console.log()
   - Formatado corretamente

4. ✅ Documentação
   - Atualizar docs
   - Adicionar exemplos se necessário
   - Links corretos

5. ✅ Testes
   - Testar localmente completamente
   - Testar edge cases
   - Testar mobile se UI

---

## ❌ O Que Evitar

- ❌ PR gigante com múltiplas features
- ❌ Código sem tratamento de erro
- ❌ Quebrar features existentes
- ❌ Documentação desatualizada
- ❌ Código sem testes
- ❌ Commits com mensagens genéricas
- ❌ Mudanças não relacionadas ao PR

---

## 🤝 Code Review

### Ao Receber Review

- 👍 Receba feedback como construtivo
- 🔄 Faça mudanças solicitadas
- 💬 Pergunte se não entender
- 📞 Abra discussão se discordar

### Ao Revisar Código

- 👀 Revisar com cuidado
- 💡 Oferecer sugestões construtivas
- ✅ Aprovar quando estiver bom
- 🚫 Rejeitar se não atender padrões

---

## 📚 Recursos

### Documentação
- [DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md)
- [ARQUITETURA.md](./ARQUITETURA.md)
- [API.md](./API.md)
- [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md)
- [COMPONENTES.md](./COMPONENTES.md)

### Ferramentas
- Git: https://git-scm.com/
- Node.js: https://nodejs.org/
- VS Code: https://code.visualstudio.com/

---

## 🎯 Ideias para Contribuir

Se não sabe por onde começar, aqui estão ideias:

- [ ] Melhorar tratamento de erro
- [ ] Adicionar validações
- [ ] Melhorar performance
- [ ] Corrigir bugs conhecidos
- [ ] Melhorar documentação
- [ ] Adicionar testes
- [ ] Melhorar UI/UX
- [ ] Otimizar queries
- [ ] Adicionar novas features
- [ ] Criar exemplos

---

## 📞 Dúvidas?

- Abra uma issue
- Consulte documentação
- Pergunte em código review

---

## 🙏 Obrigado!

Suas contribuições tornam este projeto melhor. Muito obrigado!

---

**Última atualização**: Junho 2024
