import { MessageEvent, Time } from '@foxglove/studio'
import { toSec } from '@foxglove/rostime'

import { NavSatFixMsg } from 'utils/types'

const degreeToRadian = (coordinate: number) => (coordinate * Math.PI) / 180

const getDistance = (firstPoint: NavSatFixMsg, nextPoint: NavSatFixMsg) => {
    const earthRadius = 6371

    const firstLat = degreeToRadian(firstPoint.latitude)
    const firstLon = degreeToRadian(firstPoint.longitude)

    const nextLat = degreeToRadian(nextPoint.latitude)
    const nextLon = degreeToRadian(nextPoint.longitude)

    const deltaLat = nextLat - firstLat
    const deltaLon = nextLon - firstLon

    const angle =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(firstLat) * Math.cos(nextLat) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)

    const chord = 2 * Math.atan2(Math.sqrt(angle), Math.sqrt(1 - angle))

    return earthRadius * chord
}

const getSpeed = (
    firstTimestamp: Time,
    nextTimestamp: Time,
    firstPoint: NavSatFixMsg,
    nextPoint: NavSatFixMsg,
) => {
    const distKM = getDistance(firstPoint, nextPoint)
    const timeH = (toSec(nextTimestamp) - toSec(firstTimestamp)) / 3600

    return +(distKM / timeH).toFixed(1)
}

export const getSpeedData = (messages: MessageEvent<NavSatFixMsg>[]) => {
    const speedsArr: number[] = [NaN]

    for (let i = 1; i <= messages.length; i++) {
        const currentMessage = messages[i]
        const prevMessage = messages[i - 1]

        if (currentMessage && prevMessage) {
            speedsArr.push(
                getSpeed(
                    prevMessage?.receiveTime,
                    currentMessage?.receiveTime,
                    prevMessage?.message,
                    currentMessage?.message,
                ),
            )
        }
    }

    return speedsArr
}
