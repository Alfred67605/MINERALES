# SEGURIDAD, ROLES (RBAC) Y AUDITORÍA — MINERALFLOW 2.0

## 1. Autenticación y Sesiones Seguras

- **Hash de Contraseñas**: Todas las contraseñas se almacenan encriptadas con `bcryptjs` (`cost factor = 10`). Nunca se guardan ni exponen contraseñas en texto plano.
- **Tokens Firmados y Cookies HttpOnly**: El inicio de sesión (`POST /api/auth/login`) emite un JWT firmado con expiración de 12 horas tanto en cabecera `Authorization: Bearer` como en cookie `httpOnly` (`sameSite: 'lax'`).
- **Identidad Real desde Base de Datos**: El nombre completo, usuario y rol mostrados en la interfaz provienen directamente de `/api/auth/me` y la tabla `usuarios` de PostgreSQL.

---

## 2. Matriz de Control de Acceso Basado en Roles (RBAC en Backend)

Las restricciones se validan obligatoriamente en el servidor mediante el middleware `authorizeRoles(...)` en `backend/src/middleware/auth.ts`:

| Operación / Endpoint | `ADMINISTRADOR` | `ALMACENERO` | `VENDEDOR` | `LABORATORIO` | `CONSULTA` |
|---|:---:|:---:|:---:|:---:|:---:|
| Consultar Dashboard, Almacén, Historial y Trazabilidad (`GET`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Registrar Compras y Lotes (`POST /api/compras`) | ✅ | ✅ | ❌ (`403`) | ❌ (`403`) | ❌ (`403`) |
| Editar Lote Disponible y Mover Zona (`PUT /api/lotes/:id`) | ✅ | ✅ | ❌ (`403`) | ❌ (`403`) | ❌ (`403`) |
| Versionar Certificados Químicos (`PUT /api/laboratorio/ensayes/:id`) | ✅ | ✅ | ❌ (`403`) | ✅ | ❌ (`403`) |
| Confirmar y Cerrar Ventas (`POST /api/ventas`) | ✅ | ❌ (`403`) | ✅ | ❌ (`403`) | ❌ (`403`) |
| Gestionar Proveedores y Minas (`POST/PUT /api/proveedores`) | ✅ | ✅ | ❌ (`403`) | ❌ (`403`) | ❌ (`403`) |
| Gestionar Compradores (`POST/PUT /api/compradores`) | ✅ | ❌ (`403`) | ✅ | ❌ (`403`) | ❌ (`403`) |
| Gestionar Usuarios y Consultar Bitácora (`GET/POST /api/usuarios`, `/api/auditoria`) | ✅ | ❌ (`403`) | ❌ (`403`) | ❌ (`403`) | ❌ (`403`) |

---

## 3. Protección contra Inyecciones, Validación y Bitácora de Auditoría

- **Validación Estricta con Zod**: Todas las entradas de cuerpo y parámetros se validan con esquemas tipados `Zod` antes de tocar la capa de negocio.
- **Consultas Parametrizadas**: Prisma ORM ejecuta consultas 100% parametrizadas contra PostgreSQL, mitigando inyecciones SQL.
- **Bitácora Inmutable (`auditoria`)**: Cada login, alta de compra, edición de lote, emisión de nueva versión de ensaye de laboratorio, adjunto documental M-02 y confirmación de venta registra `usuario_id`, `usuario_nombre`, `accion`, `entidad`, `registro_id`, `valor_anterior`, `valor_nuevo` y `fecha_hora`.

