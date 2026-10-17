# GuardianSafety - Arquitectura Segura Frontend + Backend Node.js

Aplicación integral para la gestión de seguridad laboral, prevención de riesgos, análisis de accidentes y reportes técnicos con arquitectura segura cliente-servidor.

---

## 1. Cómo instalar dependencias

Requiere **Node.js 18+** (recomendado **Node.js 20 o 22**).

```bash
npm install
```

---

## 2. Cómo ejecutar en desarrollo

Para iniciar el servidor de desarrollo con recarga en caliente (Hot Reload mediante Vite y Express):

```bash
npm run dev
```

El servidor estará disponible en:
```text
http://localhost:3000
```

---

## 3. Cómo construir el proyecto

El comando de compilación genera tanto el bundle optimizado del frontend como el servidor empaquetado para producción:

```bash
npm run build
```

Este proceso produce los siguientes archivos en la carpeta `dist/`:
* `dist/index.html` y activos estáticos (`dist/assets/`).
* `dist/server.cjs` (servidor Node.js backend empaquetado).

---

## 4. Cómo iniciar en producción

Para arrancar el servidor Node.js en un entorno de producción (o en el servidor local compilado):

```bash
npm start
```

El comando ejecuta internamente:
```bash
node dist/server.cjs
```

---

## 5. Cómo agregar API_KEY en Hostinger

Para que la aplicación funcione en Hostinger como una aplicación Node.js segura y ningún usuario ni dispositivo necesite ingresar claves:

1. Ingresa a tu panel de control de **Hostinger (hPanel)**.
2. Dirígete a la sección **Node.js** (o en la configuración de la aplicación web).
3. Configura los siguientes parámetros de la aplicación:
   * **Tipo de aplicación:** `Node.js`
   * **Directorio raíz / salida:** `dist`
   * **Archivo de entrada (Application startup file):** `app.cjs` (o `dist/server.cjs`)
   * **Versión de Node.js:** `20.x` o `22.x`
4. En el apartado **Variables de entorno (Environment Variables)**, añade una nueva variable:
   * **Nombre:** `API_KEY`
   * **Valor:** Tu clave privada proporcionada por el servicio (por ejemplo, Google Gemini u otra API externa).
5. Haz clic en **Guardar** y luego en **Restart (Reiniciar)** la aplicación Node.js.

> **Importante:** La clave se almacena de forma segura en las variables del servidor y nunca se incluye en el código fuente, repositorios Git ni respuestas al navegador.

---

## 6. Cómo probar /api/estado

La ruta `/api/estado` permite diagnosticar si el backend está activo y si la clave privada está cargada, sin exponer jamás ningún secreto ni fragmento de la clave.

### Prueba mediante navegador o curl:
```bash
curl -i https://tudominio.com/api/estado
```

### Respuesta esperada cuando la clave está configurada:
```json
{
  "ok": true,
  "apiKeyConfigurada": true,
  "servidor": "operativo"
}
```

### Respuesta esperada si falta configurar la clave en el servidor:
```json
{
  "ok": true,
  "apiKeyConfigurada": false,
  "servidor": "operativo"
}
```

---

## 7. Cómo probar /api/datos

La ruta `/api/datos` es el punto de enlace seguro donde el frontend solicita datos. El servidor backend lee `process.env.API_KEY`, consulta la API externa y devuelve solo los datos sanitizados.

### Prueba mediante curl:
```bash
curl -i https://tudominio.com/api/datos
```

### Respuesta esperada (Éxito):
```json
{
  "ok": true,
  "datos": { ... }
}
```

### Respuesta cuando falta la clave en el servidor (HTTP 500):
```json
{
  "ok": false,
  "error": "La API del servidor no está configurada"
}
```

---

## 8. Cómo cambiar la URL de la API externa

En el archivo `server.ts` existe la constante claramente identificada:

```typescript
// ============================================================================
// CONFIGURACIÓN DE API EXTERNA
// URL del endpoint externo que el servidor consulta de manera segura.
// Puede modificarse mediante la variable de entorno EXTERNAL_API_URL o editando esta constante.
// ============================================================================
export const EXTERNAL_API_URL = process.env.EXTERNAL_API_URL || "https://generativelanguage.googleapis.com/v1beta/models";
```

### Para cambiar la URL:
* **Opción A (Recomendada en Hostinger):** Añadir la variable de entorno `EXTERNAL_API_URL` en el panel de Hostinger con la URL de tu API externa.
* **Opción B (En código):** Modificar el valor por defecto de la constante `EXTERNAL_API_URL` en `server.ts` y volver a compilar con `npm run build`.

### Tipo de autenticación en cabecera:
Por defecto envía `Authorization: Bearer ${apiKey}`. Si tu API externa requiere `x-api-key`, define en Hostinger:
* `EXTERNAL_API_AUTH_TYPE=x-api-key`

---

## 9. Cómo interpretar errores HTTP

| Código | Significado | Mensaje devuelto al cliente | Causa y Acción recomendada |
| :--- | :--- | :--- | :--- |
| **500** | Configuración interna | `La API del servidor no está configurada` | Falta definir `API_KEY` en las variables de entorno del servidor. |
| **502** | Fallo de autenticación externo | `La API externa rechazó la autenticación` | La API externa devolvió 401 o 403. La clave configurada en el servidor es inválida, expiró o no tiene permisos. |
| **502** | Servicio externo no disponible | `La API externa no está disponible en este momento` | La API externa devolvió 404, 429 (límite de cuota) o 500. Se debe esperar unos instantes o verificar el servicio externo. |
| **504** | Tiempo de espera agotado | `La API externa tardó demasiado en responder` | La petición tardó más de 15 segundos y el backend canceló la espera controladamente con `AbortController`. |
| **Sin conexión** | Dispositivo fuera de línea | `Sin conexión a internet en el dispositivo` | El teléfono o navegador no tiene acceso a internet. |

---

## 10. Cómo comprobar que la API Key no se está exponiendo en el navegador

Para verificar y certificar la seguridad de la aplicación:

1. Abre la aplicación en cualquier navegador (Google Chrome, Firefox, Safari).
2. Presiona **F12** o haz clic derecho > **Inspeccionar**.
3. Ve a la pestaña **Network (Red)**:
   * Realiza una solicitud (por ejemplo, presiona "Solicitar Datos" o realiza un análisis de accidente).
   * Selecciona la petición hacia `/api/datos` o `/api/gemini`.
   * En los encabezados de la solicitud (**Request Headers**), comprueba que **NO** viaja ningún encabezado `Authorization`, `x-api-key` ni ningún secreto.
   * En la respuesta (**Response**), comprueba que solo viajan los datos limpios y que no hay claves, stack traces ni configuraciones internas.
4. Ve a la pestaña **Application (Aplicación) > Storage**:
   * En **Local Storage** y **Session Storage**, comprueba que no existe ninguna clave `API_KEY` ni `GEMINI_API_KEY`.
5. Ve a la pestaña **Sources (Fuentes)** y busca en el archivo JavaScript generado (`dist/assets/index-*.js`):
   * Comprueba que no contiene ninguna clave privada escrita en texto plano.
