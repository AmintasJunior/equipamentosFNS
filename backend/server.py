from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import httpx
import asyncio

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class Municipio(BaseModel):
    codigo: str
    nome: str
    estado: str = "28"  # Sergipe

class Emenda(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    municipio_codigo: str
    municipio_nome: str
    valor: float
    parlamentar: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EmendaCreate(BaseModel):
    municipio_codigo: str
    municipio_nome: str
    valor: float
    parlamentar: str

class Estabelecimento(BaseModel):
    cnes: str
    nome_fantasia: str
    razao_social: Optional[str] = None
    logradouro: Optional[str] = None
    bairro: Optional[str] = None
    telefone: Optional[str] = None

class EquipmentSearchRequest(BaseModel):
    nome: str
    page: int = 1
    count: int = 10
    ano: int = 2025

class EquipmentItem(BaseModel):
    id: Optional[str] = None
    nome: Optional[str] = None
    descricao: Optional[str] = None
    tipo: Optional[str] = None
    categoria: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    fabricante: Optional[str] = None
    registro_anvisa: Optional[str] = None
    cnpj_fabricante: Optional[str] = None
    situacao: Optional[str] = None

class EquipmentSearchResponse(BaseModel):
    success: bool
    data: List[dict] = []
    total: int = 0
    page: int = 1
    count: int = 10
    message: Optional[str] = None

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Sistema de Consulta de Equipamentos de Saúde"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Rota para buscar municípios de Sergipe
@api_router.get("/municipios", response_model=List[Municipio])
async def get_municipios():
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                # Tenta primeiro a API do DATASUS
                response = await client.get("https://cnes.datasus.gov.br/services/municipios?estado=28")
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list):
                        return [Municipio(codigo=str(item.get('codigo', '')), 
                                        nome=item.get('nome', '')) for item in data]
            except Exception as api_error:
                logger.warning(f"Erro na API do DATASUS: {api_error}")
                
        # Fallback com municípios de Sergipe
        return [
            Municipio(codigo="280010", nome="Amparo de São Francisco"),
            Municipio(codigo="280020", nome="Aquidabã"),
            Municipio(codigo="280030", nome="Aracaju"),
            Municipio(codigo="280040", nome="Arauá"),
            Municipio(codigo="280050", nome="Areia Branca"),
            Municipio(codigo="280060", nome="Barra dos Coqueiros"),
            Municipio(codigo="280070", nome="Boquim"),
            Municipio(codigo="280080", nome="Brejo Grande"),
            Municipio(codigo="280090", nome="Campo do Brito"),
            Municipio(codigo="280100", nome="Canhoba"),
            Municipio(codigo="280110", nome="Canindé de São Francisco"),
            Municipio(codigo="280120", nome="Capela"),
            Municipio(codigo="280130", nome="Carira"),
            Municipio(codigo="280140", nome="Carmópolis"),
            Municipio(codigo="280150", nome="Cedro de São João"),
            Municipio(codigo="280160", nome="Cristinápolis"),
            Municipio(codigo="280170", nome="Cumbe"),
            Municipio(codigo="280180", nome="Divina Pastora"),
            Municipio(codigo="280190", nome="Estância"),
            Municipio(codigo="280200", nome="Feira Nova"),
            Municipio(codigo="280210", nome="Frei Paulo"),
            Municipio(codigo="280220", nome="Gararu"),
            Municipio(codigo="280230", nome="Gracho Cardoso"),
            Municipio(codigo="280240", nome="Ilha das Flores"),
            Municipio(codigo="280250", nome="Indiaroba"),
            Municipio(codigo="280260", nome="Itabaiana"),
            Municipio(codigo="280270", nome="Itabaianinha"),
            Municipio(codigo="280280", nome="Itabi"),
            Municipio(codigo="280290", nome="Itaporanga d'Ajuda"),
            Municipio(codigo="280300", nome="Japaratuba"),
            Municipio(codigo="280310", nome="Japoatã"),
            Municipio(codigo="280320", nome="Lagarto"),
            Municipio(codigo="280330", nome="Laranjeiras"),
            Municipio(codigo="280340", nome="Macambira"),
            Municipio(codigo="280350", nome="Malhada dos Bois"),
            Municipio(codigo="280360", nome="Malhador"),
            Municipio(codigo="280370", nome="Maruim"),
            Municipio(codigo="280380", nome="Moita Bonita"),
            Municipio(codigo="280390", nome="Monte Alegre de Sergipe"),
            Municipio(codigo="280400", nome="Muribeca"),
            Municipio(codigo="280410", nome="Neópolis"),
            Municipio(codigo="280420", nome="Nossa Senhora Aparecida"),
            Municipio(codigo="280430", nome="Nossa Senhora da Glória"),
            Municipio(codigo="280440", nome="Nossa Senhora das Dores"),
            Municipio(codigo="280450", nome="Nossa Senhora de Lourdes"),
            Municipio(codigo="280460", nome="Nossa Senhora do Socorro"),
            Municipio(codigo="280470", nome="Pacatuba"),
            Municipio(codigo="280480", nome="Pedra Mole"),
            Municipio(codigo="280490", nome="Pedrinhas"),
            Municipio(codigo="280500", nome="Pinhão"),
            Municipio(codigo="280510", nome="Pirambu"),
            Municipio(codigo="280520", nome="Poço Redondo"),
            Municipio(codigo="280530", nome="Poço Verde"),
            Municipio(codigo="280540", nome="Porto da Folha"),
            Municipio(codigo="280550", nome="Propriá"),
            Municipio(codigo="280560", nome="Riachão do Dantas"),
            Municipio(codigo="280570", nome="Riachuelo"),
            Municipio(codigo="280580", nome="Ribeirópolis"),
            Municipio(codigo="280590", nome="Rosário do Catete"),
            Municipio(codigo="280600", nome="Salgado"),
            Municipio(codigo="280610", nome="Santa Luzia do Itanhy"),
            Municipio(codigo="280620", nome="Santa Rosa de Lima"),
            Municipio(codigo="280630", nome="Santana do São Francisco"),
            Municipio(codigo="280640", nome="Santo Amaro das Brotas"),
            Municipio(codigo="280650", nome="São Cristóvão"),
            Municipio(codigo="280660", nome="São Domingos"),
            Municipio(codigo="280670", nome="São Francisco"),
            Municipio(codigo="280680", nome="São Miguel do Aleixo"),
            Municipio(codigo="280690", nome="Simão Dias"),
            Municipio(codigo="280700", nome="Siriri"),
            Municipio(codigo="280710", nome="Telha"),
            Municipio(codigo="280720", nome="Tobias Barreto"),
            Municipio(codigo="280730", nome="Tomar do Geru"),
            Municipio(codigo="280740", nome="Umbaúba")
        ]
    except Exception as e:
        logger.error(f"Erro ao buscar municípios: {e}")
        # Fallback mínimo
        return [
            Municipio(codigo="280030", nome="Aracaju"),
            Municipio(codigo="280190", nome="Estância"),
            Municipio(codigo="280260", nome="Itabaiana"),
            Municipio(codigo="280320", nome="Lagarto"),
            Municipio(codigo="280460", nome="Nossa Senhora do Socorro"),
            Municipio(codigo="280550", nome="Propriá"),
            Municipio(codigo="280650", nome="São Cristóvão"),
            Municipio(codigo="280720", nome="Tobias Barreto")
        ]

# Rotas para gerenciar emendas
@api_router.post("/emendas", response_model=Emenda)
async def create_emenda(emenda: EmendaCreate):
    emenda_obj = Emenda(**emenda.dict())
    result = await db.emendas.insert_one(emenda_obj.dict())
    return emenda_obj

@api_router.get("/emendas", response_model=List[Emenda])
async def get_emendas():
    emendas = await db.emendas.find().to_list(1000)
    return [Emenda(**emenda) for emenda in emendas]

@api_router.get("/emendas/{emenda_id}", response_model=Emenda)
async def get_emenda(emenda_id: str):
    emenda = await db.emendas.find_one({"id": emenda_id})
    if emenda:
        return Emenda(**emenda)
    raise HTTPException(status_code=404, detail="Emenda não encontrada")

# Rota para buscar estabelecimentos por município
@api_router.get("/estabelecimentos/{municipio_codigo}", response_model=List[Estabelecimento])
async def get_estabelecimentos(municipio_codigo: str):
    try:
        logger.info(f"Buscando estabelecimentos do município: {municipio_codigo}")
        
        async with httpx.AsyncClient(
            timeout=30.0, 
            verify=False,  # Ignora verificação SSL
            follow_redirects=True,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        ) as client:
            try:
                # Tenta a API do DATASUS
                url = f"https://cnes.datasus.gov.br/services/estabelecimentos?municipio={municipio_codigo}"
                logger.info(f"Fazendo requisição para: {url}")
                
                response = await client.get(url)
                logger.info(f"Status da resposta: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"Dados recebidos: {len(data) if isinstance(data, list) else 'não é lista'}")
                    
                    estabelecimentos = []
                    
                    if isinstance(data, list) and len(data) > 0:
                        logger.info(f"Processando {len(data)} estabelecimentos...")
                        
                        for item in data[:50]:  # Limitar a 50 estabelecimentos
                            if isinstance(item, dict):
                                nome_fantasia = item.get('noFantasia', '').strip()
                                cnes = item.get('cnes', '').strip()
                                
                                # Log do primeiro item para debug
                                if len(estabelecimentos) == 0:
                                    logger.info(f"Primeiro item: noFantasia='{nome_fantasia}', cnes='{cnes}'")
                                
                                if nome_fantasia and cnes:
                                    estabelecimentos.append(Estabelecimento(
                                        cnes=cnes,
                                        nome_fantasia=nome_fantasia,
                                        razao_social=item.get('razaoSocial', ''),
                                        logradouro=item.get('logradouro', ''),
                                        bairro=item.get('bairro', ''),
                                        telefone=item.get('telefone', '')
                                    ))
                    
                    if len(estabelecimentos) > 0:
                        logger.info(f"Retornando {len(estabelecimentos)} estabelecimentos da API do DATASUS")
                        return estabelecimentos
                    else:
                        logger.warning("API do DATASUS retornou dados mas nenhum estabelecimento válido foi encontrado")
                else:
                    logger.warning(f"API do DATASUS retornou status: {response.status_code}")
                    
            except asyncio.TimeoutError:
                logger.warning("Timeout na API do DATASUS para estabelecimentos")
            except Exception as api_error:
                logger.warning(f"Erro na API do DATASUS para estabelecimentos: {api_error}")
                
        # Fallback com estabelecimentos fictícios baseados no município
        logger.info("Usando fallback com estabelecimentos fictícios")
        municipio_nome = "Município"
        try:
            # Buscar nome do município
            municipios = await get_municipios()
            municipio = next((m for m in municipios if m.codigo == municipio_codigo), None)
            if municipio:
                municipio_nome = municipio.nome
        except Exception as e:
            logger.warning(f"Erro ao buscar nome do município: {e}")
            
        return [
            Estabelecimento(cnes="0000001", nome_fantasia=f"UBS Central {municipio_nome}"),
            Estabelecimento(cnes="0000002", nome_fantasia=f"Hospital Municipal {municipio_nome}"),
            Estabelecimento(cnes="0000003", nome_fantasia=f"Centro de Saúde {municipio_nome}"),
            Estabelecimento(cnes="0000004", nome_fantasia=f"Posto de Saúde Vila Nova {municipio_nome}"),
            Estabelecimento(cnes="0000005", nome_fantasia=f"UPA 24h {municipio_nome}")
        ]
        
    except Exception as e:
        logger.error(f"Erro geral ao buscar estabelecimentos: {e}")
        return [
            Estabelecimento(cnes="0000001", nome_fantasia="UBS Central"),
            Estabelecimento(cnes="0000002", nome_fantasia="Hospital Municipal"),
            Estabelecimento(cnes="0000003", nome_fantasia="Centro de Saúde"),
            Estabelecimento(cnes="0000004", nome_fantasia="Posto de Saúde"),
            Estabelecimento(cnes="0000005", nome_fantasia="UPA 24h")
        ]

class EquipmentDetailRequest(BaseModel):
    coItem: str
    ano: int = 2025

class EquipmentDetailResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    message: Optional[str] = None

@api_router.post("/consulta-equipamentos", response_model=EquipmentSearchResponse)
async def consulta_equipamentos(request: EquipmentSearchRequest):
    """
    Consulta equipamentos na API do Ministério da Saúde
    """
    try:
        # Construct the API URL
        base_url = "https://consultafns.saude.gov.br/recursos/equipamento"
        params = {
            "abaAtiva": 1,
            "ano": request.ano,
            "count": request.count,
            "nome": request.nome.strip(),
            "page": request.page,
            "stCardapio": "false",
            "stPlanilha": "false"
        }
        
        logger.info(f"Fazendo consulta para: {request.nome} (página {request.page})")
        
        # Make the API call with timeout
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(base_url, params=params)
            
        if response.status_code == 200:
            try:
                data = response.json()
                logger.info(f"Resposta da API: {data}")
                
                # Extract the equipment list from the Brazilian Health API response
                equipamentos = []
                total_items = 0
                
                if isinstance(data, dict) and "resultado" in data:
                    resultado = data["resultado"]
                    if "itensPagina" in resultado:
                        equipamentos = resultado["itensPagina"]
                        total_items = resultado.get("totalItens", len(equipamentos))
                    
                # Process and clean the equipment data
                processed_equipamentos = []
                for item in equipamentos:
                    if isinstance(item, dict):
                        # Map the Brazilian API structure to our frontend structure
                        processed_item = {
                            "nome": item.get("sinonimos") or item.get("descricao", ""),
                            "descricao": item.get("descricao", ""),
                            "tipo": item.get("classificacao", ""),
                            "categoria": f"Grupo {item.get('coGrupo', '')}" if item.get('coGrupo') else "",
                            "fabricante": "-",  # Not provided by this API
                            "preco": item.get("precoSugerido"),
                            "codigo": item.get("coItem"),
                            "grupo": item.get("coGrupo"),
                            "subgrupo": item.get("coSubgrupo")
                        }
                        processed_equipamentos.append(processed_item)
                
                return EquipmentSearchResponse(
                    success=True,
                    data=processed_equipamentos,
                    total=total_items,
                    page=request.page,
                    count=request.count,
                    message=f"Encontrados {total_items} equipamentos para '{request.nome}'"
                )
                
            except Exception as json_error:
                logger.error(f"Erro ao processar JSON: {json_error}")
                return EquipmentSearchResponse(
                    success=False,
                    message=f"Erro ao processar resposta da API: {str(json_error)}"
                )
                
        else:
            logger.error(f"Erro na API externa: {response.status_code}")
            return EquipmentSearchResponse(
                success=False,
                message=f"Erro na consulta: Status {response.status_code}"
            )
            
    except httpx.TimeoutException:
        logger.error("Timeout na consulta à API")
        return EquipmentSearchResponse(
            success=False,
            message="Timeout na consulta. Tente novamente."
        )
    except Exception as e:
        logger.error(f"Erro inesperado: {e}")
        return EquipmentSearchResponse(
            success=False,
            message=f"Erro interno: {str(e)}"
        )

@api_router.post("/detalhes-equipamento", response_model=EquipmentDetailResponse)
async def detalhes_equipamento(request: EquipmentDetailRequest):
    """
    Consulta detalhes específicos de um equipamento na API do Ministério da Saúde
    """
    try:
        # Construct the detail API URL
        detail_url = f"https://consultafns.saude.gov.br/recursos/equipamento/{request.ano}/{request.coItem}/0/0"
        
        logger.info(f"Buscando detalhes para coItem: {request.coItem}")
        
        # Make the API call with timeout
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(detail_url)
            
        if response.status_code == 200:
            try:
                data = response.json()
                logger.info(f"Detalhes recebidos: {data}")
                
                # Extract relevant details from the response
                equipment_details = {}
                if isinstance(data, dict) and "resultado" in data:
                    resultado = data["resultado"]
                    equipment_details = {
                        "programasEstrategicos": resultado.get("programasEstrategicos", []),
                        "ambientes": resultado.get("ambientes", []),
                        "definicao": resultado.get("definicao", ""),
                        "especificacaoSugerida": resultado.get("especificacaoSugerida", ""),
                        "fornecedores": resultado.get("fornecedores", []),
                        "precoSugerido": resultado.get("precoSugerido", 0),
                        "descricao": resultado.get("descricao", ""),
                        "classificacao": resultado.get("classificacao", ""),
                        "coItem": resultado.get("coItem", request.coItem),
                        "setor": resultado.get("setor", ""),
                        "ambiente": resultado.get("ambiente", ""),
                        "definicaoBasica": resultado.get("definicaoBasica", "")
                    }
                else:
                    # Fallback for direct structure
                    equipment_details = {
                        "programasEstrategicos": data.get("programasEstrategicos", []),
                        "ambientes": data.get("ambientes", []),
                        "definicao": data.get("definicao", ""),
                        "especificacaoSugerida": data.get("especificacaoSugerida", ""),
                        "fornecedores": data.get("fornecedores", []),
                        "precoSugerido": data.get("precoSugerido", 0),
                        "descricao": data.get("descricao", ""),
                        "classificacao": data.get("classificacao", ""),
                        "coItem": data.get("coItem", request.coItem)
                    }
                
                return EquipmentDetailResponse(
                    success=True,
                    data=equipment_details,
                    message="Detalhes carregados com sucesso"
                )
                
            except Exception as json_error:
                logger.error(f"Erro ao processar JSON dos detalhes: {json_error}")
                return EquipmentDetailResponse(
                    success=False,
                    message=f"Erro ao processar resposta da API de detalhes: {str(json_error)}"
                )
                
        else:
            logger.error(f"Erro na API de detalhes: {response.status_code}")
            return EquipmentDetailResponse(
                success=False,
                message=f"Erro na consulta de detalhes: Status {response.status_code}"
            )
            
    except httpx.TimeoutException:
        logger.error("Timeout na consulta de detalhes")
        return EquipmentDetailResponse(
            success=False,
            message="Timeout na consulta de detalhes. Tente novamente."
        )
    except Exception as e:
        logger.error(f"Erro inesperado nos detalhes: {e}")
        return EquipmentDetailResponse(
            success=False,
            message=f"Erro interno nos detalhes: {str(e)}"
        )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()