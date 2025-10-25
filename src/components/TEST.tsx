import { ResponsiveLine } from '@nivo/line'

export const MyLine = () => {
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
		<div style={{ width: '100%', height: '100%', minHeight: '500px' }}>
			<ResponsiveLine
				data={data}
				margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
				xScale={{ type: 'point' }}
				yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
				axisBottom={{ legend: 'X Axis', legendOffset: 36 }}
				axisLeft={{ legend: 'Y Axis', legendOffset: -40 }}
				pointSize={8}
        isInteractive={true}
        colors={['#e11d48']}
			/>
		</div>
	)
}
