import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Pencil, Trash2, LayoutDashboard, ClipboardList, Download, BarChart3, Activity, RefreshCw } from 'lucide-react';

import { useDashboardData } from '../hooks/useDashboardData';
import { DashboardHeader } from '../components/DashboardHeader';
import { StatsCards } from '../components/StatsCards';
import { DataFormModal } from '../components/DataFormModal';
import { ChartsContainer } from '../components/ChartsContainer';
import apiClient from '../api/apiClient';

export default function Dashboard() {
  const {
    loading, registros, config, insights, user, pesos, altura, 
    setAltura, loadDashboard, handleMarcarInsightLido
  } = useDashboardData();

  const [activeTab, setActiveTab] = useState('panorama'); // 'panorama', 'analise', 'relatorios'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    humor: 3, sono: 8, estudo: 0, produtividade: 3, energia: 3, exercicio: false, agua: 2.0, observacoes: '', peso: ''
  });

  // --- Handlers de Ações ---
  const handleSalvar = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, usuarioId: user.id };
      if (editandoId) {
        await apiClient.put(`/registrosdiarios/${editandoId}`, payload);
      } else {
        await apiClient.post('/registrosdiarios', payload);
      }

      if (formData.peso) {
        await apiClient.post('/pesos', { usuarioId: user.id, valor: parseFloat(formData.peso), data: formData.data });
      }

      setIsModalOpen(false);
      await loadDashboard();
    } catch (err) {
      alert("Erro ao salvar: " + (err.response?.data?.mensagem || err.message));
    }
  };

  const handleEditar = (registro) => {
    setEditandoId(registro.id);
    setFormData({ ...registro, observacoes: registro.observacoes || '' });
    setIsModalOpen(true);
  };

  const handleExcluir = async (id) => {
    if (window.confirm("Tem certeza que deseja apagar permanentemente os dados deste dia?")) {
      try {
        await apiClient.delete(`/registrosdiarios/${id}`);
        await loadDashboard();
      } catch (err) {
        alert("Erro ao excluir");
      }
    }
  };

  const handleSalvarAltura = async () => {
    try {
      await apiClient.patch(`/usuarios/${user.id}/altura`, parseInt(altura), {
        headers: { 'Content-Type': 'application/json' }
      });
      alert("Altura atualizada!");
      await loadDashboard();
    } catch (err) {
      alert("Erro ao atualizar altura");
    }
  };

  // --- Exportações ---
  const handleExportCSV = () => {
    const headers = ["Data", "Humor", "Sono", "Agua", "Produtividade", "Energia", "Exercicio", "Peso", "Observacoes"];
    const csvContent = [
      headers.join(","),
      ...registros.map(r => [r.data, r.humor, r.sono, r.agua, r.produtividade, r.energia, r.exercicio ? "Sim" : "Nao", r.peso || "", `"${(r.observacoes || "").replace(/"/g, '""')}"`].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ritmo_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExportXLSX = () => {
    const wb = XLSX.utils.book_new();
    const wsDiary = XLSX.utils.json_to_sheet(registros.map(r => ({ "Data": r.data, "Humor": r.humor, "Sono": r.sono, "Água": r.agua, "Exercício": r.exercicio ? "Sim" : "Não" })));
    XLSX.utils.book_append_sheet(wb, wsDiary, "Diário de Hábitos");
    XLSX.writeFile(wb, `Ritmo_Analitico_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // --- Cálculos de Estatísticas ---
  const calculaIMC = () => {
    if (!altura || pesos.length === 0) return null;
    return (pesos[0].valor / Math.pow(altura / 100, 2)).toFixed(1);
  };

  const getIMCCategory = (imc) => {
    if (!imc) return { label: 'Aguardando Dados', color: 'gray' };
    const val = parseFloat(imc);
    if (val < 18.5) return { label: 'Abaixo do Peso', color: '#f1c40f' };
    if (val < 25) return { label: 'Normal', color: '#2ecc71' };
    if (val < 30) return { label: 'Sobrepeso', color: '#e67e22' };
    return { label: 'Obeso', color: '#e74c3c' };
  };

  const imcAtual = calculaIMC();
  const imcMeta = getIMCCategory(imcAtual);
  const avgHumor = registros.length > 0 ? (registros.reduce((acc, r) => acc + r.humor, 0) / registros.length).toFixed(1) : '0';
  const avgAgua = registros.length > 0 ? (registros.reduce((acc, r) => acc + r.agua, 0) / registros.length).toFixed(1) : '0';
  const avgSono = registros.length > 0 ? (registros.reduce((acc, r) => acc + r.sono, 0) / registros.length).toFixed(1) : '0';

  const radarData = registros.length > 0 ? [
    { metric: 'Humor', value: Number(avgHumor) },
    { metric: 'Energia', value: Number((registros.reduce((acc, r) => acc + r.energia, 0) / registros.length).toFixed(1)) },
    { metric: 'Produtividade', value: Number((registros.reduce((acc, r) => acc + r.produtividade, 0) / registros.length).toFixed(1)) },
    { metric: 'Ação Física', value: Number(((registros.filter(r => r.exercicio).length / registros.length) * 5).toFixed(1)) }
  ] : [];

  const weightDataForChart = pesos.slice().reverse().map(p => ({
    data: p.data.split('T')[0].split('-').reverse().slice(0, 2).join('/'),
    peso: p.valor
  }));

  if (loading) return <div className="center-wrapper"><RefreshCw className="animate-spin" size={32} color="var(--accent-cyan)" /></div>;

  return (
    <div className="container">
      <DashboardHeader user={user} config={config} insights={insights} onMarkAsRead={handleMarcarInsightLido} />

      <div className="content-divider" style={{ display: 'block' }}>
        <DataFormModal 
          isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSalvar} 
          formData={formData} setFormData={setFormData} editandoId={editandoId} 
          altura={altura} setAltura={setAltura} onSaveAltura={handleSalvarAltura} 
        />

        <main className="main-content" style={{ width: '100%' }}>
          <div className="tabs-wrapper animate-fade-up">
            <button className={`tab-btn ${activeTab === 'panorama' ? 'active' : ''}`} onClick={() => setActiveTab('panorama')}><LayoutDashboard size={18} /> Panorama</button>
            <button className={`tab-btn ${activeTab === 'analise' ? 'active' : ''}`} onClick={() => setActiveTab('analise')}><BarChart3 size={18} /> Análise</button>
            <button className={`tab-btn ${activeTab === 'relatorios' ? 'active' : ''}`} onClick={() => setActiveTab('relatorios')}><ClipboardList size={18} /> Relatórios</button>
          </div>

          <div className="tab-content">
            {activeTab === 'panorama' && (
              <>
                <StatsCards imc={imcAtual} imcMeta={imcMeta} pesoAtual={pesos[0]?.valor} pesoAnterior={pesos[1]?.valor} avgHumor={avgHumor} avgSono={avgSono} avgAgua={avgAgua} />
                <ChartsContainer type="panorama" data={registros} radarData={radarData} />
              </>
            )}

            {activeTab === 'analise' && <ChartsContainer type="analise" data={registros} weightDataForChart={weightDataForChart} />}

            {activeTab === 'relatorios' && (
              <div className="animate-fade-up">
                <div className="chart-header">
                  <h3 style={{ color: 'var(--text-light)' }}>Histórico</h3>
                  <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button className="btn-secondary" onClick={handleExportCSV}><Download size={18} /> CSV</button>
                    <button className="btn-secondary" onClick={handleExportXLSX} style={{ color: '#2ecc71' }}><Download size={18} /> Excel</button>
                  </div>
                </div>
                <div className="glass-panel" style={{ overflowX: 'auto' }}>
                  <table className="history-table">
                    <thead><tr><th>Data</th><th>Água</th><th>Sono</th><th>Humor</th><th>Físico</th><th style={{ textAlign: 'right' }}>Ações</th></tr></thead>
                    <tbody>
                      {registros.map(r => (
                        <tr key={r.id}>
                          <td>{r.data.split('-').reverse().join('/')}</td>
                          <td>{r.agua}L</td><td>{r.sono}h</td><td>{r.humor}/5</td><td>{r.exercicio ? "✅" : "❌"}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="action-btn edit" onClick={() => handleEditar(r)}><Pencil size={18} /></button>
                            <button className="action-btn delete" onClick={() => handleExcluir(r.id)}><Trash2 size={18} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <button className="fab-btn animate-fade-up" onClick={() => { setEditandoId(null); setIsModalOpen(true); }}><Activity size={32} /></button>
    </div>
  );
}
