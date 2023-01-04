import { ExtensionContext } from '@foxglove/studio'

import { initMapExtension } from 'panel'

export function activate(extensionContext: ExtensionContext): void {
    extensionContext.registerPanel({ name: 'GW-extension', initPanel: initMapExtension })
}
