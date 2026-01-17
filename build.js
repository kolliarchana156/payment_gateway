const webpack = require('webpack');
const path = require('path');

const config = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'checkout.js',
    library: {
      name: 'PaymentGateway',
      type: 'window', 
      // Removed "export: 'default'" because we are using module.exports
    },
  },
  mode: 'production'
};

console.log('🚀 Starting Build...');
webpack(config, (err, stats) => {
  if (err) {
    console.error('❌ Configuration Error:', err);
    return;
  }
  if (stats.hasErrors()) {
    console.error('❌ Build Error:', stats.toString());
    return;
  }
  console.log('✅ Build Success! File created at dist/checkout.js');
});