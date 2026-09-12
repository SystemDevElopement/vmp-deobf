'use strict';

function eliminar(codigo) {
  let salida = codigo;
  salida = salida.replace(/;?\s*debugger\s*;/g, ';');
  salida = salida.replace(/setInterval\(function\s*\(\)\s*\{\s*\}\s*,\s*\d+\)\s*;?/g, '');
  salida = salida.replace(/console\s*\.\s*clear\s*\(\s*\)\s*;?/g, '');
  salida = salida.replace(/new Function\(\s*(['"])debugger\1\s*\)\s*\(\s*\)\s*;?/g, '');
  salida = salida.replace(/\['constructor'\]\(['"]debugger['"]\)\(\)/g, 'undefined');
  return salida;
}

module.exports = { eliminar };
