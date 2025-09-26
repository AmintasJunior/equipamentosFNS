import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmendaForm = ({ onIniciarPesquisa }) => {
  const [formData, setFormData] = useState({
    municipio_codigo: '',
    municipio_nome: '',
    valor: '',
    parlamentar: ''
  });
  const [municipios, setMunicipios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMunicipios, setLoadingMunicipios] = useState(true);

  useEffect(() => {
    carregarMunicipios();
  }, []);

  const carregarMunicipios = async () => {
    try {
      setLoadingMunicipios(true);
      const response = await axios.get(`${API}/municipios`);
      setMunicipios(response.data);
    } catch (error) {
      console.error('Erro ao carregar municípios:', error);
      // Fallback com alguns municípios
      setMunicipios([
        { codigo: '280030', nome: 'Aracaju' },
        { codigo: '280190', nome: 'Estância' },
        { codigo: '280260', nome: 'Itabaiana' },
        { codigo: '280320', nome: 'Lagarto' },
        { codigo: '280460', nome: 'Nossa Senhora do Socorro' }
      ]);
    } finally {
      setLoadingMunicipios(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'municipio') {
      const municipioSelecionado = municipios.find(m => m.codigo === value);
      setFormData(prev => ({
        ...prev,
        municipio_codigo: value,
        municipio_nome: municipioSelecionado ? municipioSelecionado.nome : ''
      }));
    } else if (name === 'valor') {
      // Remove tudo que não é dígito
      const numeroLimpo = value.replace(/\D/g, '');
      
      // Converte para número e formata
      const numero = parseFloat(numeroLimpo) / 100;
      
      // Formata como moeda brasileira
      const valorFormatado = numero.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
      });
      
      setFormData(prev => ({
        ...prev,
        [name]: valorFormatado
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const getValorNumerico = () => {
    // Converte o valor formatado de volta para número
    const numeroLimpo = formData.valor.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(numeroLimpo) || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.municipio_codigo || !formData.valor || !formData.parlamentar) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setLoading(true);
      
      // Salvar dados da emenda
      const response = await axios.post(`${API}/emendas`, {
        municipio_codigo: formData.municipio_codigo,
        municipio_nome: formData.municipio_nome,
        valor: getValorNumerico(),
        parlamentar: formData.parlamentar
      });

      console.log('Emenda salva:', response.data);
      
      // Chamar callback para iniciar pesquisa
      if (onIniciarPesquisa) {
        onIniciarPesquisa(response.data);
      }
      
    } catch (error) {
      console.error('Erro ao salvar emenda:', error);
      alert('Erro ao salvar dados da emenda. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Sistema FNS - Equipamentos de Saúde
          </h1>
          <p className="text-gray-600">
            Cadastre os dados da emenda parlamentar para iniciar a pesquisa de equipamentos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo Município */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Município Destinatário <span className="text-red-500">*</span>
            </label>
            {loadingMunicipios ? (
              <div className="flex items-center justify-center p-4 border border-gray-300 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                <span className="ml-2 text-gray-600">Carregando municípios de Sergipe...</span>
              </div>
            ) : (
              <select
                name="municipio"
                value={formData.municipio_codigo}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Selecione o município destinatário</option>
                {municipios.map((municipio) => (
                  <option key={municipio.codigo} value={municipio.codigo}>
                    {municipio.nome} - SE
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Campo Valor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor da Emenda (R$) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="valor"
              value={formData.valor}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              placeholder="Ex: 150000.00"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Informe o valor total disponível para aquisição de equipamentos
            </p>
          </div>

          {/* Campo Parlamentar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parlamentar Responsável <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="parlamentar"
              value={formData.parlamentar}
              onChange={handleInputChange}
              placeholder="Nome completo do deputado/senador"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          {/* Botão Iniciar Pesquisa */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-6 rounded-lg text-white font-medium text-lg transition-colors ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Salvando dados...
                </div>
              ) : (
                'Iniciar Pesquisa de Equipamentos'
              )}
            </button>
          </div>
        </form>

        {/* Informações adicionais */}
        <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-800 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Informações Importantes:
          </h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Todos os campos marcados com * são obrigatórios</li>
            <li>• Os dados da emenda serão salvos no sistema para rastreabilidade</li>
            <li>• Você será direcionado para a consulta de equipamentos do FNS</li>
            <li>• O sistema consultará automaticamente a base do Ministério da Saúde</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Sistema de consulta ao Fundo Nacional de Saúde - Ministério da Saúde
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmendaForm;