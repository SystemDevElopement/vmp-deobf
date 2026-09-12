#!/usr/bin/env node
'use strict';

const fs = require('fs');
const tuberia = require('./nucleo/tuberia');

function principal() {
  const argumentos = process.argv.slice(2);
  if (argumentos.length === 0) {
    console.log('uso: node vmp.js entrada.js [salida.js|--stdout] [--verbose] [--sin-renombrar] [--sin-formato]');
    process.exit(1);
  }

  const rutaEntrada = argumentos[0];
  const modoStdout = argumentos.includes('--stdout');
  const detallado = argumentos.includes('--verbose');
  const renombrar = !argumentos.includes('--sin-renombrar');
  const formatear = !argumentos.includes('--sin-formato');
  const funcionesPuras = !argumentos.includes('--sin-funciones-puras');
  const rutaSalida = argumentos[1] && !argumentos[1].startsWith('--') ? argumentos[1] : null;

  const fuente = fs.readFileSync(rutaEntrada, 'utf8');
  const resultado = tuberia.ejecutar(fuente, { renombrar, formatear, funcionesPuras });

  if (modoStdout || !rutaSalida) {
    process.stdout.write(resultado.codigo + '\n');
  } else {
    fs.writeFileSync(rutaSalida, resultado.codigo, 'utf8');
    console.error('escrito: ' + rutaSalida);
  }

  if (detallado) console.error(JSON.stringify(resultado.estadisticas));
}

if (require.main === module) principal();

module.exports = tuberia;
