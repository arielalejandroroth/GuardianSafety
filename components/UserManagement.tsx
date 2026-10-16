import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../contexts/AppContext';
import { UserRole, ActionType, AuthorizedUser } from '../types';
import { SUPER_ADMIN_EMAIL, PRE_AUTHORIZED_USERS, CANONICAL_SHARED_URL, getAppShareUrl, getDefaultState } from '../utils/storage';
import Button from './common/Button';
import Input from './common/Input';
import Select from './common/Select';
import Modal from './common/Modal';
import {
  ShieldCheckIcon,
  CopyIcon,
  WhatsappIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  TableIcon,
  ExclamationTriangleIcon
} from './IconComponents';

const UserManagement: React.FC = () => {
  const {
    user,
    role: currentUserRole,
    isAdmin,
    authorizedUsers,
    addUser,
    updateUserRole,
    revokeUserAccess,
    activateUserAccess,
    deleteUser,
  } = useAuth();

  const { state, dispatch } = useAppContext();

  // Form state to add user
  const [newEmail, setNewEmail] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('supervisor');
  const [newPlant, setNewPlant] = useState('Swift');
  const [newSector, setNewSector] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Link copy state - dynamically uses current domain (Hostinger, custom domain, etc.)
  const [copiedLink, setCopiedLink] = useState(false);
  const sharedUrl = getAppShareUrl();

  // Danger zone state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sharedUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hola! Te comparto el enlace oficial para ingresar a la plataforma de Seguridad e Higiene SafetyGuard Pro:\n${sharedUrl}\n\nIngresa con tu cuenta de Google designada.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      setFeedbackMsg({ text: 'Por favor, ingresa un correo electrónico válido.', type: 'error' });
      return;
    }
    try {
      setIsSubmitting(true);
      await addUser(newEmail, newDisplayName, newRole, newPlant, newSector);
      setNewEmail('');
      setNewDisplayName('');
      setNewSector('');
      setFeedbackMsg({
        text: `Usuario ${newEmail} autorizado exitosamente con rol de ${newRole.toUpperCase()}.`,
        type: 'success'
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({
        text: `Error al autorizar usuario: ${err?.message || 'Error desconocido'}`,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (email: string, role: UserRole) => {
    try {
      await updateUserRole(email, role);
      setFeedbackMsg({ text: `Rol de ${email} actualizado a ${role.toUpperCase()}.`, type: 'success' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      alert("Error al actualizar rol: " + err.message);
    }
  };

  const handleRevoke = async (email: string) => {
    if (confirm(`¿Estás seguro de que deseas REVOCAR el acceso a ${email}? El usuario no podrá ver ni cargar datos.`)) {
      try {
        await revokeUserAccess(email);
        setFeedbackMsg({ text: `Acceso revocado para ${email}.`, type: 'success' });
        setTimeout(() => setFeedbackMsg(null), 3000);
      } catch (err: any) {
        alert("Error al revocar acceso: " + err.message);
      }
    }
  };

  const handleActivate = async (email: string) => {
    try {
      await activateUserAccess(email);
      setFeedbackMsg({ text: `Acceso reactivado para ${email}.`, type: 'success' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      alert("Error al reactivar acceso: " + err.message);
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (confirm(`¿Estás seguro de eliminar permanentemente a ${email} de la lista de usuarios?`)) {
      try {
        await deleteUser(email);
        setFeedbackMsg({ text: `Usuario ${email} eliminado.`, type: 'success' });
        setTimeout(() => setFeedbackMsg(null), 3000);
      } catch (err: any) {
        alert("Error al eliminar usuario: " + err.message);
      }
    }
  };

  // Export full JSON Backup
  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SafetyGuardPro_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Reset to default
  const handleResetData = () => {
    if (resetConfirmText.trim().toUpperCase() !== 'RESTABLECER') {
      alert('Debes escribir la palabra RESTABLECER para confirmar la operación.');
      return;
    }
    const defaults = getDefaultState();
    dispatch({ type: ActionType.RESET_COMPANY_STATE, payload: defaults });
    setIsResetModalOpen(false);
    setResetConfirmText('');
    alert('Los datos centrales de la empresa han sido restablecidos exitosamente a los valores predeterminados.');
  };

  // Merge authorizedUsers and PRE_AUTHORIZED_USERS
  const displayMap = new Map<string, AuthorizedUser>();

  // 1. Initial pre-authorized users
  PRE_AUTHORIZED_USERS.forEach((u) => {
    displayMap.set(u.email.toLowerCase().trim(), { ...u });
  });

  // 2. Override with real-time Firestore authorizedUsers
  authorizedUsers.forEach((u) => {
    displayMap.set(u.email.toLowerCase().trim(), { ...u });
  });

  // 3. Ensure super admin is present
  if (!displayMap.has(SUPER_ADMIN_EMAIL.toLowerCase())) {
    displayMap.set(SUPER_ADMIN_EMAIL.toLowerCase(), {
      id: SUPER_ADMIN_EMAIL,
      email: SUPER_ADMIN_EMAIL,
      displayName: 'Administrador Principal (Creador)',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const displayUsers = Array.from(displayMap.values());
  const pendingUsers = displayUsers.filter((u) => u.status === 'pending');

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Architecture Explanation */}
      <div className="bg-gradient-to-r from-brand-dark via-brand-primary to-blue-900 rounded-xl shadow-xl p-6 sm:p-8 text-white">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/30 mb-3">
              <ShieldCheckIcon className="h-4 w-4 mr-1.5 text-blue-300" />
              Panel de Control del Creador / Administrador
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Gestión de Usuarios, Accesos y Base de Datos
            </h2>
            <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-3xl">
              Administra los usuarios designados, sus roles y permisos en la empresa. Todos los datos
              cargados se alojan en la base de datos central en la nube y se retroalimentan en tiempo real.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20 text-xs sm:text-sm text-slate-200 min-w-[280px]">
            <div className="font-semibold text-white mb-1 flex items-center">
              <span className="h-2 w-2 rounded-full bg-emerald-400 mr-2 animate-ping"></span>
              Base de Datos Conectada
            </div>
            <p className="text-slate-300">Firestore Cloud DB: <span className="font-mono text-emerald-300">ai-studio-816f10ed...</span></p>
            <p className="text-slate-300 mt-1">Super Admin: <span className="font-mono text-white">{SUPER_ADMIN_EMAIL}</span></p>
          </div>
        </div>
      </div>

      {/* 2. Security Notice & Sharing Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 bg-blue-50 rounded-lg text-brand-primary">
              <ShieldCheckIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Enlace Oficial para Usuarios Designados</h3>
              <p className="text-xs text-slate-500">Comparte este link para que los usuarios operen sin ver el código fuente</p>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="font-mono text-xs sm:text-sm text-slate-800 break-all select-all font-medium">
              {sharedUrl}
            </span>
            <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto">
              <Button
                variant="primary"
                size="sm"
                onClick={handleCopyLink}
                className="w-full sm:w-auto flex items-center justify-center !px-3"
              >
                <CopyIcon className="h-4 w-4 mr-1.5" />
                {copiedLink ? '¡Enlace Copiado!' : 'Copiar'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleWhatsAppShare}
                className="w-full sm:w-auto flex items-center justify-center !bg-emerald-600 hover:!bg-emerald-700 !text-white !px-3"
              >
                <WhatsappIcon className="h-4 w-4 mr-1.5" />
                WhatsApp
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 bg-blue-50/70 p-4 rounded-lg border border-blue-100">
            <div>
              <strong className="block text-slate-900 font-semibold mb-0.5">🔒 Código 100% Protegido</strong>
              Los usuarios solo acceden a la aplicación compilada. <em>No pueden ver código, prompts, terminal ni configuraciones.</em>
            </div>
            <div>
              <strong className="block text-slate-900 font-semibold mb-0.5">🔄 Base de Datos Sincronizada</strong>
              Cuando cualquier usuario autorizado carga un incidente, checklist o auditoría, se sincroniza al instante para todos.
            </div>
            <div>
              <strong className="block text-slate-900 font-semibold mb-0.5">⚡ Control en Tiempo Real</strong>
              Puedes revocar el acceso de cualquier usuario en un solo clic y quedará bloqueado inmediatamente sin poder ingresar.
            </div>
          </div>

          <div className="mt-4 p-3.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <div className="flex items-center font-bold text-amber-800">
              <span className="text-sm mr-1.5">⚠️</span>
              ¿El usuario recibe el error de Google "403. No tienes acceso a esta página"?
            </div>
            <p className="text-slate-700 leading-relaxed">
              Los enlaces de vista previa de Google AI Studio (<code>ais-pre-...</code>) requieren que el usuario esté invitado en el proyecto de AI Studio. Para darle acceso instantáneo:
            </p>
            <ol className="list-decimal list-inside text-slate-800 space-y-0.5 ml-1">
              <li>Haz clic en el botón <strong>"Share" (Compartir)</strong> en la barra superior derecha de AI Studio.</li>
              <li>Añade el correo de la persona (ej. <span className="font-mono font-semibold">carlafernandxz@gmail.com</span>).</li>
              <li>Selecciona el rol <strong>"Viewer" (Lector)</strong> para que use la app sin tener acceso al código.</li>
            </ol>
            <p className="text-slate-500 text-[11px] pt-1 border-t border-amber-200/60">
              Alternativamente, puedes usar el botón <strong>"Deploy"</strong> de AI Studio para publicar la aplicación a un dominio web libre de autenticación de AI Studio.
            </p>
          </div>
        </div>

        {/* Database Summary Box */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <TableIcon className="h-5 w-5 text-brand-primary" />
              <h3 className="text-base font-bold text-slate-900">Registros en la Base Común</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Accidentes e Investigaciones:</span>
                <span className="font-bold text-slate-900">{state.accidents.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Hallazgos y Desvíos:</span>
                <span className="font-bold text-slate-900">{state.findings.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Auditorías Internas:</span>
                <span className="font-bold text-slate-900">{state.audits.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Observaciones de Conducta:</span>
                <span className="font-bold text-slate-900">{state.observations.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Checklists Autoelevadores:</span>
                <span className="font-bold text-slate-900">{state.forkliftChecklists.length}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Habilitaciones y Carnets:</span>
                <span className="font-bold text-slate-900">{state.qualifications.length}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportBackup}
              className="w-full text-xs flex items-center justify-center"
            >
              Descargar Backup JSON
            </Button>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-lg flex items-center space-x-3 text-sm font-medium ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircleIcon className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <XCircleIcon className="h-5 w-5 text-red-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* 3. Add User Form */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-1">Designar y Autorizar Nuevo Usuario</h3>
        <p className="text-xs text-slate-500 mb-4">
          Otorga acceso a supervisores, técnicos de seguridad o auditores de planta usando su correo de Google.
        </p>

        <form onSubmit={handleAddUserSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-2">
            <Input
              label="Correo Electrónico (Cuenta Google) *"
              type="email"
              required
              placeholder="ejemplo@swift.com.ar"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
          <div>
            <Input
              label="Nombre / Apellido"
              placeholder="Ej: Ing. Carlos Pérez"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
            />
          </div>
          <div>
            <Select
              label="Rol Asignado *"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
            >
              <option value="supervisor">Supervisor / Editor (Carga y Edición)</option>
              <option value="lector">Lector (Solo Lectura y Reportes)</option>
              <option value="admin">Administrador (Control Total)</option>
            </Select>
          </div>
          <div>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center py-2.5"
            >
              {isSubmitting ? 'Guardando...' : '+ Autorizar Usuario'}
            </Button>
          </div>
        </form>
      </div>

      {/* 3.5. Pending Access Requests Alert */}
      {pendingUsers.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6 shadow-md">
          <div className="flex items-center space-x-3 mb-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <h3 className="text-lg font-bold text-amber-900">
              Solicitudes de Acceso Pendientes ({pendingUsers.length})
            </h3>
          </div>
          <p className="text-xs text-amber-800 mb-4">
            Los siguientes colaboradores iniciaron sesión en el enlace oficial y están esperando tu aprobación para ingresar:
          </p>

          <div className="space-y-3">
            {pendingUsers.map((pu) => (
              <div
                key={pu.email}
                className="bg-white p-4 rounded-lg border border-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm"
              >
                <div>
                  <div className="font-semibold text-slate-900 text-sm">
                    {pu.displayName || pu.email.split('@')[0]}
                  </div>
                  <div className="font-mono text-xs text-slate-600">{pu.email}</div>
                  <div className="text-[11px] text-amber-700 mt-0.5">Esperando designación de rol</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={async () => {
                      await addUser(pu.email, pu.displayName || pu.email.split('@')[0], 'supervisor');
                      setFeedbackMsg({ text: `Acceso concedido a ${pu.email} como Supervisor.`, type: 'success' });
                    }}
                    className="!bg-blue-600 hover:!bg-blue-700 text-xs py-1.5"
                  >
                    Aprobar como Supervisor
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      await addUser(pu.email, pu.displayName || pu.email.split('@')[0], 'lector');
                      setFeedbackMsg({ text: `Acceso concedido a ${pu.email} como Lector.`, type: 'success' });
                    }}
                    className="text-xs py-1.5"
                  >
                    Aprobar como Lector
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleRevoke(pu.email)}
                    className="text-xs py-1.5"
                  >
                    Rechazar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Authorized Users Table */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Listado de Usuarios y Permisos</h3>
            <p className="text-xs text-slate-500">
              Total de usuarios registrados: <span className="font-semibold text-slate-800">{displayUsers.length}</span>
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Correo Google
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Rol de Acceso
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Acciones de Permiso
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {displayUsers.map((u) => {
                const isMainAdmin = u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

                let roleBadgeClass = 'bg-blue-100 text-blue-800';
                if (u.role === 'admin') roleBadgeClass = 'bg-purple-100 text-purple-800';
                if (u.role === 'lector') roleBadgeClass = 'bg-emerald-100 text-emerald-800';

                let statusBadgeClass = 'bg-emerald-100 text-emerald-800';
                let statusLabel = 'Activo';
                if (u.status === 'revoked') {
                  statusBadgeClass = 'bg-red-100 text-red-800 font-bold';
                  statusLabel = 'Acceso Revocado';
                } else if (u.status === 'pending') {
                  statusBadgeClass = 'bg-amber-100 text-amber-800';
                  statusLabel = 'Pendiente';
                }

                return (
                  <tr key={u.email} className={u.status === 'revoked' ? 'bg-red-50/40' : 'hover:bg-slate-50/60'}>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-medium text-slate-900 flex items-center">
                        {u.displayName || u.email.split('@')[0]}
                        {isMainAdmin && (
                          <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-purple-600 text-white rounded font-bold uppercase">
                            Creador
                          </span>
                        )}
                      </div>
                      {u.plant && <div className="text-xs text-slate-500">Planta: {u.plant}</div>}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs text-slate-600">
                      {u.email}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {isMainAdmin ? (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleBadgeClass}`}>
                          ADMINISTRADOR
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.email, e.target.value as UserRole)}
                          className="text-xs rounded-lg border border-slate-300 py-1 px-2 bg-white focus:ring-brand-primary focus:border-brand-primary"
                        >
                          <option value="supervisor">Supervisor / Editor</option>
                          <option value="lector">Lector (Solo Vista)</option>
                          <option value="admin">Administrador</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-right space-x-2">
                      {!isMainAdmin && (
                        <>
                          {u.status === 'revoked' ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleActivate(u.email)}
                              className="!bg-emerald-600 hover:!bg-emerald-700 !text-white !py-1 !px-2.5 !text-xs"
                            >
                              Reactivar
                            </Button>
                          ) : (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRevoke(u.email)}
                              className="!py-1 !px-2.5 !text-xs"
                            >
                              Revocar Permiso
                            </Button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(u.email)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors inline-block align-middle"
                            title="Eliminar de la lista"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Danger Zone: Data Management / Reset */}
      {isAdmin && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-6">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-grow">
              <h4 className="text-base font-bold text-red-900">Zona de Administración y Mantenimiento de Datos</h4>
              <p className="text-xs text-red-700 mt-1">
                Como Administrador o Creador, puedes restablecer los datos de la base central a los valores predeterminados
                de planta (limpiando pruebas y accidentes de ensayo cargados por usuarios).
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setIsResetModalOpen(true)}
                  className="!px-4 !py-2 text-xs"
                >
                  Restablecer Base de Datos Central
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExportBackup}
                  className="!px-4 !py-2 text-xs"
                >
                  Exportar Copia de Seguridad Antes de Limpiar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Resetting Database */}
      {isResetModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsResetModalOpen(false)}
          title="⚠️ Confirmación de Seguridad: Restablecer Datos"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Esta acción restablecerá todos los accidentes, auditorías, hallazgos y checklists de la empresa
              a la base limpia predeterminada de Minerva Foods.
            </p>
            <p className="text-xs text-red-600 font-semibold">
              Para confirmar, escribe la palabra <span className="font-mono bg-red-100 px-1 py-0.5 rounded">RESTABLECER</span> a continuación:
            </p>
            <Input
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="RESTABLECER"
            />
            <div className="flex justify-end space-x-3 pt-3">
              <Button variant="secondary" onClick={() => setIsResetModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleResetData}
                disabled={resetConfirmText.trim().toUpperCase() !== 'RESTABLECER'}
              >
                Confirmar y Restablecer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;
