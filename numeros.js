'use strict';

const enmascarador = require('./enmascarador');

function normalizar(codigo, estadisticas) {
  const { codigo: enmascarado, tabla } = enmascarador.enmascarar(codigo);

  const convertido = enmascarado.replace(/\b0[xX][0-9a-fA-F]+\b/g, (coincidencia) => {
    const valor = parseInt(coincidencia, 16);
    if (!Number.isSafeInteger(valor)) return coincidencia;
    if (estadisticas) estadisticas.numeros = (estadisticas.numeros || 0) + 1;
    return String(valor);
  });

  return enmascarador.desenmascarar(convertido, tabla);
}

module.exports = { normalizar };
