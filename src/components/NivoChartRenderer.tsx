import { ResponsiveBar } from '@nivo/bar'
import { ResponsiveBoxPlot } from '@nivo/boxplot'
import { ResponsiveLine } from '@nivo/line'
import { ResponsiveScatterPlot } from '@nivo/scatterplot'
import React, { useMemo } from 'react'

type ChartConfig = {
	type: 'bar' | 'line' | 'scatter' | 'box'
	[key: string]: unknown
}

interface NivoChartRendererProps {
	config: ChartConfig
	theme?: any
}

// Default Nivo theme with Tailwind-compatible colors
const DEFAULT_THEME = {
	background: '#ffffff',
	textColor: '#1f2937',
	fontSize: 12,
	axis: {
		domain: {
			line: {
				strokeWidth: 1,
				stroke: '#d1d5db'
			}
		},
		legend: {
			text: {
				fontSize: 12
			}
		},
		ticks: {
			line: {
				strokeWidth: 1,
				stroke: '#d1d5db'
			},
			text: {
				fontSize: 11
			}
		}
	},
	grid: {
		line: {
			stroke: '#e5e7eb',
			strokeWidth: 1
		}
	},
	legends: {
		text: {
			fontSize: 12
		}
	},
	tooltip: {
		container: {
			background: '#ffffff',
			color: '#1f2937',
			borderRadius: '4px',
			boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
			padding: '8px 12px'
		}
	}
}

export const NivoChartRenderer: React.FC<NivoChartRendererProps> = ({ config, theme = DEFAULT_THEME }) => {
	const { type, ...chartProps } = config

	// Merge theme with provided or default theme
	const mergedTheme = useMemo(() => ({ ...DEFAULT_THEME, ...theme }), [theme])

	const commonProps = {
		theme: mergedTheme,
		margin: { top: 50, right: 110, bottom: 50, left: 60 },
		...chartProps
	}

	switch (type) {
		case 'bar':
			return <ResponsiveBar {...(commonProps as any)} />
		case 'line':
			return <ResponsiveLine {...(commonProps as any)} />
		case 'scatter':
			return <ResponsiveScatterPlot {...(commonProps as any)} />
		case 'box':
			return <ResponsiveBoxPlot {...(commonProps as any)} />
		default:
			return <div className="text-red-500">Unknown chart type: {type}</div>
	}
}

export default NivoChartRenderer
