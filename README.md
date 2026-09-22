# Customizable Dashboard

React, TypeScript, and Vite dashboard. Dashboard layouts are stored in each browser's local storage.

## Local development

Use Node.js >=22.12 (Node 24 LTS is suitable; this computer currently uses Node 25.9).

```bash
npm ci
npm run dev
```

`npm run build` creates `dist/`; `npm run lint` checks the source.

## Automatic deployment on this computer

This follows the other projects on the host: a repository-specific GitHub Actions runner updates the existing clone and restarts a systemd service. The dashboard listens on **port 3002** using `serve`, a static web server.

Defaults are specific to this computer:

| Setting | Value |
| --- | --- |
| Repository | `bwenzinger/customizable-dashboard` |
| Deployment branch | `main` |
| Application clone | `/home/bwenzinger/dev/customizable-dashboard` |
| Linux user | `bwenzinger` |
| Application service | `customizable-dashboard.service` |
| New runner directory | `/home/bwenzinger/actions-runner-customizable-dashboard` |
| Runner name | `customizable-dashboard-server` |
| Custom runner label | `customizable-dashboard` |
| Address | `http://localhost:3002` or `http://<this-computer-LAN-IP>:3002` |

### 1. Commit and push these files

Run in a terminal on this computer:

```bash
cd /home/bwenzinger/dev/customizable-dashboard
git add .github/workflows/deploy-home-server.yml .gitignore .prettierignore README.md package.json package-lock.json eslint.config.js start.sh deploy scripts
git commit -m "Add home-server auto deployment"
git push origin main
```

The initial workflow may wait for a runner until step 3 is finished. If `main` is protected, merge these changes through a pull request and update this local clone to `main` before continuing.

### 2. Install the application service once

Run as `bwenzinger` (do not run the whole script with sudo):

```bash
cd /home/bwenzinger/dev/customizable-dashboard
bash scripts/install-service.sh
```

The script installs dependencies, builds the dashboard, records the current Node installation's directory in the service, and uses sudo to install and enable the service. It also installs a sudoers rule allowing only `systemctl restart customizable-dashboard.service` without a password, so Actions can restart this app. Enter your normal sudo password if requested.

Check the application:

```bash
systemctl status customizable-dashboard.service --no-pager
curl --fail http://127.0.0.1:3002/__deployment.txt
```

Open `http://localhost:3002`. Port 3002 must be available; the server deliberately fails instead of silently picking a different port. For another device on your network, use this computer's LAN IP; any existing firewall must allow that access. A public domain or HTTPS proxy is a separate setup.

### 3. Register a new GitHub Actions runner

The runners in `~/actions-runner`, `~/actions-runner-dogs`, and `~/actions-runner-schedule-maker` belong to other repositories. Leave those registrations in place.

1. Open [this repository's runner settings](https://github.com/bwenzinger/customizable-dashboard/settings/actions/runners).
2. Click **New self-hosted runner**. Select **Linux**, architecture **x64**.
3. On this computer, create a separate directory:

   ```bash
   mkdir -p /home/bwenzinger/actions-runner-customizable-dashboard
   cd /home/bwenzinger/actions-runner-customizable-dashboard
   ```

4. Run GitHub's displayed **download**, **checksum verification**, and **extract** commands in that directory. Skip its sample `mkdir actions-runner && cd actions-runner` command because you already created a project-specific directory. Use the version GitHub currently displays.
5. Run the displayed `./config.sh --url ... --token ...` command, appending these options. Replace `TOKEN_FROM_GITHUB` with the temporary registration token from that page:

   ```bash
   ./config.sh \
     --url https://github.com/bwenzinger/customizable-dashboard \
     --token TOKEN_FROM_GITHUB \
     --name customizable-dashboard-server \
     --labels customizable-dashboard \
     --work _work \
     --unattended
   ```

6. Install and start the runner as a boot-time service:

   ```bash
   sudo ./svc.sh install bwenzinger
   sudo ./svc.sh start
   sudo ./svc.sh status
   ```

7. Refresh GitHub's runner settings. Confirm this runner is **Idle** (or **Active** if the first deployment has started) with labels `self-hosted`, `Linux`, `X64`, and `customizable-dashboard`. GitHub assigns the first three automatically.

GitHub documents [adding a runner](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/add-runners) and [installing its service](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/configure-the-application).

### 4. Start the first deployment in GitHub

1. Open [the repository's Actions tab](https://github.com/bwenzinger/customizable-dashboard/actions).
2. Select **Deploy Home Server**.
3. Click **Run workflow**, choose branch **main**, then click the green **Run workflow** button.
4. Open the run and its **deploy** job. The final step should report `dashboard is responding on port 3002`.

The **Run workflow** button appears after the workflow file is on the default branch. If GitHub Actions is disabled, enable it under **Settings → Actions → General**. See [GitHub's manual workflow instructions](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

No custom repository secrets or variables are needed for this setup. The existing application clone must be able to run `git fetch origin main` as `bwenzinger` without prompting. For a private repository, configure this user's Git credentials or a read-only deploy key separately; the checkout action's temporary token is not used by the application clone.

Afterward, every push or merged pull request to `main` deploys automatically. Both the runner and application restart on reboot.

### Deployment behavior and troubleshooting

- The workflow runs only for pushes to `main` and manual runs on `main`. It targets the project's custom runner label.
- Deployments are serialized and a new push does not cancel an active deployment. Each run deploys the newest `origin/main` when it fetches, so an older queued run cannot revert a newer deployment.
- Uncommitted changes, the wrong local branch, divergent history, and unpushed local commits block deployment. Commit/push changes before running it. This clone is both your working copy and deployment clone, as in your other projects.
- Builds are written to `.deploy/releases/`. Only a successful build switches `.deploy/current`. Failed installation/builds leave the previously published static files in place.
- A restart is followed by an HTTP check for the deployed Git commit at `/__deployment.txt`. If restart or verification fails, the script restores `.deploy/previous` when available and attempts another restart. This rolls back static files, not Git history or installed dependencies.
- Release directories are retained. Old directories under `.deploy/releases/` may be removed when no deploy is running, keeping the directories referenced by `.deploy/current` and `.deploy/previous`.
- If Node is moved or uninstalled, rerun the service installer and refresh the runner's captured Node PATH (run `./env.sh` in the runner directory, then restart its service).

Useful commands:

```bash
# Read recent application logs.
journalctl -u customizable-dashboard.service -n 100 --no-pager

# Run the same deployment manually after committing/pushing changes.
cd /home/bwenzinger/dev/customizable-dashboard
bash scripts/deploy-from-git.sh

# Check runner service status.
cd /home/bwenzinger/actions-runner-customizable-dashboard
sudo ./svc.sh status
```
