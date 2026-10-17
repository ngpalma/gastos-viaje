# 🗺️ Gastos de Viaje

App para dividir gastos de viaje entre amigos, con **sincronización en tiempo real**:
todos los integrantes que entran a la misma *sala* ven los cambios al instante, sin
tener que reenviar ningún link.

Hecha con **React + Vite** y **Supabase** (base de datos + realtime). Lista para
desplegar en **Vercel**.

## ✨ Funciones

- Integrantes **dinámicos**: arranca con 1 y agregás los que quieras con un botón.
- Carga de gastos por categoría, en varias monedas, con cotizaciones editables.
- Cálculo automático de **deudas con transferencias mínimas** (quién le paga a quién).
- Alias/CBU por integrante con botón para copiar.
- Historial de pagos saldados (con deshacer), filtros y export a CSV.
- Resumen listo para compartir por WhatsApp.
- **Sala + PIN**: sin crear cuentas; compartís el nombre de sala y el PIN una sola vez.
- Respaldo local automático (funciona aunque se corte internet; sincroniza al volver).

---

## 1) Configurar Supabase (gratis, 5 minutos)

1. Entrá a [supabase.com](https://supabase.com) y creá una cuenta.
2. Creá un proyecto nuevo (elegí una contraseña para la base de datos y guardala).
3. En el menú lateral abrí **SQL Editor** → **New query**, pegá esto y dale **Run**:

   ```sql
   create table if not exists rooms (
     id text primary key,
     pin text default '',
     data jsonb not null default '{}'::jsonb,
     last_writer text default '',
     updated_at timestamptz default now()
   );

   -- Permitir acceso público controlado por el nombre de sala + PIN (desde la app).
   alter table rooms enable row level security;

   create policy "acceso publico a rooms"
     on rooms for all
     using (true)
     with check (true);
   ```

4. Activá **Realtime** para la tabla: menú **Database** → **Replication** (o
   **Realtime**), y agregá/habilitá la tabla `rooms`. (En proyectos nuevos suele venir
   activado el publisher `supabase_realtime`; solo tenés que sumar la tabla `rooms`.)

5. Copiá tus claves: menú **Project Settings** → **API**. Vas a necesitar:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

> 🔒 **Nota de seguridad:** este modelo es apto para un grupo de amigos. Cualquiera que
> conozca el nombre exacto de la sala podría leer sus datos; el PIN es una barrera
> simple del lado de la app, no un control de acceso fuerte. Para algo más estricto se
> puede sumar autenticación real de Supabase más adelante. **Nunca** uses la clave
> `service_role` en el front.

---

## 2) Correr en tu compu

```bash
npm install
```

Creá un archivo `.env` (copiá `.env.example`) y completá tus claves:

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-public-key
```

Levantá el servidor de desarrollo:

```bash
npm run dev
```

Abrí la URL que muestra la consola (normalmente http://localhost:5173).

> Si todavía no cargaste las claves, la app funciona igual en **modo solo local**
> (los datos quedan únicamente en ese dispositivo).

---

## 3) Subir a Vercel

1. Subí este proyecto a un repositorio de **GitHub**.
2. Entrá a [vercel.com](https://vercel.com), **Add New → Project**, e importá el repo.
3. Vercel detecta Vite solo. Antes de desplegar, agregá las **Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   (pegá los mismos valores del `.env`).
4. **Deploy**. Vercel te da una URL pública (ej. `https://gastos-viaje.vercel.app`).

Compartí esa URL + el **nombre de sala** y el **PIN** con tus amigos. Todos entran a la
misma sala y ven los gastos en vivo. 🎉

---

## 📁 Estructura

```
index.html
src/
  main.jsx            # punto de entrada React
  App.jsx             # orquesta el estado y arma la pantalla
  constants.js        # categorías, monedas, estado inicial
  index.css
  hooks/
    useTripData.js    # estado + localStorage + sync realtime con Supabase
  lib/
    supabase.js       # cliente de Supabase
    calc.js           # conversión de monedas y cálculo de deudas
    share.js          # WhatsApp, CSV y portapapeles
  components/         # UI (sala, integrantes, monedas, gastos, deudas, etc.)
```

## 💡 Ideas para más adelante

- Login real por email (Supabase Auth) en vez de sala + PIN.
- Historial de "quién cargó qué" (log de actividad).
- Adjuntar foto del ticket a cada gasto (Supabase Storage).
- Instalar como app en el celular (PWA con ícono en pantalla de inicio).
- Pasar Tailwind del CDN a build propio para producción (más rápido, sin warning).
