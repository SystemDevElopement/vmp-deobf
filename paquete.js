'use strict';

const vm = require('vm');
const bloques = require('./bloques');

function extraerBalanceado(codigo, inicio, apertura, cierre) {
  return bloques.extraerBalanceado(codigo, inicio, apertura, cierre);
}

function desempaquetar(codigo, estadisticas, profundidadRecursion) {
  profundidadRecursion = profundidadRecursion || 0;
  if (profundidadRecursion > 5) return codigo;

  const indicador = codigo.search(/function\s*\(p,a,c,k,e,[rd]\)/);
  if (indicador === -1) return codigo;

  const inicioEval = codigo.lastIndexOf('eval(', indicador);
  if (inicioEval === -1) return codigo;

  const aperturaParentesis = inicioEval + 4;
  const llamadaCompleta = extraerBalanceado(codigo, aperturaParentesis, '(', ')');
  if (!llamadaCompleta) return codigo;

  const interior = llamadaCompleta.slice(1, -1);

  try {
    const entorno = {};
    vm.createContext(entorno);
    const script = new vm.Script('(' + interior + ')', { timeout: 2000 });
    const resultado = script.runInContext(entorno, { timeout: 2000 });
    if (typeof resultado !== 'string') return codigo;

    if (estadisticas) estadisticas.paquetes = (estadisticas.paquetes || 0) + 1;

    const antes = codigo.slice(0, inicioEval);
    const despues = codigo.slice(aperturaParentesis + llamadaCompleta.length);
    const combinado = antes + resultado + despues;

    return desempaquetar(combinado, estadisticas, profundidadRecursion + 1);
  } catch (e) {
    return codigo;
  }
}

module.exports = { desempaquetar };
