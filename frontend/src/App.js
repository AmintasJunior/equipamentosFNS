import React, { useState } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [equipmentDetails, setEquipmentDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const searchEquipments = async (page = 1) => {
    if (!searchTerm.trim()) {
      setError("Por favor, digite um termo de busca");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const response = await axios.post(`${API}/consulta-equipamentos`, {
        nome: searchTerm,
        page: page,
        count: 10,
        ano: 2025
      });

      if (response.data.success) {
        setEquipments(response.data.data || []);
        setTotalResults(response.data.total || 0);
        setCurrentPage(page);
        setSearched(true);
        if (response.data.data.length === 0) {
          setError("Nenhum equipamento encontrado para este termo de busca");
        }
      } else {
        setError(response.data.message || "Erro na consulta");
        setEquipments([]);
      }
    } catch (e) {
      console.error(e);
      setError("Erro ao consultar equipamentos. Tente novamente.");
      setEquipments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    searchEquipments(1);
  };

  const handlePageChange = (newPage) => {
    searchEquipments(newPage);
  };

  const handleViewDetails = async (equipment) => {
    if (!equipment.codigo) {
      setError("Código do equipamento não encontrado");
      return;
    }

    setDetailsLoading(true);
    setSelectedEquipment(equipment);
    setShowModal(true);
    
    try {
      const response = await axios.post(`${API}/detalhes-equipamento`, {
        coItem: equipment.codigo,
        ano: 2025
      });

      if (response.data.success) {
        setEquipmentDetails(response.data.data);
      } else {
        setError(response.data.message || "Erro ao carregar detalhes");
      }
    } catch (e) {
      console.error(e);
      setError("Erro ao carregar detalhes do equipamento");
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEquipment(null);
    setEquipmentDetails(null);
  };

  const formatPrice = (price) => {
    if (!price) return '-';
    return `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const addToCart = (equipment) => {
    const existingItem = cart.find(item => item.codigo === equipment.codigo);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.codigo === equipment.codigo 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...equipment, quantity: 1, healthUnit: "" }]);
    }
  };

  const updateHealthUnit = (codigo, healthUnit) => {
    setCart(cart.map(item => 
      item.codigo === codigo 
        ? { ...item, healthUnit: healthUnit }
        : item
    ));
  };

  const validateCart = () => {
    return cart.every(item => item.healthUnit && item.healthUnit.trim() !== "");
  };

  const getHealthUnitsCount = () => {
    const units = [...new Set(cart.filter(item => item.healthUnit).map(item => item.healthUnit))];
    return units.length;
  };

  const removeFromCart = (codigo) => {
    setCart(cart.filter(item => item.codigo !== codigo));
  };

  const updateQuantity = (codigo, quantity) => {
    if (quantity <= 0) {
      removeFromCart(codigo);
      return;
    }
    
    setCart(cart.map(item => 
      item.codigo === codigo 
        ? { ...item, quantity: quantity }
        : item
    ));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.preco * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getDisplayValue = (value) => {
    return value && value !== "null" && value !== "" ? value : "-";
  };

  const removeAccents = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim();
  };

  const handleSearchInputChange = (e) => {
    const rawValue = e.target.value;
    const cleanValue = removeAccents(rawValue);
    setSearchTerm(cleanValue);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <h1 className="text-2xl md:text-3xl font-bold">
                Consulta de Equipamentos de Saúde
              </h1>
              <p className="text-green-100 mt-2">
                Sistema de consulta ao Fundo Nacional de Saúde
              </p>
            </div>
            {/* Cart Button */}
            <button
              onClick={() => setShowCart(true)}
              className="relative bg-green-700 hover:bg-green-800 p-3 rounded-full transition-colors"
              title="Ver carrinho"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
              </svg>
              {getCartItemsCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                  {getCartItemsCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal do Carrinho */}
      {showCart && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Header Compacto */}
            <div className="flex justify-between items-center px-6 py-4 border-b bg-white rounded-t-lg">
              <h3 className="text-xl font-semibold text-gray-900">
                Solicitação FNS ({getCartItemsCount()} {getCartItemsCount() === 1 ? 'item' : 'itens'})
              </h3>
              <button
                onClick={() => setShowCart(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Conteúdo do Carrinho com Scroll */}
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5-5M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                  <p className="text-gray-500 mt-4">Seu carrinho está vazio</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Informações sobre a solicitação */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Solicitação de Equipamentos - FNS</h4>
                    <p className="text-sm text-blue-700">
                      Defina a unidade de saúde destinatária para cada equipamento. 
                      Você pode enviar equipamentos para diferentes unidades na mesma solicitação.
                    </p>
                  </div>

                  {/* Lista de Equipamentos com Unidades */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-4">Equipamentos e Destinatários</h4>
                    <div className="space-y-4">
                      {cart.map((item, index) => (
                        <div key={index} className="border rounded-lg bg-white shadow-sm">
                          {/* Cabeçalho do Item */}
                          <div className="p-4 border-b bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">{item.descricao}</h5>
                                <p className="text-sm text-gray-500">{item.tipo}</p>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.codigo)}
                                className="text-red-500 hover:text-red-700 p-1 transition-colors"
                                title="Remover equipamento"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Conteúdo do Item */}
                          <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              {/* Campo Unidade de Saúde */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Unidade de Saúde Destinatária *
                                </label>
                                <input
                                  type="text"
                                  value={item.healthUnit || ""}
                                  onChange={(e) => updateHealthUnit(item.codigo, e.target.value)}
                                  placeholder="Ex: UBS Central, Hospital Municipal..."
                                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent ${
                                    item.healthUnit ? 
                                    'border-green-300 focus:ring-green-500' : 
                                    'border-red-300 focus:ring-red-500'
                                  }`}
                                  required
                                />
                                {!item.healthUnit && (
                                  <p className="text-xs text-red-500 mt-1">* Campo obrigatório</p>
                                )}
                              </div>

                              {/* Quantidade e Valores */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Quantidade e Valores
                                </label>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-sm text-gray-600">Quantidade:</span>
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => updateQuantity(item.codigo, item.quantity - 1)}
                                        className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm transition-colors"
                                      >
                                        -
                                      </button>
                                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                                      <button
                                        onClick={() => updateQuantity(item.codigo, item.quantity + 1)}
                                        className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm transition-colors"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                  <div className="text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Valor unitário:</span>
                                      <span className="font-medium">{formatPrice(item.preco)}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-1 mt-1">
                                      <span className="text-gray-900 font-medium">Subtotal:</span>
                                      <span className="font-bold text-green-600">{formatPrice(item.preco * item.quantity)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé do Carrinho */}
            {cart.length > 0 && (
              <div className="p-6 border-t bg-gray-50 rounded-b-lg">
                <div className="bg-white border rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-lg font-semibold text-gray-700">Total da Solicitação:</span>
                      <p className="text-xs text-gray-500">
                        {getCartItemsCount()} equipamento{getCartItemsCount() !== 1 ? 's' : ''} para {getHealthUnitsCount()} unidade{getHealthUnitsCount() !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-green-600">{formatPrice(getCartTotal())}</span>
                  </div>
                  
                  {/* Validação */}
                  {!validateCart() && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      ⚠️ Alguns equipamentos ainda não têm unidade de saúde definida
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCart(false)}
                    className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Continuar Selecionando
                  </button>
                  <button
                    onClick={() => {
                      if (!validateCart()) {
                        alert('Por favor, defina a unidade de saúde destinatária para todos os equipamentos antes de enviar a solicitação.');
                        return;
                      }
                      
                      // Agrupar por unidade de saúde
                      const groupedByUnit = cart.reduce((acc, item) => {
                        if (!acc[item.healthUnit]) {
                          acc[item.healthUnit] = [];
                        }
                        acc[item.healthUnit].push(`${item.quantity}x ${item.descricao} (${formatPrice(item.preco * item.quantity)})`);
                        return acc;
                      }, {});
                      
                      let message = `Solicitação enviada com sucesso!\n\nResumo da solicitação:\n`;
                      Object.keys(groupedByUnit).forEach(unit => {
                        message += `\n📍 ${unit}:\n`;
                        groupedByUnit[unit].forEach(item => {
                          message += `  • ${item}\n`;
                        });
                      });
                      message += `\n💰 Total: ${formatPrice(getCartTotal())}\n\nEm breve você receberá as instruções para prosseguir com o processo de aquisição através do FNS.`;
                      
                      alert(message);
                    }}
                    disabled={!validateCart()}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Enviar Solicitação
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 text-center mt-3">
                  * Solicitação de equipamentos do Fundo Nacional de Saúde para múltiplas unidades
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Form */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Equipamento
              </label>
              <div className="flex gap-3">
                <input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                  placeholder="Ex: ambulancia, respirador, desfibrilador..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Buscando..." : "Buscar"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mt-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Erro</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="max-w-4xl mx-auto mt-8 text-center">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-green-500 bg-white">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Consultando equipamentos...
            </div>
          </div>
        )}

        {/* Results */}
        {searched && !loading && equipments.length > 0 && (
          <div className="max-w-6xl mx-auto mt-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  Resultados da busca por: "{searchTerm}"
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {totalResults} equipamento{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                        Equipamento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preço Sugerido
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {equipments.map((equipment, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="font-medium">{getDisplayValue(equipment.descricao)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getDisplayValue(equipment.tipo)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPrice(equipment.preco)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => handleViewDetails(equipment)}
                              className="text-green-600 hover:text-green-700 transition-colors duration-200"
                              title="Ver detalhes"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button
                              onClick={() => addToCart(equipment)}
                              className="text-blue-600 hover:text-blue-700 transition-colors duration-200"
                              title="Adicionar ao carrinho"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden">
                {equipments.map((equipment, index) => (
                  <div key={index} className="p-4 border-b border-gray-200 last:border-b-0">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-900 flex-1 pr-2">
                          {getDisplayValue(equipment.descricao)}
                        </span>
                        <button
                          onClick={() => handleViewDetails(equipment)}
                          className="text-green-600 hover:text-green-700 transition-colors duration-200 ml-2"
                          title="Ver detalhes"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span><strong>Tipo:</strong> {getDisplayValue(equipment.tipo)}</span>
                        <span><strong>Preço:</strong> {formatPrice(equipment.preco)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleViewDetails(equipment)}
                            className="text-green-600 hover:text-green-700 transition-colors duration-200"
                            title="Ver detalhes"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            onClick={() => addToCart(equipment)}
                            className="text-blue-600 hover:text-blue-700 transition-colors duration-200"
                            title="Adicionar ao carrinho"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalResults > 10 && (
                <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Página {currentPage}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={equipments.length < 10}
                      className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próximo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Results */}
        {searched && !loading && equipments.length === 0 && !error && (
          <div className="max-w-4xl mx-auto mt-8 text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6">
              <h3 className="text-lg font-medium text-yellow-800">Nenhum resultado encontrado</h3>
              <p className="text-yellow-700 mt-2">
                Tente usar termos diferentes ou mais específicos para sua busca.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-lg w-11/12 md:w-3/4 lg:w-1/2 max-w-4xl h-5/6 flex flex-col">
            {/* Header Fixo */}
            <div className="flex justify-between items-center p-6 border-b bg-white rounded-t-lg">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedEquipment ? selectedEquipment.descricao : 'Detalhes do Equipamento'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="flex-1 overflow-y-auto p-6">
              {detailsLoading ? (
                <div className="flex flex-col justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                  <span className="ml-2 text-gray-600 mt-4">Carregando detalhes...</span>
                </div>
              ) : equipmentDetails ? (
                <div className="space-y-6">
                  {/* Definição */}
                  {equipmentDetails.definicao && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3">Definição:</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{equipmentDetails.definicao}</p>
                    </div>
                  )}

                  {/* Especificação Sugerida */}
                  {equipmentDetails.especificacaoSugerida && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3">Especificação Sugerida:</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{equipmentDetails.especificacaoSugerida}</p>
                    </div>
                  )}

                  {/* Preço Sugerido */}
                  {equipmentDetails.precoSugerido && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3">Preço Sugerido:</h4>
                      <p className="text-green-600 font-medium text-lg">
                        {formatPrice(equipmentDetails.precoSugerido)}
                      </p>
                    </div>
                  )}

                  {/* Programas Estratégicos */}
                  {equipmentDetails.programasEstrategicos && equipmentDetails.programasEstrategicos.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3">Programas Estratégicos:</h4>
                      <ul className="text-gray-600 text-sm space-y-3">
                        {equipmentDetails.programasEstrategicos.map((programa, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-500 mr-3 mt-1">•</span>
                            <div>
                              <div className="font-medium text-gray-800">{programa.programaEstrategico}</div>
                              <div className="text-gray-500 text-xs mt-1">{programa.componente}</div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Ambientes */}
                  {equipmentDetails.ambientes && equipmentDetails.ambientes.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3">Ambientes:</h4>
                      <ul className="text-gray-600 text-sm space-y-3">
                        {equipmentDetails.ambientes.map((ambiente, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-500 mr-3 mt-1">•</span>
                            <div>
                              <div className="font-medium text-gray-800">{ambiente.descricao}</div>
                              <div className="text-gray-500 text-xs mt-1">
                                <span className="mr-4">Setor: {ambiente.setor}</span>
                                <span>Atividade: {ambiente.atividade}</span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Fornecedores */}
                  {equipmentDetails.fornecedores && equipmentDetails.fornecedores.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3">Fornecedores:</h4>
                      <ul className="text-gray-600 text-sm space-y-3">
                        {equipmentDetails.fornecedores.map((fornecedor, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-purple-500 mr-3 mt-1">•</span>
                            <div>
                              <div className="font-medium text-gray-800">{fornecedor.nome}</div>
                              {fornecedor.telefone && (
                                <div className="text-gray-500 text-xs mt-1">Tel: {fornecedor.telefone}</div>
                              )}
                              {fornecedor.site && (
                                <div className="text-gray-500 text-xs mt-1">
                                  <a href={fornecedor.site} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    {fornecedor.site}
                                  </a>
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-20">
                  <p>Não foi possível carregar os detalhes do equipamento.</p>
                </div>
              )}
            </div>

            {/* Rodapé Fixo */}
            <div className="p-6 border-t bg-gray-50 rounded-b-lg">
              <div className="flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-gray-300">
            Sistema de consulta aos dados do Fundo Nacional de Saúde - Ministério da Saúde
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;