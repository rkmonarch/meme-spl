import MiniCssExtractPlugin from "mini-css-extract-plugin";

module.exports = {
  images: {
    domains: ["peach-rainy-ape-776.mypinata.cloud", "ipfs.io"],
  },
  webpack: (config: { plugins: unknown[] }, {}) => {
    // Add mini-css-extract-plugin
    config.plugins.push(
      new MiniCssExtractPlugin({
        filename: "[name].css",
        chunkFilename: "[id].css",
      })
    );

    return config;
  },
};
