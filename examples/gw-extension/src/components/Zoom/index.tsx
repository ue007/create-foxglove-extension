import React, { useEffect } from 'react'
import { useMap } from 'react-leaflet'

import { PanelExtensionContext } from '@foxglove/studio'

import { Config } from 'utils/types'

type ZoomProps = {
    context: PanelExtensionContext
    config: Config
}

export const Zoom: React.FC<ZoomProps> = ({ context, config }) => {
    const map = useMap()

    useEffect(() => {
        const zoomChange = () => {
            context.saveState({
                zoomLevel: map.getZoom(),
            })
        }

        map.on('zoom', zoomChange)
        return () => {
            map.off('zoom', zoomChange)
        }
    }, [context, map])

    useEffect(() => {
        context.saveState(config)
    }, [config])

    return null
}
