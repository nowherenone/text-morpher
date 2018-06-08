const Az = require("az");

const initAZ = () => {
  return new Promise(resolve => {
    Az.Morph.init(() => {
      resolve(this);
    });
  });
};

module.exports = {
  initAZ
};
