## 🛡️ License and Usage

This project is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0)**.

---

### Important Clarification for Artists and Creators:

The CC BY-NC-SA license applies **only to the player's source code** (the HTML, CSS, and JavaScript files that make it run).

It **does not apply to the content you create**, such as your music, cover art, lyrics, or the `.jsonld` graph file that structures your narrative. 
You retain full ownership of your art and are free to license or sell it however you wish.

You can freely use this player as a non-commercial tool to display and distribute your commercial or non-commercial artwork.

This means you are free to:
- **Share** — copy and redistribute the material in any medium or format.
- **Adapt** — remix, transform, and build upon the material.

Under the following terms:
- **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
- **NonCommercial** — You may not use the material for commercial purposes.
- **ShareAlike** — If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.

ℹ️ This restriction exists to protect the narrative format and prevent misuse or exploitation of the idea and system.

### A Note on Attribution (How to give credit)

To comply with the license, you must provide a visible credit. We've made this as painless as possible.

**Required Attribution:**
You only need to include the following text somewhere visible (e.g., in the footer of your page or on an "About" page):

> **AVN Player by Nftxv, used under CC BY-NC-SA 4.0**

**Optional (but appreciated):**
If you wish, you can also link to the project's official website or repository. This helps other creators discover the tool, but it is **not required**.

*Example of a simple, perfect credit:*
`My Album (powered by AVN Player by Nftxv)`

---

For the full license text, please see the LICENSE.md file or https://creativecommons.org/licenses/by-nc-sa/4.0/

---


⚠️ A Note on Importing Custom Graphs
For security reasons, the ability to import local .jsonld files via the user interface has been disabled by default in the public version of this player. This is a deliberate measure to prevent users from inadvertently loading graphs that contain malicious links (e.g., to phishing sites, IP loggers, or unwanted content).
Recommended Methods for Local Development

If you are a developer and wish to load your own graph, please use one of the following safe methods:

* **1. Direct Replacement (Easiest Method):**
Replace the contents of the public/data/default.jsonld file with your own graph data.

* **2. Modify the Source Code:**
Place your graph file (e.g., my-graph.jsonld) inside the public/data/ directory.
Open src/app.js and change the file path in the init() method:

// In src/app.js
await this.graphData.load('data/my-graph.jsonld');


🚫 Re-enabling the UI Import Feature (Advanced / At Your Own Risk)
If you understand the security implications and want to re-enable the "Import" button, you can do so. This is only recommended for local development or for a private, non-public version of the application where you trust all users and the files they might load.
You must perform two steps:

* **1. Make the button visible:**
In public/index.html, remove style="display: none;" from the <label> and <input> elements for the file import.

<!-- In public/index.html -->

<!-- BEFORE -->
<label for="importFile" class="button-like" style="display: none;">Import</label>
<input type="file" id="importFile" accept=".json,.jsonld" style="display: none;">

<!-- AFTER -->
<label for="importFile" class="button-like">Import</label>
<input type="file" id="importFile" accept=".json,.jsonld" style="display: none;">

* **2. Activate the functionality:**
In src/app.js, find the setupEventListeners method and uncomment the line that handles the import logic.

// Uncomment this line:
document.getElementById('importFile').addEventListener('change', (e) => this.editorTools.importGraph(e));

By re-enabling this feature, you assume all responsibility for the content you and your users load into the application.



AVN_PLAYER_PROJECT/
├── public/
│   ├── index.html
│   ├── style.css
│   └── data/
│       └── default.jsonld
├── src/
│   ├── app.js
│   └── modules/
│       ├── Player.js
│       ├── Renderer.js
│       ├── Navigation.js
│       └── ...
├── LICENSE.md
└── README.md