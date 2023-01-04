import React, { memo } from 'react'
import { LayersControl, TileLayer } from 'react-leaflet'

import { CustomLayerType } from 'utils/types'

type CustomLayerProps = {
    layer: CustomLayerType
    currentLayerName: string
}

const CustomLayerComponent: React.FC<CustomLayerProps> = ({ layer, currentLayerName }) => {
    return (
        <LayersControl.BaseLayer
            checked={currentLayerName === layer.name ? true : false}
            name={layer.name}
        >
            <TileLayer
                attribution={layer.attribution}
                url={layer.url}
                maxNativeZoom={18}
                maxZoom={20}
            />
        </LayersControl.BaseLayer>
    )
}

export const CustomLayer = memo(CustomLayerComponent)
