import normalizePath from "normalize-path";
import { keys } from "../../container/keys";
import { getGlobal } from "../../container/utils/getGlobal";
import type { AnnotatedRouter } from "../../interfaces/annotatedRouter";
import { setInjectables } from "../inject/setInjectables";
import type { Class, HttpMethodMetadata } from "../types";
import { getMetadata } from "../utils/getMetadata";
import { getMetadataProperty } from "../utils/getMetadataProperty";
import { MetadataProperties } from "./metadataProperties";

export function getInitializer<T extends Class<object>>(
  annotationName: string,
  context: ClassDecoratorContext<T>,
  container: Record<string, unknown>,
  controllerPath: string,
): (this: T) => void {
  return function () {
    const controller = new this();

    const metadata = getMetadata(annotationName, context);
    setInjectables(container, controller, metadata);

    const methods = <Array<HttpMethodMetadata>>(
      getMetadataProperty(metadata, MetadataProperties.methods, [])
    );

    let router = getGlobal(
      container as Record<string, AnnotatedRouter>,
      keys.router,
    );

    for (const { path: methodPath, getHandler, httpMethod } of methods) {
      const routerMethod = <Exclude<keyof AnnotatedRouter, "handle">>(
        httpMethod.toLowerCase()
      );

      if (typeof router[routerMethod] !== "function") {
        throw new Error(
          `Router is improperly configured. It should include ${routerMethod} method`,
        );
      }

      router = router[routerMethod](
        normalizePath("/" + [controllerPath, methodPath].join("/"), true),
        getHandler(container, controller),
      );
    }
  };
}
