# 🍔 King Food – Sorteio

Mini-app **PWA** para sorteio do King Food. Clientes se cadastram com nome + WhatsApp, recebem um número da sorte e participam do sorteio. Painel admin para gerenciar e sortear.

## ✨ Funcionalidades

- ✅ Cadastro público (nome + WhatsApp)
- ✅ Geração automática de número único (001–999)
- ✅ Bloqueio de duplicidade por WhatsApp
- ✅ Tela de sucesso com número em destaque + copiar
- ✅ Painel admin protegido por senha
- ✅ Sorteio aleatório com animação
- ✅ Exportar lista em CSV
- ✅ PWA instalável (Add to Home Screen)
- ✅ Funciona offline na tela de sucesso

## 🛠️ Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Vite + React 18 + TypeScript |
| Estilo | Tailwind CSS |
| Rotas | React Router DOM |
| Banco | Supabase (PostgreSQL) |
| PWA | vite-plugin-pwa |
| Deploy | Vercel |

## 📁 Estrutura

```
king-food-sorteio/
├── public/
│   ├── logo-kingfood.png      ← logo (placeholder)
│   └── icons/
│       ├── icon-192.png       ← ícone PWA 192px
│       └── icon-512.png       ← ícone PWA 512px
├── src/
│   ├── components/
│   │   └── Logo.tsx
│   ├── pages/
│   │   ├── Home.tsx           ← cadastro
│   │   ├── Success.tsx        ← número do sorteio
│   │   └── Admin.tsx          ← painel admin
│   ├── lib/
│   │   └── supabase.ts        ← cliente Supabase
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase-schema.sql         ← script SQL
├── .env.example
├── vercel.json
├── vite.config.ts
└── package.json
```

## 🚀 Setup Completo (passo a passo)

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta/entre
2. Clique **New Project** → escolha nome, senha do banco, região
3. Aguarde o provisionamento (~2 min)

### 2. Criar a tabela no banco

1. No painel do Supabase, vá em **SQL Editor** → **New query**
2. Cole o conteúdo do arquivo `supabase-schema.sql` (deste projeto)
3. Clique **Run** — a tabela `participants` será criada com RLS

### 3. Obter as chaves do Supabase

1. Vá em **Project Settings** → **API**
2. Copie:
   - **Project URL** → será `VITE_SUPABASE_URL`
   - **Project API Keys** → **anon public** → será `VITE_SUPABASE_ANON_KEY`

### 4. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...sua-chave...
VITE_ADMIN_PASSWORD=sua-senha-admin-aqui
```

### 5. Rodar localmente

```bash
npm install
npm run dev
```

Acesse **http://localhost:5173**

### 6. Build de produção

```bash
npm run build
npm run preview   # testa o build localmente
```

## 🌐 Deploy na Vercel

### Opção A: CLI

```bash
npm i -g vercel
vercel              # primeira vez: configura o projeto
vercel --prod       # deploy produção
```

### Opção B: Dashboard

1. Faça push do código para o GitHub
2. Acesse [vercel.com](https://vercel.com) → **Add New Project**
3. Importe o repositório
4. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_PASSWORD`
5. Clique **Deploy** ✅

## 🔐 Configurar a senha do admin

A senha do admin é definida na variável `VITE_ADMIN_PASSWORD` no `.env` (local) ou nas Environment Variables da Vercel.

Para acessar o painel: **/admin** → digite a senha.

> ⚠️ **Aviso de segurança:** A senha fica no bundle do frontend (Vite expõe `VITE_*`). Isso é adequado para um mini-app de sorteio simples. Para maior segurança, considere usar Supabase Auth com usuários autenticados.

## 🎨 Personalizar

### Cores

Edite `tailwind.config.js`:

```js
colors: {
  'king-green': '#166534',      // verde escuro
  'king-gold': '#f59e0b',       // dourado
}
```

### Logo

Substitua `public/logo-kingfood.png` pela logo real do King Food (recomendado: 180×180px PNG transparente).

### Ícones PWA

Substitua `public/icons/icon-192.png` e `public/icons/icon-512.png` pelos ícones reais.

## 📋 Script SQL

O arquivo `supabase-schema.sql` contém:

- Criação da tabela `participants`
- Índices únicos em `whatsapp` e `raffle_number`
- Políticas RLS (insert público + select para anon)

## 📄 Licença

Projeto privado — King Food.