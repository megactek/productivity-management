import type { NextConfig } from "next";
import type { Configuration as WebpackConfig } from "webpack";
import customWebpackConfig from "./webpack.config";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config: WebpackConfig, { dev, isServer }) => {
    // Use our custom webpack configuration
    return customWebpackConfig(config, { dev, isServer });
  },
};

export default nextConfig;
