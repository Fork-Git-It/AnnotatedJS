import { Router } from "../../src";
import { keys } from "../../src/container/keys";
import {
  itAddsClassInstanceToContainerOnInit,
  itAddsClassToContainer,
  itAddsClassToContainerOnlyOnce,
  itCreatesClassInstanceInInitHook,
  itExpectsAValidContainer,
  itHasInitializationHook,
  itSetsInjectablesOnInstance,
  itThrowsErrorIfNotUsedOnAClass
} from "./utils/classDecorators";

describe("@Router", () => {
  const name = "Router";

  itExpectsAValidContainer(Router);
  itThrowsErrorIfNotUsedOnAClass(Router);
  itAddsClassToContainer(Router, keys.routerClass);
  itAddsClassToContainerOnlyOnce(Router);
  itHasInitializationHook(Router);
  itCreatesClassInstanceInInitHook(Router);
  itAddsClassInstanceToContainerOnInit(name, Router, keys.router);
  itSetsInjectablesOnInstance(Router);
});
