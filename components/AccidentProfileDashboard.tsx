import React, { useMemo } from 'react';
import { AccidentReport } from '../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, LabelList } from 'recharts';

const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.121-3.536a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM10 18a1 1 0 01-1-1v-1a1 1 0 112 0v1a1 1 0 01-1 1zm-4.95-.464l-.707-.707a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414zm-2.121-3.536a1 1 0 010-1.414l-.707-.707a1 1 0 01-1.414 1.414l.707.707a1 1 0 011.414 0zM5.05 5.05a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const MoonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>;

const ChartCard: React.FC<{ title: string, children: React.ReactNode, className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-white rounded-lg shadow border border-slate-200/50 ${className}`}>
        <h3 className="text-center font-semibold text-sm uppercase text-brand-dark py-2 border-b border-slate-200/80">{title}</h3>
        <div className="p-2">{children}</div>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/90 p-2 border border-slate-300 rounded shadow-lg backdrop-blur-sm">
        <p className="font-bold text-sm text-brand-dark">{label}</p>
        <p className="text-sm text-slate-700">{`Ocurrencias: ${data.value}`}</p>
        {data.percent && <p className="text-xs text-slate-500">{`Porcentaje: ${data.percent}%`}</p>}
      </div>
    );
  }
  return null;
};

const AccidentProfileDashboard: React.FC<{ accidents: AccidentReport[] }> = ({ accidents }) => {

    const chartData = useMemo(() => {
        const totalAccidents = accidents.length;
        if (totalAccidents === 0) {
          // Return a default structure if there are no accidents to prevent errors
          return {
            seniority: [], dayOfWeek: [], timeSlot: [], total: 0, dayCount: 0, nightCount: 0,
            sector: [], bodyPart: [], ppe: [], injuryType: [], agent: [],
          };
        }

        const seniorityData: Record<string, number> = { '0-3m': 0, '1a': 0, '2a': 0, '3a': 0, '4a': 0, '5a': 0, '>6a': 0 };
        const seniorityMap: Record<string, string> = {'0-3m': '0-3 Meses', '1a':'1 Año', '2a':'2 Años', '3a':'3 Años', '4a':'4 Años', '5a':'5 Años', '>6a':'>6 Años'};
        const dayOfWeekData: Record<string, number> = { Dom: 0, Lun: 0, Mar: 0, Mie: 0, Jue: 0, Vie: 0, Sab: 0 };
        const dayOfWeekMap = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
        const sectorData: Record<string, number> = {};
        const bodyPartData: Record<string, number> = {};
        const timeSlotData: Record<string, number> = {'0-3':0, '3-6':0, '6-9':0, '9-12':0, '12-15':0, '15-18':0, '18-21':0, '21-24':0};
        const ppeData: Record<string, number> = { 'SI': 0, 'NO': 0, 'N/A': 0 };
        const injuryTypeData: Record<string, number> = {};
        const agentData: Record<string, number> = {};
        let dayCount = 0, nightCount = 0;
        let totalMonthsSeniority = 0;
        let validSeniorityCount = 0;

        accidents.forEach(acc => {
            if (acc.fechaIngreso && acc.date) {
                const hireDate = new Date(acc.fechaIngreso);
                const accidentDate = new Date(acc.date);
                if (!isNaN(hireDate.getTime()) && !isNaN(accidentDate.getTime())) {
                    let months = (accidentDate.getFullYear() - hireDate.getFullYear()) * 12 + (accidentDate.getMonth() - hireDate.getMonth());
                    if (accidentDate.getDate() < hireDate.getDate()) {
                        months--;
                    }
                    if (months >= 0) {
                        totalMonthsSeniority += months;
                        validSeniorityCount++;
                        if (months <= 3) seniorityData['0-3m']++;
                        else if (months <= 12) seniorityData['1a']++;
                        else if (months <= 24) seniorityData['2a']++;
                        else if (months <= 36) seniorityData['3a']++;
                        else if (months <= 48) seniorityData['4a']++;
                        else if (months <= 60) seniorityData['5a']++;
                        else seniorityData['>6a']++;
                    }
                }
            }
            if (acc.date) { const day = new Date(acc.date).getUTCDay(); dayOfWeekData[dayOfWeekMap[day]]++; }
            if (acc.time) {
                const hour = parseInt(acc.time.split(':')[0], 10);
                if(hour >= 6 && hour < 18) dayCount++; else nightCount++;
                if (hour < 3) timeSlotData['0-3']++; else if (hour < 6) timeSlotData['3-6']++; else if (hour < 9) timeSlotData['6-9']++; else if (hour < 12) timeSlotData['9-12']++; else if (hour < 15) timeSlotData['12-15']++; else if (hour < 18) timeSlotData['15-18']++; else if (hour < 21) timeSlotData['18-21']++; else timeSlotData['21-24']++;
            }
            if(acc.sector) sectorData[acc.sector] = (sectorData[acc.sector] || 0) + 1;
            if(acc.parteCuerpoAfectada) bodyPartData[acc.parteCuerpoAfectada] = (bodyPartData[acc.parteCuerpoAfectada] || 0) + 1;
            ppeData[acc.utilizaEpp || 'N/A'] = (ppeData[acc.utilizaEpp || 'N/A'] || 0) + 1;
            if(acc.tipoLesion) injuryTypeData[acc.tipoLesion] = (injuryTypeData[acc.tipoLesion] || 0) + 1;
            if(acc.agenteMaterial) agentData[acc.agenteMaterial] = (agentData[acc.agenteMaterial] || 0) + 1;
        });
        
        const topN = (data: Record<string, number>, n: number) => Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, value]) => ({ name, value }));

        const topNWithPercent = (data: Record<string, number>, n: number, total: number) => {
            return Object.entries(data)
                .sort((a, b) => b[1] - a[1])
                .slice(0, n)
                .map(([name, value]) => ({
                    name,
                    value,
                    percent: ((value / total) * 100).toFixed(1),
                }));
        };

        const averageSeniorityMonths = validSeniorityCount > 0 ? totalMonthsSeniority / validSeniorityCount : 0;
        const avgYears = Math.floor(averageSeniorityMonths / 12);
        const avgMonths = Math.floor(averageSeniorityMonths % 12);
        let averageSeniorityText = "N/A";
        if (validSeniorityCount > 0) {
            averageSeniorityText = avgYears > 0 ? `${avgYears}a ${avgMonths}m` : `${avgMonths}m`;
        }
        
        return {
            seniority: Object.entries(seniorityData).map(([name, value]) => ({ name: seniorityMap[name], value })),
            dayOfWeek: Object.entries(dayOfWeekData).map(([name, value]) => ({ name, value })),
            timeSlot: Object.entries(timeSlotData).map(([name, value]) => ({ name, value })),
            total: totalAccidents, dayCount, nightCount, averageSeniorityText,
            sector: topN(sectorData, 5), 
            bodyPart: topNWithPercent(bodyPartData, 10, totalAccidents),
            ppe: Object.entries(ppeData).map(([name, value]) => ({ name, value })),
            injuryType: topN(injuryTypeData, 4), 
            agent: topN(agentData, 5),
        };
    }, [accidents]);
    
    const PPE_COLORS = { 'SI': '#10b981', 'NO': '#ef4444', 'N/A': '#f59e0b' };
    const BAR_COLORS = ['#00529B', '#003F7A', '#64748b', '#94a3b8', '#cbd5e1'];

    return (
        <div className="bg-slate-100 rounded-lg font-sans">
            <div className="text-center bg-brand-dark text-white p-3 rounded-t-lg">
                <h2 className="text-xl font-bold tracking-wider">PERFIL DE ACCIDENTES - ROSARIO 2025</h2>
            </div>

            <div className="p-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* --- LEFT COLUMN --- */}
                <div className="lg:col-span-1 space-y-4">
                    <ChartCard title="Ocurrencias por Antigüedad">
                        <ResponsiveContainer width="100%" height={150}>
                            <LineChart data={chartData.seniority} margin={{ top: 5, right: 20, left: -25, bottom: 5 }}>
                                <defs><linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00529B" stopOpacity={0.8}/><stop offset="95%" stopColor="#00529B" stopOpacity={0}/></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 10 }}/>
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="value" stroke="#00529B" fillOpacity={1} fill="url(#colorUv)" />
                                <Line type="monotone" dataKey="value" stroke="#003F7A" strokeWidth={2} name="Ocurrencias" dot={{ r: 3 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>
                    <ChartCard title="Top 5 Sectores">
                         <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={chartData.sector} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                                <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 9 }} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9'}}/>
                                <Bar dataKey="value" name="Ocurrencias" radius={[0, 4, 4, 0]} barSize={15}>
                                    {chartData.sector.map((entry, index) => (<Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                     <ChartCard title="Top 5 Agentes Causadores">
                        <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={chartData.agent} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 9 }} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9'}}/>
                                <Bar dataKey="value" name="Ocurrencias" radius={[0, 4, 4, 0]} barSize={15}>
                                     {chartData.agent.map((entry, index) => (<Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                     <ChartCard title="Uso de EPP">
                        <ResponsiveContainer width="100%" height={150}>
                             <PieChart>
                                <Pie data={chartData.ppe} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} labelLine={false} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                                     {chartData.ppe.map((entry, index) => ( <Cell key={`cell-${index}`} fill={PPE_COLORS[entry.name as keyof typeof PPE_COLORS]} /> ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [value, name]} />
                                <Legend iconSize={10} wrapperStyle={{fontSize: "11px"}}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>

                {/* --- MIDDLE COLUMN --- */}
                <div className="lg:col-span-2 space-y-4 flex flex-col">
                     <ChartCard title="Métricas Generales" className="flex flex-col items-center">
                        <div className="flex justify-around items-center w-full mt-2">
                             <div className="flex flex-col items-center text-center px-4 w-1/2">
                                 <p className="text-5xl font-bold text-brand-dark my-2">{chartData.total}</p>
                                 <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Ocurrencias</p>
                             </div>
                             <div className="flex flex-col items-center text-center px-4 border-l border-slate-200/80 w-1/2">
                                 <p className="text-5xl font-bold text-brand-dark my-2" title="Antigüedad Promedio">{chartData.averageSeniorityText}</p>
                                 <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Antigüedad Prom</p>
                             </div>
                        </div>
                        <div className="flex justify-around items-center w-full mt-4 border-t border-slate-200/80 pt-4 mb-2">
                            <div className="text-center w-1/2 flex flex-col items-center"><SunIcon /><p className="text-2xl font-semibold mt-1">{chartData.dayCount}</p><p className="text-xs text-slate-500 font-medium">Diurno</p></div>
                            <div className="text-center w-1/2 border-l border-slate-200/80 flex flex-col items-center"><MoonIcon /><p className="text-2xl font-semibold mt-1">{chartData.nightCount}</p><p className="text-xs text-slate-500 font-medium">Nocturno</p></div>
                        </div>
                    </ChartCard>
                    <ChartCard title="Top 10 Partes del Cuerpo Afectadas" className="flex-grow">
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={chartData.bodyPart} layout="vertical" margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 9 }} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9'}}/>
                                <Bar dataKey="value" name="Ocurrencias" radius={[0, 4, 4, 0]} barSize={20}>
                                    {chartData.bodyPart.map((entry, index) => (<Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />))}
                                    <LabelList 
                                        dataKey="percent" 
                                        position="right" 
                                        offset={5}
                                        formatter={(value: string) => `${value}%`} 
                                        style={{ fontSize: '11px', fill: '#475569', fontWeight: '500' }} 
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>

                {/* --- RIGHT COLUMN --- */}
                <div className="lg:col-span-1 space-y-4">
                    <ChartCard title="Ocurrencias por Día">
                        <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={chartData.dayOfWeek} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 10 }}/>
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" name="Ocurrencias" radius={[4, 4, 0, 0]} barSize={20}>
                                    {chartData.dayOfWeek.map((entry, index) => (<Cell key={`cell-${index}`} fill={BAR_COLORS[0]} />))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                    <ChartCard title="Ocurrencias por Hora">
                       <ResponsiveContainer width="100%" height={150}>
                            <LineChart data={chartData.timeSlot} margin={{ top: 5, right: 20, left: -25, bottom: 5 }}>
                               <defs><linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00529B" stopOpacity={0.8}/><stop offset="95%" stopColor="#00529B" stopOpacity={0}/></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="value" stroke="#00529B" fillOpacity={1} fill="url(#colorTime)" />
                                <Line type="monotone" dataKey="value" stroke="#003F7A" strokeWidth={2} name="Ocurrencias" dot={{ r: 3 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>
                     <ChartCard title="Top 4 Tipos de Lesión">
                         <ResponsiveContainer width="100%" height={140}>
                            <BarChart data={chartData.injuryType} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }}/>
                                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 9 }} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9'}}/>
                                <Bar dataKey="value" name="Ocurrencias" radius={[0, 4, 4, 0]} barSize={15}>
                                     {chartData.injuryType.map((entry, index) => (<Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            </div>
        </div>
    );
};

export default AccidentProfileDashboard;