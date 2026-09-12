'use strict';

const palabrasClavePreRegex = new Set([
  'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete',
  'void', 'throw', 'case', 'do', 'else', 'yield', 'await',
]);

function puedeSerRegex(codigo, indice) {
  let j = indice - 1;
  while (j >= 0 && /\s/.test(codigo[j])) j--;
  if (j < 0) return true;
  const c = codigo[j];
  if ('([{,;:=!&|?+-*%^~<>'.includes(c)) return true;
  if (/[\w$]/.test(c)) {
    let k = j;
    while (k >= 0 && /[\w$]/.test(codigo[k])) k--;
    const palabra = codigo.slice(k + 1, j + 1);
    return palabrasClavePreRegex.has(palabra);
  }
  return false;
}

function extraerRangos(codigo) {
  const rangos = [];
  const n = codigo.length;
  let i = 0;

  while (i < n) {
    const c = codigo[i];

    if (c === '/' && codigo[i + 1] === '/') {
      const fin = codigo.indexOf('\n', i);
      const finReal = fin === -1 ? n : fin;
      rangos.push([i, finReal]);
      i = finReal;
      continue;
    }

    if (c === '/' && codigo[i + 1] === '*') {
      const fin = codigo.indexOf('*/', i + 2);
      const finReal = fin === -1 ? n : fin + 2;
      rangos.push([i, finReal]);
      i = finReal;
      continue;
    }

    if (c === '"' || c === "'" || c === '`') {
      const comilla = c;
      let j = i + 1;
      while (j < n) {
        if (codigo[j] === '\\') { j += 2; continue; }
        if (codigo[j] === comilla) { j += 1; break; }
        j += 1;
      }
      rangos.push([i, j]);
      i = j;
      continue;
    }

    if (c === '/' && puedeSerRegex(codigo, i)) {
      let j = i + 1;
      let dentroClase = false;
      let valido = false;
      while (j < n) {
        if (codigo[j] === '\\') { j += 2; continue; }
        if (codigo[j] === '[') { dentroClase = true; j += 1; continue; }
        if (codigo[j] === ']') { dentroClase = false; j += 1; continue; }
        if (codigo[j] === '/' && !dentroClase) { j += 1; valido = true; break; }
        if (codigo[j] === '\n') break;
        j += 1;
      }
      if (valido) {
        while (j < n && /[a-z]/i.test(codigo[j])) j += 1;
        rangos.push([i, j]);
        i = j;
        continue;
      }
    }

    i += 1;
  }

  return rangos;
}

function enmascarar(codigo) {
  const rangos = extraerRangos(codigo);
  const tabla = [];
  let salida = '';
  let cursor = 0;
  let contador = 0;

  for (const [inicio, fin] of rangos) {
    salida += codigo.slice(cursor, inicio);
    tabla.push(codigo.slice(inicio, fin));
    salida += '\u0001' + contador + '\u0001';
    contador += 1;
    cursor = fin;
  }
  salida += codigo.slice(cursor);

  return { codigo: salida, tabla };
}

function desenmascarar(codigo, tabla) {
  return codigo.replace(/\u0001(\d+)\u0001/g, (completa, indice) => tabla[Number(indice)]);
}

module.exports = { enmascarar, desenmascarar, extraerRangos };
