'use strict';

const vm = require('vm');
const enmascarador = require('./enmascarador');
const bloques = require('./bloques');

function dividirDeclaracionesSuperiores(codigoEnmascarado) {
  const n = codigoEnmascarado.length;
  const declaraciones = [];
  let profundidad = 0;
  let inicio = 0;

  for (let i = 0; i < n; i++) {
    const c = codigoEnmascarado[i];
    if (c === '{' || c === '(' || c === '[') profundidad++;
    else if (c === '}' || c === ')' || c === ']') profundidad--;

    if (profundidad === 0 && (c === ';' || c === '}')) {
      declaraciones.push(codigoEnmascarado.slice(inicio, i + 1));
      inicio = i + 1;
    }
  }
  if (inicio < n) declaraciones.push(codigoEnmascarado.slice(inicio));

  return declaraciones.map((d) => d.trim()).filter((d) => d.length > 0);
}

function extraerPreambulo(codigoEnmascarado) {
  const declaraciones = dividirDeclaracionesSuperiores(codigoEnmascarado);
  const patronVar = /^(?:var|let|const)\s+[\s\S]+;$/;
  const patronFuncion = /^function\s+[A-Za-z_$][\w$]*\s*\([^)]*\)\s*\{[\s\S]*\}$/;

  let limite = 0;
  for (const decl of declaraciones) {
    if (patronVar.test(decl) || patronFuncion.test(decl)) limite += 1;
    else break;
  }

  return declaraciones.slice(0, limite).join('\n');
}

function eliminarFuncionSiNoSeUsa(codigo, nombre) {
  const patron = new RegExp('function\\s+' + nombre + '\\s*\\([^)]*\\)\\s*\\{');
  const coincidencia = codigo.match(patron);
  if (!coincidencia) return codigo;

  const indiceLlave = codigo.indexOf('{', coincidencia.index);
  const bloque = bloques.extraerBalanceado(codigo, indiceLlave, '{', '}');
  if (!bloque) return codigo;

  const finBloque = indiceLlave + bloque.length;
  const restante = codigo.slice(0, coincidencia.index) + codigo.slice(finBloque);

  if (new RegExp('\\b' + nombre + '\\b').test(restante)) return codigo;
  return restante;
}

function resolver(codigo, estadisticas) {
  const { codigo: enmascarado, tabla } = enmascarador.enmascarar(codigo);
  const preambuloEnmascarado = extraerPreambulo(enmascarado);
  if (!preambuloEnmascarado) return codigo;

  const preambulo = enmascarador.desenmascarar(preambuloEnmascarado, tabla);

  let entorno;
  try {
    entorno = {};
    vm.createContext(entorno);
    new vm.Script(preambulo, { timeout: 2000 }).runInContext(entorno, { timeout: 2000 });
  } catch (e) {
    return codigo;
  }

  const nombresCandidatos = Object.keys(entorno).filter(
    (nombre) => /^_0x[0-9a-fA-F]{3,8}$/.test(nombre) && typeof entorno[nombre] === 'function'
  );
  if (nombresCandidatos.length === 0) return codigo;

  const patronArgumento = "(?:'((?:[^'\\\\]|\\\\.)*)'|\"((?:[^\"\\\\]|\\\\.)*)\"|-?\\d+\\.?\\d*|true|false)";

  let salida = codigo;
  for (const nombre of nombresCandidatos) {
    const fn = entorno[nombre];
    const patronLlamada = new RegExp(
      '\\b' + nombre + '\\(\\s*(?:' + patronArgumento + '(?:\\s*,\\s*' + patronArgumento + ')*)?\\s*\\)', 'g'
    );

    salida = salida.replace(patronLlamada, (completa) => {
      const textoArgumentos = completa.slice(completa.indexOf('(') + 1, completa.lastIndexOf(')')).trim();
      let argumentos;
      try {
        argumentos = textoArgumentos === '' ? [] : JSON.parse('[' + textoArgumentos.replace(/'/g, '"') + ']');
      } catch (e) {
        return completa;
      }

      try {
        const resultado = fn.apply(null, argumentos);
        if (typeof resultado === 'string') {
          if (estadisticas) estadisticas.funciones = (estadisticas.funciones || 0) + 1;
          const escapado = resultado.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
          return "'" + escapado + "'";
        }
        if (typeof resultado === 'number' || typeof resultado === 'boolean') {
          if (estadisticas) estadisticas.funciones = (estadisticas.funciones || 0) + 1;
          return String(resultado);
        }
        return completa;
      } catch (e) {
        return completa;
      }
    });
  }

  for (const nombre of nombresCandidatos) {
    salida = eliminarFuncionSiNoSeUsa(salida, nombre);
  }

  return salida;
}

module.exports = { resolver };
