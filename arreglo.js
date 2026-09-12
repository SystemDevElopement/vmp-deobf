'use strict';

const vm = require('vm');

function resolverArgumento(sq, dq, simple) {
  if (sq !== undefined) return sq;
  if (dq !== undefined) return dq;
  return simple.startsWith('0x') ? parseInt(simple, 16) : parseInt(simple, 10);
}

function resolverUno(codigo, estadisticas) {
  const patronDeclaracion = /(?:var|let|const)\s+(_0x[0-9a-fA-F]{3,8})\s*=\s*(\[[\s\S]*?\]);/;
  const declaracion = codigo.match(patronDeclaracion);
  if (!declaracion) return codigo;
  const nombreArreglo = declaracion[1];

  const patronDecodificador = new RegExp(
    'function\\s+(_0x[0-9a-fA-F]{3,8})\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?' + nombreArreglo + '[\\s\\S]*?\\}'
  );
  const decodificador = codigo.match(patronDecodificador);
  if (!decodificador) return codigo;
  const nombreDecodificador = decodificador[1];

  const patronRotador = new RegExp(
    '\\(function\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\}\\s*\\(\\s*' + nombreArreglo + '\\s*,[^)]*\\)\\s*\\)\\s*;?'
  );
  const rotador = codigo.match(patronRotador);

  const fuenteSandbox =
    declaracion[0] + '\n' +
    (rotador ? rotador[0] + '\n' : '') +
    decodificador[0] + '\n' +
    'globalThis.__salida = ' + nombreDecodificador + ';';

  let funcionDecodificadora;
  try {
    const entorno = {};
    entorno.globalThis = entorno;
    vm.createContext(entorno);
    new vm.Script(fuenteSandbox, { timeout: 2000 }).runInContext(entorno, { timeout: 2000 });
    funcionDecodificadora = entorno.__salida;
    if (typeof funcionDecodificadora !== 'function') return codigo;
  } catch (e) {
    return codigo;
  }

  const patronArgumento = "(?:'([^']*)'|\"([^\"]*)\"|(0x[0-9a-fA-F]+|\\d+))";
  const patronLlamada = new RegExp(
    '\\b' + nombreDecodificador + '\\(\\s*' + patronArgumento + '\\s*(?:,\\s*' + patronArgumento + '\\s*)?\\)', 'g'
  );

  let salida = codigo.replace(patronLlamada, (completa, aSq, aDq, aSimple, bSq, bDq, bSimple) => {
    try {
      const argumentoA = resolverArgumento(aSq, aDq, aSimple);
      const hayB = bSq !== undefined || bDq !== undefined || bSimple !== undefined;
      const argumentoB = hayB ? resolverArgumento(bSq, bDq, bSimple) : undefined;
      const resultado = hayB ? funcionDecodificadora(argumentoA, argumentoB) : funcionDecodificadora(argumentoA);
      if (typeof resultado !== 'string') return completa;
      if (estadisticas) estadisticas.cadenas = (estadisticas.cadenas || 0) + 1;
      const escapado = resultado.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
      return "'" + escapado + "'";
    } catch (e) {
      return completa;
    }
  });

  const restante = salida
    .replace(decodificador[0], '')
    .replace(rotador ? rotador[0] : '', '')
    .replace(declaracion[0], '');

  if (!new RegExp('\\b' + nombreDecodificador + '\\s*\\(').test(restante)) {
    salida = salida.replace(decodificador[0], '');
    if (rotador) salida = salida.replace(rotador[0], '');
    salida = salida.replace(declaracion[0], '');
  }

  return salida;
}

function resolver(codigo, estadisticas) {
  let salida = codigo;
  let cambiado = true;
  let intentos = 0;
  while (cambiado && intentos < 8) {
    cambiado = false;
    intentos++;
    const resultado = resolverUno(salida, estadisticas);
    if (resultado !== salida) {
      salida = resultado;
      cambiado = true;
    }
  }
  return salida;
}

module.exports = { resolver };
