// const imagemin = require('imagemin');
let imagemin;
let waiting = [];
function onReady(cb) {
  if (waiting) {
    waiting.push(cb);
  } else {
    cb();
  }
}
import('imagemin')
.then((res)=>{
  imagemin = res.default;
  let cbs = waiting;
  waiting = null;
  cbs.forEach((cb) => cb());
});

let last_timing_details = {};
function timingDetails(relative) {
  return last_timing_details[relative];
}

module.exports = function glovBuildImagemin(opts) {
  let { plugins, overrides } = opts;

  function imageminFunc(job, done) {
    let file = job.getFile();
    function choosePlugins() {
      if (overrides) {
        for (let ii = 0; ii < overrides.length; ++ii) {
          if (file.relative.match(overrides[ii].match)) {
            return overrides[ii].plugins;
          }
        }
      }
      return plugins;
    }
    onReady(function () {
      let start = Date.now();
      let p = imagemin.buffer(file.contents, { plugins: choosePlugins() });
      p.catch((err) => {
        done(err);
      })
      .then((buf) => {
        job.out({
          relative: file.relative,
          contents: buf,
        });
        last_timing_details[file.relative] = { dt: Date.now() - start };
        done();
      });
    });
  }

  return {
    type: 'single',
    func: imageminFunc,
    version: [
      opts,
      ...(opts.version || []),
    ],
  };
};

module.exports.timingDetails = timingDetails;
