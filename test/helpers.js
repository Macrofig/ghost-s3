exports.mockS3 = {
  headObject(params) {
    const def = new Promise((resolve, reject) => {
      resolve(params.Key !== 'not-exists');
    });
    return def;
  },
  putObject(params) {
    const def = new Promise((resolve, reject) => {
      if (params.Key === 'success') {
        resolve({message: 'Success!'});
      } else {
        reject({message: 'Oh noes!'})
      }
    });
    return def;
  }
}
