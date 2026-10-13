/* ---------- Install on your computer ----------
   INSTALL_OPTIONS are the tabs on the Install page. CMD() is a command or query with a Copy button. */
const CMD = s => `<pre class="cmd">${esc(s)}</pre>`;
const OS = (...names) => names.map(n => `<span class="os-tag">${n}</span>`).join('');
const MYSQL_SCRIPT = 'downloads/MySQLNorthwindDatabase.sql';
const SQLITE_DB = 'downloads/northwind.db';
const MS_NORTHWIND = 'https://raw.githubusercontent.com/microsoft/sql-server-samples/master/samples/databases/northwind-pubs/instnwnd.sql';

const INSTALL_INTRO = `
<p class="lede">This site runs SQLite in your browser, so you don't need to install anything to do the lessons. To practise on your own computer, set up 🪟 SQL Server (T-SQL), 🐬 MySQL or 🪶 SQLite using one of the guides below. You'll need one of them for the <a href="#/lesson/capstone">capstone project</a>.</p>
<h2 class="dot">Which one to choose</h2>
<p>There are six ways to set up, giving you one of three dialects. <strong>T-SQL is the dialect of Microsoft SQL Server</strong>, so to write T-SQL you install SQL Server; <strong>MySQL</strong> and <strong>SQLite</strong> are each both the dialect and the database. Check it works on your computer, then pick the dialect your course uses:</p>
<div class="tbl-wrap"><table class="mini choose-os"><tr><th>Option</th><th>Dialect</th><th>Windows</th><th>Mac</th><th>You write SQL in</th><th>Northwind</th></tr>
<tr><td><button type="button" class="linkish" data-install-tab="docker-sqlserver" data-testid="choose-docker-sqlserver">SQL Server with Docker</button></td><td>🪟 T-SQL</td><td class="os"><span class="os-yes" aria-label="Yes">✓</span></td><td class="os"><span class="os-yes" aria-label="Yes">✓</span><small>Apple chip: see the guide</small></td><td>VS Code</td><td>Ready to use</td></tr>
<tr><td><button type="button" class="linkish" data-install-tab="windows-sqlserver" data-testid="choose-windows-sqlserver">SQL Server on Windows</button></td><td>🪟 T-SQL</td><td class="os"><span class="os-yes" aria-label="Yes">✓</span></td><td class="os"><span class="os-no" aria-label="No">–</span></td><td>SSMS</td><td>Run a script</td></tr>
<tr><td><button type="button" class="linkish" data-install-tab="windows-mysql" data-testid="choose-windows-mysql">MySQL on Windows</button></td><td>🐬 MySQL</td><td class="os"><span class="os-yes" aria-label="Yes">✓</span></td><td class="os"><span class="os-no" aria-label="No">–</span></td><td>MySQL Workbench</td><td>Run a script</td></tr>
<tr><td><button type="button" class="linkish" data-install-tab="mac-mysql" data-testid="choose-mac-mysql">MySQL on Mac</button></td><td>🐬 MySQL</td><td class="os"><span class="os-no" aria-label="No">–</span></td><td class="os"><span class="os-yes" aria-label="Yes">✓</span></td><td>MySQL Workbench</td><td>Run a script</td></tr>
<tr><td><button type="button" class="linkish" data-install-tab="docker-mysql" data-testid="choose-docker-mysql">MySQL with Docker</button></td><td>🐬 MySQL</td><td class="os"><span class="os-yes" aria-label="Yes">✓</span></td><td class="os"><span class="os-yes" aria-label="Yes">✓</span></td><td>MySQL Workbench</td><td>Run a script</td></tr>
<tr><td><button type="button" class="linkish" data-install-tab="sqlite" data-testid="choose-sqlite">SQLite</button></td><td>🪶 SQLite</td><td class="os"><span class="os-yes" aria-label="Yes">✓</span></td><td class="os"><span class="os-yes" aria-label="Yes">✓</span></td><td>DB Browser for SQLite</td><td>Download the file</td></tr>
</table></div>
<div class="os-summary"><div><b>On Windows</b><span>Everything except the Mac-only MySQL guide. For T-SQL, <em>SQL Server with Docker</em> or <em>SQL Server on Windows</em>; for MySQL, <em>MySQL on Windows</em>.</span></div><div><b>On a Mac</b><span>SQL Server only runs in Docker, so for T-SQL use <em>SQL Server with Docker</em>. For MySQL, <em>MySQL on Mac</em> or <em>MySQL with Docker</em>.</span></div><div><b>Quickest of all</b><span><em>SQLite</em>: one small app and one file, on either system, using the same dialect and Northwind as this site.</span></div></div>
${TIP('<strong>Install the one your trainer has asked you to use</strong>: that\'s the flavour to focus on for your course and the capstone. The SQL you learn here works in all three, and the 🪶 🐬 🪟 notes in each lesson show where they differ.')}`;

const INSTALL_OPTIONS = [
  { id:'docker-sqlserver', tab:'🪟 SQL Server with Docker', os:OS('Windows','Mac'), title:'SQL Server with Docker and VS Code',
    summary:'Runs a ready-made SQL Server with Northwind already loaded, inside Docker. You write your queries in VS Code. The steps are the same on Windows and Mac.',
    body:`
<ol class="install-steps">
<li><h3>Install Docker Desktop</h3>
<p>Download Docker Desktop from <a href="https://www.docker.com/products/docker-desktop/" target="_blank" rel="noopener">docker.com</a> and run the installer. On a Mac, choose the version for your chip: <strong>Apple chip</strong> (M1 to M4) or <strong>Intel chip</strong>. To check, open the Apple menu and choose <strong>About This Mac</strong>.</p>
<p>Open Docker Desktop and wait until it says the engine is running. You don't need to sign in.</p>
<details class="trouble"><summary>Windows: Docker won't start</summary>
<ul class="plain"><li><strong>"Virtualization is disabled"</strong>: restart into your computer's firmware settings (Settings → System → Recovery → Advanced start-up → Restart now, then Troubleshoot → Advanced options → UEFI Firmware Settings). Find <em>Virtualization Technology</em> (sometimes <em>Intel VT-x</em> or <em>SVM</em>), set it to <strong>Enabled</strong>, then save and exit.</li>
<li><strong>"WSL needs updating"</strong>: open Command Prompt and run <code>wsl --update</code>, then restart Docker Desktop.</li>
<li><strong>"You are not allowed to use Docker"</strong>: your account isn't in the <em>docker-users</em> group. Open <em>Computer Management</em> as administrator → Local Users and Groups → Groups → docker-users → Add, type your username, then sign out and back in.</li></ul></details>
<details class="trouble"><summary>Mac with an Apple chip: one setting to check</summary>
<p>The Northwind image is built for Intel processors, so Docker runs it through Apple's Rosetta translation. In Docker Desktop, open Settings → General and make sure <strong>Use Rosetta for x86_64/amd64 emulation on Apple Silicon</strong> is ticked (it is by default in recent versions).</p></details></li>

<li><h3>Start the Northwind container</h3>
<p>Open a terminal (Command Prompt or PowerShell on Windows, Terminal on a Mac) and run:</p>
${CMD('docker run -d --name sql -p 1433:1433 kcornwall/sqlnorthwind')}
<p>The first time, Docker downloads the image (about 470 MB). On a Mac with an Apple chip, add <code>--platform linux/amd64</code>:</p>
${CMD('docker run -d --name sql --platform linux/amd64 -p 1433:1433 kcornwall/sqlnorthwind')}
<p>Check it's running. You should see a container called <strong>sql</strong> with the status <em>Up</em>:</p>
${CMD('docker ps')}
<table class="mini"><tr><th>Part of the command</th><th>What it does</th></tr>
<tr><td><code>docker run</code></td><td>Creates and starts a container from an image</td></tr>
<tr><td><code>-d</code></td><td>Runs it in the background</td></tr>
<tr><td><code>--name sql</code></td><td>Calls the container <em>sql</em>, so you can stop and start it by name</td></tr>
<tr><td><code>-p 1433:1433</code></td><td>Connects port 1433 on your computer (SQL Server's standard port) to the container</td></tr>
<tr><td><code>kcornwall/sqlnorthwind</code></td><td>The image: SQL Server with Northwind already installed</td></tr></table></li>

<li><h3>Install VS Code and the SQL Server extension</h3>
<p>Download <a href="https://code.visualstudio.com/" target="_blank" rel="noopener">Visual Studio Code</a> and install it. Then open the Extensions view (the four squares on the left), search for <strong>SQL Server (mssql)</strong> and install the one published by <strong>Microsoft</strong>.</p>
${TIP('Older guides use Azure Data Studio. Microsoft retired it in February 2026 and replaced it with this VS Code extension.')}</li>

<li><h3>Connect to Northwind</h3>
<p>Click the <strong>SQL Server</strong> icon that's appeared on the left, then <strong>Add Connection</strong>, and fill in:</p>
<table class="mini"><tr><th>Field</th><th>Enter</th></tr>
<tr><td>Server name</td><td><code>localhost,1433</code> (with a comma, not a colon)</td></tr>
<tr><td>Authentication type</td><td>SQL Login</td></tr>
<tr><td>User name</td><td><code>sa</code></td></tr>
<tr><td>Password</td><td><code>Passw0rd2018</code> (that's a zero in Passw0rd)</td></tr>
<tr><td>Trust server certificate</td><td><strong>Tick it.</strong> The container uses its own certificate, and without this the connection is refused.</td></tr>
<tr><td>Database</td><td><code>Northwind</code></td></tr></table>
<p>Press <strong>Connect</strong>. Northwind and its tables appear under the connection.</p></li>

<li><h3>Run your first query</h3>
<p>Right-click the connection and choose <strong>New Query</strong>. Type this, then press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>E</kbd> (<kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>E</kbd> on a Mac) to run it:</p>
${CMD('SELECT TOP 10 CompanyName, City, Country\nFROM Customers;')}
<p>You should see ten customers. This is 🪟 T-SQL, so remember <code>TOP</code> instead of <code>LIMIT</code>: the <a href="#/dialects">SQL dialects</a> page lists the other differences.</p></li>

<li><h3>Stopping, starting and starting again</h3>
<p>The container keeps running until you stop it or restart your computer. Your changes to Northwind are kept until you delete the container.</p>
${CMD('docker stop sql      # stop it\ndocker start sql     # start it again later\ndocker rm -f sql     # delete it, to get a fresh Northwind with docker run')}</li>
</ol>
<details class="trouble"><summary>The container stops straight away on a Mac with an Apple chip</summary>
<p>If <code>docker ps</code> doesn't list <strong>sql</strong>, the older SQL Server inside the Northwind image may not run under Rosetta on your Mac. Use Microsoft's current SQL Server image instead, then load Northwind yourself:</p>
${CMD('docker rm -f sql\ndocker run -d --name sql --platform linux/amd64 -p 1433:1433 -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=Passw0rd2018" mcr.microsoft.com/mssql/server:2022-latest')}
<p>Connect in VS Code as in step 4, but leave Database empty. Then download Microsoft's <a href="${MS_NORTHWIND}" target="_blank" rel="noopener">Northwind script (instnwnd.sql)</a> (if it opens in the browser, save the page as <code>instnwnd.sql</code>), open it in VS Code, and run it with <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>E</kbd>. Refresh the connection and the Northwind database appears.</p></details>`},

  { id:'windows-sqlserver', tab:'🪟 SQL Server on Windows', os:OS('Windows'), title:'SQL Server on Windows with SSMS',
    summary:'Installs SQL Server Express (free) directly on Windows, with SQL Server Management Studio to write queries.',
    body:`
<ol class="install-steps">
<li><h3>Install SQL Server Express</h3>
<p>Download <strong>SQL Server Express</strong> from <a href="https://www.microsoft.com/sql-server/sql-server-downloads" target="_blank" rel="noopener">Microsoft's SQL Server downloads page</a>. Run it, choose <strong>Basic</strong>, accept the licence and let it install. Make a note of the <strong>instance name</strong> at the end, usually <code>SQLEXPRESS</code>.</p></li>
<li><h3>Install SQL Server Management Studio (SSMS)</h3>
<p>Download <a href="https://learn.microsoft.com/ssms/install/install" target="_blank" rel="noopener">SSMS</a> and install it. It's a large download, so start it early.</p></li>
<li><h3>Connect</h3>
<p>Open SSMS. In the <strong>Connect to Server</strong> window enter:</p>
<table class="mini"><tr><th>Field</th><th>Enter</th></tr>
<tr><td>Server name</td><td><code>localhost\\SQLEXPRESS</code></td></tr>
<tr><td>Authentication</td><td>Windows Authentication</td></tr>
<tr><td>Trust server certificate</td><td>Tick it</td></tr></table></li>
<li><h3>Load Northwind</h3>
<p>Download Microsoft's <a href="${MS_NORTHWIND}" target="_blank" rel="noopener">Northwind script (instnwnd.sql)</a>. If it opens in the browser, press <kbd>Ctrl</kbd> + <kbd>S</kbd> and save it as <code>instnwnd.sql</code>. In SSMS choose <strong>File → Open → File</strong>, pick the script and press <strong>Execute</strong> (or <kbd>F5</kbd>). Right-click <strong>Databases</strong> and choose <strong>Refresh</strong>: Northwind appears.</p></li>
<li><h3>Run your first query</h3>
<p>Click <strong>New Query</strong> and run:</p>
${CMD('USE Northwind;\nSELECT TOP 10 CompanyName, City, Country\nFROM Customers;')}</li>
</ol>
${TIP('You can also connect SSMS to the Docker container from the first tab: use server name <code>localhost,1433</code>, SQL Server Authentication, login <code>sa</code> and password <code>Passw0rd2018</code>.')}`},

  { id:'windows-mysql', tab:'🐬 MySQL on Windows', os:OS('Windows'), title:'MySQL on Windows with MySQL Workbench',
    summary:'Installs MySQL Server and MySQL Workbench on Windows, then loads Northwind from a script.',
    body:`
<ol class="install-steps">
<li><h3>Install MySQL Server</h3>
<p>Go to <a href="https://dev.mysql.com/downloads/mysql/" target="_blank" rel="noopener">MySQL Community Server</a>, choose the <strong>8.4 LTS</strong> version and <strong>Microsoft Windows</strong>, and download the <strong>MSI Installer</strong>. On the next page click <em>No thanks, just start my download</em>.</p>
<p>Run it with the default options. At the end it opens <strong>MySQL Configurator</strong>: click <strong>Next</strong> through the screens, and when asked, choose a <strong>root password</strong>. Write it down: you'll need it to connect. Click <strong>Execute</strong> to apply the settings, then <strong>Finish</strong>.</p>
${TIP('Older guides use the all-in-one <em>MySQL Installer</em>. It\'s discontinued (MySQL 8.0 was its last version), so MySQL Server and Workbench are now separate downloads.')}</li>
<li><h3>Install MySQL Workbench</h3>
<p>Download <a href="https://dev.mysql.com/downloads/workbench/" target="_blank" rel="noopener">MySQL Workbench</a> for Windows and install it.</p></li>
<li><h3>Connect</h3>
<p>Open Workbench. Under <strong>MySQL Connections</strong> click <strong>Local instance</strong> (or click <strong>+</strong> and use host <code>127.0.0.1</code>, port <code>3306</code>, username <code>root</code>), then enter the root password you chose.</p></li>
<li><h3>Load Northwind</h3>
<p><a href="${MYSQL_SCRIPT}" download data-testid="download-mysql-northwind">Download the MySQL Northwind script</a>. In Workbench choose <strong>File → Open SQL Script</strong>, pick the file and click the <strong>lightning bolt</strong> to run it all. It takes a moment. Then click the refresh icon next to <strong>Schemas</strong> on the left: <strong>northwind</strong> appears.</p></li>
<li><h3>Run your first query</h3>
<p>Open a new query tab (<kbd>Ctrl</kbd> + <kbd>T</kbd>) and run:</p>
${CMD('USE northwind;\nSELECT CompanyName, City, Country\nFROM Customers\nLIMIT 10;')}</li>
</ol>`},

  { id:'mac-mysql', tab:'🐬 MySQL on Mac', os:OS('Mac'), title:'MySQL on Mac with MySQL Workbench',
    summary:'Installs MySQL Server and MySQL Workbench on a Mac, then loads Northwind from a script.',
    body:`
<ol class="install-steps">
<li><h3>Install MySQL Server</h3>
<p>Go to <a href="https://dev.mysql.com/downloads/mysql/" target="_blank" rel="noopener">MySQL Community Server</a>, choose the <strong>8.4 LTS</strong> version and <strong>macOS</strong>, and download the <strong>DMG Archive</strong> that matches your Mac: <strong>ARM</strong> for an Apple chip (M1 to M4), <strong>x86</strong> for Intel. Click <em>No thanks, just start my download</em>.</p>
<p>Open the DMG, run the installer package and follow the prompts. When asked, choose <strong>Use Strong Password Encryption</strong> and set a <strong>root password</strong>. Write it down: you'll need it to connect. MySQL then starts automatically; you can manage it in System Settings → MySQL.</p>
<details class="trouble"><summary>"Cannot be opened because it is from an unidentified developer"</summary>
<p>Right-click (or Control-click) the installer and choose <strong>Open</strong>, then confirm. Or go to System Settings → Privacy &amp; Security, scroll down and click <strong>Open Anyway</strong>.</p></details></li>
<li><h3>Install MySQL Workbench</h3>
<p>Download <a href="https://dev.mysql.com/downloads/workbench/" target="_blank" rel="noopener">MySQL Workbench</a> for macOS (again, ARM or x86 to match your Mac), open the DMG and drag Workbench into Applications.</p>
${TIP('If an older version of Workbench crashes when you run a query, remove it and install the latest version from the link above.')}</li>
<li><h3>Connect</h3>
<p>Open Workbench from Applications. Under <strong>MySQL Connections</strong> click <strong>Local instance</strong> (or click <strong>+</strong> and use host <code>127.0.0.1</code>, port <code>3306</code>, username <code>root</code>), then enter the root password you chose.</p></li>
<li><h3>Load Northwind</h3>
<p><a href="${MYSQL_SCRIPT}" download data-testid="download-mysql-northwind-mac">Download the MySQL Northwind script</a>. In Workbench choose <strong>File → Open SQL Script</strong>, pick the file and click the <strong>lightning bolt</strong> to run it all. Then click the refresh icon next to <strong>Schemas</strong>: <strong>northwind</strong> appears.</p></li>
<li><h3>Run your first query</h3>
<p>Open a new query tab (<kbd>Cmd</kbd> + <kbd>T</kbd>) and run:</p>
${CMD('USE northwind;\nSELECT CompanyName, City, Country\nFROM Customers\nLIMIT 10;')}</li>
</ol>`},

  { id:'docker-mysql', tab:'🐬 MySQL with Docker', os:OS('Windows','Mac'), title:'MySQL with Docker',
    summary:'Runs MySQL inside Docker instead of installing the server. Works natively on Windows and on both kinds of Mac.',
    body:`
<ol class="install-steps">
<li><h3>Install Docker Desktop</h3>
<p>Follow step 1 of the <strong>🪟 SQL Server with Docker</strong> tab.</p></li>
<li><h3>Start a MySQL container</h3>
${CMD('docker run -d --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=Passw0rd2018 mysql:8.4')}
<p>Check it's running with <code>docker ps</code>. The root password is <code>Passw0rd2018</code>.</p></li>
<li><h3>Install MySQL Workbench and connect</h3>
<p>Install <a href="https://dev.mysql.com/downloads/workbench/" target="_blank" rel="noopener">MySQL Workbench</a>. Click <strong>+</strong> next to <strong>MySQL Connections</strong>, use host <code>127.0.0.1</code>, port <code>3306</code> and username <code>root</code>, then click <strong>Test Connection</strong> and enter the password.</p></li>
<li><h3>Load Northwind and run a query</h3>
<p><a href="${MYSQL_SCRIPT}" download data-testid="download-mysql-northwind-docker">Download the MySQL Northwind script</a>, open it in Workbench (<strong>File → Open SQL Script</strong>) and run it with the lightning bolt. Then:</p>
${CMD('USE northwind;\nSELECT CompanyName, City, Country\nFROM Customers\nLIMIT 10;')}</li>
<li><h3>Stopping and starting</h3>
${CMD('docker stop mysql\ndocker start mysql')}</li>
</ol>`},
  { id:'sqlite', tab:'🪶 SQLite', os:OS('Windows','Mac'), title:'SQLite with DB Browser for SQLite',
    summary:'The same dialect and the same Northwind database as this site, on your own computer. There\'s no server to install: a SQLite database is a single file.',
    body:`
<ol class="install-steps">
<li><h3>Download Northwind</h3>
<p><a href="${SQLITE_DB}" download data-testid="download-sqlite-northwind">Download northwind.db</a>. It's the exact database this site uses, so every query from the lessons works on it. Save it somewhere easy to find, such as your Documents folder.</p></li>
<li><h3>Install DB Browser for SQLite</h3>
<p>Download <a href="https://sqlitebrowser.org/dl/" target="_blank" rel="noopener">DB Browser for SQLite</a>, a free app for opening SQLite files and running queries, and install it. On Windows, choose the standard installer. On a Mac, choose the download that matches your chip (Apple Silicon or Intel) and drag the app into Applications.</p>
<details class="trouble"><summary>Mac: "cannot be opened because it is from an unidentified developer"</summary>
<p>Right-click (or Control-click) the app and choose <strong>Open</strong>, then confirm. Or go to System Settings → Privacy &amp; Security and click <strong>Open Anyway</strong>.</p></details></li>
<li><h3>Open the database</h3>
<p>Open DB Browser for SQLite, click <strong>Open Database</strong> and choose <code>northwind.db</code>. The <strong>Database Structure</strong> tab lists the tables, and <strong>Browse Data</strong> shows what's in them.</p></li>
<li><h3>Run your first query</h3>
<p>Go to the <strong>Execute SQL</strong> tab, type this and press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> (<kbd>Cmd</kbd> + <kbd>Enter</kbd> on a Mac), or the ▶ button:</p>
${CMD('SELECT CompanyName, City, Country\nFROM Customers\nLIMIT 10;')}
${TIP('DB Browser keeps your changes (from <code>INSERT</code>, <code>UPDATE</code>, <code>CREATE TABLE</code> and so on) waiting until you click <strong>Write Changes</strong>. Close without writing them and they\'re undone, which is handy when you\'re practising.')}</li>
<li><h3>Make sure foreign keys are switched on</h3>
<p>SQLite only checks foreign keys when they're switched on. DB Browser normally does this for you; to check, run:</p>
${CMD('PRAGMA foreign_keys;')}
<p>If it returns <code>0</code>, run <code>PRAGMA foreign_keys = ON;</code>, or tick <strong>Foreign keys</strong> in Preferences → Database.</p></li>
</ol>
<details class="trouble"><summary>Prefer the command line?</summary>
<p>Macs come with SQLite already: open Terminal, go to the folder with the file, and run:</p>
${CMD('sqlite3 northwind.db')}
<p>On Windows, download the <em>sqlite-tools</em> zip for Windows from <a href="https://www.sqlite.org/download.html" target="_blank" rel="noopener">sqlite.org</a>, unzip it, and run <code>sqlite3.exe northwind.db</code> from that folder. Type <code>.tables</code> to list the tables and <code>.quit</code> to leave.</p></details>
<details class="trouble"><summary>Prefer VS Code?</summary>
<p>Install the <strong>SQLite</strong> extension (by alexcvzz) from the Extensions view. Then open the Command Palette (<kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>), run <strong>SQLite: Open Database</strong>, pick <code>northwind.db</code>, and use <strong>SQLite: New Query</strong> to write and run SQL.</p></details>`}
];
