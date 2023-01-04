import React, { useState, useEffect } from 'react'
import { MapContainer, ScaleControl } from 'react-leaflet'

import { PanelExtensionContext, MessageEvent } from '@foxglove/studio'

import { Layers } from 'components/Layers'
import { Zoom } from 'components/Zoom'
import { CircleMarker } from 'components/CircleMarker'

import { Point, NavSatFixMsg, Config } from 'utils/types'
import { getSpeedData } from 'utils/helpers'

type MapProps = {
    centerMap: Point
    messages: MessageEvent<NavSatFixMsg>[]
    context: PanelExtensionContext
}

export const Map: React.FC<MapProps> = ({
    messages,
    centerMap = { lat: 55.7522, lon: 37.6156 },
    context,
}) => {
    const [config] = useState<Config>(() => {
        const initialConfig = context.initialState as Partial<Config>

        initialConfig.disabledTopics = initialConfig.disabledTopics ?? []
        initialConfig.layer = initialConfig.layer ?? 'Схема'
        initialConfig.zoomLevel = initialConfig.zoomLevel ?? 7

        return initialConfig as Config
    })
    const [speedData, setSpeedData] = useState<number[]>([])

    useEffect(() => {
        setSpeedData(getSpeedData(messages))
    }, [messages])

    return (
        <MapContainer
            center={[centerMap.lat, centerMap.lon]}
            zoom={config.zoomLevel}
            scrollWheelZoom={true}
            zoomControl={true}
        >
            <Layers context={context} config={config} />

            {messages?.map((item, index) => {
                let speed = speedData[index]

                if (typeof speed === 'undefined') {
                    speed = -1
                }

                return (
                    <CircleMarker
                        key={item.message.latitude}
                        message={item}
                        context={context}
                        speed={speed}
                    />
                )
            })}

            <Zoom context={context} config={config} />

            <ScaleControl />
        </MapContainer>
    )
}
