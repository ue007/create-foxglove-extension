import React, { useEffect, memo } from 'react'
import { LayersControl, useMap } from 'react-leaflet'

import { PanelExtensionContext } from '@foxglove/studio'

import { LayersControlEvent } from 'leaflet'

import { Config, CustomLayerType } from 'utils/types'

import { CustomLayer } from './CustomLayer'

const layers: CustomLayerType[] = [
    {
        attribution: '© <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        name: 'Схема',
    },
    {
        attribution:
            'Map data: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: © <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        name: 'Топо карта',
    },
    {
        attribution: '© <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        name: 'Спутник',
    },
]

type LayersProps = {
    context: PanelExtensionContext
    config: Config
}

export const LayersComponent: React.FC<LayersProps> = ({ context, config }) => {
    const map = useMap()

    useEffect(() => {
        const layerSelectHanlder = (layerTitle: LayersControlEvent) => {
            context.saveState({
                layer: layerTitle.name,
            })
        }

        map.on('baselayerchange', layerSelectHanlder)
        return () => {
            map.off('baselayerchange', layerSelectHanlder)
        }
    }, [context, map])

    useEffect(() => {
        context.saveState(config)
    }, [config])

    return (
        <LayersControl position="topright" collapsed={false}>
            {layers.map(layer => (
                <CustomLayer key={layer.name} layer={layer} currentLayerName={config.layer} />
            ))}
        </LayersControl>
    )
}

export const Layers = memo(LayersComponent)
