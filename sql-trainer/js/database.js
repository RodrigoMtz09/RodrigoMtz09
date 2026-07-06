// ============================================================
//  Base de datos de práctica: "TiendaTech" (e-commerce ficticio)
//  Se ejecuta en el navegador con SQLite (sql.js / WebAssembly).
// ============================================================

const SCHEMA_SQL = `
CREATE TABLE categorias (
  id      INTEGER PRIMARY KEY,
  nombre  TEXT NOT NULL
);

CREATE TABLE productos (
  id           INTEGER PRIMARY KEY,
  nombre       TEXT NOT NULL,
  categoria_id INTEGER REFERENCES categorias(id),
  precio       REAL NOT NULL,
  stock        INTEGER NOT NULL
);

CREATE TABLE clientes (
  id              INTEGER PRIMARY KEY,
  nombre          TEXT NOT NULL,
  ciudad          TEXT,
  pais            TEXT,
  fecha_registro  TEXT
);

CREATE TABLE empleados (
  id                 INTEGER PRIMARY KEY,
  nombre             TEXT NOT NULL,
  puesto             TEXT,
  departamento       TEXT,
  salario            REAL,
  fecha_contratacion TEXT,
  jefe_id            INTEGER REFERENCES empleados(id)
);

CREATE TABLE pedidos (
  id          INTEGER PRIMARY KEY,
  cliente_id  INTEGER REFERENCES clientes(id),
  empleado_id INTEGER REFERENCES empleados(id),
  fecha       TEXT,
  estado      TEXT
);

CREATE TABLE detalle_pedidos (
  id             INTEGER PRIMARY KEY,
  pedido_id      INTEGER REFERENCES pedidos(id),
  producto_id    INTEGER REFERENCES productos(id),
  cantidad       INTEGER NOT NULL,
  precio_unitario REAL NOT NULL
);
`;

const SEED_SQL = `
INSERT INTO categorias (id, nombre) VALUES
  (1, 'Laptops'),
  (2, 'Telefonos'),
  (3, 'Accesorios'),
  (4, 'Monitores'),
  (5, 'Audio');

INSERT INTO productos (id, nombre, categoria_id, precio, stock) VALUES
  (1,  'Laptop Pro 14', 1, 1899.00, 12),
  (2,  'Laptop Air 13', 1, 1099.00, 30),
  (3,  'Laptop Gamer X', 1, 2499.00, 8),
  (4,  'Telefono Nova',  2, 799.00, 50),
  (5,  'Telefono Nova Plus', 2, 999.00, 25),
  (6,  'Telefono Mini', 2, 499.00, 40),
  (7,  'Mouse Inalambrico', 3, 39.90, 200),
  (8,  'Teclado Mecanico', 3, 89.90, 120),
  (9,  'Funda Laptop', 3, 24.50, 300),
  (10, 'Cable USB-C', 3, 12.00, 500),
  (11, 'Monitor 27 4K', 4, 449.00, 18),
  (12, 'Monitor 24 FHD', 4, 179.00, 45),
  (13, 'Monitor Curvo 34', 4, 699.00, 10),
  (14, 'Audifonos Pro', 5, 249.00, 60),
  (15, 'Bocina Bluetooth', 5, 79.00, 90),
  (16, 'Microfono USB', 5, 129.00, 35);

INSERT INTO clientes (id, nombre, ciudad, pais, fecha_registro) VALUES
  (1, 'Ana Torres',      'Monterrey',   'Mexico',   '2023-01-15'),
  (2, 'Luis Gomez',      'Guadalajara', 'Mexico',   '2023-02-20'),
  (3, 'Maria Fernandez', 'Bogota',      'Colombia', '2023-03-10'),
  (4, 'Carlos Ruiz',     'Madrid',      'Espana',   '2023-05-05'),
  (5, 'Sofia Castro',    'Monterrey',   'Mexico',   '2023-06-18'),
  (6, 'Diego Morales',   'Lima',        'Peru',     '2023-07-22'),
  (7, 'Elena Vargas',    'Buenos Aires','Argentina','2023-08-30'),
  (8, 'Pedro Sanchez',   'Madrid',      'Espana',   '2023-09-12'),
  (9, 'Laura Jimenez',   'Guadalajara', 'Mexico',   '2024-01-08'),
  (10,'Javier Diaz',     'Santiago',    'Chile',    '2024-02-14'),
  (11,'Valentina Rios',  'Quito',       'Ecuador',  '2024-06-25');

INSERT INTO empleados (id, nombre, puesto, departamento, salario, fecha_contratacion, jefe_id) VALUES
  (1, 'Roberto Mendez',  'Director General', 'Direccion', 12000.00, '2020-01-10', NULL),
  (2, 'Patricia Lopez',  'Gerente Ventas',   'Ventas',     8000.00, '2020-03-15', 1),
  (3, 'Miguel Angel',    'Gerente Soporte',  'Soporte',    7500.00, '2020-06-01', 1),
  (4, 'Carmen Ortiz',    'Vendedor',         'Ventas',     4200.00, '2021-02-20', 2),
  (5, 'Jorge Ramirez',   'Vendedor',         'Ventas',     4500.00, '2021-04-11', 2),
  (6, 'Lucia Herrera',   'Vendedor',         'Ventas',     3900.00, '2022-01-05', 2),
  (7, 'Fernando Cruz',   'Tecnico Soporte',  'Soporte',    3600.00, '2021-09-30', 3),
  (8, 'Andrea Flores',   'Tecnico Soporte',  'Soporte',    3800.00, '2022-05-17', 3);

INSERT INTO pedidos (id, cliente_id, empleado_id, fecha, estado) VALUES
  (1,  1, 4, '2024-01-20', 'Entregado'),
  (2,  2, 5, '2024-01-25', 'Entregado'),
  (3,  1, 4, '2024-02-03', 'Entregado'),
  (4,  3, 6, '2024-02-14', 'Enviado'),
  (5,  4, 5, '2024-02-28', 'Entregado'),
  (6,  5, 4, '2024-03-05', 'Cancelado'),
  (7,  6, 6, '2024-03-11', 'Entregado'),
  (8,  2, 5, '2024-03-19', 'Enviado'),
  (9,  7, 4, '2024-04-02', 'Entregado'),
  (10, 8, 6, '2024-04-15', 'Pendiente'),
  (11, 1, 5, '2024-04-27', 'Entregado'),
  (12, 9, 4, '2024-05-06', 'Entregado'),
  (13, 10,6, '2024-05-19', 'Enviado'),
  (14, 3, 5, '2024-06-01', 'Entregado'),
  (15, 5, 4, '2024-06-20', 'Pendiente');

INSERT INTO detalle_pedidos (id, pedido_id, producto_id, cantidad, precio_unitario) VALUES
  (1,  1, 1, 1, 1899.00),
  (2,  1, 7, 2, 39.90),
  (3,  2, 4, 1, 799.00),
  (4,  2, 8, 1, 89.90),
  (5,  3, 11,2, 449.00),
  (6,  4, 2, 1, 1099.00),
  (7,  4, 9, 1, 24.50),
  (8,  5, 3, 1, 2499.00),
  (9,  5, 14,1, 249.00),
  (10, 6, 5, 1, 999.00),
  (11, 7, 6, 3, 499.00),
  (12, 7, 10,5, 12.00),
  (13, 8, 12,2, 179.00),
  (14, 9, 1, 1, 1899.00),
  (15, 9, 8, 2, 89.90),
  (16, 10,13,1, 699.00),
  (17, 11,15,4, 79.00),
  (18, 11,16,1, 129.00),
  (19, 12,4, 2, 799.00),
  (20, 13,2, 1, 1099.00),
  (21, 13,7, 1, 39.90),
  (22, 14,11,1, 449.00),
  (23, 14,14,2, 249.00),
  (24, 15,3, 1, 2499.00);
`;

// Metadatos del esquema para el panel lateral de ayuda.
const SCHEMA_INFO = [
  { tabla: 'categorias',      columnas: ['id', 'nombre'] },
  { tabla: 'productos',       columnas: ['id', 'nombre', 'categoria_id', 'precio', 'stock'] },
  { tabla: 'clientes',        columnas: ['id', 'nombre', 'ciudad', 'pais', 'fecha_registro'] },
  { tabla: 'empleados',       columnas: ['id', 'nombre', 'puesto', 'departamento', 'salario', 'fecha_contratacion', 'jefe_id'] },
  { tabla: 'pedidos',         columnas: ['id', 'cliente_id', 'empleado_id', 'fecha', 'estado'] },
  { tabla: 'detalle_pedidos', columnas: ['id', 'pedido_id', 'producto_id', 'cantidad', 'precio_unitario'] },
];

let SQL = null;   // Módulo sql.js
let db = null;    // Instancia de la base de datos

// Inicializa sql.js y construye la base de datos en memoria.
async function initDatabase() {
  SQL = await initSqlJs({
    locateFile: file => `vendor/${file}`
  });
  db = new SQL.Database();
  db.run(SCHEMA_SQL);
  db.run(SEED_SQL);
  return db;
}

// Ejecuta una consulta y devuelve { columns, rows } o lanza un error.
function runQuery(sqlText) {
  const res = db.exec(sqlText);
  if (res.length === 0) return { columns: [], rows: [] };
  // Solo consideramos el primer conjunto de resultados.
  const { columns, values } = res[0];
  return { columns, rows: values };
}
