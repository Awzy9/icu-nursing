# Emergency simulation answer cues — batch 02

Rebalanced nine checkpoints in SC-11, SC-12 and SC-13. Preserved all canonical option indices, scores, transitions, source lists, feedback and consequences. Correct responses are concise while incorrect choices describe the same errors in realistic workflow context. No new clinical recommendation or external evidence claim. All three drafts remain unreviewed. Cumulative length-cue correction: 12/59; 47 remaining. Length is only a proxy, not a validated assessment of distractor difficulty.

- SC-11 step 1: 278/77/50 → 184/204/193
- SC-11 step 2: 289/92/65 → 171/189/197
- SC-11 step 3: 257/47/56 → 171/183/186
- SC-12 step 1: 234/71/59 → 156/182/181
- SC-12 step 2: 268/61/75 → 159/182/192
- SC-12 step 3: 226/90/93 → 154/172/176
- SC-13 step 1: 256/69/50 → 181/194/201
- SC-13 step 2: 235/54/66 → 160/189/166
- SC-13 step 3: 295/82/50 → 185/193/183

Original draft hashes checked; index and revision history synchronized. Tightened regression baseline and added nine checkpoint cases.

Prior CI, learning experience and mobile acceptance passed; isolated Supabase account E2E failed because positional answer selectors chose the wrong canonical response after display-order permutation. Updated the two selectors to identify the intended response by text; retained exact canonical database assertions, account privacy checks and cross-browser debrief assertions. Fresh CI required; no production deployment.
