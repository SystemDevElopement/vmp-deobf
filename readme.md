# vmp-deobf - By Rin

Desobfuscador de JavaScript hecho para destripar codigo ofuscado con herramientas tipo VMP (packers, arrays de strings, control flow flattening, funciones puras, etc). No es magia, pero saca bastante trabajo sucio.

## Como se usa

Necesitas Node (cualquier version moderna va bien). No hay dependencias externas, asi que no hace falta npm install.

### Desde la terminal

```
node vmp.js entrada.js salida.js
```

Eso lee `entrada.js`, lo desofusca y escribe el resultado en `salida.js`. Si no le pasas archivo de salida, escupe el codigo por consola.

```
node vmp.js entrada.js            # imprime el resultado en pantalla
node vmp.js entrada.js --stdout   # igual, pero explicito
```

### Opciones

| Flag | Que hace |
|------|----------|
| `--stdout` | Imprime el resultado en vez de escribir archivo |
| `--verbose` | Muestra las estadisticas del proceso al final |
| `--sin-renombrar` | No renombra los identificadores ofuscados |
| `--sin-formato` | No formatea el codigo al final |
| `--sin-funciones-puras` | Saltea el paso de resolver funciones puras |

Ejemplo completo:

```
node vmp.js app.js limpio.js --verbose
```

Al final vas a ver algo como `{"paquetes":2,"cadenas":340,"funciones":12,"flujos":5}`. Eso te dice cuantos packers, strings, funciones y bloques de control de flujo pudo resolver. Si el numero es bajo, el codigo no estaba muy ofuscado o el desofuscador no encontro los patrones que espera.

### Como libreria

Tambien se puede usar desde otro script:

```js
const vmp = require('./vmp.js');

const fuente = require('fs').readFileSync('entrada.js', 'utf8');
const resultado = vmp.ejecutar(fuente, { renombrar: true, formatear: true, funcionesPuras: true });

console.log(resultado.codigo);
console.log(resultado.estadisticas);
```

`ejecutar` devuelve un objeto con dos campos: `codigo` (el codigo ya desofuscado) y `estadisticas` (los contadores de lo que se resolvio).

## Como funciona por dentro

La entrada pasa por una tuberia de pasos, en este orden. Cada modulo se encarga de una tecnica de ofuscacion distinta, y el resultado de uno alimenta al siguiente.

1. **normalizador** - Pone el codigo en un formato base para que los pasos siguientes sean mas predecibles.
2. **paquete** - Busca packers del estilo `function(p,a,c,k,e,d)` (el clasico de Dean Edwards) y ejecuta el `eval` en un sandbox para quedarse con el codigo real. Si hay packers anidados, los desarma uno tras otro hasta 5 niveles.
3. **escapes** - Decodifica strings con escapes del tipo `\x41` o `\u0041`.
4. **arreglo** - Es el que mas laburo hace. Detecta el patron tipico de ofuscadores como javascript-obfuscator: un array de strings (`_0x... = [...]`), una funcion decodificadora y un rotador que baraja el array. Ejecuta todo en un sandbox, resuelve cada llamada `_0x1234('...')` por su valor real y borra el codigo muerto que queda.
5. **escapes** (otra vez) - Los strings que salen del paso anterior suelen traer escapes nuevos, asi que se vuelve a decodificar.
6. **funcionespuras** - Busca funciones cuyo nombre es `_0x...` que solo devuelven strings o numeros. Las ejecuta con los argumentos que reciben y reemplaza la llamada por el resultado. Antes de ejecutar, enmascara strings y regex (para no romperlos) y despues los restaura.
7. **escapes** (de nuevo) - Mas escapes que aparecen despues de resolver funciones.
8. **numeros** - Convierte numeros hexa (`0x1f`) a decimal.
9. **constantes** - Pliega expresiones constantes simples, tipo `1 + 2` que queda como `3`.
10. **manipulacion** - Limpia manipulaciones de codigo que quedaron sin efecto.
11. **flujo** - Ataca el control flow flattening: el patron `while(true) { switch(orden[indice++]) { case 'a': ... } }`. Reconstruye el orden original de los bloques usando el array de orden, une los `case` en secuencia y borra el `switch` entero.
12. **propiedades** - Convierte accesos a propiedades que quedaron raros a su forma normal.
13. **identificadores** - Renombra los nombres `_0x...` a algo legible (o los limpia si van con `--sin-renombrar`).
14. **limpieza** - Borra restos de codigo muerto y declaraciones vacias.
15. **formato** - Embellece el codigo final para que sea legible.

## Archivos

| Archivo | Que es |
|---------|--------|
| `vmp.js` | Punto de entrada. La CLI y el export de libreria |
| `tuberia.js` | Orquesta los pasos en orden |
| `normalizador.js` | Normaliza el codigo base |
| `paquete.js` | Desempaqueta packers tipo Dean Edwards |
| `escapes.js` | Decodifica escapes en strings |
| `arreglo.js` | Resuelve el array de strings y su decodificador |
| `funcionespuras.js` | Ejecuta y reemplaza funciones puras ofuscadas |
| `numeros.js` | Normaliza numeros hexa |
| `constantes.js` | Pliega constantes |
| `manipulacion.js` | Limpia manipulaciones de codigo |
| `flujo.js` | Desarma el control flow flattening |
| `propiedades.js` | Normaliza accesos a propiedades |
| `identificadores.js` | Renombra identificadores ofuscados |
| `limpieza.js` | Borra codigo muerto |
| `formato.js` | Embellece el resultado |
| `enmascarador.js` | Enmascara strings y regex temporalmente (lo usa funcionespuras) |
| `bloques.js` | Utilidad para extraer bloques balanceados `{}` `()` `[]` |

## Limitaciones

- Funciona con codigo ofuscado con las tecnicas clasicas (packers, array de strings, flattening). Si el ofuscador es muy nuevo o usa tecnicas raras, puede que no encuentre los patrones y devuelva el codigo casi igual.
- Los pasos que ejecutan codigo (`paquete`, `arreglo`, `funcionespuras`) corren en un sandbox con timeout de 2 segundos, asi que si algo se cuelga se saltea y sigue.
- Ojo: `vmp.js` hace `require('./nucleo/tuberia')` pero `tuberia.js` esta en la raiz del repo, no en una carpeta `nucleo/`. Tal como esta, la CLI va a fallar con `MODULE_NOT_FOUND`. Si te pasa, o moves `tuberia.js` a `nucleo/` o cambias el require en `vmp.js` a `./tuberia`.
