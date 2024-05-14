---
sidebar_position: 1
---

# Tutorial Intro

Let's discover **CRX MONKEY in less than 5 minutes**.

## Getting Started

Get started by **creating a new project**.

### What you'll need

- [Node.js](https://nodejs.org/en/download/) version 22 or above:
  - When installing Node.js, you are recommended to check all checkboxes related to dependencies.

## Generate a new project

Generate a new project using the [create-crx-monkey](https://www.npmjs.com/package/create-crx-monkey)

The template will automatically be added to your project after you run the command:

```bash
npm create crx-monkey
```

You can type this command into Command Prompt, Powershell, Terminal, or any other integrated terminal of your code editor.

The command also installs all necessary dependencies you need to run crx-monkey.

## Start your project

Run the development server:

```bash
cd my-website
npx crx-monkey dev
```

The `cd` command changes the directory you're working with. In order to work with your newly created Docusaurus site, you'll need to navigate the terminal there.

The `npx crx-monkey dev` command builds your website locally and serves it through a development server, ready for you to view at http://localhost:3000/.

Open `src/contentscripts/contentscript.ts` (this page) and edit some lines: the tab in browser **reloads automatically** and displays your changes.
