import { container as defaultContainer } from "./container/container";
import { keys } from "./container/keys";
import { getGlobal } from "./container/utils/getGlobal";
import { isInitializing } from "./container/utils/isInitializing";
import { setGlobal } from "./container/utils/setGlobal";
import { Class } from "./decorators/types";
import { AnnotatedCacheStorage } from "./interfaces/annotatedCacheStorage";
import { AnnotatedRouter } from "./interfaces/annotatedRouter";
import { RequestHandler } from "./interfaces/types";

/**
 * Initialize the framework
 *
 * @remarks
 *
 * AnnotatedJS starts with the `initialize()` method
 *
 * This method will return back a request handler. The request handler can then be used in different runtimes such as a service worker, or node
 *
 * @example
 * ```ts
 * // service worker entrypoint
 *
 * import { initialize } from "@fork-git-it/annotatedjs";
 * // import annotated classes
 *
 * const handleRequest = initialize();
 * const eventHandler = (evt: Event) => {
 *   evt.respondWith(handleRequest(evt.request));
 * };
 * addEventListener("fetch", eventHandler);
 * ```
 *
 * ```ts
 * // node entrypoint
 *
 * import { initialize } from "@fork-git-it/annotatedjs";
 * import { createServerAdapter } from "@whatwg-node/server";
 * import { createServer } from "http";
 * import "isomorphic-fetch";
 * // import annotated classes
 *
 * const handleRequest = initialize();
 * const ittyServer = createServerAdapter(handleRequest);
 * const httpServer = createServer(ittyServer);
 * httpServer.listen(3001);
 * console.log("listening at https://localhost:3001");
 * ```
 *
 *
 * @param container - Object that stores injectables
 */
export function initialize(container = defaultContainer): RequestHandler {
  if (isInitializing(container)) {
    throw new Error("container has already been initialized");
  }

  setGlobal(container, keys.initializing, true);
  instantiateClasses(container, keys.configClasses);
  instantiateClasses(container, keys.datastoreClasses);
  instantiateClasses(container, keys.serviceClasses);

  const RouterClass: Class<AnnotatedRouter> = getGlobal(
    container,
    keys.routerClass,
  );

  if (typeof RouterClass !== "function") {
    throw new Error("Router class is not in the container");
  }

  new RouterClass();

  const CacheStorageClass: Class<AnnotatedCacheStorage> = getGlobal(
    container,
    keys.cacheStorageClass,
  );

  if (typeof CacheStorageClass === "function") {
    new CacheStorageClass();
  }

  instantiateClasses(container, keys.controllerClasses);

  const router: AnnotatedRouter = getGlobal(container, keys.router);
  return router.handle.bind(router);
}

const instantiateClasses = (
  container: Record<string, Array<Class<unknown>>>,
  key: string,
) => {
  const containerClasses = getGlobal(container, key);

  if (Array.isArray(containerClasses)) {
    for (const containerClass of containerClasses) {
      new containerClass();
    }
  }
};
