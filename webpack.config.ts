import path from "path";
import type { Configuration } from "webpack";

// This is a custom webpack configuration that can be imported and used in next.config.ts
const customWebpackConfig = (
  config: Configuration,
  { dev, isServer }: { dev: boolean; isServer: boolean }
): Configuration => {
  // Extend the existing config

  // Resolve extensions
  config.resolve = {
    ...config.resolve,
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json", ".md", ...(config.resolve?.extensions || [])],
  };

  // Aliases for easier imports
  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve?.alias,
      "@components": path.resolve(__dirname, "./src/components"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@stores": path.resolve(__dirname, "./src/stores"),
    },
  };

  // Optimization settings for production
  if (!dev) {
    config.optimization = {
      ...config.optimization,
      minimize: true,
      splitChunks: {
        chunks: "all",
        maxInitialRequests: Infinity,
        minSize: 20000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module: any) {
              // Get the name of the npm package
              const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
              // Return a clean package name (avoid @ symbols)
              return `npm.${packageName.replace("@", "")}`;
            },
          },
        },
      },
    };
  }

  // Add loaders
  if (!config.module) config.module = { rules: [] };
  if (!config.module.rules) config.module.rules = [];

  // Add raw-loader for markdown files
  config.module.rules.push({
    test: /\.md$/,
    use: "raw-loader",
  });

  return config;
};

export default customWebpackConfig;
