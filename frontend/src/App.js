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

  const getDisplayValue = (value) => {
    return value && value !== "null" && value !== "" ? value : "-";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-center">
            Consulta de Equipamentos de Saúde
          </h1>
          <p className="text-green-100 text-center mt-2">
            Sistema de consulta ao Fundo Nacional de Saúde
          </p>
        </div>
      </div>

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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ex: ambulância, respirador, desfibrilador..."
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
                        Detalhes
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
                          {equipment.preco ? `R$ ${equipment.preco.toLocaleString('pt-BR')}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
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
                        <span><strong>Preço:</strong> {equipment.preco ? `R$ ${equipment.preco.toLocaleString('pt-BR')}` : '-'}</span>
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Header do Modal */}
              <div className="flex justify-between items-center pb-3 border-b">
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

              {/* Conteúdo do Modal */}
              <div className="mt-4">
                {detailsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                    <span className="ml-2 text-gray-600">Carregando detalhes...</span>
                  </div>
                ) : equipmentDetails ? (
                  <div className="space-y-4">
                    {/* Definição */}
                    {equipmentDetails.definicao && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Definição:</h4>
                        <p className="text-gray-600 text-sm">{equipmentDetails.definicao}</p>
                      </div>
                    )}

                    {/* Especificação Sugerida */}
                    {equipmentDetails.especificacaoSugerida && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Especificação Sugerida:</h4>
                        <p className="text-gray-600 text-sm">{equipmentDetails.especificacaoSugerida}</p>
                      </div>
                    )}

                    {/* Preço Sugerido */}
                    {equipmentDetails.precoSugerido && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Preço Sugerido:</h4>
                        <p className="text-green-600 font-medium">
                          R$ {equipmentDetails.precoSugerido.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}

                    {/* Programas Estratégicos */}
                    {equipmentDetails.programasEstrategicos && equipmentDetails.programasEstrategicos.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Programas Estratégicos:</h4>
                        <ul className="text-gray-600 text-sm space-y-1">
                          {equipmentDetails.programasEstrategicos.map((programa, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-green-500 mr-2">•</span>
                              {typeof programa === 'string' ? programa : programa.nome || JSON.stringify(programa)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Ambientes */}
                    {equipmentDetails.ambientes && equipmentDetails.ambientes.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Ambientes:</h4>
                        <ul className="text-gray-600 text-sm space-y-1">
                          {equipmentDetails.ambientes.map((ambiente, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              {typeof ambiente === 'string' ? ambiente : ambiente.nome || JSON.stringify(ambiente)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Fornecedores */}
                    {equipmentDetails.fornecedores && equipmentDetails.fornecedores.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Fornecedores:</h4>
                        <ul className="text-gray-600 text-sm space-y-1">
                          {equipmentDetails.fornecedores.map((fornecedor, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-purple-500 mr-2">•</span>
                              {typeof fornecedor === 'string' ? fornecedor : fornecedor.nome || JSON.stringify(fornecedor)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4">
                    Não foi possível carregar os detalhes do equipamento.
                  </div>
                )}
              </div>

              {/* Footer do Modal */}
              <div className="mt-6 pt-3 border-t flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
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