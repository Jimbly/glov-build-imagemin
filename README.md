`imagemin` task processor for [glov-build](https://github.com/Jimbly/glov-build)
=============================

Wraps [imagemin](https://www.npmjs.com/package/imagemin) in a `glov-build` task.

API usage:
```javascript
const imagemin = require('glov-build-imagemin');

gb.task({
  name: ...,
  input: ...,
  ...imagemin({
    plugins: [
      ...
    ],
    overrides: [{
      match: /regex/,
      plugins: [
        ...
      ],
    }],
  }),
});
```
Options
* **`plugins`** - list of imagemin plugins to use by default
* **`overrides`** - optional list of override plugin lists to use for matching filenames.  The first match will be used, otherwise the defaults in `plugins` will be used


Example usage:
```javascript
const imageminPngquant = require('imagemin-pngquant');
const imageminOptipng = require('imagemin-optipng');
const imageminZopfli = require('imagemin-zopfli');

const imagemin = require('glov-build-imagemin');

// pngquant
//   Note: not reasonable to use on any images used as GPU textures, unless
//   completely opaque, pngquant cannot handle premultiplied alpha textures,
//   and for regular textures it produces images that will create bad
//   mipmaps / bad blending if there are any pixels with alpha = 0 (which lose
//   their RGB values and get replaced with green)
const PNGQUANT_DEFAULT = {
  speed: 4, // 1...11
  strip: false,
  quality: [0.3, 0.5],
  dithering: 1.0,
};

// optipng
//   Note: always lossless, safe to use with anything
const OPTIPNG_DEFAULT = {
  optimizationLevel: 3, // 0...7
  bitDepthReduction: true,
  colorTypeReduction: true,
  paletteReduction: true,
  interlaced: false,
  errorRecovery: true,
};

// zopflipng
//   Note: always lossless, safe to use with anything
const ZOPFLI_DEFAULT = {
  transparent: false, // allow altering hidden colors of transparent pixels
  '8bit': false,
  iterations: 15,
  more: false,
};

gb.task({
  name: 'all',
  input: '*.png',
  ...imagemin({
    plugins: [
      imageminPngquant(PNGQUANT_DEFAULT),
      imageminOptipng(OPTIPNG_DEFAULT),
      imageminZopfli(ZOPFLI_DEFAULT),
    ],
    overrides: [{
      match: /textures\//,
      plugins: [
        imageminOptipng(OPTIPNG_DEFAULT),
        imageminZopfli(ZOPFLI_DEFAULT),
      ],
    }],
  }),
});

```
