# Car Performance Calculator

An interactive visualization tool that demonstrates the relationship between horsepower, vehicle weight, and acceleration performance. The calculator shows:
- Power required for maximum acceleration at different speeds
- 0-100 km/h acceleration times for different power levels
- 0-200 km/h acceleration times
- Effects of vehicle weight and tire grip on performance

## Quick Start

You can directly open the [standalone HTML file](dist/index.html) in your browser - no server required!

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

The build will create a single self-contained HTML file in `dist/index.html` that includes all JavaScript and CSS.
```bash
