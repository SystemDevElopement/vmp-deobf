'use strict';

const estandar = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', '0': '\0', '\\': '\\' };

function decodificarLiteral(crudo, comilla, estadisticas) {
  const interior = crudo.slice(1, -1);
  let resultado = '';
  let cambio = false;

  for (let k = 0; k < interior.length; k++) {
    if (interior[k] === '\\') {
      const resto = interior.slice(k);

      let m = resto.match(/^\\x([0-9a-fA-F]{2})/);
      if (m) { resultado += String.fromCharCode(parseInt(m[1], 16)); k += m[0].length - 1; cambio = true; continue; }

      m = resto.match(/^\\u\{([0-9a-fA-F]+)\}/);
      if (m) { resultado += String.fromCodePoint(parseInt(m[1], 16)); k += m[0].length - 1; cambio = true; continue; }

      m = resto.match(/^\\u([0-9a-fA-F]{4})/);
      if (m) { resultado += String.fromCharCode(parseInt(m[1], 16)); k += m[0].length - 1; cambio = true; continue; }

      const siguiente = interior[k + 1];
      if (siguiente === comilla) { resultado += comilla; k += 1; cambio = true; continue; }
      if (siguiente in estandar) { resultado += estandar[siguiente]; k += 1; cambio = true; continue; }
      if (siguiente === '\n') { k += 1; cambio = true; continue; }
      resultado += siguiente === undefined ? '' : siguiente;
      k += 1;
      continue;
    }
    resultado += interior[k];
  }

  if (cambio && estadisticas) estadisticas.escapes = (estadisticas.escapes || 0) + 1;

  const escapado = resultado
    .replace(/\\/g, '\\\\')
    .replace(new RegExp(comilla === '`' ? '`' : comilla, 'g'), '\\' + comilla)
    .replace(/\n/g, comilla === '`' ? '\n' : '\\n');

  return comilla + escapado + comilla;
}

function decodificar(codigo, estadisticas) {
  let salida = '';
  let i = 0;
  const n = codigo.length;

  while (i < n) {
    const c = codigo[i];

    if (c === '/' && codigo[i + 1] === '/') {
      const fin = codigo.indexOf('\n', i);
      const segmento = fin === -1 ? codigo.slice(i) : codigo.slice(i, fin);
      salida += segmento;
      i += segmento.length;
      continue;
    }

    if (c === '/' && codigo[i + 1] === '*') {
      const fin = codigo.indexOf('*/', i + 2);
      const segmento = fin === -1 ? codigo.slice(i) : codigo.slice(i, fin + 2);
      salida += segmento;
      i += segmento.length;
      continue;
    }

    if (c === '"' || c === "'" || c === '`') {
      const comilla = c;
      let j = i + 1;
      let crudo = comilla;
      while (j < n) {
        if (codigo[j] === '\\') {
          crudo += codigo[j] + (codigo[j + 1] || '');
          j += 2;
          continue;
        }
        if (codigo[j] === comilla) {
          crudo += comilla;
          j += 1;
          break;
        }
        crudo += codigo[j];
        j += 1;
      }
      salida += decodificarLiteral(crudo, comilla, estadisticas);
      i = j;
      continue;
    }

    salida += c;
    i += 1;
  }

  return salida;
}

module.exports = { decodificar };
