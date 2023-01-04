export enum LogLevel {
    UNKNOWN = 0,
    DEBUG = 1,
    INFO = 2,
    WARN = 3,
    ERROR = 4,
    FATAL = 5,
}

export enum NumericType {
    UINT8 = 1,
    INT8 = 2,
    UINT16 = 3,
    INT16 = 4,
    UINT32 = 5,
    INT32 = 6,
    FLOAT32 = 7,
    FLOAT64 = 8,
}

export type FoxgloveMessages = {
    'foxglove.CameraCalibration': {
        timestamp: bigint | { sec: number; nsec: number }
        width: number
        height: number
        distortion_model?: string
        D?: readonly number[]
        K?: readonly number[]
        P?: readonly number[]
        R?: readonly number[]
    }

    'foxglove.ImageAnnotations': {
        circles?: Array<FoxgloveMessages['foxglove.ImageAnnotations.Circle']>
        points?: Array<FoxgloveMessages['foxglove.ImageAnnotations.Points']>
    }

    'foxglove.ImageAnnotations.Circle': {
        timestamp: bigint | { sec: number; nsec: number }
        position: FoxgloveMessages['foxglove.ImageAnnotations.Point2D']
        diameter: number
        thickness: number
        fill_color?: FoxgloveMessages['foxglove.Color']
        outline_color: FoxgloveMessages['foxglove.Color']
    }

    'foxglove.Color': {
        r: number
        g: number
        b: number
        a: number
    }

    'foxglove.GeoJSON': {
        geojson: string
    }

    'foxglove.ImageAnnotations.Point2D': {
        x: number
        y: number
    }

    'foxglove.ImageAnnotations.Points': {
        timestamp: bigint | { sec: number; nsec: number }
        type: number
        points: Array<FoxgloveMessages['foxglove.ImageAnnotations.Point2D']>
        outline_colors: Array<FoxgloveMessages['foxglove.Color']>
        outline_color?: FoxgloveMessages['foxglove.Color']
        fill_color?: FoxgloveMessages['foxglove.Color']
        thickness: number
    }

    'foxglove.RawImage': {
        timestamp: bigint | { sec: number; nsec: number }
        width: number
        height: number
        encoding: string
        step: number
        data: Uint8Array
    }

    'foxglove.CompressedImage': {
        timestamp: bigint | { sec: number; nsec: number }
        format: string
        data: Uint8Array
    }

    'foxglove.Log': {
        timestamp: bigint | { sec: number; nsec: number }
        level: LogLevel
        message: string
        name?: string
        file?: string
        line?: number
    }

    'foxglove.FrameTransform': {
        timestamp: {
            sec: number
            nsec: number
        }
        parent_frame_id: string
        child_frame_id: string
        transform: {
            translation: { x: number; y: number; z: number }
            rotation: { x: number; y: number; z: number; w: number }
        }
    }

    'foxglove.Pose': {
        position: { x: number; y: number; z: number }
        orientation: { x: number; y: number; z: number; w: number }
    }

    'foxglove.PoseInFrame': {
        timestamp: { sec: number; nsec: number }
        frame_id: string
        pose: FoxgloveMessages['foxglove.Pose']
    }

    'foxglove.PosesInFrame': {
        timestamp: { sec: number; nsec: number }
        frame_id: string
        poses: Array<FoxgloveMessages['foxglove.Pose']>
    }

    'foxglove.Grid': {
        timestamp: { sec: number; nsec: number }
        frame_id: string
        pose: FoxgloveMessages['foxglove.Pose']

        column_count: number
        cell_size: { x: number; y: number }

        row_stride: number
        cell_stride: number
        fields: Array<{ name: string; offset: number; type: NumericType }>
        data: Uint8Array
    }

    'foxglove.PointCloud': {
        timestamp: { sec: number; nsec: number }
        frame_id: string
        pose: FoxgloveMessages['foxglove.Pose']
        point_stride: number
        fields: Array<{ name: string; offset: number; type: NumericType }>
        data: Uint8Array
    }

    'foxglove.LaserScan': {
        timestamp: { sec: number; nsec: number }
        frame_id: string
        pose: FoxgloveMessages['foxglove.Pose']

        start_angle: number
        end_angle: number

        ranges: number[]
        intensities: number[]
    }
}
