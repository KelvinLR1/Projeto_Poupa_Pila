# 🔧 Troubleshooting - Problemas Comuns

## ❌ Erro: Port 3001 Already in Use

### Causa
Outra aplicação está usando a porta 3001.

### Solução

**Windows**:
```powershell
# Encontrar o processo
netstat -ano | findstr :3001

# Matar o processo (substitua PID)
taskkill /PID 12345 /F
```

**Linux/Mac**:
```bash
# Encontrar o processo
lsof -i :3001

# Matar o processo
kill -9 PID_AQUI
```

**Alternativa**: Usar outra porta
```bash
cd backend
PORT=3002 npm start
```

---

## ❌ Erro: Cannot GET /

Acessar `http://localhost:3001` diretamente retorna erro.

### Causa
O backend não tem rota raiz (`/`).

### Solução
Acessar `http://localhost:5173` (frontend) em vez do backend diretamente.

---

## ❌ Erro: CORS Policy Blocked

No console do navegador:
```
Access to XMLHttpRequest at 'http://localhost:3001/...' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

### Causa
O backend não está rodando ou CORS não está configurado.

### Solução

1. **Verificar se backend está rodando**:
```bash
cd backend
npm start
```

2. **Verificar URL da API**
- Confirmar que frontend está tentando conectar em `http://localhost:3001`

3. **Verificar CORS no backend**
- Em `server.js`, verificar middleware CORS:
```javascript
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## ❌ Erro: 401 Unauthorized

```
{"error": "Token não fornecido."}
```

### Causa
- Token expirado
- Token não está sendo enviado
- Sessão deletada

### Solução

1. **Fazer logout e login novamente**
   - Limpar localStorage
   - Fazer login

2. **Verificar se token está sendo enviado**
   - Abrir DevTools → Network
   - Ver se header `Authorization` existe

3. **Verificar se sessão existe no banco**
   - Abrir `poupa_pila.db` com SQLite Viewer
   - Verificar tabela `sessions`

---

## ❌ Erro: 403 Forbidden

```
{"error": "Acesso apenas leitura..."}
```

### Causa
Usuário tem permissão read-only mas tentou modificar dados.

### Solução

1. **Se for acesso compartilhado**:
   - Dono da conta deve mudar permissão para "read-write"
   - Em Configurações → Compartilhamento

2. **Se for usuário normal**:
   - Verificar se há restrição no banco
   - Checar tabela `user_access`

---

## ❌ Erro: Module Not Found

```
Error: Cannot find module 'nome-modulo'
```

### Causa
Dependência não foi instalada.

### Solução

**Backend**:
```bash
cd backend
npm install
npm start
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

---

## ❌ Erro: Database Locked

```
Error: database is locked
```

### Causa
SQLite está sendo acessado por múltiplos processos simultaneamente.

### Solução

1. **Fechar outras conexões do banco**
   - Fechar SQLite Viewer
   - Fechar outras abas/processos

2. **Reiniciar backend**:
```bash
npm run dev
```

3. **Se persistir**: Deletar arquivo e recriar
```bash
rm backend/poupa_pila.db
npm run dev
```

---

## ❌ Erro: Cannot Read Property 'xxx' of Undefined

Erro no console:
```
TypeError: Cannot read property 'xxx' of undefined
```

### Causa
Tentando acessar propriedade de um objeto que não existe ou é null.

### Solução

**Frontend**:
```jsx
// ❌ Errado
return <div>{user.name}</div>;

// ✅ Certo
return <div>{user?.name || 'N/A'}</div>;
```

**Backend**:
```javascript
// ❌ Errado
const name = user.name;

// ✅ Certo
const name = user?.name || 'Unknown';
```

---

## ❌ Erro: Transação não Aparece

Criou uma transação mas não aparece na lista.

### Causa
- Transação foi criada em outra conta
- Página não foi atualizada
- Erro silencioso no backend

### Solução

1. **Verificar conta selecionada**
   - Se filtrado, mudar filtro

2. **Recarregar a página**
   - F5 ou Ctrl+Shift+R

3. **Verificar console do navegador**
   - Ver se há erro

4. **Verificar banco de dados**
   - Abrir SQLite Viewer
   - Verificar tabela `transactions`

---

## ❌ Erro: Saldo Incorreto

O saldo não corresponde ao esperado.

### Causa
- Transação não foi criada/deletada corretamente
- Conflito de sincronização
- Erro ao processar transferência

### Solução

1. **Recarregar página**
   - Às vezes é apenas cache

2. **Verificar todas as transações**
   - Filtrar por conta
   - Somar manualmente

3. **Fazer reconciliação**
   - Em Transações → Reconciliar
   - Comparar com extrato

4. **Contatar suporte**
   - Se for erro persistente

---

## ❌ Erro: Senha Não Funciona

Não consegue fazer login.

### Causa
- Senha incorreta
- Username incorreto
- Usuário não existe

### Solução

1. **Verificar username**
   - Username é case-sensitive? Não, converte para lowercase
   - Verificar se tem espaços

2. **Registrar novo usuário**
   - Marcar "Registrar novo usuário"
   - Preencher username, senha e nome

3. **Verificar no banco de dados**
   - Abrir SQLite Viewer
   - Verificar tabela `users`

---

## ❌ Erro: Upload OFX não Funciona

Arquivo OFX não é importado.

### Causa
- Arquivo inválido
- Formato não suportado
- Erro no parser

### Solução

1. **Verificar formato do arquivo**
   - Confirmar que é um arquivo `.ofx` válido
   - Abrir em editor de texto para verificar

2. **Verificar console do navegador**
   - Ver mensagem de erro específica

3. **Usar arquivo de exemplo**
   - Testar com arquivo OFX de outra fonte

4. **Verificar backend logs**
   - Ver output no terminal

---

## ❌ Erro: Context é Undefined

```
TypeError: xxx is undefined (reading 'xxx')
```

### Causa
- Context não está envolvendo o componente
- Hook foi usado fora do Provider

### Solução

**Verificar App.jsx**:
```jsx
function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <VaultProvider>
          {/* Conteúdo */}
        </VaultProvider>
      </FinanceProvider>
    </AuthProvider>
  );
}
```

**Verificar import do hook**:
```jsx
import { useFinance } from '../context/FinanceContext';
```

---

## ❌ Erro: Npm Install Muito Lento

### Causa
- Conexão lenta
- Registry do npm congestionado

### Solução

1. **Usar npm cache**:
```bash
npm install --prefer-offline
```

2. **Limpar cache**:
```bash
npm cache clean --force
npm install
```

3. **Usar yarn** (se instalado):
```bash
yarn install
```

---

## ❌ Erro: Build Falha

```
npm run build
```

Retorna erro.

### Causa
- Erro de sintaxe
- Import quebrado
- Dependência faltando

### Solução

1. **Verificar erros de sintaxe**
   - Rodar ESLint:
   ```bash
   npm run lint
   ```

2. **Verificar imports**
   - Confirmar que todos os arquivos existem

3. **Reinstalar dependências**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

---

## ❌ Erro: Vite não Inicia

```
Error when starting dev server:
```

### Causa
- Porta ocupada
- Erro de configuração
- Arquivo quebrado

### Solução

1. **Verificar porta 5173**:
```bash
netstat -ano | findstr :5173
```

2. **Limpar cache Vite**:
```bash
rm -rf node_modules/.vite
npm run dev
```

3. **Verificar vite.config.js**
   - Confirmar que está correto

---

## ❌ Erro: Browser não Recarrega

Fazer mudança no código mas frontend não atualiza (HMR não funciona).

### Causa
- HMR desconectado
- Erro no webpack/vite

### Solução

1. **Recarregar página manualmente**
   - Ctrl+Shift+R (hard refresh)

2. **Reiniciar dev server**:
```bash
# Ctrl+C para parar
npm run dev
```

3. **Limpar browser cache**
   - DevTools → Settings → Clear site data

---

## ❌ Erro: Dados Desaparecem após Logout

Fazer logout e login com outro usuário mostra dados do primeiro.

### Causa
- Context não está limpando dados
- localStorage não está sendo limpo

### Solução

**Em AuthContext.jsx**, no `logout()`:
```javascript
const logout = () => {
  localStorage.removeItem('poupa_pila_token');
  localStorage.removeItem('poupa_pila_user');
  setUser(null);
  setToken(null);
  // Limpar Finance context também
};
```

---

## ⚠️ Performance Lenta

### Causa
- Muitas transações na lista
- Componentes re-renderizando
- Backend lento

### Solução

1. **Filtrar por período**
   - Não trazer 5 anos de dados

2. **Usar React.memo**
   - Para componentes pesados

3. **Otimizar queries**
   - Adicionar índices no banco

4. **Usar paginação**
   - Trazer dados em chunks

---

## ✅ Teste de Conectividade

Se tudo está quebrado:

```bash
# 1. Backend está rodando?
curl http://localhost:3001

# 2. Frontend está rodando?
curl http://localhost:5173

# 3. Banco existe?
ls backend/poupa_pila.db

# 4. Dependências instaladas?
npm list

# 5. Logs do backend
npm run dev  # Ver output
```

---

## 📞 Quando Tudo Falha

### Reset Completo

```bash
# 1. Parar tudo (Ctrl+C em todos os terminais)

# 2. Deletar tudo
rm backend/poupa_pila.db
rm -rf backend/node_modules
rm -rf frontend/node_modules
rm -rf frontend/dist

# 3. Reinstalar
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 4. Recriar dados
cd backend && node seed_30_loans.js && cd ..

# 5. Iniciar novamente
# Terminal 1: cd backend && npm run dev
# Terminal 2: cd frontend && npm run dev
```

### Última Tentativa: Limpar Cache de Sistema

**Windows**:
```powershell
npm cache clean --force
```

**Linux/Mac**:
```bash
npm cache clean --force
rm -rf ~/.npm
```

---

## 📋 Checklist de Troubleshooting

- [ ] Backend está rodando em 3001?
- [ ] Frontend está rodando em 5173?
- [ ] Token está no localStorage?
- [ ] CORS está ativado?
- [ ] Banco de dados existe?
- [ ] Dependências estão instaladas?
- [ ] Arquivos não têm erros de sintaxe?
- [ ] Todas as importações estão corretas?
- [ ] Node.js é versão 18+?

---

**Ainda não resolveu?** Consulte:
1. [DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md#debugging)
2. [SETUP.md](./SETUP.md#problemas-comuns)
3. Logs do console/terminal

---

**Última atualização**: Junho 2024
