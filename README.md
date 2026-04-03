# 🌍 NORML Globe — Worldwide Cannabis Data Visualizer

![NORML Globe Banner](file:///Users/glarcher/Workspace/norml-globe/src/assets/hero.png)

**NORML Globe** is a state-of-the-art interactive 3D application designed to visualize and analyze the legal status of cannabis across the entire planet. Developed with a focus on data accuracy and premium user experience, it provides a comprehensive overview of legislation as of **April 2026**.

## 🚀 Key Features

- **100% Global Coverage**: Data for every country and territory (ISO-3166), including all 50 US states and overseas territories.
- **Interactive 3D Experience**: A high-performance globe built with Three.js, allowing smooth navigation and exploration.
- **Expert Analysis**: Detailed "NORML Expert" insights for each region, covering social, racial, and economic impacts.
- **Legislative History**: Tracking the evolution of laws from early prohibition to modern reforms.
- **Multilingual Support**: Fully localized in French (and extensible to other languages via i18n).
- **Responsive Design**: Optimized for both high-end desktop displays and mobile interactive use.

## 🛠 Tech Stack

- **Framework**: [Vue 3](https://vuejs.org/) (Composition API + `<script setup>`)
- **Rendering**: [Three.js](https://threejs.org/) + Custom Shaders
- **Animations**: [GSAP](https://greensock.com/gsap/) for smooth transitions and interactions
- **Language**: [TypeScript](https://www.typescriptlang.org/) for robust data typing
- **Build Tool**: [Vite](https://vitejs.dev/) for ultra-fast development
- **Data**: Structured JSON-based localized database

## 📦 Project Structure

```bash
src/
├── components/        # Vue components (Globe, Legend, Modals)
├── composables/       # Business logic (useGlobe, useCountries)
├── locales/           # i18n JSON files (organized by region)
│   └── fr/
│       ├── countries/ # Detailed country data (africa, americas, asia, europe, oceania, usa)
│       └── ui.json    # UI localization
├── assets/            # Static high-fidelity assets
└── style.css          # Modern CSS tokens and design system
```

## 🛠 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/10lexik/norml-globe.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 📂 Data Schema

Every country in the database follows a strict expert-validated schema:

```json
{
  "ZZ": {
    "name": "Country Name",
    "flag": "🇮🇸",
    "status": "legal | tolerated | prohibited",
    "thc_status": "legal | decriminalized | prohibited",
    "cbd_status": "legal | tolerated | prohibited",
    "history": {
      "prohibition": "Year/Context",
      "evolution": "Recent changes",
      "context": "General legal climate"
    },
    "norml_expert": {
      "summary": "High-level take",
      "risks": "Legal and personal risks",
      "analysis": {
        "social": "Impact on society",
        "racial": "Equity issues",
        "economic": "Market potential"
      }
    }
  }
}
```

## 🤝 Contributing

This project is maintained by **NORML France** supporters and contributors. For data updates or feature requests, please open an issue or submit a pull request.

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Made with ❤️ for the global cannabis community.*
