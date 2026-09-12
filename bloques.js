'use strict';

function extraerBalanceado(codigo, inicio, apertura, cierre) {
  let profundidad = 0;
  for (let i = inicio; i < codigo.length; i++) {
    if (codigo[i] === apertura) profundidad++;
    else if (codigo[i] === cierre) {
      profundidad--;
      if (profundidad === 0) return codigo.slice(inicio, i + 1);
    }
  }
  return null;
}

module.exports = { extraerBalanceado };
