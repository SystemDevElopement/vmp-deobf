'use strict';

const normalizar = require('./normalizador');
const escapes = require('./escapes');
const paquete = require('./paquete');
const arreglo = require('./arreglo');
const funcionespuras = require('./funcionespuras');
const numeros = require('./numeros');
const constantes = require('./constantes');
const manipulacion = require('./manipulacion');
const flujo = require('./flujo');
const propiedades = require('./propiedades');
const identificadores = require('./identificadores');
const limpieza = require('./limpieza');
const formato = require('./formato');

function ejecutar(fuente, opciones) {
  opciones = opciones || {};
  const estadisticas = {};

  let codigo = fuente;
  codigo = normalizar(codigo);
  codigo = paquete.desempaquetar(codigo, estadisticas);
  codigo = escapes.decodificar(codigo, estadisticas);
  codigo = arreglo.resolver(codigo, estadisticas);
  codigo = escapes.decodificar(codigo, estadisticas);
  if (opciones.funcionesPuras !== false) codigo = funcionespuras.resolver(codigo, estadisticas);
  codigo = escapes.decodificar(codigo, estadisticas);
  codigo = numeros.normalizar(codigo, estadisticas);
  codigo = constantes.plegar(codigo, estadisticas);
  codigo = manipulacion.eliminar(codigo);
  codigo = flujo.simplificar(codigo, estadisticas);
  codigo = propiedades.convertir(codigo, estadisticas);
  if (opciones.renombrar !== false) codigo = identificadores.renombrar(codigo, estadisticas);
  codigo = limpieza.limpiar(codigo);
  if (opciones.formatear !== false) codigo = formato.embellecer(codigo);

  return { codigo, estadisticas };
}

module.exports = { ejecutar };
