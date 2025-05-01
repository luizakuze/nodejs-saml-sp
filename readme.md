# Autenticação com SAML2 em Node.js

Esta aplicação Node.js implementa um provedor de serviço (SP) que autentica usuários via protocolo SAML2, utilizando a biblioteca `passport-saml` e um Discovery Service (DS) para integrar-se com provedores de identidade (IdP) em uma federação acadêmica ou institucional.

### Sumário

- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação](#instalação)
- [Execução](#execução)
- [Preparação de Ambiente](#preparação-de-ambiente)
  - [Gerar certificados](#1-gerar-certificados)
  - [Configurar variáveis de ambiente](#2-configurar-variáveis-de-ambiente)

---

## Estrutura do Projeto

```bash
.
├── app.js                         # Arquivo principal da aplicação (entrypoint)
├── bower.json                     # (Opcional) dependências do frontend
├── certs                          # Diretório com os certificados SAML
│   ├── sp-private-key.pem         # Chave privada do SP (para assinatura)
│   └── sp-public-cert.pem         # Certificado público do SP (para metadata)
├── config                         # Configurações e middlewares
│   ├── config.js                  # Carrega variáveis de ambiente e opções do SP
│   ├── federationLoader.js        # Lida com discovery service e metadados dinâmicos
│   ├── metadataDecorator.js       # Ajustes e enriquecimento do metadata SAML
│   ├── passport.js                # Estratégia `passport-saml` configurada
│   └── routes.js                  # Define as rotas da aplicação
├── controllers                    # Lógica dos endpoints
│   ├── homeController.js
│   ├── logoutController.js
│   ├── metadataController.js
│   └── usersController.js
├── metadado-sp.xml               # (opcional) Metadado gerado ou salvo manualmente
├── package.json                   # Dependências e informações do projeto
├── package-lock.json              # Lockfile das dependências
├── Procfile                       # Arquivo para deploy no Heroku ou ambientes semelhantes
├── ssl.js                         # Suporte a HTTPS local (localhost)
├── validate.sh                    # Script de validação de ambiente/configuração
└── views                          # Templates renderizados (Pug)
    ├── error.pug
    ├── home.pug
    └── users.pug
```

---

## Instalação

1. Clone o repositório:

   ```bash
   git clone https://git.rnp.br/gidlab/nodejs-saml-sp
   cd nodejs-saml-sp
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. (Opcional) Configure o domínio local para testes:

   ```bash
   echo "127.0.0.1 sp-node" | sudo tee -a /etc/hosts
   ```

---

## Execução

Execute localmente com HTTPS e logging ativado:

```bash
npm start
```

> O servidor escutará por padrão em `https://sp-node:8000`

---

## Preparação de Ambiente

### 1. Gerar certificados

Se desejar utilizar seus próprios certificados para assinatura e encriptação SAML:

```bash
mkdir -p certs

# Gerar chave privada
openssl genrsa -out certs/sp-private-key.pem 2048

# Gerar certificado público
openssl req -new -x509 -key certs/sp-private-key.pem -out certs/sp-public-cert.pem -days 365
```

Esses arquivos devem corresponder aos caminhos definidos nas variáveis de ambiente.

---

### 2. Configurar variáveis de ambiente

Você pode criar um arquivo `.env` ou definir diretamente no seu sistema as seguintes variáveis:

```ini
PORT=8000
SAML_ENTITY_ID=https://sp-node:8000/saml2/metadata/
SAML_CALLBACK_URL=https://sp-node:8000/login/callback
SAML_DISCOVERY_SERVICE_URL=https://ds.cafeexpresso.rnp.br/WAYF.php
SAML_METADATA_URL=https://ds.cafeexpresso.rnp.br/metadata/ds-metadata.xml
PRIVATE_KEY_PATH=certs/sp-private-key.pem
CERTIFICATE_PATH=certs/sp-public-cert.pem
```

- `SAML_ENTITY_ID`: URL de identificação do SP (exposta no metadata)
- `SAML_CALLBACK_URL`: URL onde o IdP retornará a resposta SAML
- `SAML_DISCOVERY_SERVICE_URL`: URL do DS da federação (ex: Café Expresso)
- `PRIVATE_KEY_PATH` / `CERTIFICATE_PATH`: caminhos para a chave privada e certificado do SP

---

Agora a aplicação está pronta para participar de um fluxo de autenticação federado via SAML2.