import React, { StrictMode, useState, useMemo, useEffect, useLayoutEffect } from 'react'
import ReactDOM from 'react-dom'

import { PanelExtensionContext, RenderState, Topic, MessageEvent } from '@foxglove/studio'

import { partition } from 'lodash'

import { Map } from 'components/Map'

import { MapPanelMessage, Point, FoxgloveMessages } from 'utils/types'

import 'leaflet/dist/leaflet.css'
import './index.sass'

const isGeoJSONMessage = (
    message: MessageEvent<unknown>,
): message is MessageEvent<FoxgloveMessages['foxglove.GeoJSON']> => {
    return (
        typeof message.message === 'object' &&
        message.message != undefined &&
        'geojson' in message.message
    )
}

type PanelProps = {
    context: PanelExtensionContext
    defaultCenter?: Point
}

export const Panel: React.FC<PanelProps> = ({ context, defaultCenter }) => {
    const [topics, setTopics] = React.useState<readonly Topic[] | undefined>()
    const [allMapMessages, setAllMapMessages] = useState<MapPanelMessage[]>([])

    const [_allGeoMessages, allNavMessages] = useMemo(
        () => partition(allMapMessages, isGeoJSONMessage),
        [allMapMessages],
    )

    const [messages, setMessages] = React.useState<readonly MessageEvent<unknown>[] | undefined>()
    const [center, setCenter] = useState<Point>()
    const [renderDone, setRenderDone] = React.useState<(() => void) | undefined>()

    useEffect(() => {
        if (defaultCenter) setCenter(defaultCenter)
    }, [defaultCenter])

    useEffect(() => {
        if (!allNavMessages[0]) return

        if (!allNavMessages[0]?.message?.latitude || allNavMessages[0]?.message?.longitude) {
            setCenter({ lat: 55.7522, lon: 37.6156 })
        }

        setCenter({
            lat: allNavMessages[0].message.latitude,
            lon: allNavMessages[0].message.longitude,
        })
    }, [allNavMessages])

    useLayoutEffect(() => {
        context.onRender = (renderState: RenderState, done) => {
            setRenderDone(() => done)

            setMessages(renderState.currentFrame)

            if (renderState.topics) {
                setTopics(renderState.topics)
            }

            if (renderState.allFrames) {
                setAllMapMessages(renderState.allFrames as MapPanelMessage[])
            }
        }

        context.watch('currentFrame')
        context.watch('topics')
        context.watch('allFrames')
        context.watch('previewTime')

        context.subscribe(['/gps'])
    }, [context, messages, topics])

    useEffect(() => {
        renderDone?.()
    }, [renderDone])

    return center ? (
        <Map context={context} centerMap={center} messages={allNavMessages} />
    ) : (
        <div className="title">
            <h2>Ожидание данных из датчика GPS...</h2>
        </div>
    )
}

export function initMapExtension(context: PanelExtensionContext): void {
    ReactDOM.render(
        <StrictMode>
            <Panel context={context} />
        </StrictMode>,
        context.panelElement,
    )
}
