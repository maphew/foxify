# Foxify

[![Node.js Version][node-version-image]][node-version-url]
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Dependencies Status][dependencies-image]][dependencies-url]
[![Dev Dependencies Status][dev-dependencies-image]][dev-dependencies-url]

Foxify is a web application that converts Chrome Web Store extensions to be compatible with Mozilla Firefox. This tool is particularly useful for developers who want to test their Chrome extensions in Firefox or for users who need to run Chrome extensions in Firefox.

## ⚠️ Important Notice

This project has been modernized to work with Node.js 18+ and includes several improvements over the original codebase. However, please note:

- The project is still in development and may have some limitations
- Some Chrome APIs may not have direct equivalents in Firefox
- You'll need Firefox Nightly or Developer Edition with `xpinstall.signatures.required` set to `false` to install unsigned extensions

## 🚀 Features

- Convert Chrome extensions (.crx) to Firefox WebExtensions (.xpi)
- Support for modern web standards and APIs
- Built with security in mind
- Easy-to-use web interface
- Developer-friendly with comprehensive testing setup

## 📋 Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ (comes with Node.js 18+)
- Firefox Nightly or Firefox Developer Edition for testing

## 🛠 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/foxify.git
   cd foxify
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file to configure your environment settings.

## 🚀 Quick Start

### Development Mode

1. Start the development server:
   ```bash
   npm run dev
   ```
   This will start both the Express server and Webpack dev server with hot-reload.

2. Open your browser to [http://localhost:3000](http://localhost:3000)

### Production Build

To create a production build:

```bash
NODE_ENV=production npm run build
npm start
```

## 🔧 Firefox Setup

To install unsigned extensions in Firefox:

1. Open Firefox Nightly or Developer Edition
2. Navigate to `about:config`
3. Search for `xpinstall.signatures.required`
4. Set the value to `false`

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run API tests
npm run test:api

# Run with coverage
npm run test:coverage
```

## 🔄 API Usage

Foxify provides a simple API for converting extensions:

```
GET /download/extension.xpi?url=<chrome-web-store-url>
```

### Parameters

- `url` (required): The Chrome Web Store URL of the extension
- `force_dl` (optional): Set to `true` to force download instead of installation

### Response Formats

- `.xpi`: Firefox extension (default)
- `.zip`: ZIP archive of the extension
- `.crx`: Original Chrome extension (if available)

## 🛡 Security Considerations

- The development server (`webpack-dev-server`) has known vulnerabilities but is only used during development
- Always use `NODE_ENV=production` for production deployments
- Be cautious when installing unsigned extensions in Firefox

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original project by [bnpoirier](https://github.com/bnpoirier/foxify)
- All contributors who helped improve this project

[node-version-image]: https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg
[node-version-url]: https://nodejs.org/
[dependencies-image]: https://david-dm.org/yourusername/foxify/status.svg
[dependencies-url]: https://david-dm.org/yourusername/foxify
[dev-dependencies-image]: https://david-dm.org/yourusername/foxify/dev-status.svg
[dev-dependencies-url]: https://david-dm.org/yourusername/foxify?type=dev
