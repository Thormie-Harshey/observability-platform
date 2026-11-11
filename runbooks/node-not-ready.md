# Runbook: NodeNotReady

**Severity:** critical (posted to #all-alerts-critical)
**Fires when:** a node has not reported Ready for 2 minutes.

## What it means
Kubernetes cannot trust the node. No new pods start there, and existing pods may be moved or stop.

## Check
1. `kubectl get nodes`
2. `kubectl describe node <node>`, under **Conditions**, look for `MemoryPressure`, `DiskPressure` or `PIDPressure` set to True, and read the **Events** at the bottom.
3. On this kind setup, the node is a Docker container. Check it is running: `docker ps --filter name=observability-control-plane`

## Common causes and fixes
- **Memory pressure.** Free memory on the host (on this setup, close heavy apps on the laptop) or lower pod memory limits.
- **Disk pressure.** Follow the DiskSpaceLow runbook.
- **The node container stopped.** `docker start observability-control-plane`, then wait for `kubectl get nodes` to show Ready.

## Known limitation
This cluster has one node, and Prometheus runs on it. If the node fails completely, this alert may never be sent. In production, the always-firing **Watchdog** alert would go to an outside service that pages someone when it stops arriving (a "dead man's switch").

## Confirm it is fixed
`kubectl get nodes` shows Ready, and Slack posts **[RESOLVED] NodeNotReady**.

## Escalate
Immediately, if the node does not recover within 10 minutes.
