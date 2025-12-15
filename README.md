# LISTA DE TAREFAS

## Rotas da API

### Autenticação
- **POST /logar** - Endpoint de login para autenticar o usuário

### Tarefas
- **GET /tasks** - Recuperar todas as tarefas (requer autenticação)
- **GET /task/:id** - Recuperar uma tarefa específica por ID (requer autenticação)
- **POST /tasks** - Criar uma nova tarefa (requer autenticação, valida título)
- **PUT /tasks/:id** - Atualizar uma tarefa existente (requer autenticação, valida título e status)
- **DELETE /tasks/:id** - Deletar uma tarefa por ID (requer autenticação)

### PDF
- **GET /pdf** - Gerar e recuperar um PDF (requer autenticação)

## Uso
1. Iniciar o servidor localmente: `npm run dev`
2. Fazer deploy no Vercel com o `vercel.json` configurado

## Dependências
- Express
- MongoDB/Mongoose
- JWT para autenticação
- Outras dependências listadas no `package.json`
