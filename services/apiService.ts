export interface ServerEstado {
  ok: boolean;
  apiKeyConfigurada: boolean;
  servidor: string;
}

export interface ApiDatosResponse<T = any> {
  ok: boolean;
  datos?: T;
  error?: string;
}

export type ApiDataStatus = 
  | 'idle'
  | 'loading'
  | 'success'
  | 'key_missing'
  | 'auth_error'
  | 'service_unavailable'
  | 'timeout'
  | 'empty_data'
  | 'network_error'
  | 'invalid_format';

/**
 * Consulta el estado del servidor y si tiene la API Key configurada internamente.
 * Utiliza exclusivamente una ruta relativa al mismo dominio (/api/estado).
 */
export async function checkServerStatus(): Promise<ServerEstado> {
  try {
    const response = await fetch('/api/estado', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return {
        ok: false,
        apiKeyConfigurada: false,
        servidor: 'inactivo o no disponible',
      };
    }

    const data = await response.json();
    return {
      ok: Boolean(data?.ok),
      apiKeyConfigurada: Boolean(data?.apiKeyConfigurada),
      servidor: String(data?.servidor || 'operativo'),
    };
  } catch (error) {
    console.warn('[ApiService] Error al consultar /api/estado:', error);
    return {
      ok: false,
      apiKeyConfigurada: false,
      servidor: 'sin conexión al backend',
    };
  }
}

/**
 * Consulta datos protegidos desde el backend a través de /api/datos.
 * El frontend nunca gestiona, envía ni solicita ninguna clave.
 */
export async function fetchApiDatos<T = any>(): Promise<{
  status: ApiDataStatus;
  data?: T;
  errorMessage?: string;
}> {
  // Comprobación de conectividad del navegador
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      status: 'network_error',
      errorMessage: 'Sin conexión a internet en el dispositivo.',
    };
  }

  try {
    const response = await fetch('/api/datos', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        status: 'invalid_format',
        errorMessage: 'La respuesta del servidor no tiene un formato JSON válido.',
      };
    }

    let result: ApiDatosResponse<T>;
    try {
      result = await response.json();
    } catch {
      return {
        status: 'invalid_format',
        errorMessage: 'No fue posible interpretar los datos devueltos por el servidor.',
      };
    }

    if (response.status === 500) {
      return {
        status: 'key_missing',
        errorMessage: result.error || 'La API del servidor no está configurada.',
      };
    }

    if (response.status === 504 || (result.error && result.error.includes('tardó demasiado'))) {
      return {
        status: 'timeout',
        errorMessage: 'La API externa tardó demasiado en responder.',
      };
    }

    if (response.status === 502) {
      if (result.error && result.error.includes('autenticación')) {
        return {
          status: 'auth_error',
          errorMessage: 'La API externa rechazó la autenticación configurada en el servidor.',
        };
      }
      return {
        status: 'service_unavailable',
        errorMessage: result.error || 'La API externa no está disponible en este momento.',
      };
    }

    if (!response.ok || !result.ok) {
      return {
        status: 'service_unavailable',
        errorMessage: result.error || 'No se pudieron cargar los datos en este momento. Intenta nuevamente.',
      };
    }

    if (result.datos === null || result.datos === undefined || (Array.isArray(result.datos) && result.datos.length === 0)) {
      return {
        status: 'empty_data',
        data: result.datos,
        errorMessage: 'No se encontraron datos registrados en el servicio.',
      };
    }

    return {
      status: 'success',
      data: result.datos,
    };
  } catch (error: any) {
    console.warn('[ApiService] Error de conexión con /api/datos:', error);
    return {
      status: 'network_error',
      errorMessage: 'No se pudo conectar con el servidor. Verifique su conexión a internet.',
    };
  }
}
