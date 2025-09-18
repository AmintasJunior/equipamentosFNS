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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preço Sugerido
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {equipments.map((equipment, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getDisplayValue(equipment.nome)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                          <div className="truncate" title={equipment.descricao}>
                            {getDisplayValue(equipment.descricao)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getDisplayValue(equipment.tipo)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {equipment.preco ? `R$ ${equipment.preco.toLocaleString('pt-BR')}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getDisplayValue(equipment.codigo)}
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
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {getDisplayValue(equipment.nome)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Descrição:</strong> {getDisplayValue(equipment.descricao)}
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span><strong>Tipo:</strong> {getDisplayValue(equipment.tipo)}</span>
                        <span><strong>Código:</strong> {getDisplayValue(equipment.codigo)}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        <strong>Preço:</strong> {equipment.preco ? `R$ ${equipment.preco.toLocaleString('pt-BR')}` : '-'}
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