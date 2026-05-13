export function ReinitSetupButton() {
  // Re-opening the wizard requires ALLOW_SETUP_REINIT=true on the
  // container env + a restart. We intentionally do NOT expose a one-
  // click toggle here — that would let a compromised admin session re-
  // run the wizard (and rotate S3/SMTP credentials) without any out-of-
  // band check.
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
      Setze <code className="font-mono">ALLOW_SETUP_REINIT=true</code> in der
      Container-Umgebung und starte den App-Container neu:
      <pre className="mt-2 overflow-x-auto rounded bg-white/60 p-2 dark:bg-black/30">
        docker compose -f docker-compose.prod.yml up -d --force-recreate app
      </pre>
      Danach ist <code className="font-mono">/setup</code> wieder erreichbar.
      Setze die Variable anschließend wieder auf <code className="font-mono">false</code>.
    </div>
  );
}
