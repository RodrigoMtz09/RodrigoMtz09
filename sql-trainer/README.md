# SQL Trainer 🧠💾

Aplicación web para **aprender SQL escribiendo queries de verdad**. Tú escribes la
consulta, se ejecuta contra una base de datos SQLite real que corre **dentro de tu
navegador** (sql.js / WebAssembly) y la app te dice si tu resultado es correcto.

No necesita servidor backend, ni instalar nada, ni conexión a internet: la base de
datos y el motor SQL viven en el navegador.

## Características

- **24 ejercicios** organizados en 3 niveles:
  - 🟢 **Básico** — `SELECT`, `WHERE`, `ORDER BY`, `LIMIT`, `DISTINCT`
  - 🔵 **Intermedio** — `JOIN`, `GROUP BY`, funciones de agregación, `HAVING`, `LEFT JOIN`
  - 🟣 **Avanzado** — subconsultas, funciones de ventana (`RANK`), `CTE` (`WITH`), `CASE`, self-join
- **Ejecución real** de tus consultas con resultados en tabla.
- **Verificación automática**: compara tu resultado con el esperado (respeta el
  orden solo cuando el ejercicio lo pide).
- **Pistas** y botón para **ver la solución** de referencia.
- **Progreso guardado** en el navegador (localStorage): tus ejercicios resueltos se
  conservan entre sesiones.
- Atajo **Ctrl / Cmd + Enter** para ejecutar.
- Interfaz responsiva en español, tema oscuro.

## La base de datos de práctica: `TiendaTech`

Un e-commerce ficticio con estas tablas:

| Tabla | Descripción |
|-------|-------------|
| `categorias` | Categorías de productos |
| `productos` | Catálogo (precio, stock, categoría) |
| `clientes` | Clientes y su ciudad/país |
| `empleados` | Empleados, salario, departamento y jefe (`jefe_id`) |
| `pedidos` | Pedidos (cliente, empleado, fecha, estado) |
| `detalle_pedidos` | Líneas de cada pedido (producto, cantidad, precio) |

## Cómo usarla

Como el motor carga un archivo `.wasm`, ábrela a través de un servidor local (no con
doble clic sobre el `file://`, que el navegador bloquea por seguridad):

```bash
cd sql-trainer
python3 -m http.server 8000
# luego abre http://localhost:8000 en tu navegador
```

Cualquier servidor estático sirve (Live Server de VS Code, `npx serve`, etc.).

## Estructura

```
sql-trainer/
├── index.html          # Estructura de la página
├── css/styles.css      # Estilos
├── js/
│   ├── database.js     # Esquema, datos de ejemplo e init de sql.js
│   ├── exercises.js    # Los 24 ejercicios con sus soluciones
│   └── app.js          # Lógica de la app (ejecutar, verificar, progreso)
└── vendor/
    ├── sql-wasm.js     # sql.js (SQLite en WebAssembly)
    └── sql-wasm.wasm
```

## Cómo agregar tus propios ejercicios

Añade un objeto al array de `js/exercises.js`:

```js
{
  id: 'i9',                     // id único
  nivel: 'Intermedio',          // Basico | Intermedio | Avanzado
  titulo: 'Mi ejercicio',
  enunciado: 'Describe qué debe devolver la consulta...',
  pista: 'Una ayuda opcional.',
  solucion: 'SELECT ...;',      // consulta de referencia correcta
  ordenado: false               // true si el orden de las filas importa
}
```

La verificación ejecuta tu `solucion` y compara su resultado con el del usuario, así
que basta con que la solución sea correcta.
