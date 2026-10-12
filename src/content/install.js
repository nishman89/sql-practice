/* ---------- Install on your computer ----------
   INSTALL_OPTIONS are the tabs on the Install page. CMD() is a command or query with a Copy button. */
const CMD = s => `<pre class="cmd">${esc(s)}</pre>`;
const OS = (...names) => names.map(n => `<span class="os-tag">${n}</span>`).join('');
const MYSQL_SCRIPT = 'downloads/MySQLNorthwindDatabase.sql';
const MS_NORTHWIND = 'https://raw.githubusercontent.com/microsoft/sql-server-samples/master/samples/databases/northwind-pubs/instnwnd.sql';

const INSTALL_INTRO = `
<p class="lede">This site runs SQLite in your browser, so you don't need to install anything to do the lessons. To practise the way you will at work, with 🪟 SQL Server (T-SQL) or 🐬 MySQL, set one up on your own computer using one of the guides below.</p>
<h2 class="dot">Which one to choose</h2>
<table class="mini choose"><tr><th>If you…</th><th>Use</th></tr>
<tr><td>Aren't sure, or have a Mac</td><td><strong>🪟 SQL Server with Docker and VS Code.</strong> It's the same on Windows and Mac, and Northwind comes ready to use.</td></tr>
<tr><td>Are on Windows and want SQL Server without Docker</td><td><strong>🪟 SQL Server on Windows</strong>, with SQL Server Management Studio (SSMS)</td></tr>
<tr><td>Are on a course that uses MySQL</td><td><strong>🐬 MySQL on Windows</strong> or <strong>🐬 MySQL on Mac</strong>, with MySQL Workbench</td></tr>
<tr><td>Want MySQL without installing a server</td><td><strong>🐬 MySQL with Docker</strong></td></tr></table>
${TIP('Ask your trainer which database your course uses. The SQL you learn here works in both: the 🪶 🐬 🪟 notes in each lesson show where they differ.')}`;

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
</ol>`}
];
