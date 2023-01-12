/* eslint no-unused-vars: off, quote-props: off */
const assert = require('assert');
const fs = require('fs');
const imageminPngquant = require('imagemin-pngquant');
const imageminOptipng = require('imagemin-optipng');
const imageminZopfli = require('imagemin-zopfli');
const path = require('path');
const { doTest } = require('./runner.js');
const gb = require('glov-build');
const imagemin = require('../');
const { timingDetails } = imagemin;

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
const PNGQUANT_REASONABLE = { // Reasonable, unless you've got an alpha channel...
  speed: 2, // 1...11
  strip: true,
  quality: [0.95, 1.0],
  dithering: 0,
};
const PNGQUANT_LOSSLESS = { // virtually no change
  quality: [1.0, 1.0],
  strip: true,
  dithering: false,
};

gb.task({
  name: 'pngquant',
  input: '*.png',
  target: 'dev',
  ...imagemin({
    plugins: [
      imageminPngquant(PNGQUANT_REASONABLE),
    ],
    overrides: [{
      match: /normal/,
      plugins: [
        imageminPngquant(PNGQUANT_LOSSLESS)
      ],
    }],
  }),
});

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
const OPTIPNG_MAX = {
  optimizationLevel: 7, // 0...7
  bitDepthReduction: true,
  colorTypeReduction: true,
  paletteReduction: true,
  interlaced: false,
  errorRecovery: true,
};

gb.task({
  name: 'optipng',
  input: '*.png',
  target: 'dev',
  ...imagemin({
    plugins: [
      imageminOptipng(OPTIPNG_DEFAULT),
    ],
  }),
});

// zopflipng
//   Note: always lossless, safe to use with anything
const ZOPFLI_DEFAULT = {
  transparent: false, // allow altering hidden colors of transparent pixels
  '8bit': false,
  iterations: 15,
  more: false,
};

gb.task({
  name: 'zopfli',
  input: '*.png',
  target: 'dev',
  ...imagemin({
    plugins: [
      imageminZopfli(ZOPFLI_DEFAULT),
    ],
  }),
});


gb.task({
  name: 'all',
  input: '*.png',
  target: 'dev',
  ...imagemin({
    plugins: [
      imageminPngquant(PNGQUANT_DEFAULT),
      imageminOptipng(OPTIPNG_DEFAULT),
      imageminZopfli(ZOPFLI_DEFAULT),
    ],
  }),
});

// Safe to use on images used as textures
gb.task({
  name: 'optizopfli',
  input: '*.png',
  target: 'dev',
  ...imagemin({
    plugins: [
      imageminOptipng(OPTIPNG_DEFAULT),
      imageminZopfli(ZOPFLI_DEFAULT),
    ],
  }),
});

const ALL_FILES = fs.readdirSync(path.join(__dirname, 'fixtures'));

function loadFilesFromFixtures(list) {
  let ret = {};
  for (let ii = 0; ii < list.length; ++ii) {
    ret[list[ii]] = fs.readFileSync(path.join(__dirname, 'fixtures', list[ii]));
  }
  return ret;
}

doTest({
  input: loadFilesFromFixtures(ALL_FILES),
  output: {
  },
  tasks: ['all'],
  checker: function (inputdir, outdir) {
    let files = fs.readdirSync(outdir);
    function printLine(filename, source_size, dest_size, ms) {
      console.log(`${filename}: ${source_size} => ${dest_size} bytes` +
        ` (${(dest_size / source_size * 100).toFixed(1)}%)` +
        `${ms ? `, ${ms}ms` : ''}`);
    }
    let source_size = 0;
    let dest_size = 0;
    files.forEach(function (filename) {
      let stat_in = fs.statSync(path.join(inputdir, filename));
      source_size += stat_in.size;
      let stat_out = fs.statSync(path.join(outdir, filename));
      dest_size += stat_out.size;
      printLine(`  ${filename}`, stat_in.size, stat_out.size, timingDetails(filename).dt);
    });
    printLine(`${files.length} file(s)`, source_size, dest_size);
  },
});
