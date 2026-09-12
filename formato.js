'use strict';

function embellecer(codigo) {
  const espaciado = codigo
    .replace(/\{/g, '{\n')
    .replace(/\}/g, '\n}\n')
    .replace(/;(?!\s*\n)/g, ';\n');

  const lineas = espaciado.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  let profundidad = 0;
  const salida = [];

  for (const linea of lineas) {
    const aperturas = (linea.match(/\{/g) || []).length;
    const cierraAlInicio = /^\}/.test(linea);
    if (cierraAlInicio) profundidad = Math.max(0, profundidad - 1);
    salida.push('  '.repeat(profundidad) + linea);
    const cierres = (linea.match(/\}/g) || []).length;
    profundidad += aperturas - cierres + (cierraAlInicio ? 1 : 0);
    profundidad = Math.max(0, profundidad);
  }

  return salida.join('\n');
}

module.exports = { embellecer };
