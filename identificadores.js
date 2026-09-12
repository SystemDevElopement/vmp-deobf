'use strict';

const enmascarador = require('./enmascarador');

function renombrar(codigo, estadisticas) {
  const { codigo: enmascarado, tabla } = enmascarador.enmascarar(codigo);

  const encontrados = new Set();
  const patron = /\b_0x[0-9a-fA-F]{3,8}\b/g;
  let coincidencia;
  while ((coincidencia = patron.exec(enmascarado))) encontrados.add(coincidencia[0]);

  const mapa = new Map();
  let contadorFuncion = 1;
  let contadorVariable = 1;

  for (const nombre of encontrados) {
    const esFuncion = new RegExp('function\\s+' + nombre + '\\s*\\(').test(enmascarado);
    if (esFuncion) {
      mapa.set(nombre, 'funcion' + contadorFuncion++);
    } else {
      mapa.set(nombre, 'variable' + contadorVariable++);
    }
  }

  let salida = enmascarado;
  for (const [nombreAnterior, nombreNuevo] of mapa) {
    salida = salida.replace(new RegExp('\\b' + nombreAnterior + '\\b', 'g'), nombreNuevo);
  }

  salida = enmascarador.desenmascarar(salida, tabla);

  if (estadisticas) estadisticas.identificadores = mapa.size;
  return salida;
}

module.exports = { renombrar };
