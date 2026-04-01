import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Activity, Droplets, Moon, Brain, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import apiClient from '../api/apiClient';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [registros, setRegistros] = useState([]);
  const [config, setConfig] = useState(null);
  const [user, setUser] = useState(null);

  // Estados do Formulário (CRUD)
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    humor: 3,
    sono: 8,
    estudo: 0,
    produtividade: 3,
    energia: 3,
    exercicio: false,
    agua: 2.0,
    observacoes: ''
  });

  const loadDashboard = async () => {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuarioLogado) return navigate('/login');
    setUser(usuarioLogado);

    try {
      const registrosFetch = await apiClient.get(`/registrosdiarios/usuario/${usuarioLogado.id}`);
      setRegistros(registrosFetch);

      const configFetch = await apiClient.get(`/configuracoesperfil/usuario/${usuarioLogado.id}`);
      setConfig(configFetch);
    } catch (err) {
      console.error("Falha ao puxar os dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Handler do Form (Criar ou Atualizar)
  const handleSalvar = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        usuarioId: user.id,
        humor: Number(formData.humor),
        sono: Number(formData.sono),
        estudo: Number(formData.estudo),
        produtividade: Number(formData.produtividade),
        energia: Number(formData.energia),
        agua: Number(formData.agua)
      };

      if (editandoId) {
        payload.id = editandoId;
        await apiClient.put(`/registrosdiarios/${editandoId}`, payload);
      } else {
        await apiClient.post('/registrosdiarios', payload);
      }

      // Limpar form
      setEditandoId(null);
      setFormData({
        data: new Date().toISOString().split('T')[0],
        humor: 3, sono: 8, estudo: 0, produtividade: 3, energia: 3, exercicio: false, agua: 2.0, observacoes: ''
      });
      // Recarregar a tela
      await loadDashboard();
    } catch (err) {
      alert("Erro ao salvar: " + (err.response?.data?.mensagem || err.message));
    }
  };

  const handleEditar = (registro) => {
    setEditandoId(registro.id);
    setFormData({
      data: registro.data,
      humor: registro.humor,
      sono: registro.sono,
      estudo: registro.estudo,
      produtividade: registro.produtividade,
      energia: registro.energia,
      exercicio: registro.exercicio,
      agua: registro.agua,
      observacoes: registro.observacoes || ''
    });
    // Rola para o topo onde está o form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExcluir = async (id) => {
    const confirmou = window.confirm("Tem certeza que deseja apagar os dados deste dia?");
    if (confirmou) {
      try {
        await apiClient.delete(`/registrosdiarios/${id}`);
        await loadDashboard();
      } catch (err) {
        alert("Erro ao excluir: " + (err.response?.data?.mensagem || err.message));
      }
    }
  };

  if (loading) {
    return <div className="center-wrapper"><RefreshCw className="animate-spin" size={32} color="var(--accent-cyan)" /></div>;
  }

  const avgHumor = registros.length > 0 ? (registros.reduce((acc, r) => acc + r.humor, 0) / registros.length).toFixed(1) : '0';
  const totalAgua = registros.reduce((acc, r) => acc + r.agua, 0).toFixed(1);
  const avgSono = registros.length > 0 ? (registros.reduce((acc, r) => acc + r.sono, 0) / registros.length).toFixed(1) : '0';

  return (
    <div className="container">
      {/* Navegação Topo */}
      <nav className="top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Activity size={32} color="var(--accent-cyan)" />
          <div className="logo">Ritmo Analytics</div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {config?.idioma && <span style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>Idioma: {config.idioma}</span>}
          <button 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontWeight: '500' }}
            onClick={() => { localStorage.clear(); navigate('/login'); }}
          >
            Sair <LogOut size={18} />
          </button>
        </div>
      </nav>

      <div className="content-divider">
        {/* Lado Esquerdo: Formulário de Entrada Direta */}
        <aside className="form-sidebar glass-panel">
          <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-light)' }}>
            {editandoId ? 'Editando Dados' : 'Inserir Novo Dia'}
          </h3>
          <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div>
              <label className="input-label">Data</label>
              <input type="date" className="input-field" disabled={!!editandoId} value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} required />
              {editandoId && <small style={{color:'var(--accent-purple)'}}>A data não pode ser mudada ao editar.</small>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="input-label">Humor (1-5)</label>
                <input type="number" min="1" max="5" className="input-field" value={formData.humor} onChange={(e) => setFormData({...formData, humor: e.target.value})} />
              </div>
              <div>
                <label className="input-label">Produt. (1-5)</label>
                <input type="number" min="1" max="5" className="input-field" value={formData.produtividade} onChange={(e) => setFormData({...formData, produtividade: e.target.value})} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="input-label">Água (L)</label>
                <input type="number" step="0.1" className="input-field" value={formData.agua} onChange={(e) => setFormData({...formData, agua: e.target.value})} />
              </div>
              <div>
                <label className="input-label">Sono (h)</label>
                <input type="number" step="0.5" className="input-field" value={formData.sono} onChange={(e) => setFormData({...formData, sono: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="input-label">Energia (1-5)</label>
              <input type="range" min="1" max="5" style={{width: '100%'}} value={formData.energia} onChange={(e) => setFormData({...formData, energia: e.target.value})} />
              <div style={{textAlign: 'center', color: 'var(--text-main)'}}>{formData.energia} / 5</div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', marginTop: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={formData.exercicio} onChange={(e) => setFormData({...formData, exercicio: e.target.checked})} />
              Fiz Exercício Físico Hoje
            </label>

            <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
              {editandoId ? 'Atualizar Dia' : 'Salvar Dia'}
            </button>

            {editandoId && (
              <button type="button" onClick={() => {
                setEditandoId(null);
                setFormData({...formData, data: new Date().toISOString().split('T')[0]}); 
              }} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>
                Cancelar Edição
              </button>
            )}
          </form>
        </aside>

        {/* Lado Direito: Dashboard Principal (Gráficos e Tabela) */}
        <main className="main-content">
          <div className="dashboard-grid" style={{ marginBottom: '2.5rem' }}>
            <div className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Média de Humor</h3>
                 <Brain size={24} color="var(--accent-purple)" />
              </div>
              <div className="stat-value" style={{ marginTop: '1rem' }}>{avgHumor} <span style={{fontSize: '1rem'}}>/ 5</span></div>
            </div>

            <div className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Sono (Média)</h3>
                 <Moon size={24} color="var(--accent-cyan-dim)" />
              </div>
              <div className="stat-value" style={{ marginTop: '1rem' }}>{avgSono} <span style={{fontSize: '1rem'}}>h</span></div>
            </div>

            <div className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Água Global</h3>
                 <Droplets size={24} color="#3498db" />
              </div>
              <div className="stat-value" style={{ marginTop: '1rem' }}>{totalAgua} <span style={{fontSize: '1rem'}}>L</span></div>
            </div>
          </div>

          {registros.length === 0 ? (
             <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
                Amanhã é o primeiro passo de muitos. Comece preenchendo o formulário de hoje as quantidades de água e sono para gerar gráficos!
             </div>
          ) : (
            <>
              {/* Gráficos */}
              <div className="dashboard-grid" style={{ marginBottom: '2.5rem' }}>
                <div className="glass-panel" style={{ height: '350px' }}>
                  <h4 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Evolução de Produtividade</h4>
                   <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={registros.slice().reverse()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="data" stroke="var(--text-main)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-main)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 5]} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-color-alt)', border: '1px solid var(--accent-purple)' }} />
                      <Line type="monotone" dataKey="produtividade" stroke="var(--accent-purple)" strokeWidth={3} dot={{ fill: 'var(--bg-color)', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="glass-panel" style={{ height: '350px' }}>
                  <h4 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Curva Físico-Recuperativa</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={registros.slice().reverse()}>
                      <defs>
                        <linearGradient id="colorSono" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="data" stroke="var(--text-main)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-main)" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-color-alt)', border: '1px solid var(--accent-cyan)' }} />
                      <Area type="monotone" dataKey="sono" stroke="var(--accent-cyan)" strokeWidth={2} fillOpacity={1} fill="url(#colorSono)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tabela de Histórico Analítico */}
              <div className="glass-panel" style={{ overflowX: 'auto' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-light)' }}>Histórico Detalhado</h3>
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Água</th>
                      <th>Sono</th>
                      <th>Humor</th>
                      <th>Exercício</th>
                      <th style={{ textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registros.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: '500', color: 'var(--text-light)' }}>
                          {r.data.split('-').reverse().join('/')}
                        </td>
                        <td>{r.agua} L</td>
                        <td>{r.sono} h</td>
                        <td>{r.humor} / 5</td>
                        <td>{r.exercicio ? '✅' : '❌'}</td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button 
                            className="action-btn edit" 
                            title="Editar"
                            onClick={() => handleEditar(r)}
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            className="action-btn delete" 
                            title="Excluir"
                            onClick={() => handleExcluir(r.id)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
