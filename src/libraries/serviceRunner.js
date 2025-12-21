const storage = require("../libraries/storage");

module.exports = {
  async runServices() {
    const glob = require("glob");
    const path = require("path");
    const _ = require("lodash");

    const servicesPath = path.resolve(__dirname, "./../services");
    const serviceFiles = glob.sync(`${servicesPath}/**/*.js`);

    for (const file of serviceFiles) {
      const service = require(path.resolve(file));

      if (service?.type == process.env.NODE_ENV) {
        service.execute();
      }
    }
  },
};
