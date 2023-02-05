import { Handler, RouteContext } from "@worker-tools/router";

import getMethods from "../../utils/getMethods.js";

export default (key: string) =>
  (path = "/") =>
    ((target, property) => {
      const methods = getMethods(key, target);
      methods.push({ path, property });
      Reflect.defineMetadata(key, methods, target);
    }) as (
      target: Object,
      propertyKey: string | symbol,
      descriptor: TypedPropertyDescriptor<Handler<RouteContext>>
    ) => TypedPropertyDescriptor<Handler<RouteContext>> | void;
