# Car Performance Calculator

An interactive visualization tool that demonstrates the relationship between horsepower, vehicle weight, and acceleration performance. The calculator shows:
- Power required for maximum acceleration at different speeds
- 0-100 km/h acceleration times for different power levels
- 0-200 km/h acceleration times
- Effects of vehicle weight and tire grip on performance

## Quick Start

You can directly access the calculator in two ways:

1. [Open Calculator (Raw HTML)](https://raw.githubusercontent.com/ReinisLusis/hp_vs_grip/refs/heads/main/dist/index.html) - Right-click and select "Save As" to download, then open locally
2. [View Source](https://github.com/ReinisLusis/hp_vs_grip/blob/main/dist/index.html) - View the source code on GitHub

## Development

If you want to modify the code:

1. Install dependencies:
```bash
npm ci
```

2. Start development server:
```bash
npm run dev
```

3. Build standalone HTML:
```bash
npm run build
```

The build will create a single self-contained HTML file that includes all JavaScript and CSS.

## Note

Due to GitHub's raw file serving limitations, you'll need to download the HTML file first and open it locally. This is because GitHub serves raw files with a `Content-Type: text/plain` header, which prevents browsers from executing it directly.
```bash
