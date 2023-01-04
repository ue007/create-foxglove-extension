import React, { useCallback, useMemo } from 'react'
import { Popup, CircleMarker as LeafletCircleMarker } from 'react-leaflet'

import { toSec } from '@foxglove/rostime'
import { PanelExtensionContext, MessageEvent } from '@foxglove/studio'

import { NavSatFixMsg } from 'utils/types'

type CircleMarkeProps = {
    context: PanelExtensionContext
    message: MessageEvent<NavSatFixMsg>
    speed: number
}

export const CircleMarker: React.FC<CircleMarkeProps> = ({ context, message, speed }) => {
    const onHover = useCallback(
        (message?: MessageEvent<NavSatFixMsg>) => {
            context.setPreviewTime(message == undefined ? undefined : toSec(message.receiveTime))
        },
        [context, message],
    )

    const onRightClick = useCallback(
        (messageEvent: MessageEvent<unknown>) => {
            context.seekPlayback?.(toSec(messageEvent.receiveTime))
        },
        [context, message],
    )

    const innerHandlers = useMemo(
        () => ({
            contextmenu() {
                onRightClick(message)
            },
            mouseover() {
                onHover(message)
            },
            mouseout() {
                onHover(undefined)
            },
        }),
        [message],
    )

    return (
        <LeafletCircleMarker
            eventHandlers={innerHandlers}
            center={[message.message.latitude, message.message.longitude]}
            radius={2}
        >
            <Popup>Скорость в км/ч: {speed}</Popup>
        </LeafletCircleMarker>
    )
}
