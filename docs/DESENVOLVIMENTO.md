# 👨‍💻 Guia de Desenvolvimento

## 🚀 Ambiente de Desenvolvimento

### Pré-requisitos
- Node.js 18+
- npm 9+
- Editor: VS Code (recomendado)

### Extensões VS Code Recomendadas
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- SQLite Viewer

---

## 🔧 Configuração Inicial

### Backend

1. **Instalar dependências**
```bash
cd backend
npm install
```

2. **Arquivo .env (opcional)**
```env
PORT=3001
NODE_ENV=development
```

3. **Iniciar com watch mode**
```bash
npm run dev
```

### Frontend

1. **Instalar dependências**
```bash
cd frontend
npm install
```

2. **Iniciar dev server**
```bash
npm run dev
```

---

## 📁 Estrutura de Pastas

### Backend
```
backend/
├── server.js           # Arquivo principal com todas as rotas
├── db.js               # Configuração SQLite e schemas
├── crypto.js           # Utilitários de criptografia
├── seed_30_loans.js    # Dados de teste
└── package.json
```

**Dica**: Todo o código do backend está em um único arquivo `server.js` por simplicidade.

### Frontend
```
frontend/src/
├── pages/              # Componentes de páginas
├── components/         # Componentes reutilizáveis
├── context/            # Context API (estado global)
├── utils/              # Funções utilitárias
├── styles/             # Estilos CSS
└── assets/             # Imagens e arquivos estáticos
```

---

## 🔄 Workflow de Desenvolvimento

### Adicionar Nova Feature

#### 1. Definir o Endpoint no Backend

Em `backend/server.js`:

```javascript
// Listar recursos
app.get('/api/section', authenticate, (req, res) => {
  try {
    const query = db.prepare('SELECT * FROM table WHERE user_id = ?');
    const data = query.all(req.user.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Criar recurso
app.post('/api/section', authenticate, (req, res) => {
  try {
    const { field1, field2 } = req.body;
    
    // Validações
    if (!field1) {
      return res.status(400).json({ error: 'Field1 é obrigatório' });
    }
    
    const stmt = db.prepare('INSERT INTO table (user_id, field1, field2) VALUES (?, ?, ?)');
    const result = stmt.run(req.user.id, field1, field2);
    
    res.status(201).json({ id: result.lastInsertRowid, field1, field2 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### 2. Criar Context/Hook no Frontend

Em `frontend/src/context/MyContext.jsx`:

```jsx
import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

const MyContext = createContext();

export function MyProvider({ children }) {
  const { token } = useAuth();
  
  const fetchData = async () => {
    try {
      const res = await fetch('/api/section', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Erro:', e);
    }
  };
  
  const addItem = async (data) => {
    try {
      const res = await fetch('/api/section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Erro:', e);
    }
  };
  
  return (
    <MyContext.Provider value={{ fetchData, addItem }}>
      {children}
    </MyContext.Provider>
  );
}

export function useMyContext() {
  return useContext(MyContext);
}
```

#### 3. Criar Página/Componente

Em `frontend/src/pages/MyPage/MyPage.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import { useMyContext } from '../../context/MyContext';

export function MyPage() {
  const { fetchData, addItem } = useMyContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchData();
    if (data) {
      setItems(data);
    }
    setLoading(false);
  };

  const handleAdd = async (newItem) => {
    const result = await addItem(newItem);
    if (result) {
      await loadData();
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="my-page">
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

#### 4. Adicionar Rota no App.jsx

Em `frontend/src/App.jsx`:

```jsx
import { MyPage } from './pages/MyPage/MyPage';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'mypage' && <MyPage />}
      {/* outras rotas */}
    </Layout>
  );
}
```

---

## 🐛 Debugging

### Backend

1. **Logs no console**
```javascript
console.log('Debug info:', data);
console.error('Erro:', error);
```

2. **Inspecionar banco de dados**
- Use extensão SQLite Viewer no VS Code
- Abra `backend/poupa_pila.db`

### Frontend

1. **DevTools do navegador**
- F12 → Console para logs
- Network tab para ver requisições
- Application tab para localStorage

2. **React DevTools**
- Extensão do navegador
- Inspect components e state

---

## 📝 Convenções de Código

### Naming

**Variáveis e Funções** (camelCase):
```javascript
const userName = "João";
function handleClick() {}
const calculateTotal = () => {};
```

**Classes** (PascalCase):
```javascript
class UserManager {}
function MyComponent() {}
```

**Constantes** (UPPERCASE):
```javascript
const API_BASE_URL = 'http://localhost:3001';
const MAX_RETRIES = 3;
```

### Estrutura de Arquivo

**Backend**:
```javascript
// 1. Imports
const express = require('express');
const { db } = require('./db');

// 2. Configuração
const router = express.Router();

// 3. Helpers/Utilidades
const validateData = (data) => {};

// 4. Rotas
app.get('/api/path', authenticate, (req, res) => {});

// 5. Exports (se necessário)
module.exports = router;
```

**Frontend**:
```jsx
// 1. Imports
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './MyComponent.css';

// 2. Interfaces/Types (se usar TypeScript)
// ...

// 3. Helper functions
const helper = () => {};

// 4. Component
export function MyComponent({ prop1, prop2 }) {
  // Hooks
  // State
  // Effects
  // Handlers
  // Render
}
```

---

## 🧪 Testes Manuais

### Testar Nova Feature

1. **Criar dados de teste**
```bash
cd backend
node seed_30_loans.js
```

2. **Fazer login**
- Username: `testuser`
- Senha: `test123`

3. **Testar funcionalidade**
- Testar criação
- Testar edição
- Testar deleção
- Testar filtros
- Testar validações

4. **Verificar banco de dados**
- Abrir `poupa_pila.db` com SQLite Viewer
- Confirmar dados foram salvos corretamente

### Testar API

```bash
# Usar curl ou Postman

# Listar
curl -X GET http://localhost:3001/api/section \
  -H "Authorization: Bearer TOKEN_AQUI"

# Criar
curl -X POST http://localhost:3001/api/section \
  -H "Authorization: Bearer TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"field": "value"}'
```

---

## 🔍 Padrões Comuns

### Padrão: Fetch com Tratamento de Erro

```javascript
try {
  const res = await fetch('/api/endpoint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Erro na requisição');
  }

  return await res.json();
} catch (error) {
  console.error('Erro:', error);
  throw error;
}
```

### Padrão: Validação de Entrada

```javascript
// Backend
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Frontend
const validateForm = (data) => {
  if (!data.name) return 'Nome é obrigatório';
  if (data.amount <= 0) return 'Valor deve ser positivo';
  return null;
};
```

---

## 📦 Adicionar Dependência

### Backend

```bash
cd backend
npm install nova-dependencia
```

Depois usar em `server.js`:
```javascript
const novo = require('nova-dependencia');
```

### Frontend

```bash
cd frontend
npm install nova-dependencia
```

Depois usar nos componentes:
```jsx
import novo from 'nova-dependencia';
```

---

## 🚀 Build e Deploy

### Frontend Build

```bash
cd frontend
npm run build
```

Cria pasta `dist/` com arquivos otimizados prontos para produção.

### Backend em Produção

Não precisa de build especial. Apenas:
1. Copiar arquivos `.js`
2. Instalar dependências: `npm install --production`
3. Iniciar: `node server.js`

---

## 📊 Performance

### Frontend

- **Lazy loading**: Carregar rotas sob demanda
- **Code splitting**: Dividir bundle
- **Memoization**: `React.memo` para componentes pesados
- **Otimizar renders**: Evitar renders desnecessários

### Backend

- **Índices**: Adicionar índices no banco de dados
- **Caching**: Cachear dados frequentes
- **Paginação**: Não trazer todos os dados de uma vez
- **Queries otimizadas**: SELECT apenas colunas necessárias

---

## 🔐 Segurança

### Checklist

- [ ] Validar entrada de usuário (backend E frontend)
- [ ] Não expor informações sensíveis
- [ ] Usar HTTPS em produção
- [ ] Hashear senhas (bcrypt)
- [ ] Validar tokens
- [ ] CORS configurado corretamente
- [ ] SQL Injection: usar prepared statements
- [ ] XSS: React escapa HTML automaticamente

---

## 📚 Recursos Úteis

### Documentação
- [React Docs](https://react.dev)
- [Express.js Docs](https://expressjs.com)
- [SQLite Docs](https://www.sqlite.org/docs.html)

### Ferramentas
- [Postman](https://www.postman.com/) - Testar API
- [VS Code](https://code.visualstudio.com/) - Editor
- [Git](https://git-scm.com/) - Controle de versão

---

## 💡 Troubleshooting

### Problema: "Port 3001 already in use"
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

### Problema: Banco de dados corrompido
```bash
rm backend/poupa_pila.db
# Reiniciar backend
npm run dev
```

### Problema: Module not found
```bash
# Reinstalar dependências
npm install

# Limpar cache
npm cache clean --force
```

### Problema: Requisição CORS bloqueada
Verificar:
1. Backend CORS está configurado?
2. Token no header está correto?
3. URL da API está correta?

---

## 🎯 Next Steps

1. Ler [API.md](./API.md) para entender endpoints
2. Ler [BANCO_DE_DADOS.md](./BANCO_DE_DADOS.md) para entender schema
3. Ler [COMPONENTES.md](./COMPONENTES.md) para entender UI
4. Explorar código existente
5. Começar a desenvolver features!

---

**Dúvidas?** Consulte os arquivos de documentação específica ou explore o código-fonte diretamente.
