'use strict';

function convertir(codigo, estadisticas) {
  return codigo.replace(/([\w$\)\]])\s*\[\s*(['"])([A-Za-z_$][\w$]*)\2\s*\]/g, (completa, previo, comilla, propiedad) => {
    if (estadisticas) estadisticas.propiedades = (estadisticas.propiedades || 0) + 1;
    return previo + '.' + propiedad;
  });
}

module.exports = { convertir };
