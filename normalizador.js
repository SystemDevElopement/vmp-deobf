'use strict';

function normalizar(codigo) {
  return codigo
    .replace(/\r\n/g, '\n')
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+$/gm, '');
}

module.exports = normalizar;
