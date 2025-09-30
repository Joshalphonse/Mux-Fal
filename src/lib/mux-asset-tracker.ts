export interface SimpleAssetEvent {
  type: 'video.asset.ready' | 'video.asset.errored';
  data: {
    id: string;
    status?: string;
    playback_ids?: Array<{ id: string }>;
    [key: string]: unknown;
  };
}

interface PendingAsset {
  resolve: (event: SimpleAssetEvent) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

const muxGlobal = globalThis as unknown as {
  __muxAssetWaiters?: Map<string, PendingAsset>;
  __muxAssetEvents?: Map<string, SimpleAssetEvent>;
};

const waiters = muxGlobal.__muxAssetWaiters ?? (muxGlobal.__muxAssetWaiters = new Map<string, PendingAsset>());
const events = muxGlobal.__muxAssetEvents ?? (muxGlobal.__muxAssetEvents = new Map<string, SimpleAssetEvent>());

export function waitForAssetReady(assetId: string, timeoutMs = 120_000) {
  if (!assetId) {
    return Promise.reject(new Error('Cannot wait for asset readiness without an asset id.'));
  }

  const existingEvent = events.get(assetId);
  if (existingEvent) {
    events.delete(assetId);
    if (existingEvent.type === 'video.asset.ready') {
      return Promise.resolve(existingEvent);
    }

    return Promise.reject(new Error(`Mux asset ${assetId} failed while processing.`));
  }

  return new Promise<SimpleAssetEvent>((resolve, reject) => {
    const timeout = setTimeout(() => {
      waiters.delete(assetId);
      reject(new Error(`Timed out after ${timeoutMs}ms waiting for Mux asset ${assetId} to become ready.`));
    }, timeoutMs);

    waiters.set(assetId, {
      resolve: (event) => {
        clearTimeout(timeout);
        waiters.delete(assetId);

        if (event.type === 'video.asset.ready') {
          resolve(event);
        } else {
          reject(new Error(`Mux asset ${assetId} failed while processing.`));
        }
      },
      reject: (error) => {
        clearTimeout(timeout);
        waiters.delete(assetId);
        reject(error);
      },
      timeout,
    });
  });
}

export function resolveAssetEvent(event: SimpleAssetEvent) {
  const assetId = event?.data?.id;
  if (!assetId) {
    return;
  }

  const waiter = waiters.get(assetId);
  if (waiter) {
    waiter.resolve(event);
    return;
  }

  events.set(assetId, event);
}

export function rejectAsset(assetId: string, error: Error) {
  const waiter = waiters.get(assetId);
  if (waiter) {
    waiter.reject(error);
    return;
  }

  events.set(assetId, {
    type: 'video.asset.errored',
    data: { id: assetId, status: 'errored' },
  });
}
