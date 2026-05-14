import {
  APP_VERSION,
  fetchUpstreamVersion,
  isNewer,
} from "@/lib/app-version";

export async function Footer() {
  const upstream = await fetchUpstreamVersion();
  const updateAvailable =
    upstream.latest !== null && isNewer(APP_VERSION, upstream.latest);

  return (
    <footer className="mt-auto border-t bg-muted/30 py-3 text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-1 px-6 text-center">
        <div className="flex items-center gap-2">
          <span>
            MerchShop <span className="font-mono">v{APP_VERSION}</span>
          </span>
          {updateAvailable && upstream.latest && (
            <>
              <span aria-hidden>·</span>
              {upstream.url ? (
                <a
                  href={upstream.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-amber-700 underline-offset-2 hover:underline dark:text-amber-400"
                  title={`GitHub-Release: v${upstream.latest}`}
                >
                  Update verfügbar (v{upstream.latest})
                </a>
              ) : (
                <span className="font-medium text-amber-700 dark:text-amber-400">
                  Update verfügbar (v{upstream.latest})
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
