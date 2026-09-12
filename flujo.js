'use strict';

const bloques = require('./bloques');

function extraerBloqueBalanceado(codigo, inicio) {
  return bloques.extraerBalanceado(codigo, inicio, '{', '}');
}

function extraerOrden(antesDelBloque, nombreOrden) {
  const patronCadena = new RegExp(
    '(?:var|let|const)\\s+' + nombreOrden + '\\s*=\\s*([\'"])((?:(?!\\1).)*)\\1\\s*\\.\\s*split\\s*\\(\\s*[\'"](.)[\'"]\\s*\\)\\s*;?'
  );
  const coincidenciaCadena = antesDelBloque.match(patronCadena);
  if (coincidenciaCadena) {
    return { orden: coincidenciaCadena[2].split(coincidenciaCadena[3]), declaracion: coincidenciaCadena[0] };
  }

  const patronLista = new RegExp('(?:var|let|const)\\s+' + nombreOrden + '\\s*=\\s*(\\[[^\\]]*\\])\\s*;?');
  const coincidenciaLista = antesDelBloque.match(patronLista);
  if (coincidenciaLista) {
    try {
      const orden = JSON.parse(coincidenciaLista[1].replace(/'/g, '"'));
      return { orden, declaracion: coincidenciaLista[0] };
    } catch (e) {
      return null;
    }
  }

  return null;
}

function simplificarUno(codigo, estadisticas) {
  const patronBloque = /while\s*\(\s*(?:true|!!\[\]|1)\s*\)\s*\{\s*switch\s*\(([\s\S]*?)\)\s*\{/;
  const coincidenciaInicio = codigo.match(patronBloque);
  if (!coincidenciaInicio) return codigo;

  const indiceInicio = coincidenciaInicio.index;
  const indiceLlaveWhile = codigo.indexOf('{', indiceInicio);
  const indiceLlaveSwitch = codigo.indexOf('{', indiceLlaveWhile + 1);
  const cuerpoSwitch = extraerBloqueBalanceado(codigo, indiceLlaveSwitch);
  if (!cuerpoSwitch) return codigo;

  const finSwitch = indiceLlaveSwitch + cuerpoSwitch.length;
  const cierreBloque = codigo.slice(finSwitch).match(/^\s*break\s*;?\s*\}/);
  if (!cierreBloque) return codigo;
  const finBloqueTotal = finSwitch + cierreBloque[0].length;

  const discriminante = coincidenciaInicio[1].trim();
  const coincidenciaDiscriminante = discriminante.match(/^([A-Za-z_$][\w$]*)\[\s*([A-Za-z_$][\w$]*)\+\+\s*\]$/);
  if (!coincidenciaDiscriminante) return codigo;
  const nombreOrden = coincidenciaDiscriminante[1];
  const nombreIndice = coincidenciaDiscriminante[2];

  const antesDelBloque = codigo.slice(0, indiceInicio);
  const infoOrden = extraerOrden(antesDelBloque, nombreOrden);
  if (!infoOrden) return codigo;

  const patronIndice = new RegExp('(?:var|let|const)\\s+' + nombreIndice + '\\s*=\\s*0\\s*;?');
  const coincidenciaIndice = antesDelBloque.match(patronIndice);

  const casos = {};
  const patronCaso = /case\s*(?:'([^']*)'|"([^"]*)")\s*:([\s\S]*?)(?=case\s*(?:'[^']*'|"[^"]*")\s*:|$)/g;
  let coincidenciaCaso;
  while ((coincidenciaCaso = patronCaso.exec(cuerpoSwitch))) {
    const etiqueta = coincidenciaCaso[1] !== undefined ? coincidenciaCaso[1] : coincidenciaCaso[2];
    let cuerpo = coincidenciaCaso[3];
    cuerpo = cuerpo.replace(/continue\s*;?\s*(\}\s*)?$/, '');
    casos[etiqueta] = cuerpo.trim();
  }

  const partesOrdenadas = [];
  for (const etiqueta of infoOrden.orden) {
    if (!(etiqueta in casos)) return codigo;
    partesOrdenadas.push(casos[etiqueta]);
  }

  const cuerpoFinal = partesOrdenadas.join('\n');

  let salida = codigo.slice(0, indiceInicio) + cuerpoFinal + codigo.slice(finBloqueTotal);
  salida = salida.replace(infoOrden.declaracion, '');
  if (coincidenciaIndice) salida = salida.replace(coincidenciaIndice[0], '');

  if (estadisticas) estadisticas.flujos = (estadisticas.flujos || 0) + 1;
  return salida;
}

function simplificar(codigo, estadisticas) {
  let salida = codigo;
  let cambiado = true;
  let vueltas = 0;
  while (cambiado && vueltas < 15) {
    cambiado = false;
    vueltas++;
    const resultado = simplificarUno(salida, estadisticas);
    if (resultado !== salida) {
      salida = resultado;
      cambiado = true;
    }
  }
  return salida;
}

module.exports = { simplificar };
