import { ExtensionContext } from "@foxglove/studio";
import { initExamplePanel } from "./ExamplePanel";

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerPanel({ name: "jeff-panel", initPanel: initExamplePanel });
}
