# Autenticação com SAML2 em Node.js

Esta aplicação Node.js implementa um provedor de serviço (SP) que autentica usuários via protocolo SAML2, utilizando a biblioteca `passport-saml` e um Discovery Service (DS) para integrar-se com provedores de identidade (IdP) em uma federação acadêmica ou institucional.


### Sumário

- [Estrutura do Projeto](#estrutura-do-projeto)
- [Execução](#execução)
- [Preparando ambiente para novo contexto](#preparando-ambiente-para-novo-contexto)
  - [Gerar novos certificados](#1-gerar-novos-certificados)
  - [Configurar variáveis de ambiente](#2-configurar-variáveis-de-ambiente)
---

## Estrutura do Projeto

```bash
.
├── certs                          # Diretório com os certificados para asserções SAML
│   ├── sp-private-key.pem          
│   └── sp-public-cert.pem          
├── config                         # Configurações e middlewares
│   ├── config.js                  # Carrega variáveis de ambiente  
│   ├── federationLoader.js        # Processa o conteúdo do discovery service  
│   ├── metadataDecorator.js       # Ajustes para gerar o metadado do SP
│   ├── passport.js                # Estratégia `passport-saml` configurada
│   └── routes.js                  # Define as rotas da aplicação
├── controllers                    # Lógica dos endpoints
│   ├── homeController.js
│   ├── logoutController.js
│   ├── metadataController.js
│   └── usersController.js
└── views                          # Templates renderizados (Pug)
    ├── home.pug
    └── users.pug
├── app.js                         # Arquivo principal da aplicação  
├── metadado-sp.xml                # Metadado do SP (obtido em 'https:fqdn:port/saml2/metadata')
├── package.json                   # Dependências do projeto
├── ssl.js                         

```

## Execução

1. Clone o repositório:

   ```bash
   https://github.com/luizakuze/nodejs-saml-sp
   cd nodejs-saml-sp
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Exexcute a aplicação:

   ```bash
   npm start
   ``` 
 

> Nota: Configurar o domínio local (teste da aplicação):
>
> Adicione o seguinte mapeamento ao arquivo `/etc/hosts` para que o domínio `sp-node` funcione localmente:
>
> ```bash
> echo "127.0.0.1 sp-node" | sudo tee -a /etc/hosts
> ```


## Preparando ambiente para novo contexto
Caso deseje apenas testar a aplicação, esta etapa não é obrigatória.  

### 1. Gerar novos certificados  
 
> 📝 Embora o repositório já inclua certificados prontos, é recomendável gerar os seus próprios.

   1. **Remover os certificados atuais do diretório `Certificates`**:

      ```bash
      rm certs/*
      ```

   2. **Gerar novos certificados**:
   Os comandos abaixo geram os certificados utilizados para assinar e encriptar as asserções SAML, e os colocam no diretório `certs`.

      ```bash 
      # Gerar chave privada
      openssl genrsa -out certs/sp-private-key.pem 2048

      # Gerar certificado público
      openssl req -new -x509 -key certs/sp-private-key.pem -out certs/sp-public-cert.pem -days 365
      ```

### 2. Configurar variáveis de ambiente

Você pode modificar as variáveis de ambiente que ficam definidas no arquivo [`.env`](./.env), localizado na raiz do projeto, para refletir o seu ambiente de execução.

Essas configurações incluem:

* Informações do provedor de serviço (`FQDN`, `PORT`);
* Segredo da sessão para assinar os cookies (`SESSION_SECRET`);
* Certificados SSL para execução local em HTTPS (`SSL_KEY`, `SSL_CERT`, opcionais);
* Informações da organização responsável pelo SP (`ORG_NAME`, `ORG_DISPLAY_NAME`, `ORG_URL`);
* Informações de contato técnico (`TECH_COMPANY`, `TECH_GIVEN_NAME`, `TECH_SURNAME`, `TECH_EMAIL`);
* Informações adicionais exibidas no Discovery Service (`UI_DISPLAY_NAME`, `UI_DESCRIPTION`, `UI_INFO_URL`, `UI_PRIVACY_URL`).

 