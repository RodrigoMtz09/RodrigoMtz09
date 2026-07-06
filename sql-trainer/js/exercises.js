// ============================================================
//  Ejercicios de SQL organizados por nivel.
//  Cada ejercicio se valida ejecutando la consulta del usuario
//  y comparando su resultado con el de la consulta solucion.
//  - ordenado: true  -> el orden de las filas debe coincidir
//              false -> se compara sin importar el orden
// ============================================================

const EXERCISES = [
  // ---------------------- NIVEL BASICO ----------------------
  {
    id: 'b1',
    nivel: 'Basico',
    titulo: 'Todos los productos',
    enunciado: 'Muestra todas las columnas de todos los productos de la tabla <code>productos</code>.',
    pista: 'Usa SELECT * FROM ...',
    solucion: 'SELECT * FROM productos;',
    ordenado: false
  },
  {
    id: 'b2',
    nivel: 'Basico',
    titulo: 'Nombre y precio',
    enunciado: 'Muestra unicamente el <code>nombre</code> y el <code>precio</code> de cada producto.',
    pista: 'Indica las columnas separadas por comas despues de SELECT.',
    solucion: 'SELECT nombre, precio FROM productos;',
    ordenado: false
  },
  {
    id: 'b3',
    nivel: 'Basico',
    titulo: 'Clientes de Mexico',
    enunciado: 'Muestra el <code>nombre</code> y la <code>ciudad</code> de los clientes cuyo pais es <code>Mexico</code>.',
    pista: "Filtra con WHERE pais = 'Mexico'.",
    solucion: "SELECT nombre, ciudad FROM clientes WHERE pais = 'Mexico';",
    ordenado: false
  },
  {
    id: 'b4',
    nivel: 'Basico',
    titulo: 'Productos caros',
    enunciado: 'Muestra el <code>nombre</code> y <code>precio</code> de los productos con precio mayor a 500.',
    pista: 'Usa WHERE precio > 500.',
    solucion: 'SELECT nombre, precio FROM productos WHERE precio > 500;',
    ordenado: false
  },
  {
    id: 'b5',
    nivel: 'Basico',
    titulo: 'Ordenar por precio',
    enunciado: 'Muestra el <code>nombre</code> y <code>precio</code> de todos los productos ordenados del <strong>mas caro al mas barato</strong>.',
    pista: 'Usa ORDER BY precio DESC.',
    solucion: 'SELECT nombre, precio FROM productos ORDER BY precio DESC;',
    ordenado: true
  },
  {
    id: 'b6',
    nivel: 'Basico',
    titulo: 'Los 3 mas baratos',
    enunciado: 'Muestra el <code>nombre</code> y <code>precio</code> de los <strong>3 productos mas baratos</strong>.',
    pista: 'Combina ORDER BY precio ASC con LIMIT 3.',
    solucion: 'SELECT nombre, precio FROM productos ORDER BY precio ASC LIMIT 3;',
    ordenado: true
  },
  {
    id: 'b7',
    nivel: 'Basico',
    titulo: 'Empleados del area de Ventas',
    enunciado: 'Muestra el <code>nombre</code> y <code>salario</code> de los empleados del departamento <code>Ventas</code>.',
    pista: "WHERE departamento = 'Ventas'.",
    solucion: "SELECT nombre, salario FROM empleados WHERE departamento = 'Ventas';",
    ordenado: false
  },
  {
    id: 'b8',
    nivel: 'Basico',
    titulo: 'Paises distintos',
    enunciado: 'Muestra la lista de <strong>paises unicos</strong> (sin repetir) de la tabla <code>clientes</code>.',
    pista: 'Usa SELECT DISTINCT.',
    solucion: 'SELECT DISTINCT pais FROM clientes;',
    ordenado: false
  },

  // -------------------- NIVEL INTERMEDIO --------------------
  {
    id: 'i1',
    nivel: 'Intermedio',
    titulo: 'Contar productos por categoria',
    enunciado: 'Muestra el <code>categoria_id</code> y la <strong>cantidad de productos</strong> que hay en cada categoria. Nombra la columna del conteo como <code>total</code>.',
    pista: 'Agrupa con GROUP BY categoria_id y usa COUNT(*) AS total.',
    solucion: 'SELECT categoria_id, COUNT(*) AS total FROM productos GROUP BY categoria_id;',
    ordenado: false
  },
  {
    id: 'i2',
    nivel: 'Intermedio',
    titulo: 'Precio promedio por categoria',
    enunciado: 'Muestra el <code>categoria_id</code> y el <strong>precio promedio</strong> de los productos de cada categoria. Nombra la columna como <code>precio_promedio</code>.',
    pista: 'Usa AVG(precio) AS precio_promedio con GROUP BY.',
    solucion: 'SELECT categoria_id, AVG(precio) AS precio_promedio FROM productos GROUP BY categoria_id;',
    ordenado: false
  },
  {
    id: 'i3',
    nivel: 'Intermedio',
    titulo: 'Productos con su categoria',
    enunciado: 'Muestra el <code>nombre</code> del producto y el <code>nombre</code> de su categoria. Nombra las columnas <code>producto</code> y <code>categoria</code>.',
    pista: 'Haz un JOIN entre productos y categorias por categoria_id = categorias.id.',
    solucion: 'SELECT p.nombre AS producto, c.nombre AS categoria FROM productos p JOIN categorias c ON p.categoria_id = c.id;',
    ordenado: false
  },
  {
    id: 'i4',
    nivel: 'Intermedio',
    titulo: 'Pedidos por cliente',
    enunciado: 'Muestra el <code>nombre</code> del cliente y cuantos <strong>pedidos</strong> ha realizado. Nombra el conteo como <code>total_pedidos</code>. Incluye solo clientes con al menos un pedido.',
    pista: 'JOIN entre clientes y pedidos, luego GROUP BY nombre y COUNT.',
    solucion: 'SELECT cl.nombre, COUNT(pe.id) AS total_pedidos FROM clientes cl JOIN pedidos pe ON pe.cliente_id = cl.id GROUP BY cl.nombre;',
    ordenado: false
  },
  {
    id: 'i5',
    nivel: 'Intermedio',
    titulo: 'Categorias con mas de 3 productos',
    enunciado: 'Muestra el <code>categoria_id</code> y la cantidad de productos (<code>total</code>) unicamente de las categorias que tienen <strong>mas de 3 productos</strong>.',
    pista: 'Filtra grupos con HAVING COUNT(*) > 3.',
    solucion: 'SELECT categoria_id, COUNT(*) AS total FROM productos GROUP BY categoria_id HAVING COUNT(*) > 3;',
    ordenado: false
  },
  {
    id: 'i6',
    nivel: 'Intermedio',
    titulo: 'Valor total de cada pedido',
    enunciado: 'Muestra el <code>pedido_id</code> y el <strong>valor total</strong> de cada pedido (suma de cantidad * precio_unitario). Nombra la columna como <code>total</code>.',
    pista: 'Usa SUM(cantidad * precio_unitario) con GROUP BY pedido_id en detalle_pedidos.',
    solucion: 'SELECT pedido_id, SUM(cantidad * precio_unitario) AS total FROM detalle_pedidos GROUP BY pedido_id;',
    ordenado: false
  },
  {
    id: 'i7',
    nivel: 'Intermedio',
    titulo: 'Clientes sin pedidos',
    enunciado: 'Muestra el <code>nombre</code> de los clientes que <strong>no han hecho ningun pedido</strong>.',
    pista: 'Usa LEFT JOIN y filtra donde pedidos.id IS NULL (o una subconsulta con NOT IN).',
    solucion: 'SELECT cl.nombre FROM clientes cl LEFT JOIN pedidos pe ON pe.cliente_id = cl.id WHERE pe.id IS NULL;',
    ordenado: false
  },
  {
    id: 'i8',
    nivel: 'Intermedio',
    titulo: 'Ventas por vendedor',
    enunciado: 'Muestra el <code>nombre</code> del empleado y el numero de pedidos <strong>Entregados</strong> que gestiono. Nombra el conteo como <code>entregados</code>. Solo empleados con al menos uno.',
    pista: "JOIN empleados con pedidos, filtra estado = 'Entregado', agrupa por nombre.",
    solucion: "SELECT em.nombre, COUNT(pe.id) AS entregados FROM empleados em JOIN pedidos pe ON pe.empleado_id = em.id WHERE pe.estado = 'Entregado' GROUP BY em.nombre;",
    ordenado: false
  },

  // --------------------- NIVEL AVANZADO ---------------------
  {
    id: 'a1',
    nivel: 'Avanzado',
    titulo: 'Producto mas caro que el promedio',
    enunciado: 'Muestra el <code>nombre</code> y <code>precio</code> de los productos cuyo precio es <strong>mayor al precio promedio</strong> de todos los productos.',
    pista: 'Usa una subconsulta: WHERE precio > (SELECT AVG(precio) FROM productos).',
    solucion: 'SELECT nombre, precio FROM productos WHERE precio > (SELECT AVG(precio) FROM productos);',
    ordenado: false
  },
  {
    id: 'a2',
    nivel: 'Avanzado',
    titulo: 'Top 3 clientes por gasto',
    enunciado: 'Muestra el <code>nombre</code> del cliente y el <strong>total gastado</strong> (suma de cantidad * precio_unitario de todos sus pedidos). Ordena de mayor a menor y muestra solo los <strong>3 primeros</strong>. Nombra la columna como <code>total_gastado</code>.',
    pista: 'Encadena clientes -> pedidos -> detalle_pedidos con JOINs, SUM, GROUP BY, ORDER BY DESC y LIMIT 3.',
    solucion: 'SELECT cl.nombre, SUM(dp.cantidad * dp.precio_unitario) AS total_gastado FROM clientes cl JOIN pedidos pe ON pe.cliente_id = cl.id JOIN detalle_pedidos dp ON dp.pedido_id = pe.id GROUP BY cl.nombre ORDER BY total_gastado DESC LIMIT 3;',
    ordenado: true
  },
  {
    id: 'a3',
    nivel: 'Avanzado',
    titulo: 'Ranking de productos por precio',
    enunciado: 'Muestra el <code>nombre</code>, el <code>precio</code> y un <strong>ranking</strong> (columna <code>posicion</code>) de los productos ordenados del mas caro al mas barato usando una <strong>funcion de ventana</strong>.',
    pista: 'Usa RANK() OVER (ORDER BY precio DESC) AS posicion.',
    solucion: 'SELECT nombre, precio, RANK() OVER (ORDER BY precio DESC) AS posicion FROM productos;',
    ordenado: true
  },
  {
    id: 'a4',
    nivel: 'Avanzado',
    titulo: 'Producto mas caro por categoria',
    enunciado: 'Para cada categoria muestra el <code>nombre</code> de la categoria, el <code>nombre</code> del producto mas caro y su <code>precio</code>. Nombra las columnas <code>categoria</code>, <code>producto</code> y <code>precio</code>.',
    pista: 'Puedes usar una subconsulta correlacionada o una funcion de ventana con particion por categoria.',
    solucion: `SELECT c.nombre AS categoria, p.nombre AS producto, p.precio
FROM productos p
JOIN categorias c ON c.id = p.categoria_id
WHERE p.precio = (SELECT MAX(p2.precio) FROM productos p2 WHERE p2.categoria_id = p.categoria_id);`,
    ordenado: false
  },
  {
    id: 'a5',
    nivel: 'Avanzado',
    titulo: 'Empleados y su jefe',
    enunciado: 'Muestra el <code>nombre</code> de cada empleado y el <code>nombre</code> de su jefe. Nombra las columnas <code>empleado</code> y <code>jefe</code>. Los empleados sin jefe tambien deben aparecer (con jefe en NULL).',
    pista: 'Haz un self-join (LEFT JOIN de empleados consigo misma) usando jefe_id.',
    solucion: 'SELECT e.nombre AS empleado, j.nombre AS jefe FROM empleados e LEFT JOIN empleados j ON e.jefe_id = j.id;',
    ordenado: false
  },
  {
    id: 'a6',
    nivel: 'Avanzado',
    titulo: 'Ingresos mensuales (CTE)',
    enunciado: 'Usando una <strong>CTE</strong>, muestra el <strong>mes</strong> (formato <code>YYYY-MM</code>) y los <strong>ingresos totales</strong> de los pedidos de ese mes (suma de cantidad * precio_unitario). Ordena por mes ascendente. Nombra las columnas <code>mes</code> e <code>ingresos</code>.',
    pista: "Usa strftime('%Y-%m', pe.fecha) para el mes. Define una CTE con WITH ... AS (...).",
    solucion: `WITH ventas AS (
  SELECT strftime('%Y-%m', pe.fecha) AS mes,
         dp.cantidad * dp.precio_unitario AS importe
  FROM pedidos pe
  JOIN detalle_pedidos dp ON dp.pedido_id = pe.id
)
SELECT mes, SUM(importe) AS ingresos
FROM ventas
GROUP BY mes
ORDER BY mes ASC;`,
    ordenado: true
  },
  {
    id: 'a7',
    nivel: 'Avanzado',
    titulo: 'Clasificar productos por precio (CASE)',
    enunciado: 'Muestra el <code>nombre</code>, el <code>precio</code> y una columna <code>rango</code> que valga <code>Caro</code> si el precio &gt;= 500, <code>Medio</code> si esta entre 100 y 499, y <code>Barato</code> si es menor a 100.',
    pista: 'Usa una expresion CASE WHEN ... THEN ... ELSE ... END AS rango.',
    solucion: `SELECT nombre, precio,
  CASE
    WHEN precio >= 500 THEN 'Caro'
    WHEN precio >= 100 THEN 'Medio'
    ELSE 'Barato'
  END AS rango
FROM productos;`,
    ordenado: false
  },
  {
    id: 'a8',
    nivel: 'Avanzado',
    titulo: 'Participacion de cada categoria en el catalogo',
    enunciado: 'Muestra el <code>categoria_id</code>, cuantos productos tiene (<code>total</code>) y el <strong>porcentaje</strong> que representa sobre el total de productos, redondeado a 1 decimal. Nombra la ultima columna <code>porcentaje</code>.',
    pista: 'Usa COUNT(*) y ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM productos), 1).',
    solucion: 'SELECT categoria_id, COUNT(*) AS total, ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM productos), 1) AS porcentaje FROM productos GROUP BY categoria_id;',
    ordenado: false
  }
];
