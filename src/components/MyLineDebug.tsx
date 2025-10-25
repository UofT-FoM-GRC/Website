import { ResponsiveLine } from '@nivo/line'
import { useEffect, useRef } from 'react'

export const MyLineDebug = () => {
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		console.log('MyLineDebug mounted', containerRef.current)
		console.log('Container dimensions:', {
			width: containerRef.current?.offsetWidth,
			height: containerRef.current?.offsetHeight,
			parent: containerRef.current?.parentElement?.offsetHeight
		})
	}, [])

	const data = [
		{
			id: 'Series 1',
			data: [
				{ x: '1', y: 100 },
				{ x: '2', y: 150 },
				{ x: '3', y: 120 },
				{ x: '4', y: 180 }
			]
		}
	]

	return (
		<div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '500px', border: '2px solid blue' }}>
			<div style={{ fontSize: '12px', color: 'blue', padding: '5px' }}>Debug: Container loaded</div>
			<div style={{ width: '100%', height: 'calc(100% - 30px)' }}>
				<ResponsiveLine
					data={data}
					margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
					xScale={{ type: 'point' }}
					yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
					axisBottom={{ legend: 'X Axis', legendOffset: 36 }}
					axisLeft={{ legend: 'Y Axis', legendOffset: -40 }}
					pointSize={8}
					colors={['#e11d48']}
					enableArea={true}
					enableCrosshair={true}
					useMesh={true}
					isInteractive={true}
					tooltip={({ point }) => (
						<div
							style={{
								background: 'white',
								padding: '10px',
								borderRadius: '4px',
								boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
							}}
						>
							<strong>{point.seriesId}</strong>
							<br />
							{point.data.xFormatted}: {point.data.yFormatted}
						</div>
					)}
				/>
			</div>
		</div>
	)
}
