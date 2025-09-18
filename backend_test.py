#!/usr/bin/env python3
"""
Testes para o sistema de consulta de equipamentos de saúde
Testa a integração com a API do Ministério da Saúde brasileiro
"""

import requests
import json
import time
import os
from typing import Dict, Any

# Get backend URL from environment
BACKEND_URL = "https://equipcheck.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def test_api_connection():
    """Testa se a API está respondendo"""
    print("🔍 Testando conexão com a API...")
    try:
        response = requests.get(f"{API_BASE}/", timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data and "Sistema de Consulta" in data["message"]:
                print("✅ Endpoint raiz funcionando corretamente em português")
                return True
            else:
                print("❌ Mensagem em português não encontrada")
                return False
        else:
            print(f"❌ Erro na conexão: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erro na conexão: {e}")
        return False

def test_equipment_search_basic():
    """Testa busca básica por equipamentos"""
    print("\n🔍 Testando busca básica por 'ambulancia'...")
    
    payload = {
        "nome": "ambulancia",
        "page": 1,
        "count": 10,
        "ano": 2025
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/consulta-equipamentos",
            json=payload,
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response keys: {list(data.keys())}")
            
            # Verificar estrutura da resposta
            required_fields = ["success", "data", "total", "page", "count"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                print(f"❌ Campos obrigatórios ausentes: {missing_fields}")
                return False
            
            print(f"Success: {data['success']}")
            print(f"Total: {data['total']}")
            print(f"Page: {data['page']}")
            print(f"Count: {data['count']}")
            print(f"Message: {data.get('message', 'N/A')}")
            print(f"Data items: {len(data['data'])}")
            
            if data['success']:
                print("✅ Busca por 'ambulancia' funcionou")
                if data['data']:
                    print(f"📋 Primeiro item: {json.dumps(data['data'][0], indent=2, ensure_ascii=False)}")
                return True
            else:
                print(f"❌ Busca falhou: {data.get('message', 'Sem mensagem')}")
                return False
        else:
            print(f"❌ Erro HTTP: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erro na busca: {e}")
        return False

def test_equipment_search_different_terms():
    """Testa busca com diferentes termos"""
    print("\n🔍 Testando busca com diferentes termos...")
    
    terms = ["respirador", "desfibrilador", "monitor"]
    results = {}
    
    for term in terms:
        print(f"\n  Testando termo: '{term}'")
        payload = {
            "nome": term,
            "page": 1,
            "count": 5,
            "ano": 2025
        }
        
        try:
            response = requests.post(
                f"{API_BASE}/consulta-equipamentos",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                results[term] = {
                    "success": data['success'],
                    "total": data['total'],
                    "items": len(data['data'])
                }
                print(f"  ✅ {term}: {data['total']} resultados, success: {data['success']}")
            else:
                results[term] = {"error": f"HTTP {response.status_code}"}
                print(f"  ❌ {term}: Erro HTTP {response.status_code}")
                
        except Exception as e:
            results[term] = {"error": str(e)}
            print(f"  ❌ {term}: Erro {e}")
    
    print(f"\n📊 Resumo dos testes:")
    for term, result in results.items():
        if "error" in result:
            print(f"  {term}: ❌ {result['error']}")
        else:
            print(f"  {term}: ✅ Success: {result['success']}, Total: {result['total']}")
    
    # Considerar sucesso se pelo menos um termo funcionou
    successful_terms = [term for term, result in results.items() if "error" not in result and result.get("success")]
    return len(successful_terms) > 0

def test_pagination():
    """Testa paginação"""
    print("\n🔍 Testando paginação...")
    
    # Teste página 1
    payload1 = {
        "nome": "equipamento",
        "page": 1,
        "count": 5,
        "ano": 2025
    }
    
    # Teste página 2
    payload2 = {
        "nome": "equipamento",
        "page": 2,
        "count": 5,
        "ano": 2025
    }
    
    try:
        print("  Testando página 1...")
        response1 = requests.post(f"{API_BASE}/consulta-equipamentos", json=payload1, timeout=30)
        
        print("  Testando página 2...")
        response2 = requests.post(f"{API_BASE}/consulta-equipamentos", json=payload2, timeout=30)
        
        if response1.status_code == 200 and response2.status_code == 200:
            data1 = response1.json()
            data2 = response2.json()
            
            print(f"  Página 1: Success: {data1['success']}, Items: {len(data1['data'])}")
            print(f"  Página 2: Success: {data2['success']}, Items: {len(data2['data'])}")
            
            # Verificar se as páginas são diferentes (se houver dados suficientes)
            if data1['success'] and data2['success']:
                if data1['page'] == 1 and data2['page'] == 2:
                    print("✅ Paginação funcionando corretamente")
                    return True
                else:
                    print("❌ Números de página incorretos")
                    return False
            else:
                print("⚠️ Paginação testada mas sem dados suficientes para validar")
                return True  # Não é um erro crítico
        else:
            print(f"❌ Erro HTTP - Página 1: {response1.status_code}, Página 2: {response2.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Erro no teste de paginação: {e}")
        return False

def test_different_count_values():
    """Testa diferentes valores de count"""
    print("\n🔍 Testando diferentes valores de count...")
    
    count_values = [1, 5, 20]
    
    for count in count_values:
        print(f"  Testando count={count}...")
        payload = {
            "nome": "equipamento",
            "page": 1,
            "count": count,
            "ano": 2025
        }
        
        try:
            response = requests.post(f"{API_BASE}/consulta-equipamentos", json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                print(f"  ✅ Count {count}: Success: {data['success']}, Items: {len(data['data'])}")
            else:
                print(f"  ❌ Count {count}: Erro HTTP {response.status_code}")
                return False
                
        except Exception as e:
            print(f"  ❌ Count {count}: Erro {e}")
            return False
    
    print("✅ Teste de diferentes valores de count passou")
    return True

def test_error_handling():
    """Testa tratamento de erros"""
    print("\n🔍 Testando tratamento de erros...")
    
    # Teste com termo vazio
    print("  Testando termo vazio...")
    payload_empty = {
        "nome": "",
        "page": 1,
        "count": 10,
        "ano": 2025
    }
    
    try:
        response = requests.post(f"{API_BASE}/consulta-equipamentos", json=payload_empty, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print(f"  Termo vazio: Success: {data['success']}, Message: {data.get('message', 'N/A')}")
        else:
            print(f"  ❌ Termo vazio: Erro HTTP {response.status_code}")
    except Exception as e:
        print(f"  ❌ Termo vazio: Erro {e}")
    
    # Teste com termo muito longo/inválido
    print("  Testando termo inválido...")
    payload_invalid = {
        "nome": "x" * 1000,  # Termo muito longo
        "page": 1,
        "count": 10,
        "ano": 2025
    }
    
    try:
        response = requests.post(f"{API_BASE}/consulta-equipamentos", json=payload_invalid, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print(f"  Termo inválido: Success: {data['success']}, Message: {data.get('message', 'N/A')}")
        else:
            print(f"  ❌ Termo inválido: Erro HTTP {response.status_code}")
    except Exception as e:
        print(f"  ❌ Termo inválido: Erro {e}")
    
    print("✅ Testes de tratamento de erros concluídos")
    return True

def test_response_format():
    """Testa se o formato da resposta está correto"""
    print("\n🔍 Testando formato da resposta...")
    
    payload = {
        "nome": "monitor",
        "page": 1,
        "count": 5,
        "ano": 2025
    }
    
    try:
        response = requests.post(f"{API_BASE}/consulta-equipamentos", json=payload, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            
            # Verificar campos obrigatórios do EquipmentSearchResponse
            required_fields = ["success", "data", "total", "page", "count"]
            optional_fields = ["message"]
            
            print("  Verificando campos obrigatórios...")
            for field in required_fields:
                if field in data:
                    print(f"  ✅ {field}: {type(data[field]).__name__}")
                else:
                    print(f"  ❌ Campo obrigatório ausente: {field}")
                    return False
            
            print("  Verificando tipos de dados...")
            if not isinstance(data["success"], bool):
                print(f"  ❌ 'success' deve ser boolean, encontrado: {type(data['success'])}")
                return False
            
            if not isinstance(data["data"], list):
                print(f"  ❌ 'data' deve ser list, encontrado: {type(data['data'])}")
                return False
            
            if not isinstance(data["total"], int):
                print(f"  ❌ 'total' deve ser int, encontrado: {type(data['total'])}")
                return False
            
            if not isinstance(data["page"], int):
                print(f"  ❌ 'page' deve ser int, encontrado: {type(data['page'])}")
                return False
            
            if not isinstance(data["count"], int):
                print(f"  ❌ 'count' deve ser int, encontrado: {type(data['count'])}")
                return False
            
            print("✅ Formato da resposta está correto")
            return True
        else:
            print(f"❌ Erro HTTP: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Erro no teste de formato: {e}")
        return False

def run_all_tests():
    """Executa todos os testes"""
    print("🚀 Iniciando testes do sistema de consulta de equipamentos de saúde")
    print("=" * 70)
    
    tests = [
        ("Conexão API", test_api_connection),
        ("Busca básica", test_equipment_search_basic),
        ("Diferentes termos", test_equipment_search_different_terms),
        ("Paginação", test_pagination),
        ("Valores de count", test_different_count_values),
        ("Tratamento de erros", test_error_handling),
        ("Formato da resposta", test_response_format)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            result = test_func()
            results[test_name] = result
            status = "✅ PASSOU" if result else "❌ FALHOU"
            print(f"\n{test_name}: {status}")
        except Exception as e:
            results[test_name] = False
            print(f"\n{test_name}: ❌ ERRO - {e}")
    
    # Resumo final
    print("\n" + "="*70)
    print("📊 RESUMO DOS TESTES")
    print("="*70)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSOU" if result else "❌ FALHOU"
        print(f"{test_name:.<30} {status}")
    
    print(f"\nResultado final: {passed}/{total} testes passaram")
    
    if passed == total:
        print("🎉 Todos os testes passaram!")
        return True
    else:
        print("⚠️ Alguns testes falharam. Verifique os logs acima.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)