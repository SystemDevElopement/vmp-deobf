'use strict';

const reglas = [
  [/!!\[\]/g, 'true'],
  [/!\[\]/g, 'false'],
  [/\+\[\]/g, '0'],
  [/\+!\+\[\]/g, '1'],
  [/!\+\[\]/g, 'true'],
  [/\[\]\[\s*\(\s*\)\s*\]/g, 'undefined'],
  [/void\s+0/g, 'undefined'],
  [/typeof\s+undefined\b/g, "'undefined'"],
];

function plegar(codigo, estadisticas) {
  let salida = codigo;
  for (const [patron, reemplazo] of reglas) {
    salida = salida.replace(patron, () => {
      if (estadisticas) estadisticas.constantes = (estadisticas.constantes || 0) + 1;
      return reemplazo;
    });
  }
  return salida;
}

module.exports = { plegar };
