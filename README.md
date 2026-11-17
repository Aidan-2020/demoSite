# Downtrace Site Atlas

Leaflet map with Firebase Authentication and Cloud Firestore. Sites are shared live across signed-in viewers. The initial ten records use real places with fictional notes and client categories; all are marked as demo data.

## Use

Enter the shared access code. Add site, then click the map to fill coordinates, or enter coordinates manually. Choose Client or Potential client and save. Manage sites has Edit and Remove buttons; Undo restores the last removed site. Research notes are optional. Transactions reject stale edits so a colleague's newer changes are not silently overwritten.

Imports add up to 200 GeoJSON Point features at a time; existing sites are kept. Exports include all loaded sites. The viewer supports up to 1,000 sites and pauses edits when disconnected. Earlier browser-local records remain on their original domain; About this workspace offers an explicit import option there.

## Hosting

The GitHub repository serves the browser files from its main branch root. No build is needed for GitHub Pages. In this Sites source checkout, node scripts/build.mjs generates both a Sites Worker and the pages/ static folder. The GitHub Pages and Sites versions use the same Firestore database in downtrace-atlas.

The login screen hides the map until Firebase sign-in succeeds. Application code and public Firebase configuration can be downloaded, as with any static site; Firestore rules enforce access to the location data. The access code is not bundled. Firebase Authentication verifies it as the password of the single shared app identity; this is separate from the owner's Google account and CLI login. The shared identity has no personal mailbox and is not used to send email. Everyone using the code has the same edit permissions. Individual identity, attribution, and access revocation require individual accounts in a later version.

## Firebase administration

Firebase project: downtrace-atlas. Default Standard database, location nam5. Browser config: firebase-config.js. Shared app UID: downtrace-atlas-shared. Prototype Security Rules in firestore.rules allow only that UID to access /sites, reject extra fields and invalid values, preserve creation timestamps, and require incrementing revisions. All other paths are denied. Review and verify the rules before broadly sharing the app.

Use npx -y firebase-tools@latest deploy --only firestore:rules --project downtrace-atlas to deploy rule changes. No Cloud Functions or billing-plan change was needed. Update the shared account password through Firebase Authentication to rotate the access code; use token revocation if active sessions must be invalidated immediately.

The current Sites URL retains its existing private ChatGPT access boundary. GitHub Pages visitors use Firebase sign-in directly. Neither Google CLI credentials nor private service-account keys belong in either repository. Browser firebaseConfig contains public identifiers, not database access credentials.

## Map and validation

Leaflet, Firebase SDKs, and fonts load from public CDNs. Preserve OpenStreetMap attribution and follow https://operations.osmfoundation.org/policies/tiles/ . Select an appropriate tile provider before scaling traffic.

Validation covered unauthenticated denial, signed-in create/update/delete, live updates between two independent clients, invalid coordinates/notes/types/extra fields, immutable timestamps, and stale-edit protection. Browser UI verification supplements these database checks.

## Aidan's room — experimental 3D scene

Open Aidan's room in the 3D SCENES sidebar or use #aidans-room in the URL. Three.js loads only when the scene opens. First-person mode supports WASD/arrow keys, Q/E vertical movement, Shift for speed, pointer-lock mouse look, and drag-to-look fallback. On-screen movement buttons support touch. Orbit, Reset view, speed selection, and fullscreen are available. Movement has no physics or wall collisions.

The source is an instant-NGP OBJ with baked vertex colors, not a live NeRF renderer. Its coordinate axes were aligned to the capture cameras; the browser copy crops to the camera area, drops disconnected components smaller than 100 triangles, and clusters nearby vertices. Holes, coarse surfaces, and floaters remain from the input mesh. Originals are preserved. A later cleaner mesh or Gaussian splat can replace this preview. A demonstration pin in central Baltimore (39.2904, -76.6122) links to the scene through sceneId: aidans-room. This pin is deliberately unrelated to the scan's actual location. Site edits and GeoJSON exports/imports preserve this association.

The public GitHub asset is AES-256-GCM ciphertext. Its random key and IV are stored in /scenes/aidans-room, readable only by the shared atlas account; client writes to this record are denied. The viewer checks the decrypted GLB's SHA-256 before parsing. The room's raw GLB, NeRF snapshot, source photos, and decryption key are excluded from the public repository. Authorized viewers can still copy what they can view. Changing the shared login code does not revoke asset keys already downloaded; rotating this asset requires re-encryption and updating its metadata.
