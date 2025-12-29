/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Fix workspace root detection when multiple lockfiles exist higher in the tree.
    root: __dirname,
  },
};

module.exports = nextConfig;
