#!/bin/bash

# Nome do arquivo de metadata
METADATA_FILE="metadado-sp.xml"

# Caminho local para o schema
LOCAL_SCHEMA="schemas/saml-schema-metadata-2.0.xsd"

# Verifica se o xmlstarlet está instalado
if ! command -v xmlstarlet &> /dev/null; then
    echo "Erro: xmlstarlet não encontrado. Instale com: sudo apt install xmlstarlet"
    exit 1
fi

# Verifica se o arquivo existe
if [ ! -f "$METADATA_FILE" ]; then
    echo "Erro: Arquivo '$METADATA_FILE' não encontrado na raiz do projeto."
    exit 1
fi

# Verifica se o schema existe
if [ ! -f "$LOCAL_SCHEMA" ]; then
    echo "Erro: Schema local '$LOCAL_SCHEMA' não encontrado. Baixe primeiro!"
    exit 1
fi

# Valida o XML contra o esquema
echo "Validando $METADATA_FILE usando schema local..."
xmlstarlet val --err --xsd "$LOCAL_SCHEMA" "$METADATA_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Metadata válido!"
else
    echo "❌ Metadata inválido!"
fi
