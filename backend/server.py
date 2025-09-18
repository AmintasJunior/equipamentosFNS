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