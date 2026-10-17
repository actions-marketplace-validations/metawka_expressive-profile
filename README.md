# Expressive Profile

Generator of GitHub profile READMEs in the Material 3 Expressive style. You set up the profile on the site, download an archive and upload it to your profile repository. After that a GitHub Action refreshes the stats every day.

**Generator:** https://metawka.github.io/expressive-profile/

## Features

- Blocks: header, socials, about, tech stack, project cards, activity, streak, divider, link buttons.
- Live preview with editing by click, drag to reorder, hiding blocks.
- Material 3 color palette built from one color, a custom color or an image. Five palette styles, light and dark themes.
- Eight Material 3 shapes for the avatar, project cards and social icons.
- Typing animation for the subtitle and animations in every card. Animations can be turned off.
- Icon search across Material Symbols and Simple Icons.
- Templates, a shareable link to a setup and a "make one like this" page for any profile built with the generator.
- English and Russian interface.

## Usage

1. Open the [generator](https://metawka.github.io/expressive-profile/) and enter your GitHub username.
2. Set up the blocks and press **Download**.
3. Create a public repository named exactly like your username.
4. Unpack the archive and upload all of its files to the repository, including the `.github` and `.profile` folders.

The first workflow run replaces the preview data with exact stats and your pinned repositories. Then the profile updates once a day and commits only when something changed.

To change the profile later, edit `profile.json` in the repository or set it up again on the site and upload the new `profile.json`.

## Action

The archive contains this workflow:

```yaml
name: Expressive Profile

on:
  schedule:
    - cron: "17 3 * * *"
  workflow_dispatch:
  push:
    paths:
      - profile.json
      - .profile/icons.json

permissions:
  contents: write

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: metawka/expressive-profile@v1
        with:
          token: ${{ secrets.PROFILE_TOKEN || github.token }}
```

| Input | Default | Description |
| --- | --- | --- |
| `token` | `github.token` | Token for the GitHub API |
| `commit-message` | `Updated profile` | Message of update commits |

With the default token the language chart counts public repositories only. To include private ones, create a personal access token with read access to your repositories and save it as the `PROFILE_TOKEN` secret.

## Development

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

`npm run build` builds the site into `dist` and the Action renderer into `action/render.mjs`.

## License

The code is under the [MIT License](LICENSE).

- Google Sans Flex and Roboto Flex: SIL Open Font License, see `fonts/`.
- Material Symbols: Apache License 2.0.
- Simple Icons: CC0 1.0. Brand icons belong to their owners.
