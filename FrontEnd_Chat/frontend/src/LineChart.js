import { ResponsiveLine } from '@nivo/line';
import "./LineChart.css";

const LineChart = ({ data }) => {
    return (
    <div className="chart-container">
    <ResponsiveLine
        data={data}
        colors={['#0f5a0b']}
        margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
        xScale={{ type: 'point' }}
        yScale={{
            type: 'linear',
            min: '0',
            max: '30',
            stacked: false,
            reverse: false
        }}
        yFormat=" >-.2f"
        axisTop={null}
        axisRight={null}
        axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legendOffset: 36,
            truncateTickAt: 0
        }}
        axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legendOffset: -40,
            legendPosition: 'middle',
            tickValues: [0, 5, 10, 15, 20, 25, 30]
        }}
        gridYValues={[0, 5, 10, 15, 20, 25, 30]} 
        enableGridX={false}
        enableGridY={true}
        lineWidth={4}
        pointSize={13}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={3}
        pointBorderColor={{ from: 'seriesColor' }}
        pointLabelYOffset={-12}
        isInteractive={false}
        enableTouchCrosshair={true}
        useMesh={true}
        legends={[]}
        animate={false}
        role="application"
    />
    </div>
)}

export default LineChart;