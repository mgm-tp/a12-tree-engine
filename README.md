<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://www.mgm-tp.com/global-content/cd/logos/a12/app-icons/dark/A12-Dark.svg" />
  <img src="https://www.mgm-tp.com/global-content/cd/logos/a12/app-icons/light/A12-Light.svg" height="200" alt="A12 logo" />
</picture>

# Tree Engine

Containing the A12 Tree Engine packages.

Refer to https://geta12.com/#/docs to get started with A12 development

---

## License

Parts of the A12 platform are made available under a **dual license**.
Please check the [LICENSE](./LICENSE) file for details.

---

## Getting Started

### How to Use It

#### Import & Install

To use the Tree Engine in your project:

```sh
npm install @com.mgmtp.a12.treeengine/treeengine-core
```

---

### How to Build and Run

#### Prerequisites

The following tools are required in order to build this repository:

| Tool                                    | Version |
| --------------------------------------- | ------: |
| [JDK](https://openjdk.org/)             |    `21` |
| [Node](https://nodejs.org/)             |  `22.x` |
| [pnpm](https://pnpm.io/)                |   `9.x` |
| [Gradle](https://gradle.org) (optional) |   `9.x` |

#### How to Build

Install all dependencies and link local packages:

```sh
pnpm install
```

Build all packages:

```sh
pnpm compile
```

#### How to Test

Run unit tests in all packages:

```sh
pnpm test
```

Run end-to-end tests (requires the dev server to be running):

```sh
pnpm test:e2e
```

Run performance tests (requires the dev server to be running):

```sh
pnpm test:perf
```

#### How to Run

Start the development environment:

```sh
pnpm start
```

This will start the dev servers and TypeScript compilers in watch mode. This is the recommended way to start developing instead of starting individual packages.

For IntelliJ users, the compound task 'Start All' can be run to execute all of them separately.

#### How to Access It

Once running, open your browser and navigate to:

- **Showcase**: <http://localhost:15000>
- **Documentation**: `documentation/build/index.html` (after compile)
- **TypeDoc**: `documentation/build/assets/generated/typedoc/index.html` (after compile)

#### How to Clean and Format

Remove all build artifacts:

```sh
pnpm clean
```

Run linting:

```sh
pnpm lint
```

Fix linting issues:

```sh
pnpm format
```

---

### Documentation

- Full technical documentation is available at [GetA12.com](https://GetA12.com).
- The website also provides access to the **A12 Discourse Community Forum**.

---

**The mgm A12 Team**

[mgm technology partners GmbH](https://www.mgm-tp.com) • [Imprint](https://www.mgm-tp.com/imprint.html)
