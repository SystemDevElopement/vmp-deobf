'use strict';

function limpiar(codigo) {
  return codigo
    .replace(/;;+/g, ';')
    .replace(/,\s*\]/g, ']')
    .replace(/,\s*\}/g, '}')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s*;\s*$/gm, '');
}

module.exports = { limpiar };
