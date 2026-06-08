





import React from 'react';
import { Finding, View, DialogueFormState, DialogueType, FindingStatus, RiskLevel, FindingSource, Qualification, QualificationStatus, ObservationFormState } from '../types';
import Button from './common/Button';
import { DocumentAddIcon, ClipboardCheckIcon, AmbulanceIcon, UsersIcon, IdCardIcon, DocumentTextIcon, ExclamationTriangleIcon, ClockIcon, ClipboardDocumentListIcon, UserGroupIcon, ForkliftIcon, AiVisionIcon, ImageIcon } from './IconComponents';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Card from './common/Card';

interface DashboardProps {
  findings: Finding[];
  dialogues: DialogueFormState[];
  qualifications: Qualification[];
  observations: ObservationFormState[];
  onNavigate: (view: View) => void;
}

const ActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; description: string; }> = ({ icon, label, onClick, description }) => (
    <button onClick={onClick} className="text-left p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all duration-200 w-full flex items-center space-x-4">
        <div className="flex-shrink-0 text-brand-primary">
            {icon}
        </div>
        <div>
            <p className="font-semibold text-brand-dark">{label}</p>
            <p className="text-xs text-slate-500">{description}</p>
        </div>
    </button>
);


const BehavioralGoals: React.FC<{ observations: number; dds: number; dss: number; dms: number; onNavigate: (view: View) => void; }> = ({ observations, dds, dss, dms, onNavigate }) => {
    const goals = {
        observations: { target: 8, label: 'Obs. de Comp.' },
        dds: { target: 20, label: 'DDS' },
        dss: { target: 4, label: 'DSS' },
        dms: { target: 1, label: 'DMS' },
    };

    const GoalProgress: React.FC<{current: number, target: number, label: string}> = ({ current, target, label }) => {
        const percentage = Math.min((current / target) * 100, 100);
        const strokeColor = percentage >= 100 ? 'text-status-safe' : 'text-brand-primary';
        return (
            <div className="text-center">
                <div className="relative w-20 h-20 mx-auto">
                     <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path
                            d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                            className="text-slate-200"
                            fill="none"
                            strokeWidth="3.5"
                            stroke="currentColor"
                        />
                        <path
                            d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                            className={strokeColor}
                            fill="none"
                            strokeWidth="3.5"
                            strokeDasharray={`${percentage}, 100`}
                            strokeLinecap="round"
                            stroke="currentColor"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold text-slate-700">{current}</span>
                    </div>
                </div>
                <p className="text-sm font-semibold text-slate-600 mt-2">{label}</p>
                <p className="text-xs text-slate-400">Meta: {target}</p>
            </div>
        )
    };

    return (
        <Card 
            title="Metas de Comportamiento (Mes)" 
            titleAction={
                <Button size="sm" variant="secondary" onClick={() => onNavigate(View.DIALOGUES_MATRIX)}>
                    Ver Historial
                </Button>
            }
        >
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <GoalProgress current={observations} target={goals.observations.target} label={goals.observations.label} />
                 <GoalProgress current={dds} target={goals.dds.target} label={goals.dds.label} />
                 <GoalProgress current={dss} target={goals.dss.target} label={goals.dss.label} />
                 <GoalProgress current={dms} target={goals.dms.target} label={goals.dms.label} />
             </div>
        </Card>
    )
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; bgColor: string; }> = ({ title, value, icon, color, bgColor }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm flex items-center space-x-4">
      <div className={`p-3 rounded-lg ${bgColor} ${color}`}>
          {icon}
      </div>
      <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
  </div>
);


const Dashboard: React.FC<DashboardProps> = ({ findings, dialogues, qualifications, observations, onNavigate }) => {
    // Action Launcher data
    const actions = [
        { icon: <AiVisionIcon className="h-7 w-7"/>, label: 'Segurito Vision', description: 'Analizar riesgos con IA', view: View.SEGURITO_VISION },
        { icon: <ImageIcon className="h-7 w-7"/>, label: 'Generador de Imagen', description: 'Crear imágenes con IA', view: View.IMAGE_GENERATOR },
        { icon: <DocumentAddIcon className="h-7 w-7"/>, label: 'Observación', description: 'Registrar un comportamiento', view: View.FORM },
        { icon: <ClipboardCheckIcon className="h-7 w-7"/>, label: 'Auditoría', description: 'Ver historial o iniciar auditoría', view: View.AUDITS_MATRIX },
        { icon: <AmbulanceIcon className="h-7 w-7"/>, label: 'Incidente', description: 'Reportar accidente o incidente', view: View.ACCIDENTS_MATRIX },
        { icon: <UsersIcon className="h-7 w-7"/>, label: 'Diálogo', description: 'Anotar un diálogo de seguridad', view: View.DIALOGUE_FORM },
        { icon: <IdCardIcon className="h-7 w-7"/>, label: 'Habilitación', description: 'Crear carnet de habilitación', view: View.QUALIFICATION_FORM },
        { icon: <ForkliftIcon className="h-7 w-7"/>, label: 'Control Vehicular', description: 'Checklist SRT 960/15 Autoelevadores', view: View.FORKLIFT_CHECKLIST_MATRIX },
    ];
    
    // Behavioral Goals data
    const observationCount = observations.length;
    const ddsCount = dialogues.filter(d => d.type === DialogueType.DDS).length;
    const dssCount = dialogues.filter(d => d.type === DialogueType.DSS).length;
    const dmsCount = dialogues.filter(d => d.type === DialogueType.DMS).length;

    // Chart data
    const now = new Date();
    const findingsByStatus = findings.reduce((acc, f) => {
        let status: FindingStatus = f.status;
        if (f.status !== FindingStatus.CUMPLIDO && f.plannedDate && new Date(f.plannedDate) < now) {
            status = FindingStatus.RETRASADO;
        }
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const statusChartData = Object.entries(findingsByStatus).map(([name, value]) => ({ name, value }));
    
    const riskLevelData = findings.filter(f => f.status !== FindingStatus.CUMPLIDO).reduce((acc, f) => {
        acc[f.riskLevel] = (acc[f.riskLevel] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const riskChartData = Object.entries(riskLevelData).map(([name, value]) => ({ name, value }));

    const COLORS = {
        [FindingStatus.ABIERTO]: '#3b82f6', // blue-500
        [FindingStatus.EN_EJECUCION]: '#f59e0b', // amber-500
        [FindingStatus.CUMPLIDO]: '#10b981', // emerald-500
        [FindingStatus.RETRASADO]: '#ef4444', // red-500
    };
    
    const RISK_COLORS = {
        [RiskLevel.ALTO]: '#ef4444',
        [RiskLevel.MEDIO]: '#f59e0b',
        [RiskLevel.BAJO]: '#3b82f6',
    };

    // Stats Cards data
    const openHighRiskCount = findings.filter(f => f.status !== FindingStatus.CUMPLIDO && f.riskLevel === RiskLevel.ALTO).length;
    const expiringSoonCount = qualifications.filter(q => {
        const expiry = new Date(q.expiryDate);
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        return expiry > today && expiry <= thirtyDaysFromNow;
    }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard de Seguridad</h2>
        <p className="text-slate-500">Resumen del estado actual del sistema.</p>
      </div>

       {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <StatCard title="Total Hallazgos" value={findings.length} icon={<DocumentTextIcon className="w-6 h-6"/>} color="text-blue-600" bgColor="bg-blue-100" />
        <StatCard title="Abiertos / Ejec." value={findings.filter(f => f.status !== FindingStatus.CUMPLIDO).length} icon={<ClipboardDocumentListIcon className="w-6 h-6"/>} color="text-amber-600" bgColor="bg-amber-100" />
        <StatCard title="Riesgo Alto" value={openHighRiskCount} icon={<ExclamationTriangleIcon className="w-6 h-6"/>} color="text-red-600" bgColor="bg-red-100" />
        <StatCard title="Retrasados" value={findingsByStatus[FindingStatus.RETRASADO] || 0} icon={<ClockIcon className="w-6 h-6"/>} color="text-purple-600" bgColor="bg-purple-100" />
        <StatCard title="Habil. por Vencer" value={expiringSoonCount} icon={<UserGroupIcon className="w-6 h-6"/>} color="text-yellow-600" bgColor="bg-yellow-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Actions & Charts */}
        <div className="lg:col-span-2 space-y-6">
           <BehavioralGoals observations={observationCount} dds={ddsCount} dss={dssCount} dms={dmsCount} onNavigate={onNavigate} />
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Hallazgos por Estado">
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <PieChart>
                             <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                                const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                                return ( (percent*100) > 5 ? <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="12">
                                    {`${(percent * 100).toFixed(0)}%`}
                                </text> : null);
                            }}>
                                {statusChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} stroke={COLORS[entry.name as keyof typeof COLORS]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => [value, 'Hallazgos']} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </Card>
            <Card title="Hallazgos Abiertos por Riesgo">
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={riskChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                           <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                           <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                           <YAxis type="category" dataKey="name" width={80} tickLine={false} axisLine={false} tick={{fill: '#64748b'}} />
                           <Tooltip cursor={{fill: 'rgba(241, 245, 249, 0.8)'}} contentStyle={{borderRadius: '0.5rem', border: '1px solid #e2e8f0'}}/>
                           <Bar dataKey="value" name="N° Hallazgos" barSize={25} radius={[0, 4, 4, 0]}>
                                {riskChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name as keyof typeof RISK_COLORS]} />
                                ))}
                           </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
           </div>
        </div>
        {/* Right Column: Quick Actions */}
        <div className="space-y-4">
            <h3 className="font-semibold text-lg text-slate-800">Acciones Rápidas</h3>
            {actions.map(action => <ActionButton key={action.label} {...action} onClick={() => onNavigate(action.view)} />)}
        </div>
      </div>
    </div>
  );
};


export default Dashboard;