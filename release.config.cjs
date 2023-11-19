/**
 * @type {import('semantic-release').GlobalConfig}
 */
module.exports = {
  branches: [
    "main",
    {
      name: "beta",
      prerelease: true,
    },
  ],
};
