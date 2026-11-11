# Runbook: DiskSpaceLow

**Severity:** warning (posted to #alerts-warning)
**Fires when:** less than 10% of the node's /var disk is free, for 5 minutes.

## What it means
/var holds container images, container logs, and the Loki and Tempo data. When it fills, logs and traces stop being written, and Kubernetes starts removing pods (eviction).

## Check
1. Open **Infrastructure (Node)**, panel **Disk free on /var**. How fast is it falling?
2. See what is using space, inside the kind node:
   `docker exec observability-control-plane du -sh /var/lib/containerd /var/log/pods /var/local-path-provisioner`

## Common causes and fixes
- **Old container images.** `docker exec observability-control-plane crictl rmi --prune`
- **Large container logs.** Find the noisy pod in **Application Logs** (log volume panel) and reduce its logging.
- **Loki or Tempo data.** Both keep 48 hours on 2 GiB volumes. Lower the retention, or increase the volume size, in their values files.
- **The host disk is full.** On this setup, /var lives on WSL's virtual disk, stored on the Windows C: drive. Check free space on C:.

## Confirm it is fixed
The disk panel rises back above 10%, and Slack posts **[RESOLVED] DiskSpaceLow**.

## Escalate
If free space keeps falling after cleanup, escalate before it reaches 5%.
