# Shared-Grasp Connectivity — video companion

A buildless GitHub Pages site for the regrasp-planning paper. Open `index.html` directly or serve the repository with a static web server.

## Contents

- Original `video_1.mp4`, retained byte for byte.
- Eight one-step pose-optimization videos, one per object.
- Sixteen trajectory videos, with Cold and Warm starts for each object.
- Analytical-reference and final-distribution plots for ordinary, truncated and balanced generating objectives.
- All eight one-step and sixteen trajectory videos directly visible in responsive two-row, four-column grids on wide desktop screens, with no object or objective tabs.
- Sixteen additional fixed-grasp/candidate optimization videos in a two-row by eight-object gallery, Cold above Warm. Each clip shows every integer update of synchronized mid-pose/robot-path optimization and stops before a replan. Both the pose-generation and fixed-grasp galleries use 30 fps, with one optimization update every 0.2 seconds.
- All 41 videos initialize with muted autoplay and looping, retaining native playback controls. Starting another video or scrolling does not pause them.
- Independent linked Cold/Warm playback, verified TCP-length traces and full-size result figures for every object.
- Thirteen original equation captures cropped directly from the clean manuscript PDF, preserving its typesetting and equation numbers. Each capture opens at full resolution.

The page uses a wider content region (up to 1840px). Method illustrations in `assets/images/paper/` are byte-identical copies of the current manuscript overview, shared-grasp, energy-composition and stable-placement figures, with click-to-enlarge views.

## Scientific scope

The one-step illustrations use the 10k-pose/FPS20 models, 200 candidates and 20 native pose updates. Objects use their first registered one-step query, with one geometry-qualified replacement for Mug. The Mug example uses mug_q0015, the first subsequent registered query with collision-free object/environment endpoints, nonempty feasible endpoint grasp sets and no direct shared grasp. Selection precedes optimization. The videos track the same twenty candidate identities selected by final ordinary cost. Colors in each final-objective row use that objective's own scale.

Trajectory clips replay saved Jseq paths from the completed 20-grasp study. They include real pose updates, verified checkpoints and final joint-path playback. Cold has no supplied path. Warm uses the saved common executable initialization. Illustrative paired queries are the first in numerical order with an available Warm initialization and final executable Jseq paths under both starts. Displayed TCP lengths are taken from audited results. Animation time is adjusted for viewing.

The examples are separate from query-level benchmark statistics. The manuscript's main one-step benchmark uses 1000 candidates and ten updates. Full trajectory comparisons use ten valid pose pairs per object. The existing recorded hardware experiment is a separate demonstration.

## Deploy to the existing GitHub Pages repository

Copy `index.html`, `styles.css`, `app.js`, `assets/` and `.nojekyll` to the root of `UccI22911/UccI22911.github.io`. Keep `video_1.mp4` in place. The provided ready-to-upload ZIP contains the full static site, including the unchanged original recording.

GitHub Pages should serve the root of the repository's `main` branch. No Node packages, external fonts, analytics, accounts or third-party runtime scripts are required. Displayed formulas are original PDF equation captures, with descriptive alt text.

## Local build records

Local-only rendering scripts are in `tools/`, with source hashes, replay audits and validation reports in `.build/`. These directories are excluded from publication. The tiled-page builder is `tools/build_tiled_page.py`. The public `assets/data/examples.json` contains the displayed example metadata without private filesystem paths.

Validation includes all published MP4 decodes, H.264/yuv420p encoding, fast-start MP4s, caption tracks, local links, unchanged original video hash, archived trajectory anchors/lengths, and browser checks for the fully expanded grids, PDF equation capture rendering, figure zoom, independent synchronized pairs and responsive widths.

Fixed-pair example selection and archived checkpoint audits are under `.build/fixed-pair/`. Every-step visualization recovery and rendering records are under `.build/fixed-pair-every-step-v2/`. The frozen original optimizer is replayed on the original GPU type, using saved initializations and optimizer snapshots. Every update is compared with the archived planar/acceptance record, and reconstructed joints are checked against each archived checkpoint before anchoring the next block. No joint/pose interpolation, new RRT planning, scientific parameter changes or result modifications are used. Intermediate updates are visualizations of optimizer states, while full-motion verification refers to the archived checkpoints. The shorter Mug Warm interval is retained.
