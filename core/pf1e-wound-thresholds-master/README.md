# Pathfinder 1e - Wound Thresholds with Wounds & Vigor

A crude implementation of a wounds & vigor and wound threshold
compatibility patch for Pathfinder 1e for FoundryVTT.

The following conditions are automatically applied:
- **Fatigued:** Character reaches 0 vigor.
- **Grazed:** Character loses at least 1 wound point.
- **Wounded:** Character loses at least 1/4 of their wounds.
- **Critical:** Character loses at least 1/2 of their wounds.
- **Staggered:** Character loses at least 1/2 of their wounds.

# Token Settings

This module runs under the assumption that tokens are set up as follows:
- **Bar 1:** Vigor
- **Bar 2:** Wounds

Bars will be condensed into one bar that shows both attributes at once.

# Credits

- The following images are included in this project:
    - [Bloody stash](https://game-icons.net/1x1/lorc/bloody-stash.html) by [Lorc](https://lorcblog.blogspot.com/) under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/), edited as `wt-critical`, `wt-grazed` and `wt-wounded`.